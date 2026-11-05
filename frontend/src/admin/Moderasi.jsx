import { useCallback, useEffect, useState } from "react";
import { Check, X, Instagram, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, errMsg, fileUrl, formatDate, waLink } from "@/lib/api";
import { PageTitle } from "./Dashboard";
import ConfirmButton from "./ConfirmButton";
import WaNotify from "./WaNotify";
import { useAuth } from "@/lib/auth";

const STATUS = { menunggu: "Menunggu ACC", disetujui: "Disetujui", ditolak: "Ditolak" };

const ApproveDialog = ({ sub, onClose, onDone }) => {
  const [f, setF] = useState(null);
  useEffect(() => {
    if (sub) setF({ title: sub.title, content: sub.content, post_instagram: sub.ig_consent, caption: `${sub.title}\n\n${(sub.content || "").slice(0, 300)}\n\n📷 Kiriman warga: ${sub.name}` });
  }, [sub]);
  const approve = async () => {
    try {
      await api.post(`/admin/submissions/${sub.id}/approve`, f);
      toast.success(f.post_instagram ? "Disetujui & masuk antrean Instagram" : "Disetujui dan dipublikasikan");
      onDone();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <Dialog open={!!sub} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto" data-testid="approve-dialog">
        <DialogHeader><DialogTitle>ACC & Publikasikan</DialogTitle></DialogHeader>
        {f && sub && (
          <div className="space-y-4">
            <div><Label>Judul</Label><Input className="h-11 mt-1" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} data-testid="approve-title-input" /></div>
            {sub.kind === "berita" && <div><Label>Isi (boleh disunting)</Label><Textarea rows={6} className="mt-1" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} data-testid="approve-content-input" /></div>}
            <label className="flex items-start gap-3 border rounded-lg p-3 cursor-pointer" data-testid="approve-ig-toggle">
              <Checkbox checked={f.post_instagram} onCheckedChange={(v) => setF({ ...f, post_instagram: !!v })} disabled={!sub.ig_consent} className="mt-0.5" />
              <span className="text-sm"><b>Masukkan ke antrean Instagram</b><br />{sub.ig_consent ? "Warga mengizinkan publikasi ke Instagram." : "Warga tidak mengizinkan publikasi ke Instagram."}</span>
            </label>
            {f.post_instagram && <div><Label>Caption Instagram</Label><Textarea rows={5} className="mt-1" value={f.caption} onChange={(e) => setF({ ...f, caption: e.target.value })} data-testid="approve-caption-input" /></div>}
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6" onClick={approve} data-testid="approve-confirm-btn"><Check className="h-4 w-4 mr-2" />Setujui</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function Moderasi() {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("menunggu");
  const [approving, setApproving] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const load = useCallback(() => api.get("/admin/submissions").then((r) => setItems(r.data)).catch((e) => toast.error(errMsg(e))), []);
  useEffect(() => {
    load();
  }, [load]);
  const reject = async () => {
    try {
      await api.post(`/admin/submissions/${rejecting.id}/reject`, { reason });
      toast.success("Kiriman ditolak");
      setRejecting(null);
      setReason("");
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const shown = items.filter((i) => i.status === tab);
  return (
    <div data-testid="moderation-page">
      <PageTitle title="Kiriman Warga" desc="Tinjau berita dan foto dari warga. Hanya kiriman yang di-ACC yang tampil di website." />
      <Tabs value={tab} onValueChange={setTab} className="mb-5">
        <TabsList className="h-11">
          {Object.entries(STATUS).map(([k, l]) => <TabsTrigger key={k} value={k} className="h-9" data-testid={`moderation-tab-${k}`}>{l} ({items.filter((i) => i.status === k).length})</TabsTrigger>)}
        </TabsList>
      </Tabs>
      {shown.length === 0 && <div className="text-center text-slate-500 py-12 bg-white rounded-xl border border-dashed" data-testid="moderation-empty">Tidak ada kiriman.</div>}
      <div className="space-y-4">
        {shown.map((s) => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-5" data-testid={`submission-${s.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap gap-2 text-xs mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold uppercase">{s.kind}</span>
                  {s.ig_consent && <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 font-bold flex items-center gap-1"><Instagram className="h-3 w-3" />Izin Instagram</span>}
                  <span className="text-slate-500 font-mono">{s.ticket}</span>
                </div>
                <h3 className="font-bold text-lg">{s.title}</h3>
                <div className="text-sm text-slate-500">{s.name} · RT/RW {s.rt_rw || "-"} · {formatDate(s.created_at, true)}</div>
              </div>
              <a href={waLink(s.phone)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-emerald-700 flex items-center gap-1" data-testid={`submission-wa-${s.id}`}><Phone className="h-4 w-4" />{s.phone}</a>
            </div>
            {s.content && <p className="text-sm text-slate-700 mt-3 whitespace-pre-line line-clamp-6">{s.content}</p>}
            {s.images?.length > 0 && <div className="flex gap-2 mt-3 flex-wrap">{s.images.map((im) => <a key={im} href={fileUrl(im)} target="_blank" rel="noreferrer"><img src={fileUrl(im)} alt="" className="h-24 w-24 object-cover rounded-lg border" /></a>)}</div>}
            {s.status === "ditolak" && s.reason && <p className="text-sm text-red-700 mt-3">Alasan: {s.reason}</p>}
            <div className="mt-4"><WaNotify testid={`submission-notify-${s.id}`} phone={s.phone} name={s.name} kindLabel="Kiriman Warga" ticket={s.ticket} titleLabel="Judul" title={s.title} status={STATUS[s.status]} note={s.status === "disetujui" ? "Kiriman Anda telah dipublikasikan di website kelurahan." : s.status === "ditolak" ? s.reason || "Kiriman belum dapat dipublikasikan." : "Kiriman sedang ditinjau oleh admin."} /></div>
            {s.status !== "menunggu" && can("admin") && <ConfirmButton title="Hapus kiriman ini?" onConfirm={async () => { await api.delete(`/admin/inbox/submissions/${s.id}`); load(); }} testid={`submission-delete-${s.id}`} className="h-9 mt-3 text-red-600" variant="ghost"><Trash2 className="h-4 w-4 mr-1" />Hapus</ConfirmButton>}
            {s.status === "menunggu" && (
              <div className="flex gap-2 mt-4">
                <Button className="h-11 bg-emerald-600 hover:bg-emerald-700" onClick={() => setApproving(s)} data-testid={`submission-approve-${s.id}`}><Check className="h-4 w-4 mr-2" />ACC</Button>
                <Button variant="outline" className="h-11 text-red-600" onClick={() => setRejecting(s)} data-testid={`submission-reject-${s.id}`}><X className="h-4 w-4 mr-2" />Tolak</Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <ApproveDialog sub={approving} onClose={() => setApproving(null)} onDone={() => { setApproving(null); load(); }} />
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent data-testid="reject-dialog">
          <DialogHeader><DialogTitle>Tolak kiriman?</DialogTitle></DialogHeader>
          <Label>Alasan (terlihat oleh warga di halaman Lacak)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} data-testid="reject-reason-input" />
          <DialogFooter><Button variant="outline" onClick={() => setRejecting(null)}>Batal</Button><Button className="bg-red-600 hover:bg-red-700" onClick={reject} data-testid="reject-confirm-btn">Tolak</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
