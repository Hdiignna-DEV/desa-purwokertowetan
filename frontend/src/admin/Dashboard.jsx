import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Newspaper, FilePen, Inbox, FileCheck, MessageSquareWarning, Instagram, Eye, Images, Plus, AlertTriangle, Store } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const PageTitle = ({ title, desc, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
    <div><h1 className="text-2xl md:text-3xl font-bold text-slate-900" data-testid="admin-page-title">{title}</h1>{desc && <p className="text-slate-600 mt-1 text-sm md:text-base">{desc}</p>}</div>
    {action}
  </div>
);

export default function Dashboard() {
  const { user, can } = useAuth();
  const [d, setD] = useState({});
  useEffect(() => {
    api.get("/admin/dashboard").then((r) => setD(r.data));
  }, []);
  const cards = [
    { k: "news_published", l: "Berita terbit", icon: Newspaper, to: "/admin/berita" },
    { k: "news_draft", l: "Draf / diajukan", icon: FilePen, to: "/admin/berita" },
    { k: "submissions_pending", l: "Kiriman warga menunggu ACC", icon: Inbox, to: "/admin/kiriman-warga", role: "editor", hot: true },
    { k: "umkm_pending", l: "Pendaftaran UMKM diproses", icon: Store, to: "/admin/pendaftaran-umkm", role: "editor", hot: true },
    { k: "requests_open", l: "Permohonan layanan aktif", icon: FileCheck, to: "/admin/permohonan", role: "editor", hot: true },
    { k: "complaints_open", l: "Pengaduan belum selesai", icon: MessageSquareWarning, to: "/admin/pengaduan", role: "editor", hot: true },
    { k: "instagram_waiting", l: "Antrean Instagram", icon: Instagram, to: "/admin/instagram", role: "editor" },
    { k: "gallery", l: "Foto galeri", icon: Images, to: "/admin/galeri", role: "editor" },
    { k: "visits_30d", l: "Kunjungan 30 hari", icon: Eye, to: "/admin" },
  ].filter((c) => !c.role || can(c.role));
  return (
    <div data-testid="admin-dashboard">
      <PageTitle title={`Selamat datang, ${user.name}`} desc="Ringkasan website dan tugas yang perlu ditindaklanjuti." />
      {d.news_stale && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-6" data-testid="stale-reminder"><AlertTriangle className="h-5 w-5 shrink-0" />Belum ada berita baru dalam 30 hari terakhir. Yuk perbarui informasi kelurahan.</div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ k, l, icon: Icon, to, hot }) => (
          <Link key={k} to={to} className={`rounded-xl border p-5 bg-white hover:shadow-md transition-shadow ${hot && d[k] > 0 ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"}`} data-testid={`dash-card-${k}`}>
            <Icon className="h-6 w-6 text-sky-600" />
            <div className="text-3xl font-extrabold mt-3">{d[k] ?? "–"}</div>
            <div className="text-sm text-slate-600">{l}</div>
          </Link>
        ))}
      </div>
      <h2 className="font-bold text-lg mt-10 mb-4">Pintasan cepat</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        <Link to="/admin/berita?baru=1" className="flex items-center gap-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl p-5 font-semibold" data-testid="shortcut-new-news"><Plus className="h-6 w-6" />Tulis berita baru</Link>
        {can("editor") && <Link to="/admin/galeri?baru=1" className="flex items-center gap-3 bg-white border border-slate-200 hover:border-sky-400 rounded-xl p-5 font-semibold" data-testid="shortcut-new-photo"><Images className="h-6 w-6 text-sky-600" />Unggah foto galeri</Link>}
        {can("editor") && <Link to="/admin/kiriman-warga" className="flex items-center gap-3 bg-white border border-slate-200 hover:border-sky-400 rounded-xl p-5 font-semibold" data-testid="shortcut-moderation"><Inbox className="h-6 w-6 text-sky-600" />Tinjau kiriman warga</Link>}
      </div>
    </div>
  );
}
