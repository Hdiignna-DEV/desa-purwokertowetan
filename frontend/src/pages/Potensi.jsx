import { useState } from "react";
import { Store, ClipboardCheck, Building2, BadgeCheck, Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePublic } from "@/lib/site";
import { compressImage, api, errMsg, fileUrl, waLink } from "@/lib/api";
import { PageHeader, CtaBand } from "@/components/public/Common";
import TicketCard from "@/components/public/TicketCard";
import { WhatsAppIcon } from "@/components/public/BrandIcons";

const CATS = ["Kuliner", "Kerajinan", "Jasa", "Perdagangan", "Pertanian & Peternakan", "Wisata & Budaya", "Lainnya"];
const F = ({ id, label, hint, children, full }) => (
  <div className={full ? "sm:col-span-2" : ""}><Label htmlFor={id} className="text-sm font-semibold">{label}</Label><div className="mt-1.5">{children}</div>{hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}</div>
);

export const RegisterForm = () => {
  const init = { kind: "UMKM", business_name: "", category: "", description: "", address: "", product_contact: "", name: "", phone: "", rt_rw: "", website: "" };
  const [form, setForm] = useState(init);
  const [files, setFiles] = useState([]);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!form.category) return toast.error("Pilih kategori usaha/potensi");
    if (!agree) return toast.error("Centang persetujuan publikasi terlebih dahulu");
    setBusy(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try {
      (await Promise.all(files.map((f) => compressImage(f)))).forEach((f) => fd.append("files", f));
      const r = await api.post("/public/umkm", fd);
      setTicket(r.data.ticket);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  if (ticket) return (
    <div className="max-w-lg mx-auto space-y-4">
      <TicketCard ticket={ticket} docTitle="BUKTI PENDAFTARAN UMKM" title={`${form.kind}: ${form.business_name}`} name={form.name} phone={form.phone}
        lines={["KTP pemilik usaha", "Foto produk / lokasi usaha", "Surat pengantar RT/RW (jika diminta petugas)"]} listTitle="Siapkan berkas berikut bila dipanggil ke kantor" />
      <Button variant="outline" className="w-full h-11" onClick={() => { setTicket(null); setForm(init); setFiles([]); setAgree(false); }} data-testid="umkm-new-btn">Daftarkan usaha lain</Button>
    </div>
  );
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4" data-testid="umkm-form">
      <F id="kind" label="Jenis pendaftaran" full>
        <div className="grid grid-cols-2 gap-3">
          {[["UMKM", "UMKM / Usaha Warga"], ["Potensi", "Potensi Wilayah"]].map(([v, l]) => (
            <button type="button" key={v} onClick={() => setForm({ ...form, kind: v })} data-testid={`umkm-kind-${v.toLowerCase()}`} className={`h-12 rounded-2xl border-2 font-semibold text-sm transition-colors ${form.kind === v ? "border-sky-600 bg-sky-50 text-sky-800" : "border-slate-200 hover:border-sky-300"}`}>{l}</button>
          ))}
        </div>
      </F>
      <F id="bn" label="Nama usaha / potensi *"><Input id="bn" className="h-11" value={form.business_name} onChange={set("business_name")} required data-testid="umkm-business-input" /></F>
      <F id="cat" label="Kategori *">
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
          <SelectTrigger id="cat" className="h-11" data-testid="umkm-category-select"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
          <SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </F>
      <F id="desc" label="Deskripsi singkat *" hint="Produk/jasa yang ditawarkan, keunggulan, dan jam buka." full><Textarea id="desc" rows={4} value={form.description} onChange={set("description")} required data-testid="umkm-description-input" /></F>
      <F id="addr" label="Alamat usaha"><Input id="addr" className="h-11" value={form.address} onChange={set("address")} data-testid="umkm-address-input" /></F>
      <F id="pc" label="WhatsApp usaha (tampil publik)" hint="Opsional. Kosongkan jika tidak ingin ditampilkan."><Input id="pc" className="h-11" inputMode="tel" value={form.product_contact} onChange={set("product_contact")} data-testid="umkm-contact-input" /></F>
      <F id="files" label="Foto produk / usaha (maks. 3)" full><Input id="files" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 3))} data-testid="umkm-files-input" /></F>
      <div className="sm:col-span-2 border-t pt-4 text-sm font-bold text-slate-800">Data pemilik / penanggung jawab</div>
      <F id="nm" label="Nama lengkap *"><Input id="nm" className="h-11" value={form.name} onChange={set("name")} required data-testid="umkm-name-input" /></F>
      <F id="ph" label="Nomor WhatsApp aktif *" hint="Untuk notifikasi persetujuan & melacak status."><Input id="ph" className="h-11" inputMode="tel" placeholder="08xx" value={form.phone} onChange={set("phone")} required data-testid="umkm-phone-input" /></F>
      <F id="rt" label="RT / RW"><Input id="rt" className="h-11" placeholder="contoh: 03 / 05" value={form.rt_rw} onChange={set("rt_rw")} data-testid="umkm-rtrw-input" /></F>
      <input type="text" className="hidden" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
      <label className="sm:col-span-2 flex items-start gap-3 bg-sky-50 border border-sky-100 rounded-2xl p-4 cursor-pointer text-sm" data-testid="umkm-agree">
        <Checkbox checked={agree} onCheckedChange={(v) => setAgree(!!v)} className="mt-0.5" />
        <span>Saya menyatakan data benar dan bersedia usaha/potensi ini ditampilkan di website kelurahan setelah diverifikasi admin.</span>
      </label>
      <Button type="submit" disabled={busy} className="sm:col-span-2 h-12 text-base bg-sky-600 hover:bg-sky-700" data-testid="umkm-submit-btn">{busy ? "Mengirim…" : "Kirim Pendaftaran"}</Button>
    </form>
  );
};

export const STEPS = [
  { icon: ClipboardCheck, t: "Isi formulir", d: "Tanpa login. Anda langsung menerima nomor tiket." },
  { icon: Search, t: "Verifikasi admin", d: "Petugas memeriksa data. Pantau status di menu Lacak." },
  { icon: Building2, t: "Dipanggil ke kantor", d: "Bila perlu, Anda diundang ke kantor via WhatsApp untuk verifikasi berkas." },
  { icon: BadgeCheck, t: "Disetujui & tampil", d: "Usaha Anda tampil di halaman Potensi & UMKM." },
];

export default function Potensi() {
  const { items } = usePublic("potentials");
  const [cat, setCat] = useState("Semua");
  const cats = ["Semua", ...new Set(items.map((p) => p.category))];
  const shown = cat === "Semua" ? items : items.filter((p) => p.category === cat);
  return (
    <div data-testid="potensi-page">
      <PageHeader title="Potensi & UMKM" desc="Katalog potensi wilayah dan produk UMKM warga Kelurahan Purwokerto Wetan." crumb="Potensi & UMKM" />
      <section className="container-x mt-12">
        <div className="flex flex-wrap gap-2 mb-8" data-testid="potensi-filter">
          {cats.map((c) => (
            <button key={c} onClick={() => setCat(c)} data-testid={`potensi-filter-${c}`} className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${cat === c ? "bg-sky-600 text-white border-sky-600" : "bg-white border-slate-200 hover:border-sky-400"}`}>{c}</button>
          ))}
        </div>
        {shown.length === 0 && <p className="text-slate-500" data-testid="potensi-empty">Belum ada data pada kategori ini.</p>}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-lg transition-shadow" data-testid={`potensi-card-${p.id}`}>
              <div className="p-3 pb-0"><div className="aspect-[16/10] bg-sky-600 batik-bg rounded-2xl overflow-hidden">{p.image && <img src={fileUrl(p.image)} alt={p.name} className="w-full h-full object-cover" loading="lazy" />}</div></div>
              <div className="p-5">
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">{p.category}</span>
                <h3 className="font-bold mt-2">{p.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{p.description}</p>
                {p.contact && <a href={waLink(p.contact)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-[#128C7E] mt-3"><WhatsAppIcon className="h-4 w-4" />{p.contact}</a>}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="container-x mt-16" data-testid="potensi-register-cta">
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 p-6 md:p-10 grid md:grid-cols-[auto_1fr_auto] gap-6 items-center">
          <span className="h-16 w-16 rounded-3xl bg-amber-400 text-slate-900 grid place-items-center"><Store className="h-8 w-8" /></span>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">Punya usaha atau potensi wilayah?</h2>
            <p className="text-slate-600 mt-2 max-w-2xl text-sm md:text-base">Warga Kelurahan Purwokerto Wetan yang ingin usaha (UMKM) atau potensi wilayahnya tampil di katalog ini dapat mendaftar secara gratis. Data akan <b>diverifikasi oleh admin kelurahan</b> dan Anda mendapat nomor tiket untuk memantau statusnya.</p>
          </div>
          <Link to="/potensi/daftar" className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3.5 transition-colors" data-testid="potensi-register-link">Daftarkan Usaha Anda <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
      <CtaBand />
    </div>
  );
}
