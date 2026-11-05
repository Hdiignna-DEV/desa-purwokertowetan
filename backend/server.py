import asyncio
import contextlib
import io
import json
import logging
import os
import re
import secrets
import string
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form, Query
from fastapi.responses import Response, FileResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from PIL import Image
from pydantic import BaseModel
from pymongo import ASCENDING, DESCENDING, IndexModel
from starlette.middleware.cors import CORSMiddleware

import seed_data

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

_conn = {"loop": None, "client": None}


def _database():
    # Satu klien per event loop: aman untuk server biasa maupun serverless (Vercel).
    loop = asyncio.get_running_loop()
    if _conn["loop"] is not loop:
        if _conn["client"] is not None:
            try:
                _conn["client"].close()
            except Exception:
                pass
        _conn.update(loop=loop, client=AsyncIOMotorClient(os.environ['MONGO_URL'], serverSelectionTimeoutMS=15000))
    return _conn["client"][os.environ['DB_NAME']]


class _DB:
    def __getattr__(self, name):
        return _database()[name]

    def __getitem__(self, name):
        return _database()[name]


db = _DB()
JWT_SECRET = os.environ['JWT_SECRET']
UPLOAD_DIR = ROOT_DIR / 'uploads'
LAYANAN_DIR = ROOT_DIR / 'data' / 'layanan'
logger = logging.getLogger(__name__)

INDEXES = {
    "users": [IndexModel([("id", ASCENDING)], unique=True), IndexModel([("username", ASCENDING)], unique=True)],
    "news": [IndexModel([("id", ASCENDING)], unique=True), IndexModel([("slug", ASCENDING)]), IndexModel([("status", ASCENDING), ("published_at", DESCENDING)])],
    "requests": [IndexModel([("ticket", ASCENDING)], unique=True), IndexModel([("created_at", DESCENDING)])],
    "complaints": [IndexModel([("ticket", ASCENDING)], unique=True)],
    "submissions": [IndexModel([("status", ASCENDING), ("created_at", DESCENDING)])],
    "umkm": [IndexModel([("ticket", ASCENDING)], unique=True), IndexModel([("status", ASCENDING), ("created_at", DESCENDING)])],
    "rate_hits": [IndexModel([("at", ASCENDING)], expireAfterSeconds=7200), IndexModel([("k", ASCENDING), ("at", ASCENDING)])],
    "activity_logs": [IndexModel([("created_at", DESCENDING)]), IndexModel([("user_id", ASCENDING)])],
}

ROLE_RANK = {"kontributor": 1, "editor": 2, "admin": 3}

# Generic content resources: public visibility & minimum admin role
RESOURCES = {
    "news": {"sort": [("published_at", -1)], "role": "kontributor"},
    "gallery": {"sort": [("order", 1), ("created_at", -1)], "role": "editor", "visible": True},
    "officials": {"sort": [("level", 1), ("order", 1)], "role": "editor", "visible": True},
    "services": {"sort": [("order", 1)], "role": "editor", "visible": True},
    "potentials": {"sort": [("order", 1), ("created_at", -1)], "role": "editor", "visible": True},
    "statistics": {"sort": [("order", 1)], "role": "editor"},
    "documents": {"sort": [("created_at", -1)], "role": "editor"},
    "links": {"sort": [("order", 1)], "role": "editor", "visible": True},
    "institutions": {"sort": [("order", 1)], "role": "editor"},
    "rw": {"sort": [("order", 1)], "role": "editor"},
    "announcements": {"sort": [("start_at", -1), ("created_at", -1)], "role": "editor", "visible": True},
}
CONTENT_SETTING_KEYS = {"sambutan", "profil", "ringkasan", "data_info", "alur", "survey", "auto_holidays"}

REQUEST_STATUSES = ["diterima", "diverifikasi", "perlu_dilengkapi", "diproses", "selesai", "ditolak"]
COMPLAINT_STATUSES = ["diterima", "ditindaklanjuti", "selesai", "ditolak"]

app = FastAPI(title="API Kelurahan Purwokerto Wetan")
api = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


def slugify(text: str) -> str:
    s = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')
    return f"{s[:70]}-{secrets.token_hex(2)}"


def make_ticket(prefix: str) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return f"{prefix}-{datetime.now(timezone.utc).strftime('%y%m%d')}-{''.join(secrets.choice(alphabet) for _ in range(4))}"


def digits(phone: str) -> str:
    return re.sub(r'\D', '', phone or '')


def mask_name(name: str) -> str:
    return " ".join(p[0] + "*" * (len(p) - 1) if len(p) > 1 else p for p in (name or "").split())


# ---------------- Auth ----------------
def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def check_pw(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def make_token(user_id: str) -> str:
    return jwt.encode({"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(hours=8)}, JWT_SECRET, algorithm="HS256")


def public_user(u: dict) -> dict:
    return {k: u.get(k) for k in ["id", "username", "email", "name", "position", "phone", "photo", "role", "status", "last_login", "must_change_password", "locked_until", "created_at"]}


async def current_user(request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(401, "Silakan login terlebih dahulu")
    try:
        payload = jwt.decode(auth[7:], JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Sesi berakhir, silakan login kembali")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
    if not user or user.get("status") != "aktif":
        raise HTTPException(401, "Akun tidak aktif")
    return user


def require_role(role: str):
    async def dep(user: dict = Depends(current_user)):
        if ROLE_RANK.get(user["role"], 0) < ROLE_RANK[role]:
            raise HTTPException(403, "Anda tidak memiliki hak akses untuk tindakan ini")
        return user
    return dep


async def log_activity(user: dict, action: str, target: str):
    await db.activity_logs.insert_one({"id": new_id(), "user_id": user["id"], "user_name": user.get("name") or user["username"],
                                       "action": action, "target": target, "created_at": now_iso()})


class LoginIn(BaseModel):
    username: str
    password: str


class PasswordIn(BaseModel):
    old_password: str
    new_password: str


class ProfileIn(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    photo: Optional[str] = None
    position: Optional[str] = None


@api.post("/auth/login")
async def login(body: LoginIn):
    ident = body.username.strip().lower()
    user = await db.users.find_one({"$or": [{"username": ident}, {"email": ident}]}, {"_id": 0})
    if not user:
        raise HTTPException(401, "Nama pengguna atau kata sandi salah")
    if user["status"] == "nonaktif":
        raise HTTPException(403, "Akun Anda dinonaktifkan. Hubungi Administrator.")
    locked = user.get("locked_until")
    if locked and datetime.fromisoformat(locked) > datetime.now(timezone.utc):
        raise HTTPException(423, "Akun terkunci karena 5 kali salah kata sandi. Coba lagi setelah 15 menit atau hubungi Administrator.")
    if not check_pw(body.password, user["password_hash"]):
        fails = user.get("failed_attempts", 0) + 1
        upd = {"failed_attempts": fails}
        if fails >= 5:
            upd = {"failed_attempts": 0, "locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}
        await db.users.update_one({"id": user["id"]}, {"$set": upd})
        raise HTTPException(401, "Nama pengguna atau kata sandi salah")
    status = "aktif" if user["status"] == "menunggu" else user["status"]
    await db.users.update_one({"id": user["id"]}, {"$set": {"failed_attempts": 0, "locked_until": None, "last_login": now_iso(), "status": status}})
    user.update(status=status, last_login=now_iso())
    return {"token": make_token(user["id"]), "user": public_user(user)}


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return public_user(user)


@api.put("/auth/me")
async def update_me(body: ProfileIn, user: dict = Depends(current_user)):
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    await db.users.update_one({"id": user["id"]}, {"$set": upd})
    return public_user({**user, **upd})


@api.post("/auth/change-password")
async def change_password(body: PasswordIn, user: dict = Depends(current_user)):
    if not check_pw(body.old_password, user["password_hash"]):
        raise HTTPException(400, "Kata sandi lama tidak sesuai")
    if len(body.new_password) < 8:
        raise HTTPException(400, "Kata sandi baru minimal 8 karakter")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_pw(body.new_password), "must_change_password": False}})
    await log_activity(user, "Mengganti kata sandi", "Akun sendiri")
    return {"ok": True}


# ---------------- Users (Administrator) ----------------
class UserIn(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = ""
    name: Optional[str] = None
    position: Optional[str] = ""
    phone: Optional[str] = ""
    photo: Optional[str] = ""
    role: Optional[str] = None
    status: Optional[str] = None


def temp_password() -> str:
    return "Pw-" + secrets.token_urlsafe(6)


@api.get("/admin/users")
async def list_users(admin: dict = Depends(require_role("admin"))):
    users = await db.users.find({}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return [public_user(u) for u in users]


@api.post("/admin/users")
async def create_user(body: UserIn, admin: dict = Depends(require_role("admin"))):
    if not body.username or not body.name or body.role not in ROLE_RANK:
        raise HTTPException(400, "Nama, nama pengguna, dan peran wajib diisi")
    username = body.username.strip().lower()
    if await db.users.find_one({"username": username}):
        raise HTTPException(400, "Nama pengguna sudah dipakai")
    pw = temp_password()
    doc = {**body.model_dump(), "id": new_id(), "username": username, "email": (body.email or "").lower(), "status": "menunggu",
           "password_hash": hash_pw(pw), "must_change_password": True, "failed_attempts": 0, "created_at": now_iso()}
    await db.users.insert_one(doc)
    await log_activity(admin, "Menambah akun", f"{body.name} ({body.role})")
    return {"user": public_user(doc), "temp_password": pw}


async def active_admin_count(exclude_id: str) -> int:
    return await db.users.count_documents({"role": "admin", "status": "aktif", "id": {"$ne": exclude_id}})


@api.put("/admin/users/{uid}")
async def update_user(uid: str, body: UserIn, admin: dict = Depends(require_role("admin"))):
    target = await db.users.find_one({"id": uid}, {"_id": 0})
    if not target:
        raise HTTPException(404, "Akun tidak ditemukan")
    upd = {k: v for k, v in body.model_dump().items() if v is not None and k != "username"}
    if "role" in upd and upd["role"] not in ROLE_RANK:
        raise HTTPException(400, "Peran tidak dikenal")
    if "status" in upd and upd["status"] not in ("aktif", "nonaktif", "menunggu"):
        raise HTTPException(400, "Status tidak dikenal")
    if uid == admin["id"] and (upd.get("role", "admin") != "admin" or upd.get("status", "aktif") != "aktif"):
        raise HTTPException(400, "Anda tidak dapat menurunkan peran atau menonaktifkan akun sendiri")
    losing_admin = target["role"] == "admin" and (upd.get("role", "admin") != "admin" or upd.get("status", "aktif") != "aktif")
    if losing_admin and await active_admin_count(uid) < 1:
        raise HTTPException(400, "Harus selalu ada minimal satu Administrator aktif")
    await db.users.update_one({"id": uid}, {"$set": upd})
    await log_activity(admin, "Mengubah akun", target["name"])
    return public_user({**target, **upd})


@api.post("/admin/users/{uid}/reset-password")
async def reset_password(uid: str, admin: dict = Depends(require_role("admin"))):
    target = await db.users.find_one({"id": uid}, {"_id": 0})
    if not target:
        raise HTTPException(404, "Akun tidak ditemukan")
    pw = temp_password()
    await db.users.update_one({"id": uid}, {"$set": {"password_hash": hash_pw(pw), "must_change_password": True, "failed_attempts": 0, "locked_until": None}})
    await log_activity(admin, "Mengatur ulang kata sandi", target["name"])
    return {"temp_password": pw}


@api.post("/admin/users/{uid}/unlock")
async def unlock_user(uid: str, admin: dict = Depends(require_role("admin"))):
    await db.users.update_one({"id": uid}, {"$set": {"failed_attempts": 0, "locked_until": None}})
    return {"ok": True}


@api.delete("/admin/users/{uid}")
async def delete_user(uid: str, admin: dict = Depends(require_role("admin"))):
    if uid == admin["id"]:
        raise HTTPException(400, "Anda tidak dapat menghapus akun sendiri")
    target = await db.users.find_one({"id": uid}, {"_id": 0})
    if not target:
        raise HTTPException(404, "Akun tidak ditemukan")
    if await db.news.count_documents({"author_id": uid}) or await db.activity_logs.count_documents({"user_id": uid}):
        raise HTTPException(400, "Akun sudah memiliki konten atau riwayat. Gunakan Nonaktifkan.")
    if target["role"] == "admin" and await active_admin_count(uid) < 1:
        raise HTTPException(400, "Harus selalu ada minimal satu Administrator aktif")
    await db.users.delete_one({"id": uid})
    await log_activity(admin, "Menghapus akun", target["name"])
    return {"ok": True}


@api.get("/admin/activity")
async def activity(user: dict = Depends(current_user), limit: int = Query(200, le=500)):
    q = {} if user["role"] == "admin" else {"user_id": user["id"]}
    return await db.activity_logs.find(q, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)


# ---------------- Uploads ----------------
ALLOWED_IMG = {"image/jpeg", "image/png", "image/webp"}


async def save_upload(f: UploadFile, max_mb: int = 10, allow_pdf: bool = True) -> str:
    data = await f.read()
    if len(data) > max_mb * 1024 * 1024:
        raise HTTPException(400, f"Ukuran berkas maksimal {max_mb} MB")
    if f.content_type in ALLOWED_IMG:
        try:
            img = Image.open(io.BytesIO(data)).convert("RGB")
        except Exception:
            raise HTTPException(400, "Berkas gambar rusak atau tidak valid")
        img.thumbnail((1600, 1600))
        name, ctype = f"{uuid.uuid4().hex}.jpg", "image/jpeg"
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=82, optimize=True)
        data = buf.getvalue()
    elif allow_pdf and f.content_type == "application/pdf":
        name, ctype = f"{uuid.uuid4().hex}.pdf", "application/pdf"
    else:
        raise HTTPException(400, "Hanya gambar (JPG/PNG/WEBP) atau PDF yang diterima")
    # Berkas disimpan di MongoDB (GridFS) agar tetap ada di hosting serverless/gratis.
    await AsyncIOMotorGridFSBucket(_database(), bucket_name="files").upload_from_stream(name, data, metadata={"content_type": ctype})
    return f"/api/uploads/{name}"


FILE_FIELDS = ("cover", "file", "image", "logo", "photo", "images")
FILE_COLLS = ("news", "gallery", "officials", "potentials", "services", "documents", "announcements", "institutions", "rw", "links",
              "statistics", "submissions", "umkm", "users", "settings", "instagram_queue", "requests", "complaints")


async def cleanup_files(doc: dict):
    # Hapus berkas GridFS milik data yang dihapus bila tidak dipakai data lain (hemat kuota 512 MB Atlas).
    bucket = AsyncIOMotorGridFSBucket(_database(), bucket_name="files")
    for name in set(re.findall(r"/api/uploads/([A-Za-z0-9._-]+)", json.dumps(doc, default=str))):
        url = f"/api/uploads/{name}"
        used = False
        for c in FILE_COLLS:
            if await db[c].find_one({"$or": [{f: url} for f in FILE_FIELDS]}, {"_id": 1}):
                used = True
                break
        if not used:
            async for f in db["files.files"].find({"filename": name}, {"_id": 1}):
                with contextlib.suppress(Exception):
                    await bucket.delete(f["_id"])


@api.get("/uploads/{name}")
async def get_upload(name: str):
    if not re.fullmatch(r"[A-Za-z0-9._-]+", name):
        raise HTTPException(404, "Berkas tidak ditemukan")
    headers = {"Cache-Control": "public, max-age=31536000, immutable"}
    bucket = AsyncIOMotorGridFSBucket(_database(), bucket_name="files")
    try:
        stream = await bucket.open_download_stream_by_name(name)
        return Response(await stream.read(), media_type=(stream.metadata or {}).get("content_type", "application/octet-stream"), headers=headers)
    except Exception:
        legacy = UPLOAD_DIR / name
        if legacy.is_file():
            return FileResponse(legacy, headers=headers)
        raise HTTPException(404, "Berkas tidak ditemukan")


@api.post("/admin/upload")
async def upload(file: UploadFile = File(...), user: dict = Depends(current_user)):
    return {"url": await save_upload(file)}


# ---------------- Settings ----------------
async def get_settings() -> dict:
    s = await db.settings.find_one({"id": "site"}, {"_id": 0})
    return s or {}


@api.get("/public/settings")
async def public_settings():
    return await get_settings()


@api.put("/admin/settings")
async def update_settings(body: dict, user: dict = Depends(require_role("editor"))):
    body.pop("id", None)
    body.pop("_id", None)
    if user["role"] != "admin":
        body = {k: v for k, v in body.items() if k in CONTENT_SETTING_KEYS}
    if not body:
        raise HTTPException(403, "Pengaturan situs hanya dapat diubah oleh Administrator")
    await db.settings.update_one({"id": "site"}, {"$set": body}, upsert=True)
    await log_activity(user, "Mengubah konten/pengaturan", ", ".join(body.keys()))
    return await get_settings()


# ---------------- Generic content resources ----------------
def check_res(res: str) -> dict:
    if res not in RESOURCES:
        raise HTTPException(404, "Data tidak ditemukan")
    return RESOURCES[res]


def published_news_filter() -> dict:
    return {"status": {"$in": ["terbit", "terjadwal"]}, "published_at": {"$lte": now_iso()}}


@api.get("/public/news/{key}")
async def public_news_detail(key: str):
    doc = await db.news.find_one({"$or": [{"slug": key}, {"id": key}], **published_news_filter()}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Berita tidak ditemukan")
    await db.news.update_one({"id": doc["id"]}, {"$inc": {"views": 1}})
    return doc


@api.get("/public/{res}")
async def public_list(res: str, page: int = 1, limit: int = Query(100, le=200), category: Optional[str] = None, q: Optional[str] = None):
    cfg = check_res(res)
    filt = {}
    if res == "news":
        filt = published_news_filter()
    elif cfg.get("visible"):
        filt = {"visible": {"$ne": False}}
    if res == "announcements":
        now = now_iso()
        filt["$and"] = [{"$or": [{f: {"$in": [None, ""]}}, {f: {op: now}}]} for f, op in (("start_at", "$lte"), ("end_at", "$gte"))]
    if category:
        filt["category"] = category
    if q:
        filt["title" if res == "news" else "name"] = {"$regex": re.escape(q), "$options": "i"}
    total = await db[res].count_documents(filt)
    items = await db[res].find(filt, {"_id": 0}).sort(cfg["sort"]).skip((page - 1) * limit).limit(limit).to_list(limit)
    return {"items": items, "total": total}


@api.get("/admin/res/{res}")
async def admin_list(res: str, user: dict = Depends(current_user)):
    cfg = check_res(res)
    if ROLE_RANK[user["role"]] < ROLE_RANK[cfg["role"]]:
        raise HTTPException(403, "Anda tidak memiliki hak akses")
    filt = {"author_id": user["id"]} if res == "news" and user["role"] == "kontributor" else {}
    return await db[res].find(filt, {"_id": 0}).sort(cfg["sort"]).to_list(1000)


def check_announcement(body: dict, partial: bool):
    for k, label in (("title", "Judul"), ("content", "Isi pengumuman")):
        if (not partial or k in body) and not str(body.get(k) or "").strip():
            raise HTTPException(422, f"{label} wajib diisi")


def prepare_news(body: dict, user: dict, existing: Optional[dict]) -> dict:
    if user["role"] == "kontributor" and body.get("status") not in ("draf", "diajukan"):
        body["status"] = "draf"
    if body.get("title") and (not existing or not existing.get("slug")):
        body["slug"] = slugify(body["title"])
    if body.get("status") in ("terbit", "terjadwal") and not body.get("published_at"):
        body["published_at"] = now_iso()
    return body


@api.post("/admin/res/{res}")
async def admin_create(res: str, body: dict, user: dict = Depends(current_user)):
    cfg = check_res(res)
    if ROLE_RANK[user["role"]] < ROLE_RANK[cfg["role"]]:
        raise HTTPException(403, "Anda tidak memiliki hak akses")
    body = {k: v for k, v in body.items() if k not in ("id", "_id", "created_at")}
    if res == "announcements":
        check_announcement(body, False)
    if res == "news":
        body = prepare_news(body, user, None)
        body.update(author_id=user["id"], author_name=user.get("name"), views=0)
    doc = {**body, "id": new_id(), "created_at": now_iso(), "updated_at": now_iso()}
    await db[res].insert_one(doc)
    doc.pop("_id", None)
    await log_activity(user, f"Menambah {res}", body.get("title") or body.get("name") or body.get("label") or "-")
    return doc


@api.put("/admin/res/{res}/{item_id}")
async def admin_update(res: str, item_id: str, body: dict, user: dict = Depends(current_user)):
    cfg = check_res(res)
    if ROLE_RANK[user["role"]] < ROLE_RANK[cfg["role"]]:
        raise HTTPException(403, "Anda tidak memiliki hak akses")
    existing = await db[res].find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Data tidak ditemukan")
    body = {k: v for k, v in body.items() if k not in ("id", "_id", "created_at", "author_id", "author_name", "views")}
    if res == "announcements":
        check_announcement(body, True)
    if res == "news":
        if user["role"] == "kontributor" and (existing.get("author_id") != user["id"] or existing.get("status") not in ("draf", "diajukan")):
            raise HTTPException(403, "Kontributor hanya dapat mengubah draf miliknya sendiri")
        body = prepare_news(body, user, existing)
    body["updated_at"] = now_iso()
    await db[res].update_one({"id": item_id}, {"$set": body})
    await log_activity(user, f"Mengubah {res}", body.get("title") or body.get("name") or existing.get("title") or existing.get("name") or "-")
    return {**existing, **body}


@api.delete("/admin/res/{res}/{item_id}")
async def admin_delete(res: str, item_id: str, user: dict = Depends(current_user)):
    cfg = check_res(res)
    need = "editor" if res == "news" else cfg["role"]
    existing = await db[res].find_one({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Data tidak ditemukan")
    own_draft = res == "news" and existing.get("author_id") == user["id"] and existing.get("status") in ("draf", "diajukan")
    if ROLE_RANK[user["role"]] < ROLE_RANK[need] and not own_draft:
        raise HTTPException(403, "Anda tidak memiliki hak akses")
    await db[res].delete_one({"id": item_id})
    await cleanup_files(existing)
    await log_activity(user, f"Menghapus {res}", existing.get("title") or existing.get("name") or "-")
    return {"ok": True}


# ---------------- Public citizen forms (no login) ----------------


async def rate_limit(request: Request, key: str, limit: int = 8, window: int = 3600):
    # Disimpan di MongoDB agar berlaku di semua instance serverless.
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "-").split(",")[-1].strip()
    k = f"{key}:{ip}"
    now = datetime.now(timezone.utc)
    if await db.rate_hits.count_documents({"k": k, "at": {"$gte": now - timedelta(seconds=window)}}) >= limit:
        raise HTTPException(429, "Terlalu banyak pengiriman. Silakan coba lagi nanti.")
    await db.rate_hits.insert_one({"k": k, "at": now})


class RequestIn(BaseModel):
    service_id: str
    name: str
    phone: str
    rt_rw: Optional[str] = ""
    address: Optional[str] = ""
    note: Optional[str] = ""
    website: Optional[str] = ""


class ComplaintIn(BaseModel):
    name: str
    phone: str
    rt_rw: Optional[str] = ""
    category: str
    message: str
    website: Optional[str] = ""


def require_fields(name: str, phone: str):
    if len(name.strip()) < 2 or len(digits(phone)) < 9:
        raise HTTPException(400, "Nama dan nomor WhatsApp wajib diisi dengan benar")


@api.post("/public/requests")
async def create_request(body: RequestIn, request: Request):
    if body.website:
        raise HTTPException(400, "Permintaan ditolak")
    require_fields(body.name, body.phone)
    await rate_limit(request, "req")
    svc = await db.services.find_one({"id": body.service_id}, {"_id": 0})
    if not svc:
        raise HTTPException(400, "Jenis layanan tidak ditemukan")
    ticket = make_ticket("PW")
    doc = {"id": new_id(), "ticket": ticket, "service_id": svc["id"], "service_name": svc["name"], "estimate": svc.get("estimate", ""),
           "requirements": svc.get("requirements", []), "name": body.name.strip(), "phone": body.phone.strip(), "rt_rw": body.rt_rw,
           "address": body.address, "note": body.note, "status": "diterima", "created_at": now_iso(),
           "history": [{"status": "diterima", "note": "Permohonan diterima sistem. Silakan bawa berkas persyaratan ke kantor kelurahan.", "at": now_iso()}]}
    await db.requests.insert_one(doc)
    return {"ticket": ticket, "service_name": svc["name"], "estimate": doc["estimate"], "requirements": doc["requirements"], "created_at": doc["created_at"]}


@api.post("/public/complaints")
async def create_complaint(body: ComplaintIn, request: Request):
    if body.website:
        raise HTTPException(400, "Permintaan ditolak")
    require_fields(body.name, body.phone)
    if len(body.message.strip()) < 10:
        raise HTTPException(400, "Isi laporan minimal 10 karakter")
    await rate_limit(request, "cmp")
    ticket = make_ticket("AD")
    doc = {"id": new_id(), "ticket": ticket, **body.model_dump(exclude={"website"}), "status": "diterima", "response": "",
           "created_at": now_iso(), "history": [{"status": "diterima", "note": "Laporan diterima dan menunggu tindak lanjut.", "at": now_iso()}]}
    await db.complaints.insert_one(doc)
    return {"ticket": ticket, "created_at": doc["created_at"]}


@api.get("/public/track/{ticket}")
async def track(ticket: str, phone4: str = Query(..., min_length=4, max_length=4)):
    t = ticket.strip().upper()
    prefixes = {"AD-": (db.complaints, "pengaduan"), "KW-": (db.submissions, "kiriman"), "UM-": (db.umkm, "umkm")}
    coll, kind = next((v for p, v in prefixes.items() if t.startswith(p)), (db.requests, "layanan"))
    doc = await coll.find_one({"ticket": t}, {"_id": 0})
    if not doc or not digits(doc["phone"]).endswith(phone4):
        raise HTTPException(404, "Nomor tiket tidak ditemukan atau 4 digit nomor WhatsApp tidak sesuai")
    if kind == "umkm":
        title = f"Pendaftaran {doc['kind']}: {doc['business_name']}"
    elif kind == "kiriman":
        title = f"Kiriman {doc['kind']}: {doc['title']}"
    else:
        title = doc.get("service_name") or doc.get("category")
    return {"ticket": doc["ticket"], "kind": kind, "title": title, "name": mask_name(doc["name"]),
            "status": doc["status"], "history": doc.get("history", []), "estimate": doc.get("estimate", ""),
            "response": doc.get("response") or doc.get("reason", ""), "schedule": doc.get("schedule", ""), "created_at": doc["created_at"]}


@api.post("/public/submissions")
async def create_submission(request: Request, kind: str = Form(...), title: str = Form(...), content: str = Form(""),
                            category: str = Form("Kegiatan Warga"), name: str = Form(...), phone: str = Form(...),
                            rt_rw: str = Form(""), ig_consent: bool = Form(False), website: str = Form(""),
                            files: List[UploadFile] = File(default=[])):
    if website:
        raise HTTPException(400, "Permintaan ditolak")
    if kind not in ("berita", "galeri"):
        raise HTTPException(400, "Jenis kiriman tidak dikenal")
    require_fields(name, phone)
    if len(title.strip()) < 5:
        raise HTTPException(400, "Judul minimal 5 karakter")
    if kind == "galeri" and not files:
        raise HTTPException(400, "Unggah minimal satu foto untuk galeri")
    if len(files) > 5:
        raise HTTPException(400, "Maksimal 5 foto per kiriman")
    await rate_limit(request, "sub", limit=5)
    images = [await save_upload(f, max_mb=5, allow_pdf=False) for f in files]
    ticket = make_ticket("KW")
    doc = {"id": new_id(), "ticket": ticket, "kind": kind, "title": title.strip(), "content": content, "category": category,
           "name": name.strip(), "phone": phone.strip(), "rt_rw": rt_rw, "ig_consent": ig_consent, "images": images,
           "status": "menunggu", "reason": "", "created_at": now_iso(),
           "history": [{"status": "menunggu", "note": "Kiriman diterima dan menunggu peninjauan admin.", "at": now_iso()}]}
    await db.submissions.insert_one(doc)
    return {"ticket": ticket}


@api.post("/public/umkm")
async def create_umkm(request: Request, kind: str = Form("UMKM"), business_name: str = Form(...), category: str = Form(""),
                      description: str = Form(...), address: str = Form(""), product_contact: str = Form(""), name: str = Form(...),
                      phone: str = Form(...), rt_rw: str = Form(""), website: str = Form(""), files: List[UploadFile] = File(default=[])):
    if website:
        raise HTTPException(400, "Permintaan ditolak")
    require_fields(name, phone)
    if len(business_name.strip()) < 3:
        raise HTTPException(400, "Nama usaha/potensi minimal 3 karakter")
    if len(description.strip()) < 20:
        raise HTTPException(400, "Deskripsi minimal 20 karakter")
    if len(files) > 3:
        raise HTTPException(400, "Maksimal 3 foto")
    await rate_limit(request, "umkm", limit=5)
    images = [await save_upload(f, max_mb=5, allow_pdf=False) for f in files]
    ticket = make_ticket("UM")
    await db.umkm.insert_one({"id": new_id(), "ticket": ticket, "kind": kind, "business_name": business_name.strip(), "category": category,
                              "description": description.strip(), "address": address, "product_contact": product_contact, "name": name.strip(),
                              "phone": phone.strip(), "rt_rw": rt_rw, "images": images, "status": "menunggu", "reason": "", "schedule": "",
                              "created_at": now_iso(), "history": [{"status": "menunggu", "note": "Pendaftaran diterima dan menunggu verifikasi admin kelurahan.", "at": now_iso()}]})
    return {"ticket": ticket}


@api.post("/public/visit")
async def visit():
    day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.visits.update_one({"day": day}, {"$inc": {"count": 1}}, upsert=True)
    return {"ok": True}


# ---------------- Admin: requests, complaints, submissions, instagram ----------------
class StatusIn(BaseModel):
    status: str
    note: Optional[str] = ""
    response: Optional[str] = None


@api.get("/admin/requests")
async def admin_requests(user: dict = Depends(require_role("editor"))):
    return await db.requests.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)


@api.put("/admin/requests/{rid}/status")
async def admin_request_status(rid: str, body: StatusIn, user: dict = Depends(require_role("editor"))):
    if body.status not in REQUEST_STATUSES:
        raise HTTPException(400, "Status tidak dikenal")
    entry = {"status": body.status, "note": body.note or "", "at": now_iso(), "by": user.get("name")}
    res = await db.requests.find_one_and_update({"id": rid}, {"$set": {"status": body.status}, "$push": {"history": entry}}, projection={"_id": 0}, return_document=True)
    if not res:
        raise HTTPException(404, "Permohonan tidak ditemukan")
    await log_activity(user, f"Status permohonan → {body.status}", res["ticket"])
    return res


@api.get("/admin/complaints")
async def admin_complaints(user: dict = Depends(require_role("editor"))):
    return await db.complaints.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)


@api.put("/admin/complaints/{cid}/status")
async def admin_complaint_status(cid: str, body: StatusIn, user: dict = Depends(require_role("editor"))):
    if body.status not in COMPLAINT_STATUSES:
        raise HTTPException(400, "Status tidak dikenal")
    upd = {"status": body.status}
    if body.response is not None:
        upd["response"] = body.response
    entry = {"status": body.status, "note": body.note or "", "at": now_iso(), "by": user.get("name")}
    res = await db.complaints.find_one_and_update({"id": cid}, {"$set": upd, "$push": {"history": entry}}, projection={"_id": 0}, return_document=True)
    if not res:
        raise HTTPException(404, "Laporan tidak ditemukan")
    await log_activity(user, f"Status pengaduan → {body.status}", res["ticket"])
    return res


@api.get("/admin/submissions")
async def admin_submissions(user: dict = Depends(require_role("editor"))):
    return await db.submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


class ApproveIn(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    post_instagram: bool = False
    caption: Optional[str] = ""


class RejectIn(BaseModel):
    reason: str = ""


async def queue_instagram(news_id: str, title: str, image: str, caption: str, source: str):
    doc = {"id": new_id(), "news_id": news_id, "title": title, "image": image, "caption": caption, "source": source,
           "status": "menunggu", "created_at": now_iso(), "note": ""}
    await db.instagram_queue.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/admin/submissions/{sid}/approve")
async def approve_submission(sid: str, body: ApproveIn, user: dict = Depends(require_role("editor"))):
    sub = await db.submissions.find_one({"id": sid, "status": "menunggu"}, {"_id": 0})
    if not sub:
        raise HTTPException(404, "Kiriman tidak ditemukan atau sudah diproses")
    title = body.title or sub["title"]
    published_id = None
    if sub["kind"] == "berita":
        content = body.content if body.content is not None else sub["content"]
        news = {"id": new_id(), "title": title, "slug": slugify(title), "category": body.category or sub["category"],
                "excerpt": content[:180], "content": content, "cover": sub["images"][0] if sub["images"] else "",
                "images": sub["images"], "status": "terbit", "published_at": now_iso(), "author_id": None,
                "author_name": f"Kiriman warga: {sub['name']}", "views": 0, "created_at": now_iso(), "updated_at": now_iso()}
        await db.news.insert_one(news)
        published_id = news["id"]
        if body.post_instagram:
            await queue_instagram(news["id"], title, news["cover"], body.caption or f"{title}\n\n{content[:300]}", "Kiriman warga")
    else:
        for img in sub["images"]:
            await db.gallery.insert_one({"id": new_id(), "title": title, "caption": f"Kiriman warga: {sub['name']}", "image": img,
                                         "album": "Kiriman Warga", "visible": True, "order": 99, "created_at": now_iso()})
        if body.post_instagram and sub["images"]:
            await queue_instagram("", title, sub["images"][0], body.caption or title, "Galeri warga")
    await db.submissions.update_one({"id": sid}, {"$set": {"status": "disetujui", "reviewed_by": user.get("name"), "reviewed_at": now_iso(), "published_id": published_id},
                                                "$push": {"history": {"status": "disetujui", "note": "Kiriman disetujui dan telah dipublikasikan di website kelurahan.", "at": now_iso(), "by": user.get("name")}}})
    await log_activity(user, "ACC kiriman warga", title)
    return {"ok": True}


@api.post("/admin/submissions/{sid}/reject")
async def reject_submission(sid: str, body: RejectIn, user: dict = Depends(require_role("editor"))):
    res = await db.submissions.update_one({"id": sid, "status": "menunggu"}, {"$set": {"status": "ditolak", "reason": body.reason, "reviewed_by": user.get("name"), "reviewed_at": now_iso()},
                                          "$push": {"history": {"status": "ditolak", "note": body.reason or "Kiriman belum dapat dipublikasikan.", "at": now_iso(), "by": user.get("name")}}})
    if not res.matched_count:
        raise HTTPException(404, "Kiriman tidak ditemukan atau sudah diproses")
    await log_activity(user, "Menolak kiriman warga", sid)
    return {"ok": True}


class UmkmActionIn(BaseModel):
    schedule: Optional[str] = ""
    note: Optional[str] = ""
    reason: Optional[str] = ""
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None


@api.get("/admin/umkm")
async def admin_umkm(user: dict = Depends(require_role("editor"))):
    return await db.umkm.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.post("/admin/umkm/{uid}/{action}")
async def admin_umkm_action(uid: str, action: str, body: UmkmActionIn, user: dict = Depends(require_role("editor"))):
    d = await db.umkm.find_one({"id": uid}, {"_id": 0})
    if not d:
        raise HTTPException(404, "Pendaftaran tidak ditemukan")
    if d["status"] in ("disetujui", "ditolak"):
        raise HTTPException(400, "Pendaftaran ini sudah selesai diproses")
    upd = {}
    if action == "call":
        if not (body.schedule or "").strip():
            raise HTTPException(400, "Isi jadwal kedatangan ke kantor")
        upd = {"status": "dipanggil", "schedule": body.schedule.strip()}
        note = f"Mohon datang ke Kantor Kelurahan pada {upd['schedule']}" + (f". {body.note}" if body.note else "") + "."
    elif action == "approve":
        pot = {"id": new_id(), "name": body.name or d["business_name"], "category": body.category or d.get("category") or "Lainnya",
               "description": body.description or d["description"], "image": d["images"][0] if d["images"] else "",
               "contact": d.get("product_contact", ""), "visible": True, "order": 99, "created_at": now_iso(), "source_ticket": d["ticket"]}
        await db.potentials.insert_one(pot)
        upd = {"status": "disetujui", "published_id": pot["id"]}
        note = body.note or "Pendaftaran disetujui. Usaha/potensi Anda kini tampil di halaman Potensi & UMKM website kelurahan."
    elif action == "reject":
        upd = {"status": "ditolak", "reason": body.reason or ""}
        note = body.reason or "Pendaftaran belum dapat disetujui."
    else:
        raise HTTPException(404, "Tindakan tidak dikenal")
    entry = {"status": upd["status"], "note": note, "at": now_iso(), "by": user.get("name")}
    res = await db.umkm.find_one_and_update({"id": uid}, {"$set": upd, "$push": {"history": entry}}, projection={"_id": 0}, return_document=True)
    await log_activity(user, f"Pendaftaran UMKM → {upd['status']}", d["business_name"])
    return res


class QueueIn(BaseModel):
    news_id: str
    caption: Optional[str] = ""


class QueueUpdate(BaseModel):
    caption: Optional[str] = None
    status: Optional[str] = None


def instagram_connected() -> bool:
    return bool(os.environ.get("INSTAGRAM_ACCESS_TOKEN") and os.environ.get("INSTAGRAM_ACCOUNT_ID"))


@api.get("/admin/instagram")
async def ig_queue(user: dict = Depends(require_role("editor"))):
    items = await db.instagram_queue.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return {"connected": instagram_connected(), "items": items}


@api.post("/admin/instagram")
async def ig_add(body: QueueIn, user: dict = Depends(require_role("editor"))):
    news = await db.news.find_one({"id": body.news_id}, {"_id": 0})
    if not news:
        raise HTTPException(404, "Berita tidak ditemukan")
    doc = await queue_instagram(news["id"], news["title"], news.get("cover", ""), body.caption or f"{news['title']}\n\n{news.get('excerpt', '')}", "Berita admin")
    await log_activity(user, "Menambah antrean Instagram", news["title"])
    return doc


@api.put("/admin/instagram/{qid}")
async def ig_update(qid: str, body: QueueUpdate, user: dict = Depends(require_role("editor"))):
    upd = {k: v for k, v in body.model_dump().items() if v is not None}
    if "status" in upd and upd["status"] not in ("menunggu", "terposting", "dibatalkan"):
        raise HTTPException(400, "Status tidak dikenal")
    if not (await db.instagram_queue.update_one({"id": qid}, {"$set": upd})).matched_count:
        raise HTTPException(404, "Antrean tidak ditemukan")
    return {"ok": True}


@api.post("/admin/instagram/{qid}/publish")
async def ig_publish(qid: str, user: dict = Depends(require_role("editor"))):
    # Koneksi Instagram Graph API belum disambungkan (menunggu akun bisnis & token).
    if not await db.instagram_queue.find_one({"id": qid}):
        raise HTTPException(404, "Antrean tidak ditemukan")
    if not instagram_connected():
        raise HTTPException(400, "Instagram belum terhubung. Isi INSTAGRAM_ACCESS_TOKEN dan INSTAGRAM_ACCOUNT_ID di server, atau unggah manual lalu tandai 'Sudah diposting'.")
    raise HTTPException(501, "Publikasi otomatis akan aktif setelah integrasi Instagram Graph API dipasang.")


@api.delete("/admin/instagram/{qid}")
async def ig_delete(qid: str, user: dict = Depends(require_role("editor"))):
    if not (await db.instagram_queue.delete_one({"id": qid})).deleted_count:
        raise HTTPException(404, "Antrean tidak ditemukan")
    return {"ok": True}


@api.delete("/admin/inbox/{coll}/{item_id}")
async def inbox_delete(coll: str, item_id: str, user: dict = Depends(require_role("admin"))):
    if coll not in ("requests", "complaints", "submissions", "umkm"):
        raise HTTPException(404, "Data tidak ditemukan")
    existing = await db[coll].find_one_and_delete({"id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(404, "Data tidak ditemukan")
    await cleanup_files(existing)
    await log_activity(user, f"Menghapus {coll}", item_id)
    return {"ok": True}


# ---------------- Dashboard & backup ----------------
@api.get("/admin/dashboard")
async def dashboard(user: dict = Depends(current_user)):
    since = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%d")
    visits = await db.visits.find({"day": {"$gte": since}}, {"_id": 0}).to_list(40)
    old_limit = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    latest = await db.news.find(published_news_filter(), {"_id": 0, "published_at": 1}).sort("published_at", -1).limit(1).to_list(1)
    if user["role"] == "kontributor":
        return {"news_published": await db.news.count_documents({"author_id": user["id"], "status": "terbit"}),
                "news_draft": await db.news.count_documents({"author_id": user["id"], "status": {"$in": ["draf", "diajukan"]}}),
                "visits_30d": sum(v.get("count", 0) for v in visits), "news_stale": False}
    return {
        "news_published": await db.news.count_documents({"status": "terbit"}),
        "news_draft": await db.news.count_documents({"status": {"$in": ["draf", "diajukan"]}}),
        "submissions_pending": await db.submissions.count_documents({"status": "menunggu"}),
        "umkm_pending": await db.umkm.count_documents({"status": {"$in": ["menunggu", "dipanggil"]}}),
        "requests_open": await db.requests.count_documents({"status": {"$nin": ["selesai", "ditolak"]}}),
        "complaints_open": await db.complaints.count_documents({"status": {"$in": ["diterima", "ditindaklanjuti"]}}),
        "instagram_waiting": await db.instagram_queue.count_documents({"status": "menunggu"}),
        "gallery": await db.gallery.count_documents({}),
        "visits_30d": sum(v.get("count", 0) for v in visits),
        "news_stale": not latest or latest[0]["published_at"] < old_limit,
    }


@api.get("/admin/backup")
async def backup(user: dict = Depends(require_role("admin"))):
    out = {}
    for name in list(RESOURCES) + ["settings", "requests", "complaints", "submissions", "umkm", "instagram_queue"]:
        out[name] = await db[name].find({}, {"_id": 0}).to_list(10000)
    return out


@api.get("/")
async def root():
    return {"message": "API Kelurahan Purwokerto Wetan"}


# ---------------- Seed ----------------
async def seed():
    if not await db.users.find_one({"username": os.environ["ADMIN_USERNAME"]}):
        await db.users.insert_one({"id": new_id(), "username": os.environ["ADMIN_USERNAME"], "email": os.environ["ADMIN_EMAIL"].lower(),
                                   "name": "Administrator", "position": "Administrator Website", "phone": "", "photo": "", "role": "admin",
                                   "status": "aktif", "password_hash": hash_pw(os.environ["ADMIN_PASSWORD"]), "must_change_password": False,
                                   "failed_attempts": 0, "created_at": now_iso()})
    if not await db.settings.find_one({"id": "site"}):
        await db.settings.insert_one({"id": "site", **seed_data.DEFAULT_SETTINGS})
    if not await db.services.count_documents({}):
        for f in sorted(LAYANAN_DIR.glob("*.json")):
            svc = json.loads(f.read_text(encoding="utf-8"))
            await db.services.insert_one({"id": new_id(), "created_at": now_iso(), **svc})
    seeds = {"officials": seed_data.OFFICIALS, "institutions": seed_data.INSTITUTIONS, "rw": seed_data.RW, "statistics": seed_data.STATISTICS,
             "links": seed_data.LINKS, "potentials": seed_data.POTENTIALS, "gallery": seed_data.GALLERY}
    for coll, items in seeds.items():
        if not await db[coll].count_documents({}):
            await db[coll].insert_many([{"id": new_id(), "order": i + 1, "visible": True, "photo": "", "created_at": now_iso(), **it} for i, it in enumerate(items)])
    if not await db.news.count_documents({}):
        for it in seed_data.NEWS:
            await db.news.insert_one({"id": new_id(), "slug": slugify(it["title"]), "status": "terbit", "author_name": "Admin Kelurahan",
                                      "views": 0, "created_at": now_iso(), **it})


async def ensure_indexes():
    for coll, models in INDEXES.items():
        for m in models:
            try:
                await db[coll].create_indexes([m])
            except Exception as exc:
                logger.error("index %s: %s", coll, exc)


_init = {"loop": None, "task": None}


async def _init_db():
    await ensure_indexes()
    await seed()


async def ensure_ready():
    loop = asyncio.get_running_loop()
    if _init["loop"] is not loop or _init["task"] is None:
        _init.update(loop=loop, task=loop.create_task(_init_db()))
    try:
        await _init["task"]
    except Exception:
        _init["task"] = None
        raise


@app.middleware("http")
async def ready_middleware(request: Request, call_next):
    if request.url.path.startswith("/api"):
        try:
            await ensure_ready()
        except Exception as exc:
            logger.error("database belum siap: %s", exc)
            return JSONResponse({"detail": "Server belum tersambung ke database. Coba lagi beberapa saat."}, status_code=503)
    return await call_next(request)


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("startup")
async def startup():
    await ensure_ready()
