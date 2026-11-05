import { Link } from "react-router-dom";
import { ArrowRight, FileText, Search, Upload, Store } from "lucide-react";
import { useSite, usePublic } from "@/lib/site";
import { fileUrl } from "@/lib/api";
import { SectionHead, NewsCard, CtaBand } from "@/components/public/Common";
import DigitalServices from "@/components/public/DigitalServices";
import StatCards from "@/components/public/StatCards";
import HolidayBanner from "@/components/public/HolidayBanner";
import AnnouncementsSection from "@/components/public/AnnouncementsSection";

const Hero = () => {
  const { settings } = useSite();
  return (
    <section className="container-x pt-4" data-testid="home-hero">
      <div className="relative overflow-hidden rounded-3xl">
        <img src={fileUrl(settings.hero_image)} alt="Kantor Kelurahan" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-950/90 via-sky-900/75 to-sky-800/35" />
        <div className="relative px-6 sm:px-10 lg:px-14 pt-14 pb-24 md:pt-20 md:pb-32 text-white max-w-3xl reveal">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 backdrop-blur rounded-full px-3 py-1 text-[11px] font-bold tracking-widest mb-5">SITUS RESMI PEMERINTAH KELURAHAN</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">{settings.hero_title}</h1>
          <p className="text-sky-100 font-semibold mt-3">{settings.tagline}</p>
          <p className="mt-5 text-sky-50/90 max-w-xl text-sm md:text-base leading-relaxed">{settings.hero_subtitle}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link to="/layanan" data-testid="hero-layanan-btn" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-full px-6 py-3 transition-colors">Layanan Masyarakat <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/profil" data-testid="hero-profil-btn" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/40 text-white font-semibold rounded-full px-6 py-3 transition-colors">Profil Kelurahan</Link>
          </div>
        </div>
      </div>
      <div className="relative z-10 -mt-14 md:-mt-20 mx-2 sm:mx-6 lg:mx-10" data-testid="home-stats"><StatCards floating /></div>
    </section>
  );
};

const QUICK = [
  { to: "/layanan#ajukan", icon: FileText, t: "Ajukan Permohonan", d: "Isi formulir tanpa login, dapat nomor tiket", id: "ajukan" },
  { to: "/lacak", icon: Search, t: "Lacak Status Layanan", d: "Cek proses pengajuan dengan nomor tiket", id: "lacak" },
  { to: "/partisipasi", icon: Upload, t: "Kirim Berita / Laporan", d: "Bagikan kegiatan warga atau pengaduan", id: "kirim" },
  { to: "/potensi/daftar", icon: Store, t: "Daftarkan UMKM", d: "Promosikan usaha atau potensi wilayah", id: "umkm" },
];

const QuickActions = () => (
  <section className="container-x mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="home-quick-actions">
    {QUICK.map(({ to, icon: Icon, t, d, id }) => (
      <Link key={id} to={to} data-testid={`quick-${id}`} className="group flex items-center gap-4 rounded-2xl border border-sky-100 bg-white hover:bg-sky-600 hover:text-white p-5 transition-colors shadow-sm">
        <span className="h-12 w-12 rounded-2xl bg-sky-100 text-sky-700 group-hover:bg-white/20 group-hover:text-white grid place-items-center shrink-0 transition-colors"><Icon className="h-6 w-6" /></span>
        <div><div className="font-bold">{t}</div><div className="text-sm text-slate-600 group-hover:text-sky-50">{d}</div></div>
      </Link>
    ))}
  </section>
);

export default function Home() {
  const services = usePublic("services", { limit: 4 });
  const news = usePublic("news", { limit: 3 });
  return (
    <div data-testid="home-page">
      <HolidayBanner />
      <Hero />
      <QuickActions />
      <AnnouncementsSection />
      <DigitalServices />
      <section className="container-x mt-20">
        <SectionHead eyebrow="Layanan Masyarakat" title="Layanan di Kantor Kelurahan" desc="Ajukan secara online lalu bawa berkas ke kantor, atau datang langsung pada jam layanan." action={<Link to="/layanan" className="text-sky-700 font-semibold hover:underline" data-testid="home-all-services">Lihat Seluruh Layanan →</Link>} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.items.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-shadow" data-testid={`home-service-${s.id}`}>
              <span className="h-10 w-10 rounded-xl bg-sky-100 text-sky-700 grid place-items-center mb-3"><FileText className="h-5 w-5" /></span>
              <h3 className="font-bold text-slate-900">{s.name}</h3>
              <p className="text-sm text-slate-600 mt-1">{s.description}</p>
              <div className="inline-block text-xs font-semibold text-sky-800 bg-sky-50 rounded-full px-3 py-1 mt-3">Estimasi {s.estimate}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="container-x mt-20">
        <SectionHead eyebrow="Informasi Terkini" title="Berita dan Kegiatan Terbaru" action={<Link to="/berita" className="text-sky-700 font-semibold hover:underline" data-testid="home-all-news">Lihat Semua Berita →</Link>} />
        <div className="grid gap-6 md:grid-cols-3">
          {news.items.map((n, i) => <NewsCard key={n.id} n={n} i={i} />)}
        </div>
      </section>
      <CtaBand />
    </div>
  );
}
