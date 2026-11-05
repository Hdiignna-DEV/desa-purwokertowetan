import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, Clock, MapPin, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSite, usePublic } from "@/lib/site";
import { api, errMsg, waLink } from "@/lib/api";
import { PageHeader, SectionHead, CtaBand } from "@/components/public/Common";
import Flowchart from "@/components/public/Flowchart";
import TicketCard from "@/components/public/TicketCard";
import DigitalServices from "@/components/public/DigitalServices";
import { gmapsUrl } from "./Profil";

const empty = { name: "", phone: "", rt_rw: "", address: "", note: "", website: "" };

const RequestDialog = ({ service, onClose }) => {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post("/public/requests", { ...form, service_id: service.id });
      setResult(r.data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog open={!!service} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" data-testid="request-dialog">
        <DialogHeader>
          <DialogTitle>{result ? "Permohonan Terkirim" : `Ajukan: ${service?.name}`}</DialogTitle>
          {!result && <DialogDescription>Tanpa login. Setelah dikirim Anda menerima nomor tiket untuk dibawa ke kantor.</DialogDescription>}
        </DialogHeader>
        {result ? (
          <TicketCard ticket={result.ticket} docTitle="BUKTI PERMOHONAN LAYANAN" title={result.service_name} name={form.name} phone={form.phone} lines={result.requirements} extraRows={[["Estimasi", result.estimate]]} />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div><Label htmlFor="rq-name">Nama lengkap *</Label><Input id="rq-name" value={form.name} onChange={set("name")} required data-testid="request-name-input" /></div>
            <div><Label htmlFor="rq-phone">Nomor WhatsApp aktif *</Label><Input id="rq-phone" inputMode="tel" placeholder="08xx" value={form.phone} onChange={set("phone")} required data-testid="request-phone-input" /><p className="text-xs text-slate-500 mt-1">Dipakai untuk konfirmasi dan melacak status (4 digit terakhir).</p></div>
            <div><Label htmlFor="rq-rt">RT / RW</Label><Input id="rq-rt" placeholder="contoh: 03 / 05" value={form.rt_rw} onChange={set("rt_rw")} data-testid="request-rtrw-input" /></div>
            <div><Label htmlFor="rq-note">Keperluan / keterangan</Label><Textarea id="rq-note" value={form.note} onChange={set("note")} data-testid="request-note-input" /></div>
            <input type="text" className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
            <Button type="submit" disabled={busy} className="w-full h-12 text-base bg-sky-600 hover:bg-sky-700" data-testid="request-submit-btn">{busy ? "Mengirim…" : "Kirim Permohonan"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default function Layanan() {
  const { settings } = useSite();
  const services = usePublic("services");
  const [selected, setSelected] = useState(null);
  const { hash } = useLocation();
  useEffect(() => {
    if (hash && !services.loading) document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  }, [hash, services.loading]);
  return (
    <div data-testid="layanan-page">
      <PageHeader title="Layanan di Kelurahan" desc="Informasi layanan administrasi, alur pelayanan, dan pengajuan permohonan online tanpa login." crumb="Layanan" />
      <section className="container-x mt-14">
        <SectionHead eyebrow="Alur Pelayanan" title="Diagram Alir Pengurusan Layanan" desc="Ikuti langkah berikut. Estimasi waktu dihitung sejak berkas dinyatakan lengkap." />
        <Flowchart />
      </section>
      <section id="ajukan" className="container-x mt-20 scroll-mt-28">
        <SectionHead eyebrow="Daftar Layanan" title="Layanan yang Tersedia" desc="Pilih layanan lalu tekan “Ajukan Online”. Persyaratan lengkap dapat ditanyakan ke petugas." action={<Link to="/lacak" className="text-sky-700 font-semibold hover:underline" data-testid="layanan-track-link">Sudah punya tiket? Lacak status →</Link>} />
        <div className="grid gap-5 md:grid-cols-2">
          {services.items.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col" data-testid={`service-card-${s.id}`}>
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-sky-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{s.name}</h3>
                  <p className="text-sm text-slate-600">{s.description}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-700 flex-1">
                {(s.requirements || []).map((r) => <li key={r} className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />{r}</li>)}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-slate-100">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-800"><Clock className="h-4 w-4" />{s.estimate}</span>
                {s.online !== false ? (
                  <Button onClick={() => setSelected(s)} className="bg-sky-600 hover:bg-sky-700 rounded-full" data-testid={`service-apply-btn-${s.id}`}>Ajukan Online</Button>
                ) : (
                  <span className="text-xs text-slate-500">Dilayani langsung di kantor</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="container-x mt-16 grid md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6" data-testid="service-hours">
          <h3 className="font-bold flex items-center gap-2 mb-3"><Clock className="h-5 w-5 text-sky-600" />Jam Layanan</h3>
          {(settings.hours || []).map((h) => <div key={h.day} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm"><span>{h.day}</span><span className="font-semibold">{h.time}</span></div>)}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="font-bold flex items-center gap-2 mb-3"><MapPin className="h-5 w-5 text-sky-600" />Lokasi Kantor</h3>
          <p className="text-sm text-slate-700">{settings.address}</p>
          <div className="flex flex-wrap gap-4 mt-4">
            <a href={gmapsUrl(settings.office_map_query || settings.address)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-700 hover:underline" data-testid="service-maps-link">Petunjuk arah Google Maps →</a>
            <a href={waLink(settings.whatsapp?.[0] || "")} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700 hover:underline" data-testid="service-wa-link">Hubungi via WhatsApp →</a>
          </div>
        </div>
      </section>
      <DigitalServices />
      <CtaBand />
      <RequestDialog service={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
