import { useState } from "react";
import { ShieldCheck, Instagram } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compressImage, api, errMsg } from "@/lib/api";
import { PageHeader } from "@/components/public/Common";
import TicketCard from "@/components/public/TicketCard";

const Field = ({ id, label, children, hint }) => (
  <div><Label htmlFor={id} className="text-sm font-semibold">{label}</Label><div className="mt-1.5">{children}</div>{hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}</div>
);

const Identity = ({ form, set, prefix }) => (
  <div className="grid sm:grid-cols-3 gap-4">
    <Field id={`${prefix}-name`} label="Nama pengirim *"><Input id={`${prefix}-name`} value={form.name} onChange={set("name")} required data-testid={`${prefix}-name-input`} /></Field>
    <Field id={`${prefix}-phone`} label="Nomor WhatsApp *"><Input id={`${prefix}-phone`} inputMode="tel" value={form.phone} onChange={set("phone")} required data-testid={`${prefix}-phone-input`} /></Field>
    <Field id={`${prefix}-rt`} label="RT / RW"><Input id={`${prefix}-rt`} value={form.rt_rw} onChange={set("rt_rw")} data-testid={`${prefix}-rtrw-input`} /></Field>
  </div>
);

const ContentForm = () => {
  const init = { kind: "berita", title: "", content: "", name: "", phone: "", rt_rw: "", ig_consent: false, website: "" };
  const [form, setForm] = useState(init);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try {
      (await Promise.all(files.map((f) => compressImage(f)))).forEach((f) => fd.append("files", f));
      const r = await api.post("/public/submissions", fd);
      setTicket(r.data.ticket);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  if (ticket) return (
    <div className="max-w-md mx-auto space-y-4">
      <TicketCard ticket={ticket} docTitle="BUKTI KIRIMAN WARGA" title={`${form.kind === "berita" ? "Berita/Kegiatan" : "Foto Galeri"}: ${form.title}`} name={form.name} phone={form.phone} extraRows={[["Status", "Menunggu persetujuan admin"]]} />
      <Button variant="outline" className="w-full" onClick={() => { setTicket(null); setForm(init); setFiles([]); }} data-testid="submission-new-btn">Kirim lagi</Button>
    </div>
  );
  return (
    <form onSubmit={submit} className="space-y-5" data-testid="submission-form">
      <Field id="kind" label="Jenis kiriman">
        <div className="grid grid-cols-2 gap-3">
          {[["berita", "Berita / Kegiatan"], ["galeri", "Foto Galeri"]].map(([v, l]) => (
            <button type="button" key={v} onClick={() => setForm({ ...form, kind: v })} data-testid={`submission-kind-${v}`} className={`h-12 rounded-lg border-2 font-semibold ${form.kind === v ? "border-sky-600 bg-sky-50 text-sky-800" : "border-slate-200"}`}>{l}</button>
          ))}
        </div>
      </Field>
      <Field id="title" label="Judul *"><Input id="title" value={form.title} onChange={set("title")} required data-testid="submission-title-input" /></Field>
      {form.kind === "berita" && <Field id="content" label="Isi berita *" hint="Ceritakan apa, kapan, di mana, dan siapa yang terlibat."><Textarea id="content" rows={6} value={form.content} onChange={set("content")} required data-testid="submission-content-input" /></Field>}
      <Field id="files" label={form.kind === "galeri" ? "Foto * (maks. 5, @5 MB)" : "Foto pendukung (opsional, maks. 5)"}>
        <Input id="files" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 5))} data-testid="submission-files-input" />
      </Field>
      <Identity form={form} set={set} prefix="submission" />
      <label className="flex items-start gap-3 bg-gradient-to-r from-pink-50 to-amber-50 border border-pink-200 rounded-lg p-4 cursor-pointer" data-testid="submission-ig-consent">
        <Checkbox checked={form.ig_consent} onCheckedChange={(v) => setForm({ ...form, ig_consent: !!v })} className="mt-0.5" />
        <span className="text-sm"><b className="flex items-center gap-1"><Instagram className="h-4 w-4" />Izinkan dipublikasikan juga ke Instagram resmi kelurahan</b>Jika disetujui admin, kiriman dapat diposting ulang di Instagram kelurahan.</span>
      </label>
      <input type="text" className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      <Button type="submit" disabled={busy} className="w-full h-12 text-base bg-sky-600 hover:bg-sky-700" data-testid="submission-submit-btn">{busy ? "Mengirim…" : "Kirim untuk Ditinjau"}</Button>
    </form>
  );
};

const CATS = ["Infrastruktur & Jalan", "Kebersihan & Lingkungan", "Keamanan & Ketertiban", "Pelayanan Administrasi", "Sosial & Kesehatan", "Lainnya"];

const ComplaintForm = () => {
  const init = { name: "", phone: "", rt_rw: "", category: "", message: "", website: "" };
  const [form, setForm] = useState(init);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error("Pilih kategori laporan");
    setBusy(true);
    try {
      const r = await api.post("/public/complaints", form);
      setTicket(r.data.ticket);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  if (ticket) return (
    <div className="max-w-md mx-auto space-y-4">
      <TicketCard ticket={ticket} docTitle="BUKTI PENGADUAN" title={`Pengaduan: ${form.category}`} name={form.name} phone={form.phone} />
      <Button variant="outline" className="w-full" onClick={() => { setTicket(null); setForm(init); }} data-testid="complaint-new-btn">Buat laporan lain</Button>
    </div>
  );
  return (
    <form onSubmit={submit} className="space-y-5" data-testid="complaint-form">
      <Field id="cat" label="Kategori laporan *">
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger id="cat" className="h-11" data-testid="complaint-category-select"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
          <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <Field id="msg" label="Isi laporan *" hint="Sebutkan lokasi dan uraian masalah dengan jelas."><Textarea id="msg" rows={6} value={form.message} onChange={set("message")} required data-testid="complaint-message-input" /></Field>
      <Identity form={form} set={set} prefix="complaint" />
      <input type="text" className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      <Button type="submit" disabled={busy} className="w-full h-12 text-base bg-sky-600 hover:bg-sky-700" data-testid="complaint-submit-btn">{busy ? "Mengirim…" : "Kirim Laporan"}</Button>
    </form>
  );
};

export default function Partisipasi() {
  return (
    <div data-testid="partisipasi-page">
      <PageHeader title="Partisipasi Warga" desc="Kirim berita kegiatan, foto galeri, atau laporan pengaduan tanpa perlu login." crumb="Partisipasi Warga" />
      <section className="container-x mt-12 grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-8">
          <Tabs defaultValue="konten">
            <TabsList className="grid grid-cols-2 w-full h-12">
              <TabsTrigger value="konten" className="h-10 font-semibold" data-testid="tab-konten">Kirim Berita / Galeri</TabsTrigger>
              <TabsTrigger value="aduan" className="h-10 font-semibold" data-testid="tab-pengaduan">Pengaduan</TabsTrigger>
            </TabsList>
            <TabsContent value="konten" className="mt-6"><ContentForm /></TabsContent>
            <TabsContent value="aduan" className="mt-6"><ComplaintForm /></TabsContent>
          </Tabs>
        </div>
        <aside className="bg-sky-50 border border-sky-100 rounded-2xl p-6 space-y-4 text-sm text-slate-700">
          <ShieldCheck className="h-10 w-10 text-sky-600" />
          <h3 className="font-bold text-lg text-slate-900">Bagaimana prosesnya?</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Isi formulir, tidak perlu membuat akun.</li>
            <li>Anda mendapat nomor tiket. Simpan untuk melacak status di menu Lacak Layanan.</li>
            <li>Admin kelurahan meninjau (ACC) kiriman sebelum tampil di website.</li>
            <li>Jika Anda mengizinkan, berita yang di-ACC dapat diposting ke Instagram resmi.</li>
          </ol>
          <p className="text-xs text-slate-500">Nomor WhatsApp hanya dipakai petugas untuk konfirmasi dan tidak ditampilkan di website.</p>
        </aside>
      </section>
    </div>
  );
}
