import { MapPin, Clock, ExternalLink } from "lucide-react";
import { useSite } from "@/lib/site";
import { waLink } from "@/lib/api";
import { PageHeader } from "@/components/public/Common";
import DigitalServices from "@/components/public/DigitalServices";
import { BrandBadge, WhatsAppIcon } from "@/components/public/BrandIcons";
import { MapEmbed, gmapsUrl } from "./Profil";

const Card = ({ badge, title, children, testid }) => (
  <div className="bg-white border border-slate-200 rounded-3xl p-6 h-full flex flex-col" data-testid={testid}>
    <div className="flex items-center gap-3 mb-4">{badge}<h3 className="font-bold">{title}</h3></div>
    <div className="text-sm text-slate-700 space-y-2 flex-1">{children}</div>
  </div>
);

export default function Kontak() {
  const { settings } = useSite();
  const office = settings.office_map_query || settings.address;
  return (
    <div data-testid="kontak-page">
      <PageHeader title="Kontak Kelurahan" desc="Hubungi kami atau ikuti informasi terbaru melalui media sosial resmi." crumb="Kontak" />
      <section className="container-x mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card badge={<BrandBadge kind="maps" />} title="Alamat Kantor" testid="contact-address">
          <p>{settings.address}</p>
          <a href={gmapsUrl(office)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline" data-testid="contact-address-maps">Petunjuk arah <ExternalLink className="h-3.5 w-3.5" /></a>
        </Card>
        <Card badge={<BrandBadge kind="whatsapp" />} title="WhatsApp" testid="contact-whatsapp">
          {settings.whatsapp?.map((w) => <a key={w} href={waLink(w)} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold hover:text-[#128C7E]"><WhatsAppIcon className="h-4 w-4 text-[#25D366]" />{w}</a>)}
        </Card>
        <Card badge={<BrandBadge kind="instagram" />} title="Instagram" testid="contact-instagram">
          <a href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noreferrer" className="font-semibold hover:text-pink-600 break-all">@{settings.instagram}</a>
          <p className="text-xs text-slate-500">Ikuti untuk kabar kegiatan terbaru.</p>
        </Card>
        <Card badge={<span className="h-11 w-11 rounded-xl bg-sky-600 text-white grid place-items-center"><Clock className="h-6 w-6" /></span>} title="Jam Layanan" testid="contact-hours">
          {settings.hours?.map((h) => {
            const closed = /tutup/i.test(h.time);
            return (
              <div key={h.day} className={`rounded-xl px-3 py-2 ${closed ? "bg-red-50" : "bg-sky-50"}`} data-testid={`hours-${h.day}`}>
                <div className="text-xs font-semibold text-slate-500">{h.day}</div>
                <div className={`font-bold ${closed ? "text-red-600" : "text-slate-900"}`}>{h.time}</div>
              </div>
            );
          })}
        </Card>
      </section>
      <section className="container-x mt-10 grid lg:grid-cols-[1fr_1.4fr] gap-6 items-stretch">
        <div className="bg-sky-700 text-white rounded-3xl p-8 batik-bg flex flex-col">
          <MapPin className="h-10 w-10 text-sky-200" />
          <h2 className="text-2xl font-bold mt-3">Kunjungi Kantor Kami</h2>
          <p className="text-sky-100 mt-2">{settings.address}</p>
          <p className="text-sky-100 mt-2 text-sm">Silakan datang pada jam layanan atau hubungi kami terlebih dahulu melalui WhatsApp.</p>
          <div className="flex flex-wrap gap-3 mt-auto pt-6">
            <a href={gmapsUrl(office)} target="_blank" rel="noreferrer" data-testid="open-gmaps-btn" className="inline-flex items-center gap-2 bg-white text-sky-800 font-semibold rounded-full px-5 py-3"><BrandBadge kind="maps" size="sm" />Buka di Google Maps</a>
            <a href={waLink(settings.whatsapp?.[0] || "")} target="_blank" rel="noreferrer" data-testid="contact-wa-btn" className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] font-semibold rounded-full px-5 py-3"><WhatsAppIcon className="h-5 w-5" />Hubungi via WhatsApp</a>
          </div>
        </div>
        <MapEmbed q={office} zoom={17} testid="office-map-embed" />
      </section>
      <DigitalServices />
    </div>
  );
}
