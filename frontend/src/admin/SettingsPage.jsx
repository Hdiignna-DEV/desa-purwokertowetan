import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, errMsg } from "@/lib/api";
import { useSite } from "@/lib/site";
import { UploadField } from "./FieldInput";
import { PageTitle } from "./Dashboard";
import { SurveyCard } from "@/components/public/DigitalServices";

const F = ({ label, children, help }) => (
  <div><Label className="font-semibold">{label}</Label><div className="mt-1.5">{children}</div>{help && <p className="text-xs text-slate-500 mt-1">{help}</p>}</div>
);

const useField = (s, setS) => (path, type = "text", tid) => {
  const keys = path.split(".");
  const value = keys.reduce((o, k) => o?.[k], s) ?? "";
  const set = (v) => setS((prev) => {
    const next = structuredClone(prev);
    let o = next;
    keys.slice(0, -1).forEach((k) => { o[k] = o[k] || {}; o = o[k]; });
    o[keys.at(-1)] = v;
    return next;
  });
  const testid = tid || `set-${path.replace(/\./g, "-")}`;
  if (type === "textarea") return <Textarea rows={6} value={value} onChange={(e) => set(e.target.value)} data-testid={testid} />;
  if (type === "image") return <UploadField value={value} onChange={set} testid={testid} />;
  if (type === "lines") return <Textarea rows={4} value={(value || []).join("\n")} onChange={(e) => set(e.target.value.split("\n"))} data-testid={testid} />;
  if (type === "switch") return <Switch checked={!!value} onCheckedChange={set} data-testid={testid} />;
  return <Input className="h-11" value={value} onChange={(e) => set(e.target.value)} data-testid={testid} />;
};

const StepsEditor = ({ steps, onChange }) => {
  const upd = (i, k, v) => onChange(steps.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const move = (i, d) => {
    const n = [...steps];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    onChange(n);
  };
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="border rounded-xl p-4 bg-slate-50 space-y-3" data-testid={`step-editor-${i}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-700">Langkah {i + 1}</span>
            <div className="flex gap-1">
              <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" disabled={i === steps.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
              <Button type="button" size="icon" variant="ghost" className="text-red-600" onClick={() => onChange(steps.filter((_, j) => j !== i))} data-testid={`step-remove-${i}`}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <F label="Judul"><Input value={s.title} onChange={(e) => upd(i, "title", e.target.value)} data-testid={`step-title-${i}`} /></F>
            <F label="Pelaku"><Input value={s.actor} onChange={(e) => upd(i, "actor", e.target.value)} /></F>
            <F label="Waktu"><Input value={s.duration} onChange={(e) => upd(i, "duration", e.target.value)} data-testid={`step-duration-${i}`} /></F>
          </div>
          <F label="Keterangan"><Textarea rows={2} value={s.desc} onChange={(e) => upd(i, "desc", e.target.value)} /></F>
          <label className="flex items-center gap-2 text-sm"><Switch checked={!!s.decision} onCheckedChange={(v) => upd(i, "decision", v)} />Bentuk keputusan (belah ketupat: Ya / Tidak)</label>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => onChange([...steps, { title: "", desc: "", actor: "Petugas", duration: "", decision: false }])} data-testid="step-add-btn"><Plus className="h-4 w-4 mr-2" />Tambah langkah</Button>
    </div>
  );
};

const TABS = {
  konten: [
    { id: "sambutan", label: "Sambutan Lurah", keys: ["sambutan"] },
    { id: "profil", label: "Profil & Wilayah", keys: ["profil"] },
    { id: "ringkasan", label: "Angka Ringkas", keys: ["ringkasan", "data_info"] },
    { id: "alur", label: "Alur Pelayanan", keys: ["alur"] },
    { id: "survei", label: "Survei Kepuasan (QR)", keys: ["survey"] },
  ],
  situs: [
    { id: "identitas", label: "Identitas & Kontak", keys: ["site_name", "tagline", "address", "whatsapp", "instagram", "email", "hours", "map_query", "office_map_query", "footer_text"] },
    { id: "tampilan", label: "Foto & Logo", keys: ["hero_title", "hero_subtitle", "hero_image", "login_image", "logo"] },
    { id: "seo", label: "Mesin Pencari", keys: ["seo_title", "seo_description"] },
    { id: "instagram", label: "Instagram", keys: ["instagram_integration"] },
  ],
};

const TabBody = ({ id, s, setS, field }) => {
  switch (id) {
    case "sambutan": return (<><F label="Foto Lurah">{field("sambutan.photo", "image")}</F><div className="grid sm:grid-cols-2 gap-4"><F label="Nama & gelar">{field("sambutan.name")}</F><F label="Jabatan">{field("sambutan.title")}</F></div><F label="Isi sambutan" help="Sambutan tampil di halaman Profil (tidak ditampilkan di beranda, sama di semua perangkat).">{field("sambutan.text", "textarea")}</F></>);
    case "profil": return (<><F label="Sejarah & letak geografis">{field("profil.sejarah", "textarea")}</F><F label="Visi">{field("profil.visi", "textarea")}</F><F label="Misi (satu per baris)">{field("profil.misi", "lines")}</F><div className="grid sm:grid-cols-2 gap-4">{["utara", "timur", "selatan", "barat"].map((k) => <F key={k} label={`Batas ${k}`}>{field(`profil.batas.${k}`)}</F>)}</div></>);
    case "ringkasan": return (<div className="grid sm:grid-cols-2 gap-4">{[["penduduk", "Jumlah penduduk"], ["kk", "Kepala keluarga"], ["rw", "Jumlah RW"], ["rt", "Jumlah RT"], ["umkm", "UMKM binaan"]].map(([k, l]) => <F key={k} label={l}>{field(`ringkasan.${k}`)}</F>)}<F label="Tanggal data">{field("data_info.date")}</F><F label="Sumber data">{field("data_info.source")}</F></div>);
    case "alur": return (<><div className="grid sm:grid-cols-2 gap-4"><F label="Estimasi waktu layanan sederhana">{field("alur.estimasi")}</F><F label="Catatan estimasi">{field("alur.note")}</F></div><StepsEditor steps={s.alur?.steps || []} onChange={(steps) => setS({ ...s, alur: { ...s.alur, steps } })} /></>);
    case "survei": return (<><div className="grid sm:grid-cols-2 gap-4"><F label="Judul">{field("survey.title")}</F><F label="Tautan survei (URL)" help="Contoh: https://forms.gle/... Wajib diawali https://">{field("survey.url")}</F></div><F label="Deskripsi">{field("survey.description", "textarea")}</F><div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start"><F label="Gambar QR code resmi (opsional)" help="Jika kosong, QR dibuat otomatis dari tautan di atas.">{field("survey.qr_image", "image")}</F><div><Label className="font-semibold">Pratinjau di website</Label><div className="mt-1.5"><SurveyCard preview={s.survey} /></div></div></div></>);
    case "identitas": return (<div className="grid sm:grid-cols-2 gap-4"><F label="Nama situs">{field("site_name")}</F><F label="Instagram (tanpa @)">{field("instagram")}</F><F label="Tagline">{field("tagline")}</F><F label="Email">{field("email")}</F><F label="Nomor WhatsApp (satu per baris)">{field("whatsapp", "lines")}</F><F label="Alamat">{field("address", "textarea")}</F><F label="Peta wilayah (halaman Profil)" help="Nama wilayah untuk menampilkan batas kelurahan.">{field("map_query")}</F><F label="Lokasi kantor (halaman Kontak & Layanan)" help="Nama tempat atau koordinat kantor, contoh: -7.4237,109.2564">{field("office_map_query")}</F><F label="Teks footer">{field("footer_text", "textarea")}</F>
      <div className="sm:col-span-2"><Label className="font-semibold">Jam layanan</Label>{(s.hours || []).map((h, i) => (
        <div key={i} className="flex gap-2 mt-2"><Input value={h.day} onChange={(e) => setS({ ...s, hours: s.hours.map((x, j) => (j === i ? { ...x, day: e.target.value } : x)) })} /><Input value={h.time} onChange={(e) => setS({ ...s, hours: s.hours.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)) })} /><Button variant="ghost" size="icon" onClick={() => setS({ ...s, hours: s.hours.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button></div>
      ))}<Button variant="outline" size="sm" className="mt-2" onClick={() => setS({ ...s, hours: [...(s.hours || []), { day: "", time: "" }] })}><Plus className="h-4 w-4 mr-1" />Tambah baris</Button></div></div>);
    case "tampilan": return (<><F label="Judul utama beranda">{field("hero_title")}</F><F label="Deskripsi beranda">{field("hero_subtitle", "textarea")}</F><div className="grid sm:grid-cols-3 gap-4"><F label="Foto latar beranda">{field("hero_image", "image")}</F><F label="Foto latar login admin">{field("login_image", "image")}</F><F label="Logo">{field("logo", "image")}</F></div></>);
    case "seo": return (<><F label="Judul situs (tab browser & Google)">{field("seo_title")}</F><F label="Deskripsi untuk mesin pencari">{field("seo_description", "textarea")}</F></>);
    case "instagram": return (<><div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">Posting otomatis memerlukan akun Instagram Bisnis yang terhubung ke Facebook Page. Token akses disimpan di server (variabel <code>INSTAGRAM_ACCESS_TOKEN</code> dan <code>INSTAGRAM_ACCOUNT_ID</code>), bukan di halaman ini.</div><F label="Akun Instagram resmi">{field("instagram_integration.account")}</F><label className="flex items-center gap-3">{field("instagram_integration.auto_queue", "switch")}<span className="text-sm">Tawarkan masuk antrean Instagram saat ACC kiriman warga</span></label></>);
    default: return null;
  }
};

export default function SettingsPage({ scope }) {
  const { settings, reload } = useSite();
  const [s, setS] = useState(settings);
  const [busy, setBusy] = useState(false);
  const field = useField(s, setS);
  const tabs = TABS[scope];
  useEffect(() => {
    setS(settings);
  }, [settings]);
  const save = async (keys) => {
    setBusy(true);
    const body = Object.fromEntries(keys.map((k) => [k, s[k]]));
    if (body.whatsapp) body.whatsapp = body.whatsapp.map((w) => w.trim()).filter(Boolean);
    if (body.profil?.misi) body.profil = { ...body.profil, misi: body.profil.misi.map((m) => m.trim()).filter(Boolean) };
    try {
      await api.put("/admin/settings", body);
      await reload();
      toast.success("Perubahan disimpan dan langsung tampil di website");
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const backup = async () => {
    const r = await api.get("/admin/backup");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(r.data, null, 2)], { type: "application/json" }));
    a.download = `cadangan-website-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  return (
    <div data-testid={`settings-${scope}`}>
      <PageTitle title={scope === "konten" ? "Konten Halaman" : "Pengaturan Situs"} desc={scope === "konten" ? "Ubah sambutan, profil, angka ringkas, alur pelayanan, dan QR survei." : "Identitas, kontak, foto, mesin pencari, dan Instagram."}
        action={scope === "situs" && <Button variant="outline" className="h-11" onClick={backup} data-testid="backup-download-btn"><Download className="h-4 w-4 mr-2" />Unduh cadangan data</Button>} />
      <Tabs defaultValue={tabs[0].id}>
        <TabsList className="h-auto flex-wrap justify-start mb-4">
          {tabs.map((t) => <TabsTrigger key={t.id} value={t.id} className="h-10" data-testid={`settings-tab-${t.id}`}>{t.label}</TabsTrigger>)}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5">
              <TabBody id={t.id} s={s} setS={setS} field={field} />
              <Button className="h-12 px-6 text-base bg-sky-600 hover:bg-sky-700" disabled={busy} onClick={() => save(t.keys)} data-testid={`settings-save-${t.id}`}><Save className="h-5 w-5 mr-2" />Simpan {t.label}</Button>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
