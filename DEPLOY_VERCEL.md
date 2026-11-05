# Panduan Lengkap Deploy ke Vercel (Gratis) — Website Kelurahan Purwokerto Wetan

Website + server (API) berjalan dalam **satu proyek Vercel** (gratis, paket Hobby).
Database & berkas unggahan (foto, PDF) disimpan di **MongoDB Atlas** (gratis, paket M0 – 512 MB).
Tidak perlu kartu kredit untuk keduanya.

```
Warga ──► https://nama-proyek.vercel.app
            ├─ halaman website (React, frontend/)
            └─ /api/...  ──► FastAPI (api/index.py → backend/server.py) ──► MongoDB Atlas
```

---

## Langkah 1 — Buat database gratis di MongoDB Atlas (±10 menit)

1. Buka https://www.mongodb.com/cloud/atlas/register → daftar (bisa pakai akun Google).
2. Saat diminta membuat cluster, pilih **M0 (Free)**.
   - Provider: AWS / Google Cloud bebas. Region: pilih **Singapore** atau **Jakarta** (paling dekat).
   - Nama cluster bebas, mis. `kelurahan`. Klik **Create Deployment**.
3. **Buat user database** (muncul otomatis setelah membuat cluster, atau menu *Database Access*):
   - Username: mis. `kelurahan_app`
   - Password: klik *Autogenerate* lalu **salin & simpan**. Sebaiknya hanya huruf & angka (tanpa `@ : / ? #`).
   - Role: *Read and write to any database*.
4. **Izinkan akses jaringan** (menu *Network Access* → *Add IP Address*):
   - Klik **Allow Access from Anywhere** (`0.0.0.0/0`) → *Confirm*.
   - Wajib, karena alamat IP server Vercel selalu berubah-ubah.
5. **Ambil connection string**: menu *Database* → tombol **Connect** → *Drivers* → salin teks seperti:
   ```
   mongodb+srv://kelurahan_app:<db_password>@kelurahan.abcde.mongodb.net/?retryWrites=true&w=majority&appName=kelurahan
   ```
   Ganti `<db_password>` dengan password dari langkah 3. Inilah nilai **MONGO_URL**.

## Langkah 2 — Upload kode ke GitHub (±5 menit)

1. Ekstrak file zip ini di komputer.
2. Buka https://github.com/new → nama repo mis. `website-kelurahan-purwokerto-wetan` → pilih **Private** atau Public → *Create repository*.
3. Pada halaman repo kosong klik **uploading an existing file**, lalu seret **seluruh isi** folder hasil ekstrak
   (folder `api`, `backend`, `frontend`, file `vercel.json`, `requirements.txt`, `README.md`, dll — **bukan folder induknya**).
   - Pastikan `vercel.json` berada **langsung di halaman utama repo** (bukan di dalam subfolder).
   - Jika browser menolak terlalu banyak file sekaligus, unggah per folder; atau pakai **GitHub Desktop** (https://desktop.github.com).
4. Klik **Commit changes**.

> Jangan pernah mengunggah file `.env` berisi password ke GitHub. Semua rahasia diisi di Vercel (Langkah 3).

## Langkah 3 — Deploy di Vercel (±5 menit)

1. Buka https://vercel.com/signup → **Continue with GitHub** (paket Hobby / gratis).
2. Klik **Add New… → Project** → pilih repo tadi → **Import**.
3. Pengaturan proyek:
   - **Framework Preset**: `Other` (pengaturan build sudah otomatis dibaca dari `vercel.json`).
   - **Root Directory**: biarkan `./` (kosong).
   - Jangan ubah Build/Output/Install Command.
4. Buka bagian **Environment Variables**, tambahkan satu per satu:

   | Name | Value (contoh) | Keterangan |
   |---|---|---|
   | `MONGO_URL` | `mongodb+srv://kelurahan_app:PASSWORD@kelurahan.abcde.mongodb.net/?retryWrites=true&w=majority` | dari Langkah 1 |
   | `DB_NAME` | `kelurahan_purwokerto_wetan` | nama database bebas |
   | `JWT_SECRET` | teks acak minimal 32 karakter | buat di https://generate-secret.vercel.app/32 |
   | `ADMIN_USERNAME` | `admin` | username admin pertama |
   | `ADMIN_EMAIL` | `admin@purwokertowetan.id` | email admin |
   | `ADMIN_PASSWORD` | kata sandi kuat, mis. `Kelurahan#Wetan2026` | **ganti!** minimal 8 karakter, huruf besar, angka, simbol |
   | `CORS_ORIGINS` | `*` | opsional |

   Tidak perlu mengisi `REACT_APP_BACKEND_URL` (website & API berada di domain yang sama).
5. Klik **Deploy**. Tunggu ±3–5 menit sampai muncul *Congratulations*.
6. Buka alamat `https://nama-proyek.vercel.app`.
   - Kunjungan pertama mengisi data awal (profil, layanan, berita contoh, akun admin) otomatis ke database.
   - Cek server: buka `https://nama-proyek.vercel.app/api/` → harus tampil `{"message":"API Kelurahan Purwokerto Wetan"}`.

## Langkah 4 — Pengecekan setelah online

1. Masuk admin: `https://nama-proyek.vercel.app/admin/login` → pakai `ADMIN_USERNAME` & `ADMIN_PASSWORD`.
2. Segera ganti kata sandi di menu profil, dan lengkapi **Pengaturan Situs** (nama, alamat, kontak, logo).
3. Uji: buat **Pengumuman** → buka beranda di HP lain → pengumuman tampil (data sudah bersama untuk semua warga).
4. Uji unggah foto (berita/galeri) → foto tampil. Foto otomatis diperkecil sebelum diunggah.
5. Menu **Hari Besar** → status sumber data harus "Data resmi terbaru berhasil diambil".
   Ingin melihat tampilan ucapan tanggal tertentu: tambahkan `?simulasi_tanggal=2026-08-17` di alamat.

## Langkah 5 — Domain sendiri (opsional)

Vercel → Project → **Settings → Domains** → masukkan domain (mis. `purwokertowetan.id` / subdomain `.desa.id`/`.go.id`
sesuai ketentuan Kominfo/Diskominfo) → ikuti petunjuk DNS (A record `76.76.21.21` atau CNAME `cname.vercel-dns.com`).

## Memperbarui website

Ubah file di GitHub (atau unggah ulang file yang berubah) → Vercel otomatis deploy ulang dalam beberapa menit.
Data di database **tidak** hilang saat deploy ulang.

## Batas paket gratis (cukup untuk website kelurahan)

| Layanan | Batas gratis | Catatan |
|---|---|---|
| Vercel Hobby | 100 GB bandwidth/bulan, fungsi server 30 detik/permintaan | ukuran unggahan per kiriman maks 4,5 MB (foto sudah diperkecil otomatis, PDF maks 4 MB) |
| MongoDB Atlas M0 | 512 MB data + berkas | ± ribuan foto terkompresi (±200–400 KB/foto) |

Paket Hobby Vercel ditujukan untuk penggunaan non-komersial — sesuai untuk website informasi kelurahan.

## Masalah umum

| Gejala | Penyebab & solusi |
|---|---|
| `/api/` error 500 / *FUNCTION_INVOCATION_FAILED* | Environment variable belum lengkap/typo. Cek Settings → Environment Variables, lalu **Deployments → ⋯ → Redeploy**. Lihat detail di tab **Logs**. |
| Error `ServerSelectionTimeout` di Logs | Network Access Atlas belum `0.0.0.0/0`, atau password di `MONGO_URL` salah / mengandung simbol (`@`, `#`) — buat password baru tanpa simbol. |
| Tidak bisa login admin | Akun admin dibuat saat kunjungan pertama dengan `ADMIN_PASSWORD` saat itu. Mengubah env setelahnya tidak mengganti password lama; pakai password awal atau hapus koleksi `users` di Atlas lalu buka situs lagi. |
| Halaman 404 saat di-refresh | Pastikan `vercel.json` ada di halaman utama repo. |
| Build gagal | Pastikan folder `frontend` lengkap beserta `yarn.lock`; lihat log build di Vercel. |

## Menjalankan di komputer sendiri (opsional, untuk pengembang)

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # isi MONGO_URL (Atlas atau MongoDB lokal) dll.
uvicorn server:app --reload --port 8001

# Frontend (terminal lain)
cd frontend
cp .env.example .env        # REACT_APP_BACKEND_URL=http://localhost:8001
yarn install && yarn start
```
