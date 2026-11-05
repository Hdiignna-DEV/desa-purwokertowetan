import { useCallback, useEffect, useState } from "react";
import { Check, X, CalendarClock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api, errMsg, fileUrl, formatDate, statusLabel } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/pages/Lacak";
import { PageTitle } from "./Dashboard";
import ConfirmButton from "./ConfirmButton";
import WaNotify from "./WaNotify";

const TABS = ["menunggu", "dipanggil", "disetujui", "ditolak"];
const ACTIONS = {
  call: { title: "Panggil ke Kantor", desc: "Warga akan melihat jadwal ini di halaman Lacak. Kirim juga notifikasi WhatsApp setelah disimpan.", btn: "Simpan Panggilan", cls: "bg-violet-600 hover:bg-violet-700" },
  approve: { title: "Setujui & Tampilkan", desc: "Data akan tampil di halaman Potensi & UMKM.", btn: "Setujui", cls: "bg-emerald-600 hover:bg-emerald-700" },
  reject: { title: "Tolak Pendaftaran", desc: "Alasan akan terlihat oleh warga di halaman Lacak.", btn: "Tolak", cls: "bg-red-600 hover:bg-red-700" },
};

const ActionDialog = ({ state, onClose, onDone }) => {
  const [f, setF] = useState({});
  useEffect(() => {
    if (state) setF({ schedule: "", note: "", reason: "", name: state.item.business_name, category: state.item.category, description: state.item.description });
  }, [state]);
  if (!state) return null;
  const a = ACTIONS[state.action];
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async () => {
    try {
      const r = await api.post(`/admin/umkm/${state.item.id}/${state.action}`, f);
      toast.success("Status pendaftaran diperbarui");
      onDone(r.data);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" data-testid="umkm-action-dialog">
        <DialogHeader><DialogTitle>{a.title}</DialogTitle><DialogDescription>{a.desc}</DialogDescription></DialogHeader>
        <div className="space-y-4">
          {state.action === "call" && <>
            <div><Label>Jadwal kedatangan *</Label><Input className="h-11 mt-1" placeholder="contoh: Senin, 10 November 2026 pukul 09.00 WIB" value={f.schedule} onChange={set("schedule")} data-testid="umkm-schedule-input" /></div>
            <div><Label>Catatan (berkas yang dibawa, dll.)</Label><Textarea className="mt-1" value={f.note} onChange={set("note")} data-testid="umkm-call-note-input" /></div>
          </>}
          {state.action === "approve" && <>
            <div><Label>Nama tampil</Label><Input className="h-11 mt-1" value={f.name} onChange={set("name")} data-testid="umkm-approve-name-input" /></div>
            <div><Label>Kategori</Label><Input className="h-11 mt-1" value={f.category} onChange={set("category")} /></div>
            <div><Label>Deskripsi (boleh disunting)</Label><Textarea rows={4} className="mt-1" value={f.description} onChange={set("description")} /></div>
            <div><Label>Catatan untuk warga</Label><Textarea className="mt-1" value={f.note} onChange={set("note")} /></div>
          </>}
          {state.action === "reject" && <div><Label>Alasan penolakan</Label><Textarea className="mt-1" value={f.reason} onChange={set("reason")} data-testid="umkm-reject-reason-input" /></div>}
        </div>
        <DialogFooter className="gap-2"><Button variant="outline" onClick={onClose}>Batal</Button><Button className={`h-11 ${a.cls}`} onClick={submit} data-testid="umkm-action-confirm-btn">{a.btn}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const lastNote = (it) => it.history?.at(-1)?.note || "";

const Item = ({ it, onAction, onDelete }) => {
  const { can } = useAuth();
  const open = ["menunggu", "dipanggil"].includes(it.status);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5" data-testid={`umkm-item-${it.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs mb-1"><span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">{it.kind}</span><span className="font-mono text-slate-500">{it.ticket}</span><StatusBadge s={it.status} /></div>
          <h3 className="font-bold text-lg">{it.business_name}</h3>
          <div className="text-sm text-slate-500">{it.category} · {it.name} · RT/RW {it.rt_rw || "-"} · {formatDate(it.created_at, true)}</div>
        </div>
      </div>
      <p className="text-sm text-slate-700 mt-3 whitespace-pre-line">{it.description}</p>
      <div className="text-sm text-slate-600 mt-2 space-y-0.5">
        {it.address && <div>Alamat: {it.address}</div>}
        <div>WA pemilik: <b>{it.phone}</b>{it.product_contact && <> · WA usaha: <b>{it.product_contact}</b></>}</div>
        {it.schedule && <div className="text-violet-700 font-semibold flex items-center gap-1"><CalendarClock className="h-4 w-4" />Jadwal ke kantor: {it.schedule}</div>}
      </div>
      {it.images?.length > 0 && <div className="flex gap-2 mt-3 flex-wrap">{it.images.map((im, i) => <img key={i} src={fileUrl(im)} alt="" className="h-24 w-24 object-cover rounded-xl border" />)}</div>}
      {open && (
        <div className="flex flex-wrap gap-2 mt-4">
          <Button className="h-11 bg-violet-600 hover:bg-violet-700" onClick={() => onAction(it, "call")} data-testid={`umkm-call-${it.id}`}><CalendarClock className="h-4 w-4 mr-2" />Panggil ke Kantor</Button>
          <Button className="h-11 bg-emerald-600 hover:bg-emerald-700" onClick={() => onAction(it, "approve")} data-testid={`umkm-approve-${it.id}`}><Check className="h-4 w-4 mr-2" />Setujui</Button>
          <Button variant="outline" className="h-11 text-red-600" onClick={() => onAction(it, "reject")} data-testid={`umkm-reject-${it.id}`}><X className="h-4 w-4 mr-2" />Tolak</Button>
        </div>
      )}
      <div className="mt-4">
        <WaNotify testid={`umkm-wa-${it.id}`} phone={it.phone} name={it.name} kindLabel="Pendaftaran UMKM" ticket={it.ticket} titleLabel="Usaha" title={it.business_name} status={statusLabel(it.status)} schedule={it.status === "dipanggil" ? it.schedule : ""} note={lastNote(it)} />
      </div>
      {!open && can("admin") && <ConfirmButton title="Hapus pendaftaran ini?" onConfirm={() => onDelete(it)} testid={`umkm-delete-${it.id}`} className="h-9 mt-3 text-red-600" variant="ghost"><Trash2 className="h-4 w-4 mr-1" />Hapus</ConfirmButton>}
    </div>
  );
};

export default function UmkmPage() {
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("menunggu");
  const [action, setAction] = useState(null);
  const load = useCallback(() => api.get("/admin/umkm").then((r) => setItems(r.data)).catch((e) => toast.error(errMsg(e))), []);
  useEffect(() => {
    load();
  }, [load]);
  const shown = items.filter((i) => i.status === tab);
  return (
    <div data-testid="umkm-admin-page">
      <PageTitle title="Pendaftaran Potensi & UMKM" desc="Verifikasi pendaftaran warga: panggil ke kantor, setujui, atau tolak. Kirim notifikasi WhatsApp satu klik." />
      <Tabs value={tab} onValueChange={setTab} className="mb-5">
        <TabsList className="h-auto flex-wrap justify-start">
          {TABS.map((k) => <TabsTrigger key={k} value={k} className="h-9" data-testid={`umkm-tab-${k}`}>{statusLabel(k)} ({items.filter((i) => i.status === k).length})</TabsTrigger>)}
        </TabsList>
      </Tabs>
      {shown.length === 0 && <div className="text-center text-slate-500 py-12 bg-white rounded-2xl border border-dashed" data-testid="umkm-empty">Tidak ada pendaftaran.</div>}
      <div className="space-y-4">
        {shown.map((it) => <Item key={it.id} it={it} onAction={(item, a) => setAction({ item, action: a })} onDelete={async (x) => { await api.delete(`/admin/inbox/umkm/${x.id}`); load(); }} />)}
      </div>
      <ActionDialog state={action} onClose={() => setAction(null)} onDone={(d) => { setAction(null); setTab(d.status); load(); }} />
    </div>
  );
}
