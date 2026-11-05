import { Link } from "react-router-dom";
import { ChevronRight, UserRound } from "lucide-react";
import { useSite } from "@/lib/site";
import { fileUrl, waLink, formatDate } from "@/lib/api";
import { WhatsAppIcon, InstagramIcon } from "./BrandIcons";

export const PageHeader = ({ title, desc, crumb }) => {
  const { settings } = useSite();
  return (
    <section className="container-x pt-4" data-testid="page-header">
      <div className="relative overflow-hidden rounded-3xl bg-sky-800 text-white">
        <img src={fileUrl(settings.hero_image)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-sky-900/95 via-sky-800/80 to-sky-700/40" />
        <div className="relative px-6 sm:px-10 lg:px-14 py-12 md:py-16">
          <div className="flex items-center gap-1 text-sky-100 text-sm mb-3">
            <Link to="/" className="hover:underline">Beranda</Link>
            <ChevronRight className="h-4 w-4" /> <span>{crumb || title}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight reveal">{title}</h1>
          {desc && <p className="mt-3 max-w-2xl text-sky-50/90 text-sm md:text-base reveal">{desc}</p>}
        </div>
      </div>
    </section>
  );
};

export const SectionHead = ({ eyebrow, title, desc, action }) => (
  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
    <div className="max-w-2xl">
      {eyebrow && <div className="eyebrow mb-2">{eyebrow}</div>}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
      {desc && <p className="mt-2 text-slate-600 text-sm md:text-base">{desc}</p>}
    </div>
    {action}
  </div>
);

export const Photo = ({ src, alt, className = "" }) =>
  src ? (
    <img src={fileUrl(src)} alt={alt} className={`object-cover ${className}`} loading="lazy" />
  ) : (
    <div className={`bg-gradient-to-br from-sky-100 to-sky-200 grid place-items-center text-sky-500 ${className}`}>
      <UserRound className="h-1/3 w-1/3" />
    </div>
  );

export const NewsCard = ({ n, i = 0 }) => (
  <Link to={`/berita/${n.slug || n.id}`} data-testid={`news-card-${n.id}`} className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-[transform,box-shadow] duration-300 reveal flex flex-col" style={{ animationDelay: `${i * 80}ms` }}>
    <div className="p-3 pb-0"><div className="aspect-[16/10] overflow-hidden bg-sky-50 rounded-2xl">
      {n.cover ? <img src={fileUrl(n.cover)} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full batik-bg bg-sky-600" />}
    </div></div>
    <div className="p-5 flex flex-col flex-1">
      <div className="flex items-center gap-2 text-xs mb-2">
        <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-semibold">{n.category}</span>
        <span className="text-slate-500">{formatDate(n.published_at)}</span>
      </div>
      <h3 className="font-bold text-slate-900 leading-snug group-hover:text-sky-700 line-clamp-2">{n.title}</h3>
      <p className="text-sm text-slate-600 mt-2 line-clamp-2 flex-1">{n.excerpt}</p>
      <span className="text-sm font-semibold text-sky-700 mt-3">Baca selengkapnya →</span>
    </div>
  </Link>
);

export const CtaBand = () => {
  const { settings } = useSite();
  return (
    <section className="container-x mt-20">
      <div className="relative rounded-3xl bg-sky-700 text-white p-8 md:p-12 overflow-hidden batik-bg">
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">Ada pertanyaan atau memerlukan informasi?</h3>
            <p className="text-sky-100 mt-2 max-w-xl">Hubungi {settings.site_name} melalui WhatsApp atau ikuti informasi terbaru di Instagram resmi kelurahan.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={waLink(settings.whatsapp?.[0] || "")} target="_blank" rel="noreferrer" data-testid="cta-whatsapp-btn" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-semibold rounded-full px-5 py-3"><WhatsAppIcon className="h-5 w-5" />WhatsApp Kelurahan</a>
            <a href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noreferrer" data-testid="cta-instagram-btn" className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold rounded-full px-5 py-3 hover:bg-pink-50"><span className="h-6 w-6 rounded-lg grid place-items-center text-white bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fd5949_45%,#d6249f_60%,#285AEB_90%)]"><InstagramIcon className="h-4 w-4" /></span>Instagram Resmi</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export const Paragraphs = ({ text }) => (
  <div className="prose-gov">{(text || "").split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}</div>
);
