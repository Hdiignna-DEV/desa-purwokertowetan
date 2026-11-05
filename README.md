# Website Resmi Kelurahan Purwokerto Wetan

Website profil + layanan Kelurahan Purwokerto Wetan, Kec. Purwokerto Timur, Kab. Banyumas.
Full-stack: **React** (frontend/) + **FastAPI** (backend/) + **MongoDB**. Data tersimpan di server sehingga
dapat diakses bersama oleh semua warga dan dikelola admin dari mana saja.

**Cara online gratis (Vercel + MongoDB Atlas): baca [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).**

## Struktur
```
api/index.py        entry Vercel Serverless Function (memuat backend/server.py)
backend/            FastAPI: API, data awal (seed), unggahan berkas → MongoDB GridFS
frontend/           React (CRA + craco + Tailwind + shadcn/ui)
vercel.json         pengaturan build & routing Vercel
requirements.txt    dependensi Python untuk Vercel
```

## Fitur utama
- Profil, pemerintahan, data & statistik, layanan + lacak permohonan, potensi & UMKM, berita, galeri, partisipasi warga & pengaduan, kontak.
- Panel admin (/admin): konten, kotak masuk permohonan/pengaduan/kiriman, akun & peran, pengaturan situs, riwayat aktivitas.
- **Pengumuman**: tampil di beranda (terbaru di atas) dan popup sekali per kunjungan, dengan masa berlaku.
- **Hari Besar otomatis**: libur nasional & cuti bersama dari kalender resmi (gratis, tanpa kunci), hari peringatan,
  dan hari besar lokal buatan admin. Tampil hari-H s.d. H+2 (WIB) sebagai popup + banner beranda.
  Uji tampilan tanggal tertentu: `?simulasi_tanggal=2026-08-17`.

## Akun admin
Dibuat otomatis saat pertama kali server tersambung database, dari env `ADMIN_USERNAME` dan `ADMIN_PASSWORD`.

## Mode demo tanpa server (opsional)
`REACT_APP_DATA_MODE=local` di `frontend/.env` → data hanya di localStorage browser (tidak terbagi antar perangkat).
Default sekarang adalah mode server (`backend`).
