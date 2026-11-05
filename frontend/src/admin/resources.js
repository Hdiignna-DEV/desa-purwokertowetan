const NEWS_STATUS = [
  { value: "draf", label: "Draf" },
  { value: "diajukan", label: "Diajukan untuk ditinjau" },
  { value: "terjadwal", label: "Terjadwal" },
  { value: "terbit", label: "Terbit" },
];
export const NEWS_STATUS_LABEL = Object.fromEntries(NEWS_STATUS.map((s) => [s.value, s.label]));

const visible = { key: "visible", label: "Tampil di website", type: "switch" };
const order = { key: "order", label: "Urutan tampil", type: "number", help: "Angka kecil tampil lebih dulu." };

export const RESOURCES = {
  berita: {
    res: "news", title: "Berita", desc: "Tulis, ubah, dan terbitkan berita kelurahan.", role: "kontributor",
    primary: "title", secondary: (i) => `${i.category || "-"} · ${NEWS_STATUS_LABEL[i.status] || i.status}`, image: "cover",
    defaults: { status: "draf", category: "Kegiatan" },
    fields: [
      { key: "title", label: "Judul berita", required: true, full: true },
      { key: "category", label: "Kategori", type: "select", options: ["Kegiatan", "Pengumuman", "Pemberdayaan", "Kesehatan", "Pembangunan", "Kegiatan Warga", "Lainnya"] },
      { key: "status", label: "Status", type: "select", options: NEWS_STATUS, help: "Kontributor hanya dapat menyimpan Draf atau Diajukan." },
      { key: "published_at", label: "Tanggal terbit", type: "datetime", help: "Kosongkan untuk memakai waktu sekarang. Isi tanggal mendatang untuk Terjadwal." },
      { key: "cover", label: "Gambar sampul", type: "image" },
      { key: "excerpt", label: "Ringkasan singkat", type: "textarea", rows: 2, full: true },
      { key: "content", label: "Isi berita", type: "textarea", rows: 10, full: true, help: "Pisahkan paragraf dengan satu baris kosong." },
    ],
    instagram: true,
  },
  galeri: {
    res: "gallery", title: "Galeri", desc: "Unggah foto kegiatan, beri keterangan, dan atur urutan.",
    primary: "title", secondary: (i) => i.album || "-", image: "image", defaults: { visible: true, album: "Kegiatan" },
    fields: [
      { key: "image", label: "Foto", type: "image", required: true, full: true },
      { key: "title", label: "Judul foto", required: true },
      { key: "album", label: "Album", help: "contoh: Kegiatan, Kantor, UMKM" },
      { key: "caption", label: "Keterangan", type: "textarea", rows: 2, full: true },
      order, visible,
    ],
  },
  perangkat: {
    res: "officials", title: "Perangkat Kelurahan", desc: "Nama, jabatan, dan foto masing-masing perangkat kelurahan.",
    primary: "name", secondary: (i) => i.position, image: "photo", round: true, defaults: { level: 3, visible: true },
    fields: [
      { key: "photo", label: "Foto perangkat", type: "image", full: true, help: "Disarankan foto formal rasio 4:5." },
      { key: "name", label: "Nama lengkap & gelar", required: true },
      { key: "position", label: "Jabatan", required: true },
      { key: "level", label: "Tingkat bagan", type: "select", numeric: true, options: [{ value: 1, label: "1 – Pimpinan (Lurah)" }, { value: 2, label: "2 – Sekretaris" }, { value: 3, label: "3 – Kasi / Staf" }] },
      order, visible,
    ],
  },
  layanan: {
    res: "services", title: "Jenis Layanan", desc: "Daftar layanan, persyaratan, dan estimasi waktu yang tampil di halaman Layanan.",
    primary: "name", secondary: (i) => `Estimasi ${i.estimate || "-"}`, defaults: { estimate: "3–4 hari kerja", online: true, visible: true, requirements: [] },
    fields: [
      { key: "name", label: "Nama layanan", required: true, full: true },
      { key: "description", label: "Deskripsi singkat", type: "textarea", rows: 2, full: true },
      { key: "requirements", label: "Persyaratan (satu per baris)", type: "list", full: true },
      { key: "estimate", label: "Estimasi waktu" },
      { key: "online", label: "Bisa diajukan online", type: "switch" },
      order, visible,
    ],
  },
  potensi: {
    res: "potentials", title: "Potensi & UMKM", desc: "Potensi wilayah dan usaha warga.",
    primary: "name", secondary: (i) => i.category, image: "image", defaults: { visible: true, category: "Kuliner" },
    fields: [
      { key: "image", label: "Foto", type: "image", full: true },
      { key: "name", label: "Nama", required: true },
      { key: "category", label: "Kategori", help: "contoh: Kuliner, Kerajinan, Jasa, Wisata" },
      { key: "description", label: "Deskripsi", type: "textarea", full: true },
      { key: "contact", label: "Nomor WhatsApp (opsional)" },
      order, visible,
    ],
  },
  statistik: {
    res: "statistics", title: "Data Statistik", desc: "Angka penduduk per kelompok untuk grafik di halaman Data & Statistik.",
    primary: "label", secondary: (i) => `${i.group} · ${i.value}`, defaults: { group: "Kelompok Usia" },
    fields: [
      { key: "group", label: "Kelompok grafik", required: true, help: "Data dengan kelompok sama tampil dalam satu grafik." },
      { key: "label", label: "Label", required: true },
      { key: "value", label: "Nilai", type: "number", required: true },
      order,
    ],
  },
  dokumen: {
    res: "documents", title: "Dokumen Unduhan", desc: "Berkas PDF yang dapat diunduh warga.",
    primary: "title", secondary: (i) => i.category || "-", defaults: { category: "Umum" },
    fields: [
      { key: "title", label: "Judul dokumen", required: true, full: true },
      { key: "category", label: "Kategori" },
      { key: "file", label: "Berkas PDF", type: "file", required: true },
    ],
  },
  tautan: {
    res: "links", title: "Tautan Layanan Digital", desc: "Tautan layanan pemerintah yang tampil di beranda, layanan, kontak, dan footer.",
    primary: "title", secondary: (i) => i.url || i.app_url, image: "logo", defaults: { featured: false, visible: true, kind: "Situs Web" },
    fields: [
      { key: "logo", label: "Logo resmi", type: "image", full: true, help: "Gunakan logo resmi berlatar putih/transparan, rasio persegi." },
      { key: "title", label: "Judul", required: true },
      { key: "kind", label: "Jenis", type: "select", options: ["Situs Web", "Aplikasi Android", "Situs Web & Aplikasi", "Dokumen"] },
      { key: "url", label: "Alamat situs web (URL)", full: true, help: "Diawali https://. Tautan tidak valid tidak ditampilkan di website." },
      { key: "app_url", label: "Tautan unduh aplikasi (Google Play)", full: true },
      { key: "description", label: "Deskripsi", type: "textarea", rows: 2, full: true },
      { key: "featured", label: "Tampil sebagai kartu besar", type: "switch" },
      order, visible,
    ],
  },
  lembaga: {
    res: "institutions", title: "Lembaga Kemasyarakatan", desc: "Daftar lembaga di halaman Pemerintahan.",
    primary: "name", secondary: (i) => i.description,
    fields: [{ key: "name", label: "Nama lembaga", required: true, full: true }, { key: "description", label: "Deskripsi", type: "textarea", full: true }, order],
  },
  rw: {
    res: "rw", title: "Daftar RW", desc: "Rukun Warga, ketua, dan jumlah RT.",
    primary: "name", secondary: (i) => `${i.chairman} · ${i.rt_count} RT`,
    fields: [{ key: "name", label: "Nama RW", required: true }, { key: "chairman", label: "Ketua RW" }, { key: "rt_count", label: "Jumlah RT", type: "number" }, order],
  },
};

export const ANNOUNCEMENTS = {
  res: "announcements", title: "Pengumuman Resmi", desc: "Pengumuman atau peringatan resmi yang muncul sebagai popup saat warga membuka website.",
  primary: "title", secondary: (i) => `${i.type || "Pengumuman Resmi"} · ${i.start_at ? new Date(i.start_at).toLocaleDateString("id-ID") : "segera"} s.d. ${i.end_at ? new Date(i.end_at).toLocaleDateString("id-ID") : "tanpa batas"}`,
  image: "image", defaults: { visible: true, popup: true, type: "Pengumuman Resmi" },
  fields: [
    { key: "title", label: "Judul", required: true, full: true },
    { key: "type", label: "Jenis", type: "select", options: ["Pengumuman Resmi", "Peringatan Hari Besar", "Pemberitahuan Libur Layanan", "Himbauan"] },
    { key: "image", label: "Gambar / poster (opsional)", type: "image" },
    { key: "content", label: "Isi pengumuman", type: "textarea", rows: 6, full: true, required: true },
    { key: "start_at", label: "Mulai tampil", type: "datetime", help: "Kosongkan untuk tampil mulai sekarang." },
    { key: "end_at", label: "Berakhir", type: "datetime", help: "Setelah tanggal ini popup otomatis berhenti tampil." },
    { key: "link", label: "Tautan selengkapnya (opsional)", full: true, help: "Diawali https://" },
    { key: "popup", label: "Tampilkan sebagai popup", type: "switch" },
    visible,
  ],
};
