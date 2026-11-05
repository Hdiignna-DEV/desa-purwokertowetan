import { ExternalLink, Globe, ClipboardCheck, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useSite } from "@/lib/site";
import { fileUrl, isValidUrl } from "@/lib/api";
import { SectionHead } from "./Common";

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M3.6 1.8c-.4.2-.6.7-.6 1.2v18c0 .5.2.9.6 1.2L13.8 12 3.6 1.8Zm11.6 8.8 2.8-2.8L5.3.6l9.9 10Zm0 2.8-9.9 10L18 16.2l-2.8-2.8Zm5.7-3.3-2.5-1.4-3 3.3 3 3.3 2.6-1.5c.9-.5.9-1.9-.1-2.4v-.3Z" /></svg>
);

const FeaturedCard = ({ l }) => (
  <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-[box-shadow,transform]" data-testid={`digital-link-${l.id}`}>
    <div className="flex items-center gap-4">
      {l.logo ? <img src={fileUrl(l.logo)} alt={`Logo ${l.title}`} className="h-16 w-16 rounded-2xl object-contain bg-white border border-slate-100 p-1.5 shrink-0" /> : <span className="h-16 w-16 rounded-2xl bg-sky-100 text-sky-700 grid place-items-center shrink-0"><Globe className="h-7 w-7" /></span>}
      <div>
        <h3 className="font-bold text-slate-900 leading-snug">{l.title}</h3>
        <div className="text-xs font-semibold text-sky-700 mt-0.5">{l.kind}</div>
      </div>
    </div>
    <p className="text-sm text-slate-600 mt-4 flex-1">{l.description}</p>
    <div className="flex flex-wrap gap-2 mt-5">
      {isValidUrl(l.url) && <a href={l.url} target="_blank" rel="noreferrer" data-testid={`digital-web-${l.id}`} className="inline-flex items-center gap-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"><Globe className="h-4 w-4" />Buka Situs Web</a>}
      {isValidUrl(l.app_url) && <a href={l.app_url} target="_blank" rel="noreferrer" data-testid={`digital-app-${l.id}`} className="inline-flex items-center gap-2 rounded-full bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors"><PlayIcon />Unduh Aplikasi</a>}
    </div>
  </div>
);

export const SurveyCard = ({ preview }) => {
  const { settings } = useSite();
  const s = preview || settings.survey || {};
  const ok = isValidUrl(s.url);
  const qr = s.qr_image ? <img src={fileUrl(s.qr_image)} alt="QR code survei" className="h-36 w-36 object-contain" /> : <QRCodeSVG value={s.url || "-"} size={144} level="M" fgColor="#0c4a6e" />;
  return (
    <div className="bg-sky-800 text-white rounded-3xl p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center batik-bg" data-testid="survey-card">
      <div>
        <span className="h-12 w-12 rounded-2xl bg-white/15 grid place-items-center mb-4"><ClipboardCheck className="h-6 w-6" /></span>
        <h3 className="text-xl md:text-2xl font-bold">{s.title || "Survei Kepuasan Masyarakat"}</h3>
        <p className="text-sky-100 mt-2 text-sm md:text-base max-w-xl">{s.description}</p>
        {ok ? (
          <a href={s.url} target="_blank" rel="noreferrer" data-testid="survey-link-btn" className="inline-flex items-center gap-2 mt-5 rounded-full bg-white text-sky-800 font-semibold px-5 py-3 hover:bg-sky-50 transition-colors">Isi Survei Sekarang <ExternalLink className="h-4 w-4" /></a>
        ) : <p className="mt-5 text-sm text-sky-200" data-testid="survey-pending">Tautan dan QR code survei akan segera tersedia.</p>}
      </div>
      {ok ? (
        <a href={s.url} target="_blank" rel="noreferrer" className="justify-self-center bg-white rounded-3xl p-4 text-center shadow-xl hover:scale-[1.03] transition-transform" data-testid="survey-qr-link" aria-label="Buka survei">
          {qr}
          <div className="text-[11px] font-semibold text-slate-600 mt-2 flex items-center justify-center gap-1"><QrCode className="h-3.5 w-3.5" />Pindai atau ketuk QR</div>
        </a>
      ) : (
        <div className="justify-self-center h-44 w-44 rounded-3xl border-2 border-dashed border-white/40 grid place-items-center text-sky-200"><QrCode className="h-12 w-12" /></div>
      )}
    </div>
  );
};

export default function DigitalServices() {
  const { links } = useSite();
  const valid = links.filter((l) => isValidUrl(l.url) || isValidUrl(l.app_url));
  const featured = valid.filter((l) => l.featured);
  const other = valid.filter((l) => !l.featured);
  return (
    <section className="container-x mt-20" data-testid="digital-services">
      <SectionHead eyebrow="Akses Utama" title="Layanan Digital Pemerintah" desc="Akses cepat ke layanan resmi pemerintah yang sering dibutuhkan masyarakat." />
      <div className="grid gap-5 md:grid-cols-2">{featured.map((l) => <FeaturedCard key={l.id} l={l} />)}</div>
      {other.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 mt-5">
          {other.map((l) => (
            <a key={l.id} href={l.url || l.app_url} target="_blank" rel="noreferrer" data-testid={`digital-link-${l.id}`} className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-sky-400 transition-colors">
              {l.logo && <img src={fileUrl(l.logo)} alt="" className="h-10 w-10 rounded-xl object-contain" />}
              <div className="flex-1"><div className="font-semibold text-slate-900">{l.title}</div><div className="text-sm text-slate-600">{l.description}</div></div>
              <ExternalLink className="h-5 w-5 text-sky-700 shrink-0" />
            </a>
          ))}
        </div>
      )}
      <div className="mt-5"><SurveyCard /></div>
    </section>
  );
}
