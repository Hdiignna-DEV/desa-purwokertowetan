// Penyimpanan lokal (localStorage) yang meniru seluruh endpoint backend FastAPI (/api/...).
// Ganti ke backend asli dengan REACT_APP_DATA_MODE=backend di frontend/.env.
import { AxiosError } from "axios";
import SEED from "./seed.json";

const DB_KEY = "pwetan_db_v2";
const TOKEN_KEY = "pw_admin_token";
export const LOCAL_ADMIN = { username: "admin", password: "Admin#PWetan2026" };

const RES = {
  news: { sort: [["published_at", -1]], role: "kontributor" },
  gallery: { sort: [["order", 1], ["created_at", -1]], role: "editor", visible: true },
  officials: { sort: [["level", 1], ["order", 1]], role: "editor", visible: true },
  services: { sort: [["order", 1]], role: "editor", visible: true },
  potentials: { sort: [["order", 1], ["created_at", -1]], role: "editor", visible: true },
  statistics: { sort: [["order", 1]], role: "editor" },
  documents: { sort: [["created_at", -1]], role: "editor" },
  links: { sort: [["order", 1]], role: "editor", visible: true },
  institutions: { sort: [["order", 1]], role: "editor" },
  rw: { sort: [["order", 1]], role: "editor" },
  announcements: { sort: [["start_at", -1], ["created_at", -1]], role: "editor", visible: true },
};
const CONTENT_KEYS = ["sambutan", "profil", "ringkasan", "data_info", "alur", "survey", "auto_holidays"];
const DB_VERSION = 2;
const OLD_HOURS = "Senin – Jumat";
const ROLE_RANK = { kontributor: 1, editor: 2, admin: 3 };
const REQUEST_STATUSES = ["diterima", "diverifikasi", "perlu_dilengkapi", "diproses", "selesai", "ditolak"];
const COMPLAINT_STATUSES = ["diterima", "ditindaklanjuti", "selesai", "ditolak"];
const INBOX = ["requests", "complaints", "submissions", "umkm"];

const nowIso = () => new Date().toISOString();
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const rand = (n, chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => chars[b % chars.length]).join("");
const slugify = (t) => `${t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70)}-${rand(4, "0123456789abcdef")}`;
const makeTicket = (p) => {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `${p}-${ymd}-${rand(4)}`;
};
const digits = (s) => (s || "").replace(/\D/g, "");
const maskName = (n) => (n || "").split(/\s+/).map((p) => (p.length > 1 ? p[0] + "*".repeat(p.length - 1) : p)).join(" ");
const sha = async (text) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))), (b) => b.toString(16).padStart(2, "0")).join("");
const hashPw = async (pw) => {
  const salt = rand(16);
  return `${salt}$${await sha(`${salt}:${pw}`)}`;
};
const checkPw = async (pw, h) => {
  const [salt, hash] = (h || "").split("$");
  return (await sha(`${salt}:${pw}`)) === hash;
};

class HttpError extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}
const fail = (status, detail) => {
  throw new HttpError(status, detail);
};

const sortBy = (items, spec) => [...items].sort((a, b) => {
  for (const [k, dir] of spec) {
    const x = a[k] ?? "";
    const y = b[k] ?? "";
    if (x < y) return -dir;
    if (x > y) return dir;
  }
  return 0;
});

function seedDb() {
  const t = nowIso();
  const base = (it, i) => ({ id: newId(), order: i + 1, visible: true, photo: "", created_at: t, ...it });
  const db = { version: DB_VERSION, settings: { id: "site", ...SEED.settings }, users: [], sessions: {}, activity_logs: [], visits: {}, requests: [], complaints: [], submissions: [], umkm: [], instagram_queue: [], documents: [], announcements: [] };
  ["officials", "institutions", "rw", "statistics", "links", "potentials", "gallery"].forEach((k) => { db[k] = SEED[k].map(base); });
  db.services = SEED.services.map((s) => ({ id: newId(), created_at: t, ...s }));
  db.news = SEED.news.map((n) => ({ id: newId(), slug: slugify(n.title), status: "terbit", author_name: "Admin Kelurahan", views: 0, created_at: t, ...n }));
  return db;
}

let db;
function getDb() {
  if (!db) {
    try {
      db = JSON.parse(localStorage.getItem(DB_KEY));
    } catch {
      db = null;
    }
    if (!db) db = seedDb();
    migrate(db);
  }
  return db;
}
// Pembaruan struktur data untuk browser yang sudah menyimpan data versi lama
function migrate(d) {
  if ((d.version || 1) >= DB_VERSION) return;
  d.announcements = d.announcements || [];
  if (!d.settings.auto_holidays) d.settings.auto_holidays = SEED.settings.auto_holidays;
  if (d.settings.hours?.[0]?.day === OLD_HOURS) d.settings.hours = SEED.settings.hours;
  d.version = DB_VERSION;
  localStorage.setItem(DB_KEY, JSON.stringify(d));
}
function persist() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    fail(507, "Penyimpanan browser penuh. Hapus beberapa foto/berkas atau gunakan mode backend.");
  }
}
async function ensureAdmin() {
  const d = getDb();
  if (d.users.length) return;
  d.users.push({ id: newId(), username: LOCAL_ADMIN.username, email: "admin@kelurahan.local", name: "Administrator", position: "Administrator Website", phone: "", photo: "", role: "admin", status: "aktif", password_hash: await hashPw(LOCAL_ADMIN.password), must_change_password: false, failed_attempts: 0, created_at: nowIso() });
  persist();
}

const PUBLIC_USER_KEYS = ["id", "username", "email", "name", "position", "phone", "photo", "role", "status", "last_login", "must_change_password", "locked_until", "created_at"];
const publicUser = (u) => Object.fromEntries(PUBLIC_USER_KEYS.map((k) => [k, u[k] ?? null]));

function currentUser(headers) {
  const auth = headers?.Authorization || headers?.authorization || headers?.get?.("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const s = token && db.sessions[token];
  if (!s || s.exp < Date.now()) fail(401, "Sesi berakhir, silakan login kembali");
  const u = db.users.find((x) => x.id === s.uid);
  if (!u || u.status !== "aktif") fail(401, "Akun tidak aktif");
  return u;
}
const needRole = (u, role) => {
  if (ROLE_RANK[u.role] < ROLE_RANK[role]) fail(403, "Anda tidak memiliki hak akses untuk tindakan ini");
  return u;
};
const log = (u, action, target) => db.activity_logs.unshift({ id: newId(), user_id: u.id, user_name: u.name || u.username, action, target, created_at: nowIso() });

// ---------- Unggahan: gambar dikompres, disimpan sebagai data URL ----------
const readDataUrl = (f) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(r.result);
  r.onerror = rej;
  r.readAsDataURL(f);
});
async function compressImage(file, max = 1280) {
  const src = await readDataUrl(file);
  if (file.type === "image/png" && file.size < 250 * 1024) return src;
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new HttpError(400, "Berkas gambar rusak atau tidak valid"));
    i.src = src;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.78);
}
async function saveUpload(f, { maxMb = 10, pdf = true } = {}) {
  if (f.size > maxMb * 1024 * 1024) fail(400, `Ukuran berkas maksimal ${maxMb} MB`);
  if (["image/jpeg", "image/png", "image/webp"].includes(f.type)) return compressImage(f);
  if (pdf && f.type === "application/pdf") {
    if (f.size > 2 * 1024 * 1024) fail(400, "Mode lokal: PDF maksimal 2 MB");
    return readDataUrl(f);
  }
  return fail(400, "Hanya gambar (JPG/PNG/WEBP) atau PDF yang diterima");
}

const requireFields = (name, phone) => {
  if ((name || "").trim().length < 2 || digits(phone).length < 9) fail(400, "Nama dan nomor WhatsApp wajib diisi dengan benar");
};
const publishedNews = () => db.news.filter((n) => ["terbit", "terjadwal"].includes(n.status) && (n.published_at || "") <= nowIso());
const checkRes = (res) => RES[res] || fail(404, "Data tidak ditemukan");
const prepareNews = (body, u, existing) => {
  if (u.role === "kontributor" && !["draf", "diajukan"].includes(body.status)) body.status = "draf";
  if (body.title && (!existing || !existing.slug)) body.slug = slugify(body.title);
  if (["terbit", "terjadwal"].includes(body.status) && !body.published_at) body.published_at = nowIso();
  return body;
};
const strip = (body, keys) => Object.fromEntries(Object.entries(body || {}).filter(([k]) => !keys.includes(k)));
const tempPassword = () => `Pw-${rand(8, "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789")}`;
const activeAdmins = (excludeId) => db.users.filter((u) => u.role === "admin" && u.status === "aktif" && u.id !== excludeId).length;
const queueInstagram = (newsId, title, image, caption, source) => {
  const doc = { id: newId(), news_id: newsId, title, image, caption, source, status: "menunggu", created_at: nowIso(), note: "" };
  db.instagram_queue.unshift(doc);
  return doc;
};
const findOr404 = (coll, id, msg = "Data tidak ditemukan") => db[coll].find((x) => x.id === id) || fail(404, msg);

// ---------- Rute ----------
const R = [];
const route = (method, path, fn) => R.push({ method, re: new RegExp(`^${path.replace(/:(\w+)/g, "(?<$1>[^/]+)")}$`), fn });

route("post", "/auth/login", async ({ body }) => {
  const ident = (body.username || "").trim().toLowerCase();
  const u = db.users.find((x) => x.username === ident || x.email === ident);
  if (!u) fail(401, "Nama pengguna atau kata sandi salah");
  if (u.status === "nonaktif") fail(403, "Akun Anda dinonaktifkan. Hubungi Administrator.");
  if (u.locked_until && new Date(u.locked_until) > new Date()) fail(423, "Akun terkunci karena 5 kali salah kata sandi. Coba lagi setelah 15 menit atau hubungi Administrator.");
  if (!(await checkPw(body.password || "", u.password_hash))) {
    u.failed_attempts = (u.failed_attempts || 0) + 1;
    if (u.failed_attempts >= 5) Object.assign(u, { failed_attempts: 0, locked_until: new Date(Date.now() + 15 * 60000).toISOString() });
    persist();
    fail(401, "Nama pengguna atau kata sandi salah");
  }
  Object.assign(u, { failed_attempts: 0, locked_until: null, last_login: nowIso(), status: u.status === "menunggu" ? "aktif" : u.status });
  const token = rand(40);
  db.sessions[token] = { uid: u.id, exp: Date.now() + 8 * 3600000 };
  persist();
  return { token, user: publicUser(u) };
});
route("get", "/auth/me", ({ user }) => publicUser(user()));
route("put", "/auth/me", ({ user, body }) => {
  const u = user();
  ["name", "phone", "photo", "position"].forEach((k) => { if (body[k] != null) u[k] = body[k]; });
  persist();
  return publicUser(u);
});
route("post", "/auth/change-password", async ({ user, body }) => {
  const u = user();
  if (!(await checkPw(body.old_password || "", u.password_hash))) fail(400, "Kata sandi lama tidak sesuai");
  if ((body.new_password || "").length < 8) fail(400, "Kata sandi baru minimal 8 karakter");
  Object.assign(u, { password_hash: await hashPw(body.new_password), must_change_password: false });
  log(u, "Mengganti kata sandi", "Akun sendiri");
  persist();
  return { ok: true };
});

route("get", "/admin/users", ({ user }) => (needRole(user(), "admin"), sortBy(db.users, [["created_at", 1]]).map(publicUser)));
route("post", "/admin/users", async ({ user, body }) => {
  const admin = needRole(user(), "admin");
  if (!body.username || !body.name || !ROLE_RANK[body.role]) fail(400, "Nama, nama pengguna, dan peran wajib diisi");
  const username = body.username.trim().toLowerCase();
  if (db.users.some((u) => u.username === username)) fail(400, "Nama pengguna sudah dipakai");
  const pw = tempPassword();
  const doc = { email: "", position: "", phone: "", photo: "", ...body, id: newId(), username, email: (body.email || "").toLowerCase(), status: "menunggu", password_hash: await hashPw(pw), must_change_password: true, failed_attempts: 0, created_at: nowIso() };
  db.users.push(doc);
  log(admin, "Menambah akun", `${body.name} (${body.role})`);
  persist();
  return { user: publicUser(doc), temp_password: pw };
});
route("put", "/admin/users/:uid", ({ user, body, p }) => {
  const admin = needRole(user(), "admin");
  const t = findOr404("users", p.uid, "Akun tidak ditemukan");
  const upd = Object.fromEntries(Object.entries(body).filter(([k, v]) => v != null && k !== "username"));
  if (upd.role && !ROLE_RANK[upd.role]) fail(400, "Peran tidak dikenal");
  if (t.id === admin.id && ((upd.role || "admin") !== "admin" || (upd.status || "aktif") !== "aktif")) fail(400, "Anda tidak dapat menurunkan peran atau menonaktifkan akun sendiri");
  if (t.role === "admin" && ((upd.role || "admin") !== "admin" || (upd.status || "aktif") !== "aktif") && activeAdmins(t.id) < 1) fail(400, "Harus selalu ada minimal satu Administrator aktif");
  Object.assign(t, upd);
  log(admin, "Mengubah akun", t.name);
  persist();
  return publicUser(t);
});
route("post", "/admin/users/:uid/reset-password", async ({ user, p }) => {
  const admin = needRole(user(), "admin");
  const t = findOr404("users", p.uid, "Akun tidak ditemukan");
  const pw = tempPassword();
  Object.assign(t, { password_hash: await hashPw(pw), must_change_password: true, failed_attempts: 0, locked_until: null });
  log(admin, "Mengatur ulang kata sandi", t.name);
  persist();
  return { temp_password: pw };
});
route("post", "/admin/users/:uid/unlock", ({ user, p }) => {
  needRole(user(), "admin");
  Object.assign(findOr404("users", p.uid, "Akun tidak ditemukan"), { failed_attempts: 0, locked_until: null });
  persist();
  return { ok: true };
});
route("delete", "/admin/users/:uid", ({ user, p }) => {
  const admin = needRole(user(), "admin");
  if (p.uid === admin.id) fail(400, "Anda tidak dapat menghapus akun sendiri");
  const t = findOr404("users", p.uid, "Akun tidak ditemukan");
  if (db.news.some((n) => n.author_id === t.id) || db.activity_logs.some((a) => a.user_id === t.id)) fail(400, "Akun sudah memiliki konten atau riwayat. Gunakan Nonaktifkan.");
  if (t.role === "admin" && activeAdmins(t.id) < 1) fail(400, "Harus selalu ada minimal satu Administrator aktif");
  db.users = db.users.filter((u) => u.id !== t.id);
  log(admin, "Menghapus akun", t.name);
  persist();
  return { ok: true };
});
route("get", "/admin/activity", ({ user, params }) => {
  const u = user();
  return db.activity_logs.filter((a) => u.role === "admin" || a.user_id === u.id).slice(0, Number(params.limit) || 200);
});
route("post", "/admin/upload", async ({ user, form }) => (user(), { url: await saveUpload(form.get("file")) }));

route("get", "/public/settings", () => db.settings);
route("put", "/admin/settings", ({ user, body }) => {
  const u = needRole(user(), "editor");
  let b = strip(body, ["id", "_id"]);
  if (u.role !== "admin") b = Object.fromEntries(Object.entries(b).filter(([k]) => CONTENT_KEYS.includes(k)));
  if (!Object.keys(b).length) fail(403, "Pengaturan situs hanya dapat diubah oleh Administrator");
  Object.assign(db.settings, b);
  log(u, "Mengubah konten/pengaturan", Object.keys(b).join(", "));
  persist();
  return db.settings;
});

route("get", "/public/news/:key", ({ p }) => {
  const n = publishedNews().find((x) => x.slug === p.key || x.id === p.key) || fail(404, "Berita tidak ditemukan");
  n.views = (n.views || 0) + 1;
  persist();
  return n;
});
route("get", "/public/track/:ticket", ({ p, params }) => {
  const t = decodeURIComponent(p.ticket).trim().toUpperCase();
  const [coll, kind] = t.startsWith("AD-") ? ["complaints", "pengaduan"] : t.startsWith("KW-") ? ["submissions", "kiriman"] : t.startsWith("UM-") ? ["umkm", "umkm"] : ["requests", "layanan"];
  const d = db[coll].find((x) => x.ticket === t);
  if (!d || String(params.phone4 || "").length !== 4 || !digits(d.phone).endsWith(params.phone4)) fail(404, "Nomor tiket tidak ditemukan atau 4 digit nomor WhatsApp tidak sesuai");
  const title = d.service_name || (coll === "complaints" ? d.category : coll === "umkm" ? `Pendaftaran ${d.kind}: ${d.business_name}` : `Kiriman ${d.kind}: ${d.title}`);
  return { ticket: d.ticket, kind, title, name: maskName(d.name), status: d.status, history: d.history || [], estimate: d.estimate || "", response: d.response || d.reason || "", schedule: d.schedule || "", created_at: d.created_at };
});
route("get", "/public/:res", ({ p, params }) => {
  const cfg = checkRes(p.res);
  let items = p.res === "news" ? publishedNews() : cfg.visible ? db[p.res].filter((x) => x.visible !== false) : db[p.res];
  if (params.category) items = items.filter((x) => x.category === params.category);
  if (params.q) items = items.filter((x) => (x[p.res === "news" ? "title" : "name"] || "").toLowerCase().includes(params.q.toLowerCase()));
  const limit = Math.min(Number(params.limit) || 100, 200);
  const page = Number(params.page) || 1;
  return { items: sortBy(items, cfg.sort).slice((page - 1) * limit, page * limit), total: items.length };
});

route("get", "/admin/res/:res", ({ user, p }) => {
  const u = needRole(user(), checkRes(p.res).role);
  const items = p.res === "news" && u.role === "kontributor" ? db.news.filter((n) => n.author_id === u.id) : db[p.res];
  return sortBy(items, RES[p.res].sort);
});
route("post", "/admin/res/:res", ({ user, p, body }) => {
  const u = needRole(user(), checkRes(p.res).role);
  let b = strip(body, ["id", "_id", "created_at"]);
  if (p.res === "news") b = { ...prepareNews(b, u, null), author_id: u.id, author_name: u.name, views: 0 };
  const doc = { ...b, id: newId(), created_at: nowIso(), updated_at: nowIso() };
  db[p.res].push(doc);
  log(u, `Menambah ${p.res}`, b.title || b.name || b.label || "-");
  persist();
  return doc;
});
route("put", "/admin/res/:res/:id", ({ user, p, body }) => {
  const u = needRole(user(), checkRes(p.res).role);
  const ex = findOr404(p.res, p.id);
  let b = strip(body, ["id", "_id", "created_at", "author_id", "author_name", "views"]);
  if (p.res === "news") {
    if (u.role === "kontributor" && (ex.author_id !== u.id || !["draf", "diajukan"].includes(ex.status))) fail(403, "Kontributor hanya dapat mengubah draf miliknya sendiri");
    b = prepareNews(b, u, ex);
  }
  Object.assign(ex, b, { updated_at: nowIso() });
  log(u, `Mengubah ${p.res}`, ex.title || ex.name || "-");
  persist();
  return ex;
});
route("delete", "/admin/res/:res/:id", ({ user, p }) => {
  const u = user();
  const cfg = checkRes(p.res);
  const ex = findOr404(p.res, p.id);
  const ownDraft = p.res === "news" && ex.author_id === u.id && ["draf", "diajukan"].includes(ex.status);
  if (ROLE_RANK[u.role] < ROLE_RANK[p.res === "news" ? "editor" : cfg.role] && !ownDraft) fail(403, "Anda tidak memiliki hak akses");
  db[p.res] = db[p.res].filter((x) => x.id !== p.id);
  log(u, `Menghapus ${p.res}`, ex.title || ex.name || "-");
  persist();
  return { ok: true };
});

// ---------- Formulir warga ----------
route("post", "/public/requests", ({ body }) => {
  if (body.website) fail(400, "Permintaan ditolak");
  requireFields(body.name, body.phone);
  const svc = db.services.find((s) => s.id === body.service_id) || fail(400, "Jenis layanan tidak ditemukan");
  const ticket = makeTicket("PW");
  const doc = { id: newId(), ticket, service_id: svc.id, service_name: svc.name, estimate: svc.estimate || "", requirements: svc.requirements || [], name: body.name.trim(), phone: body.phone.trim(), rt_rw: body.rt_rw || "", address: body.address || "", note: body.note || "", status: "diterima", created_at: nowIso(), history: [{ status: "diterima", note: "Permohonan diterima sistem. Silakan bawa berkas persyaratan ke kantor kelurahan.", at: nowIso() }] };
  db.requests.unshift(doc);
  persist();
  return { ticket, service_name: svc.name, estimate: doc.estimate, requirements: doc.requirements, created_at: doc.created_at };
});
route("post", "/public/complaints", ({ body }) => {
  if (body.website) fail(400, "Permintaan ditolak");
  requireFields(body.name, body.phone);
  if ((body.message || "").trim().length < 10) fail(400, "Isi laporan minimal 10 karakter");
  const ticket = makeTicket("AD");
  const doc = { id: newId(), ticket, ...strip(body, ["website"]), status: "diterima", response: "", created_at: nowIso(), history: [{ status: "diterima", note: "Laporan diterima dan menunggu tindak lanjut.", at: nowIso() }] };
  db.complaints.unshift(doc);
  persist();
  return { ticket, created_at: doc.created_at };
});
route("post", "/public/submissions", async ({ form }) => {
  const g = (k) => form.get(k) || "";
  if (g("website")) fail(400, "Permintaan ditolak");
  if (!["berita", "galeri"].includes(g("kind"))) fail(400, "Jenis kiriman tidak dikenal");
  requireFields(g("name"), g("phone"));
  if (g("title").trim().length < 5) fail(400, "Judul minimal 5 karakter");
  const files = form.getAll("files").filter((f) => f && f.size);
  if (g("kind") === "galeri" && !files.length) fail(400, "Unggah minimal satu foto untuk galeri");
  if (files.length > 5) fail(400, "Maksimal 5 foto per kiriman");
  const images = [];
  for (const f of files) images.push(await saveUpload(f, { maxMb: 5, pdf: false }));
  const ticket = makeTicket("KW");
  db.submissions.unshift({ id: newId(), ticket, kind: g("kind"), title: g("title").trim(), content: g("content"), category: g("category") || "Kegiatan Warga", name: g("name").trim(), phone: g("phone").trim(), rt_rw: g("rt_rw"), ig_consent: g("ig_consent") === "true", images, status: "menunggu", reason: "", created_at: nowIso(), history: [{ status: "menunggu", note: "Kiriman diterima dan menunggu peninjauan admin.", at: nowIso() }] });
  persist();
  return { ticket };
});
route("post", "/public/umkm", async ({ form }) => {
  const g = (k) => (form.get(k) || "").toString();
  if (g("website")) fail(400, "Permintaan ditolak");
  requireFields(g("name"), g("phone"));
  if (g("business_name").trim().length < 3) fail(400, "Nama usaha/potensi minimal 3 karakter");
  if (g("description").trim().length < 20) fail(400, "Deskripsi minimal 20 karakter");
  const files = form.getAll("files").filter((f) => f && f.size);
  if (files.length > 3) fail(400, "Maksimal 3 foto");
  const images = [];
  for (const f of files) images.push(await saveUpload(f, { maxMb: 5, pdf: false }));
  const ticket = makeTicket("UM");
  db.umkm.unshift({ id: newId(), ticket, kind: g("kind") || "UMKM", business_name: g("business_name").trim(), category: g("category"), description: g("description").trim(), address: g("address"), product_contact: g("product_contact"), name: g("name").trim(), nik_last: g("nik_last"), phone: g("phone").trim(), rt_rw: g("rt_rw"), images, status: "menunggu", reason: "", schedule: "", created_at: nowIso(), history: [{ status: "menunggu", note: "Pendaftaran diterima dan menunggu verifikasi admin kelurahan.", at: nowIso() }] });
  persist();
  return { ticket };
});
route("post", "/public/visit", () => {
  const day = nowIso().slice(0, 10);
  db.visits[day] = (db.visits[day] || 0) + 1;
  persist();
  return { ok: true };
});

// ---------- Admin: permohonan, pengaduan, kiriman, UMKM, instagram ----------
const statusUpdate = (coll, statuses, label) => ({ user, p, body }) => {
  const u = needRole(user(), "editor");
  if (!statuses.includes(body.status)) fail(400, "Status tidak dikenal");
  const d = findOr404(coll, p.id, `${label} tidak ditemukan`);
  d.status = body.status;
  if (coll === "complaints" && body.response != null) d.response = body.response;
  d.history = [...(d.history || []), { status: body.status, note: body.note || "", at: nowIso(), by: u.name }];
  log(u, `Status ${label.toLowerCase()} → ${body.status}`, d.ticket);
  persist();
  return d;
};
route("get", "/admin/requests", ({ user }) => (needRole(user(), "editor"), sortBy(db.requests, [["created_at", -1]])));
route("put", "/admin/requests/:id/status", statusUpdate("requests", REQUEST_STATUSES, "Permohonan"));
route("get", "/admin/complaints", ({ user }) => (needRole(user(), "editor"), sortBy(db.complaints, [["created_at", -1]])));
route("put", "/admin/complaints/:id/status", statusUpdate("complaints", COMPLAINT_STATUSES, "Pengaduan"));
route("get", "/admin/submissions", ({ user }) => (needRole(user(), "editor"), sortBy(db.submissions, [["created_at", -1]])));
route("post", "/admin/submissions/:id/approve", ({ user, p, body }) => {
  const u = needRole(user(), "editor");
  const sub = db.submissions.find((s) => s.id === p.id && s.status === "menunggu") || fail(404, "Kiriman tidak ditemukan atau sudah diproses");
  const title = body.title || sub.title;
  let publishedId = null;
  if (sub.kind === "berita") {
    const content = body.content ?? sub.content;
    const news = { id: newId(), title, slug: slugify(title), category: body.category || sub.category, excerpt: content.slice(0, 180), content, cover: sub.images[0] || "", images: sub.images, status: "terbit", published_at: nowIso(), author_id: null, author_name: `Kiriman warga: ${sub.name}`, views: 0, created_at: nowIso(), updated_at: nowIso() };
    db.news.push(news);
    publishedId = news.id;
    if (body.post_instagram) queueInstagram(news.id, title, news.cover, body.caption || `${title}\n\n${content.slice(0, 300)}`, "Kiriman warga");
  } else {
    sub.images.forEach((img) => db.gallery.push({ id: newId(), title, caption: `Kiriman warga: ${sub.name}`, image: img, album: "Kiriman Warga", visible: true, order: 99, created_at: nowIso() }));
    if (body.post_instagram && sub.images.length) queueInstagram("", title, sub.images[0], body.caption || title, "Galeri warga");
  }
  Object.assign(sub, { status: "disetujui", reviewed_by: u.name, reviewed_at: nowIso(), published_id: publishedId, history: [...(sub.history || []), { status: "disetujui", note: "Kiriman disetujui dan telah dipublikasikan di website kelurahan.", at: nowIso(), by: u.name }] });
  log(u, "ACC kiriman warga", title);
  persist();
  return { ok: true };
});
route("post", "/admin/submissions/:id/reject", ({ user, p, body }) => {
  const u = needRole(user(), "editor");
  const sub = db.submissions.find((s) => s.id === p.id && s.status === "menunggu") || fail(404, "Kiriman tidak ditemukan atau sudah diproses");
  Object.assign(sub, { status: "ditolak", reason: body.reason || "", reviewed_by: u.name, reviewed_at: nowIso(), history: [...(sub.history || []), { status: "ditolak", note: body.reason || "Kiriman belum dapat dipublikasikan.", at: nowIso(), by: u.name }] });
  log(u, "Menolak kiriman warga", sub.title);
  persist();
  return { ok: true };
});

route("get", "/admin/umkm", ({ user }) => (needRole(user(), "editor"), sortBy(db.umkm, [["created_at", -1]])));
route("post", "/admin/umkm/:id/:action", ({ user, p, body }) => {
  const u = needRole(user(), "editor");
  const d = findOr404("umkm", p.id, "Pendaftaran tidak ditemukan");
  if (["disetujui", "ditolak"].includes(d.status)) fail(400, "Pendaftaran ini sudah selesai diproses");
  const push = (status, note) => { d.status = status; d.history = [...(d.history || []), { status, note, at: nowIso(), by: u.name }]; };
  if (p.action === "call") {
    if (!(body.schedule || "").trim()) fail(400, "Isi jadwal kedatangan ke kantor");
    d.schedule = body.schedule.trim();
    push("dipanggil", `Mohon datang ke Kantor Kelurahan pada ${d.schedule}${body.note ? `. ${body.note}` : ""}.`);
    log(u, "Memanggil pendaftar UMKM ke kantor", d.business_name);
  } else if (p.action === "approve") {
    const pot = { id: newId(), name: body.name || d.business_name, category: body.category || d.category || "Lainnya", description: body.description || d.description, image: d.images[0] || "", contact: d.product_contact || "", visible: true, order: 99, created_at: nowIso(), source_ticket: d.ticket };
    db.potentials.push(pot);
    d.published_id = pot.id;
    push("disetujui", body.note || "Pendaftaran disetujui. Usaha/potensi Anda kini tampil di halaman Potensi & UMKM website kelurahan.");
    log(u, "Menyetujui pendaftaran UMKM", d.business_name);
  } else if (p.action === "reject") {
    d.reason = body.reason || "";
    push("ditolak", body.reason || "Pendaftaran belum dapat disetujui.");
    log(u, "Menolak pendaftaran UMKM", d.business_name);
  } else fail(404, "Tindakan tidak dikenal");
  persist();
  return d;
});

route("get", "/admin/instagram", ({ user }) => (needRole(user(), "editor"), { connected: false, items: sortBy(db.instagram_queue, [["created_at", -1]]) }));
route("post", "/admin/instagram", ({ user, body }) => {
  const u = needRole(user(), "editor");
  const n = findOr404("news", body.news_id, "Berita tidak ditemukan");
  const doc = queueInstagram(n.id, n.title, n.cover || "", body.caption || `${n.title}\n\n${n.excerpt || ""}`, "Berita admin");
  log(u, "Menambah antrean Instagram", n.title);
  persist();
  return doc;
});
route("put", "/admin/instagram/:id", ({ user, p, body }) => {
  needRole(user(), "editor");
  const q = findOr404("instagram_queue", p.id, "Antrean tidak ditemukan");
  if (body.status && !["menunggu", "terposting", "dibatalkan"].includes(body.status)) fail(400, "Status tidak dikenal");
  Object.entries(body).forEach(([k, v]) => { if (v != null) q[k] = v; });
  persist();
  return { ok: true };
});
route("post", "/admin/instagram/:id/publish", ({ user, p }) => {
  needRole(user(), "editor");
  findOr404("instagram_queue", p.id, "Antrean tidak ditemukan");
  return fail(400, "Instagram belum terhubung. Unggah manual lalu tandai 'Sudah diposting'.");
});
route("delete", "/admin/instagram/:id", ({ user, p }) => {
  needRole(user(), "editor");
  findOr404("instagram_queue", p.id, "Antrean tidak ditemukan");
  db.instagram_queue = db.instagram_queue.filter((x) => x.id !== p.id);
  persist();
  return { ok: true };
});
route("delete", "/admin/inbox/:coll/:id", ({ user, p }) => {
  const u = needRole(user(), "admin");
  if (!INBOX.includes(p.coll)) fail(404, "Data tidak ditemukan");
  findOr404(p.coll, p.id);
  db[p.coll] = db[p.coll].filter((x) => x.id !== p.id);
  log(u, `Menghapus ${p.coll}`, p.id);
  persist();
  return { ok: true };
});

route("get", "/admin/dashboard", ({ user }) => {
  const u = user();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const visits = Object.entries(db.visits).filter(([d]) => d >= since.slice(0, 10)).reduce((a, [, c]) => a + c, 0);
  const latest = sortBy(publishedNews(), [["published_at", -1]])[0];
  const draft = (n) => ["draf", "diajukan"].includes(n.status);
  if (u.role === "kontributor") {
    const mine = db.news.filter((n) => n.author_id === u.id);
    return { news_published: mine.filter((n) => n.status === "terbit").length, news_draft: mine.filter(draft).length, visits_30d: visits, news_stale: false };
  }
  return {
    news_published: db.news.filter((n) => n.status === "terbit").length,
    news_draft: db.news.filter(draft).length,
    submissions_pending: db.submissions.filter((s) => s.status === "menunggu").length,
    umkm_pending: db.umkm.filter((s) => ["menunggu", "dipanggil"].includes(s.status)).length,
    requests_open: db.requests.filter((r) => !["selesai", "ditolak"].includes(r.status)).length,
    complaints_open: db.complaints.filter((c) => ["diterima", "ditindaklanjuti"].includes(c.status)).length,
    instagram_waiting: db.instagram_queue.filter((q) => q.status === "menunggu").length,
    gallery: db.gallery.length,
    visits_30d: visits,
    news_stale: !latest || latest.published_at < since,
  };
});
route("get", "/admin/backup", ({ user }) => {
  needRole(user(), "admin");
  return Object.fromEntries([...Object.keys(RES), "settings", "requests", "complaints", "submissions", "umkm", "instagram_queue"].map((k) => [k, db[k]]));
});

const parseBody = (data) => {
  if (data instanceof FormData) return { form: data, body: {} };
  if (typeof data === "string" && data) {
    try {
      return { body: JSON.parse(data) };
    } catch {
      return { body: {} };
    }
  }
  return { body: data || {} };
};

export async function localAdapter(config) {
  await ensureAdmin();
  const method = (config.method || "get").toLowerCase();
  const path = (config.url || "").replace(/^https?:\/\/[^/]+/, "").replace(/^\/api/, "").split("?")[0];
  const respond = (status, data) => ({ data, status, statusText: String(status), headers: {}, config, request: {} });
  try {
    for (const r of R) {
      const m = r.method === method && path.match(r.re);
      if (!m) continue;
      const { body, form } = parseBody(config.data);
      const data = await r.fn({ p: m.groups || {}, body, form, params: config.params || {}, user: () => currentUser(config.headers) });
      return respond(200, structuredClone(data));
    }
    fail(404, "Endpoint tidak ditemukan");
  } catch (e) {
    if (!(e instanceof HttpError)) throw e;
    if (e.status === 401 && path !== "/auth/login") localStorage.removeItem(TOKEN_KEY);
    const res = respond(e.status, { detail: e.detail });
    throw new AxiosError(e.detail, e.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST, config, {}, res);
  }
  return null;
}
