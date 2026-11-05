# Full-stack regression: auth, public lists, citizen forms (requests/complaints/submissions/umkm),
# GridFS uploads, admin CRUD + data sharing, request status, users, settings, dashboard.
import io
import os
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN = {"username": "admin", "password": "Admin#PWetan2026"}


def jpeg_bytes(color=(200, 30, 30), size=(400, 300)):
    b = io.BytesIO()
    Image.new("RGB", size, color).save(b, "JPEG")
    return b.getvalue()


def png_bytes():
    b = io.BytesIO()
    Image.new("RGBA", (300, 200), (0, 128, 255, 128)).save(b, "PNG")
    return b.getvalue()


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{API}/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.skip(f"login failed {r.status_code} {r.text}")
    return r.json()["token"]


@pytest.fixture(scope="module")
def H(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def cleanup(H):
    items = []  # (kind, coll, id)
    yield items
    for kind, coll, iid in items:
        if kind == "res":
            requests.delete(f"{API}/admin/res/{coll}/{iid}", headers=H)
        elif kind == "inbox":
            requests.delete(f"{API}/admin/inbox/{coll}/{iid}", headers=H)
        elif kind == "user":
            requests.delete(f"{API}/admin/users/{iid}", headers=H)


# --- Health / auth
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/")
        assert r.status_code == 200 and "Purwokerto" in r.json()["message"]

    def test_login_ok(self, token):
        assert isinstance(token, str) and len(token) > 20

    def test_login_bad(self):
        r = requests.post(f"{API}/auth/login", json={"username": "TEST_nouser_x", "password": "x"})
        assert r.status_code == 401

    def test_me(self, H):
        r = requests.get(f"{API}/auth/me", headers=H)
        assert r.status_code == 200 and r.json()["role"] == "admin"

    def test_admin_requires_auth(self):
        assert requests.get(f"{API}/admin/dashboard").status_code == 401


# --- Public lists
class TestPublicLists:
    @pytest.mark.parametrize("res", ["news", "gallery", "officials", "services", "potentials", "statistics", "links", "institutions", "rw", "announcements", "documents"])
    def test_list(self, res):
        r = requests.get(f"{API}/public/{res}")
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d["items"], list) and isinstance(d["total"], int)
        assert all("_id" not in i for i in d["items"])

    def test_settings(self):
        r = requests.get(f"{API}/public/settings")
        assert r.status_code == 200 and isinstance(r.json(), dict) and "_id" not in r.json()

    def test_unknown_res(self):
        assert requests.get(f"{API}/public/unknownx").status_code == 404

    def test_news_detail(self):
        items = requests.get(f"{API}/public/news").json()["items"]
        assert items
        r = requests.get(f"{API}/public/news/{items[0]['slug']}")
        assert r.status_code == 200 and r.json()["id"] == items[0]["id"]
        assert requests.get(f"{API}/public/news/TEST_nonexistent-slug").status_code == 404

    def test_visit(self):
        assert requests.post(f"{API}/public/visit").json()["ok"] is True


# --- Uploads (GridFS)
class TestUploads:
    def test_upload_jpeg_and_fetch(self, H):
        r = requests.post(f"{API}/admin/upload", headers=H, files={"file": ("t.jpg", jpeg_bytes(), "image/jpeg")})
        assert r.status_code == 200, r.text
        url = r.json()["url"]
        assert url.startswith("/api/uploads/") and url.endswith(".jpg")
        g = requests.get(f"{BASE_URL}{url}")
        assert g.status_code == 200 and g.headers["content-type"].startswith("image/jpeg")
        assert g.content[:3] == b"\xff\xd8\xff"

    def test_upload_png_converted(self, H):
        r = requests.post(f"{API}/admin/upload", headers=H, files={"file": ("t.png", png_bytes(), "image/png")})
        assert r.status_code == 200 and r.json()["url"].endswith(".jpg")

    def test_upload_pdf(self, H):
        r = requests.post(f"{API}/admin/upload", headers=H, files={"file": ("t.pdf", b"%PDF-1.4 test", "application/pdf")})
        assert r.status_code == 200 and r.json()["url"].endswith(".pdf")
        g = requests.get(f"{BASE_URL}{r.json()['url']}")
        assert g.status_code == 200 and "pdf" in g.headers["content-type"]

    def test_upload_bad_type(self, H):
        r = requests.post(f"{API}/admin/upload", headers=H, files={"file": ("t.txt", b"hello", "text/plain")})
        assert r.status_code == 400

    def test_upload_corrupt_image(self, H):
        r = requests.post(f"{API}/admin/upload", headers=H, files={"file": ("t.jpg", b"notanimage", "image/jpeg")})
        assert r.status_code == 400

    def test_upload_requires_auth(self):
        r = requests.post(f"{API}/admin/upload", files={"file": ("t.jpg", jpeg_bytes(), "image/jpeg")})
        assert r.status_code == 401

    def test_unknown_upload_404(self):
        assert requests.get(f"{API}/uploads/doesnotexist123.jpg").status_code == 404


# --- Citizen forms (rate limited: keep count low)
class TestCitizenForms:
    def test_request_flow(self, H, cleanup):
        svc = requests.get(f"{API}/public/services").json()["items"][0]
        r = requests.post(f"{API}/public/requests", json={"service_id": svc["id"], "name": "TEST_Warga", "phone": "081234567890", "rt_rw": "01/02", "note": "TEST"})
        assert r.status_code == 200, r.text
        t = r.json()["ticket"]
        assert t.startswith("PW-")
        lst = requests.get(f"{API}/admin/requests", headers=H).json()
        item = next(i for i in lst if i["ticket"] == t)
        cleanup.append(("inbox", "requests", item["id"]))
        u = requests.put(f"{API}/admin/requests/{item['id']}/status", headers=H, json={"status": "diproses", "note": "TEST proses"})
        assert u.status_code == 200 and u.json()["status"] == "diproses"
        tr = requests.get(f"{API}/public/track/{t}", params={"phone4": "7890"})
        assert tr.status_code == 200 and tr.json()["status"] == "diproses" and tr.json()["kind"] == "layanan"
        assert requests.get(f"{API}/public/track/{t}", params={"phone4": "0000"}).status_code == 404
        assert requests.put(f"{API}/admin/requests/{item['id']}/status", headers=H, json={"status": "bogus"}).status_code == 400

    def test_complaint_flow(self, H, cleanup):
        r = requests.post(f"{API}/public/complaints", json={"name": "TEST_Warga", "phone": "081234567891", "category": "Lainnya", "message": "TEST laporan jalan rusak di RT 01"})
        assert r.status_code == 200, r.text
        t = r.json()["ticket"]
        item = next(i for i in requests.get(f"{API}/admin/complaints", headers=H).json() if i["ticket"] == t)
        cleanup.append(("inbox", "complaints", item["id"]))
        assert requests.get(f"{API}/public/track/{t}", params={"phone4": "7891"}).json()["kind"] == "pengaduan"

    def test_complaint_validation(self):
        r = requests.post(f"{API}/public/complaints", json={"name": "T", "phone": "08", "category": "Lainnya", "message": "short"})
        assert r.status_code == 400

    def test_submission_with_photo(self, H, cleanup):
        r = requests.post(f"{API}/public/submissions",
                          data={"kind": "galeri", "title": "TEST_Kiriman Galeri", "name": "TEST_Warga", "phone": "081234567892", "ig_consent": "false"},
                          files=[("files", ("a.jpg", jpeg_bytes(), "image/jpeg"))])
        assert r.status_code == 200, r.text
        t = r.json()["ticket"]
        assert t.startswith("KW-")
        item = next(i for i in requests.get(f"{API}/admin/submissions", headers=H).json() if i["ticket"] == t)
        cleanup.append(("inbox", "submissions", item["id"]))
        assert len(item["images"]) == 1
        g = requests.get(f"{BASE_URL}{item['images'][0]}")
        assert g.status_code == 200 and g.headers["content-type"].startswith("image/jpeg")

    def test_umkm_with_photo(self, H, cleanup):
        r = requests.post(f"{API}/public/umkm",
                          data={"kind": "UMKM", "business_name": "TEST_Usaha Keripik", "category": "Kuliner", "description": "TEST deskripsi usaha keripik singkong renyah",
                                "name": "TEST_Warga", "phone": "081234567893"},
                          files=[("files", ("a.jpg", jpeg_bytes((10, 200, 10)), "image/jpeg"))])
        assert r.status_code == 200, r.text
        t = r.json()["ticket"]
        assert t.startswith("UM-")
        item = next(i for i in requests.get(f"{API}/admin/umkm", headers=H).json() if i["ticket"] == t)
        cleanup.append(("inbox", "umkm", item["id"]))
        assert len(item["images"]) == 1 and requests.get(f"{BASE_URL}{item['images'][0]}").status_code == 200
        tr = requests.get(f"{API}/public/track/{t}", params={"phone4": "7893"})
        assert tr.status_code == 200 and tr.json()["kind"] == "umkm"


# --- Admin CRUD + sharing (visible publicly without auth)
class TestAdminCrud:
    def test_news_crud_public(self, H, cleanup):
        up = requests.post(f"{API}/admin/upload", headers=H, files={"file": ("c.jpg", jpeg_bytes(), "image/jpeg")}).json()["url"]
        r = requests.post(f"{API}/admin/res/news", headers=H, json={"title": "TEST_Berita Fullstack", "category": "Kegiatan", "status": "terbit", "cover": up, "content": "TEST isi"})
        assert r.status_code == 200
        n = r.json()
        cleanup.append(("res", "news", n["id"]))
        pub = requests.get(f"{API}/public/news/{n['slug']}")
        assert pub.status_code == 200 and pub.json()["cover"] == up
        u = requests.put(f"{API}/admin/res/news/{n['id']}", headers=H, json={"title": "TEST_Berita Fullstack Edit"})
        assert u.status_code == 200
        assert requests.get(f"{API}/public/news/{n['id']}").json()["title"] == "TEST_Berita Fullstack Edit"
        # draft must not be public
        requests.put(f"{API}/admin/res/news/{n['id']}", headers=H, json={"status": "draf"})
        assert requests.get(f"{API}/public/news/{n['id']}").status_code == 404

    @pytest.mark.parametrize("res,payload,key", [
        ("gallery", {"title": "TEST_Galeri", "image": "", "album": "Kegiatan", "visible": True}, "title"),
        ("officials", {"name": "TEST_Pejabat", "position": "Staf", "level": 3, "visible": True}, "name"),
        ("announcements", {"title": "TEST_Pengumuman", "content": "TEST isi pengumuman", "visible": True}, "title"),
    ])
    def test_res_crud(self, H, cleanup, res, payload, key):
        r = requests.post(f"{API}/admin/res/{res}", headers=H, json=payload)
        assert r.status_code == 200, r.text
        iid = r.json()["id"]
        cleanup.append(("res", res, iid))
        pub = requests.get(f"{API}/public/{res}", params={"limit": 200}).json()["items"]
        assert any(i["id"] == iid for i in pub)
        requests.put(f"{API}/admin/res/{res}/{iid}", headers=H, json={"visible": False})
        pub = requests.get(f"{API}/public/{res}", params={"limit": 200}).json()["items"]
        assert not any(i["id"] == iid for i in pub)
        d = requests.delete(f"{API}/admin/res/{res}/{iid}", headers=H)
        assert d.status_code == 200
        assert requests.put(f"{API}/admin/res/{res}/{iid}", headers=H, json={"visible": True}).status_code == 404

    def test_announcement_validation(self, H):
        assert requests.post(f"{API}/admin/res/announcements", headers=H, json={"title": "", "content": ""}).status_code == 422


# --- Users, settings, dashboard
class TestAdminMisc:
    def test_dashboard(self, H):
        r = requests.get(f"{API}/admin/dashboard", headers=H)
        assert r.status_code == 200
        for k in ["news_published", "requests_open", "complaints_open", "submissions_pending", "umkm_pending", "gallery"]:
            assert isinstance(r.json()[k], int)

    def test_users_crud(self, H, cleanup):
        r = requests.post(f"{API}/admin/users", headers=H, json={"username": "test_fs_user", "name": "TEST_User", "role": "editor"})
        assert r.status_code == 200, r.text
        uid = r.json()["user"]["id"]
        pw = r.json()["temp_password"]
        cleanup.append(("user", "users", uid))
        lg = requests.post(f"{API}/auth/login", json={"username": "test_fs_user", "password": pw})
        assert lg.status_code == 200 and lg.json()["user"]["must_change_password"] is True
        u = requests.put(f"{API}/admin/users/{uid}", headers=H, json={"status": "nonaktif"})
        assert u.status_code == 200 and u.json()["status"] == "nonaktif"
        assert requests.post(f"{API}/auth/login", json={"username": "test_fs_user", "password": pw}).status_code == 403

    def test_settings_roundtrip(self, H):
        orig = requests.get(f"{API}/public/settings").json()
        val = orig.get("site_name")
        r = requests.put(f"{API}/admin/settings", headers=H, json={"site_name": val})
        assert r.status_code == 200 and r.json().get("site_name") == val

    def test_backup(self, H):
        r = requests.get(f"{API}/admin/backup", headers=H)
        assert r.status_code == 200 and "news" in r.json()
