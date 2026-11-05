import axios from "axios";
import { localAdapter } from "./local/localServer";

// "backend" (default) = FastAPI + MongoDB, data bersama untuk semua warga. "local" = demo localStorage browser.
// REACT_APP_BACKEND_URL kosong = API di domain yang sama (mis. Vercel: /api).
export const DATA_MODE = process.env.REACT_APP_DATA_MODE === "local" ? "local" : "backend";
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
export const TOKEN_KEY = "pw_admin_token";

export const api = axios.create({ baseURL: `${BACKEND_URL}/api`, ...(DATA_MODE === "local" ? { adapter: localAdapter } : {}) });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

// Perkecil foto di browser sebelum diunggah (hemat kuota & di bawah batas 4,5 MB Vercel).
export const compressImage = (file, max = 1600, quality = 0.82) =>
  new Promise((resolve) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => resolve(b && b.size < file.size ? new File([b], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }) : file), "image/jpeg", quality);
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });

export const fileUrl = (u) => (!u ? "" : u.startsWith("/api/") ? `${BACKEND_URL}${u}` : u);

export const errMsg = (e) => {
  const d = e?.response?.data?.detail;
  if (!e?.response && !e?.isAxiosError && e?.message) return e.message;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return "Mohon lengkapi isian yang wajib diisi.";
  return "Terjadi kesalahan. Silakan coba lagi.";
};

export const formatDate = (iso, withTime = false) => {
  if (!iso) return "-";
  const opts = { day: "numeric", month: "long", year: "numeric" };
  if (withTime) Object.assign(opts, { hour: "2-digit", minute: "2-digit" });
  return new Date(iso).toLocaleDateString("id-ID", opts);
};

export const toIntl = (phone = "") => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? `62${d.slice(1)}` : d;
};

export const waLink = (phone, text = "") =>
  `https://wa.me/${toIntl(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const REQUEST_STATUS = {
  diterima: { label: "Diterima", cls: "bg-sky-100 text-sky-800" },
  diverifikasi: { label: "Berkas Diverifikasi", cls: "bg-indigo-100 text-indigo-800" },
  perlu_dilengkapi: { label: "Perlu Dilengkapi", cls: "bg-amber-100 text-amber-800" },
  diproses: { label: "Sedang Diproses", cls: "bg-blue-100 text-blue-800" },
  selesai: { label: "Selesai – Siap Diambil", cls: "bg-emerald-100 text-emerald-800" },
  ditolak: { label: "Ditolak", cls: "bg-red-100 text-red-800" },
  ditindaklanjuti: { label: "Ditindaklanjuti", cls: "bg-blue-100 text-blue-800" },
  menunggu: { label: "Menunggu Verifikasi", cls: "bg-amber-100 text-amber-800" },
  dipanggil: { label: "Diundang ke Kantor", cls: "bg-violet-100 text-violet-800" },
  disetujui: { label: "Disetujui", cls: "bg-emerald-100 text-emerald-800" },
};

export const isValidUrl = (u) => /^https?:\/\/[^\s]+\.[^\s]+/.test(u || "");

export const statusLabel = (s, kind) => (kind === "pengaduan" && s === "selesai" ? "Selesai" : REQUEST_STATUS[s]?.label || s);
