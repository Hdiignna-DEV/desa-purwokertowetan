import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container-x py-24 text-center" data-testid="not-found-page">
      <div className="font-mono text-7xl font-bold text-sky-200">404</div>
      <h1 className="text-2xl font-bold mt-4">Halaman tidak ditemukan</h1>
      <p className="text-slate-600 mt-2">Halaman yang Anda cari mungkin sudah dipindahkan atau tidak tersedia.</p>
      <Link to="/" className="inline-block mt-6 bg-sky-600 text-white font-semibold rounded-full px-6 py-3" data-testid="back-home-btn">Kembali ke Beranda</Link>
    </div>
  );
}
