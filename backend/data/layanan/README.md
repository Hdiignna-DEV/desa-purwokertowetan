# Folder Jenis Pelayanan

Setiap berkas `.json` di folder ini = satu jenis layanan. Saat website pertama kali dijalankan
(database layanan masih kosong), semua berkas di sini otomatis dimuat ke database.
Setelah itu layanan dikelola dari **Panel Admin → Jenis Layanan**.

Contoh isi berkas:

```json
{
  "name": "Surat Keterangan Domisili",
  "description": "Keterangan tempat tinggal warga atau domisili usaha.",
  "requirements": ["Surat pengantar RT/RW", "Fotokopi KTP", "Fotokopi KK"],
  "estimate": "3–4 hari kerja",
  "icon": "home",
  "online": true,
  "order": 2,
  "visible": true
}
```

Daftar saat ini masih CONTOH dari mockup – ganti dengan daftar resmi dari kelurahan.
Nama berkas diawali nomor urut (01-, 02-, …) agar urutannya rapi.
