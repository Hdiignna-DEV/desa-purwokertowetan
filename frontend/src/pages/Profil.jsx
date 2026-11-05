import { Compass } from "lucide-react";
import { useSite } from "@/lib/site";
import { PageHeader, SectionHead, Paragraphs, Photo, CtaBand } from "@/components/public/Common";

const MapEmbed = ({ q, zoom = 15, testid = "map-embed" }) => (
  <iframe title="Peta lokasi" data-testid={testid} className="w-full h-80 lg:h-full min-h-[20rem] rounded-3xl border border-slate-200" loading="lazy" src={`https://maps.google.com/maps?q=${encodeURIComponent(q || "")}&z=${zoom}&output=embed`} />
);
export const gmapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || "")}`;
export { MapEmbed };

export default function Profil() {
  const { settings } = useSite();
  const p = settings.profil || {};
  const s = settings.sambutan || {};
  const batas = p.batas || {};
  return (
    <div data-testid="profil-page">
      <PageHeader title="Profil Kelurahan" desc="Gambaran umum wilayah, visi dan misi, serta batas administrasi." crumb="Profil" />
      <section id="sambutan" className="container-x mt-14 grid md:grid-cols-[220px_1fr] gap-8 items-start">
        <Photo src={s.photo} alt={s.name} className="w-40 md:w-full aspect-[3/4] rounded-3xl" />
        <div>
          <div className="eyebrow mb-2">Sambutan Lurah</div>
          <h2 className="text-2xl font-bold">{s.name}</h2>
          <div className="text-slate-500 mb-4">{s.title}</div>
          <Paragraphs text={s.text} />
        </div>
      </section>
      <section className="container-x mt-16 grid lg:grid-cols-2 gap-10">
        <div>
          <SectionHead eyebrow="Sejarah" title="Sejarah dan Letak Geografis" />
          <Paragraphs text={p.sejarah} />
        </div>
        <div className="bg-sky-700 text-white rounded-2xl p-8 batik-bg" data-testid="visi-misi">
          <div className="text-xs font-bold tracking-widest text-sky-200">VISI</div>
          <p className="text-xl font-bold mt-2 leading-snug">{p.visi}</p>
          <div className="text-xs font-bold tracking-widest text-sky-200 mt-8 mb-3">MISI</div>
          <ol className="space-y-3">
            {(p.misi || []).map((m, i) => (
              <li key={i} className="flex gap-3"><span className="h-7 w-7 rounded-full bg-white text-sky-700 font-bold grid place-items-center shrink-0 text-sm">{i + 1}</span><span>{m}</span></li>
            ))}
          </ol>
        </div>
      </section>
      <section className="container-x mt-16">
        <SectionHead eyebrow="Wilayah" title="Batas Administrasi Wilayah" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            {["utara", "timur", "selatan", "barat"].map((k) => (
              <div key={k} className="bg-white border border-slate-200 rounded-xl p-5" data-testid={`batas-${k}`}>
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-sky-700"><Compass className="h-4 w-4" />{k.toUpperCase()}</div>
                <div className="font-semibold mt-2 text-slate-900">{batas[k]}</div>
              </div>
            ))}
          </div>
          <MapEmbed q={settings.map_query} />
        </div>
      </section>
      <CtaBand />
    </div>
  );
}
