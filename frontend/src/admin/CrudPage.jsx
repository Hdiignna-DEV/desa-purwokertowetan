import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Instagram, EyeOff, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, errMsg, fileUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import FieldInput from "./FieldInput";
import ConfirmButton from "./ConfirmButton";
import { PageTitle } from "./Dashboard";

const Row = ({ item, cfg, onEdit, onDelete, onInstagram, canDelete }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-3 md:p-4 flex items-center gap-4" data-testid={`row-${item.id}`}>
    {cfg.image && (item[cfg.image]
      ? <img src={fileUrl(item[cfg.image])} alt="" className={`h-14 w-14 object-cover shrink-0 ${cfg.round ? "rounded-full" : "rounded-lg"}`} />
      : <div className={`h-14 w-14 bg-slate-100 grid place-items-center text-slate-400 shrink-0 ${cfg.round ? "rounded-full" : "rounded-lg"}`}><ImageIcon className="h-5 w-5" /></div>)}
    <div className="flex-1 min-w-0">
      <div className="font-semibold text-slate-900 truncate flex items-center gap-2">{item[cfg.primary] || "(tanpa judul)"}{item.visible === false && <EyeOff className="h-4 w-4 text-slate-400" />}</div>
      <div className="text-sm text-slate-500 truncate">{cfg.secondary?.(item)}</div>
    </div>
    <div className="flex gap-1.5 shrink-0">
      {onInstagram && item.status === "terbit" && <Button variant="outline" size="icon" className="h-10 w-10" title="Kirim ke antrean Instagram" onClick={() => onInstagram(item)} data-testid={`row-ig-${item.id}`}><Instagram className="h-4 w-4" /></Button>}
      <Button variant="outline" className="h-10" onClick={() => onEdit(item)} data-testid={`row-edit-${item.id}`}><Pencil className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Ubah</span></Button>
      {canDelete && <ConfirmButton onConfirm={() => onDelete(item)} testid={`row-delete-${item.id}`} title="Hapus data ini?" desc="Data yang dihapus tidak dapat dikembalikan."><Trash2 className="h-4 w-4" /></ConfirmButton>}
    </div>
  </div>
);

export default function CrudPage({ config: cfg }) {
  const { can } = useAuth();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [params, setParams] = useSearchParams();
  const load = useCallback(() => api.get(`/admin/res/${cfg.res}`).then((r) => setItems(r.data)).catch((e) => toast.error(errMsg(e))), [cfg.res]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (params.get("baru")) {
      setEditing({ ...(cfg.defaults || {}) });
      setParams({}, { replace: true });
    }
  }, [params, setParams, cfg.defaults]);
  const save = async () => {
    const missing = cfg.fields.find((f) => f.required && (editing[f.key] === undefined || editing[f.key] === ""));
    if (missing) return toast.error(`${missing.label} wajib diisi`);
    setBusy(true);
    try {
      if (editing.id) await api.put(`/admin/res/${cfg.res}/${editing.id}`, editing);
      else await api.post(`/admin/res/${cfg.res}`, editing);
      toast.success("Tersimpan");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (item) => {
    try {
      await api.delete(`/admin/res/${cfg.res}/${item.id}`);
      toast.success("Dihapus");
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const toInstagram = async (item) => {
    try {
      await api.post("/admin/instagram", { news_id: item.id });
      toast.success("Ditambahkan ke antrean Instagram");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const shown = items.filter((i) => JSON.stringify([i[cfg.primary], cfg.secondary?.(i)]).toLowerCase().includes(q.toLowerCase()));
  return (
    <div data-testid={`crud-${cfg.res}`}>
      <PageTitle title={cfg.title} desc={cfg.desc} action={<Button className="h-12 px-5 text-base bg-sky-600 hover:bg-sky-700" onClick={() => setEditing({ ...(cfg.defaults || {}) })} data-testid="crud-add-btn"><Plus className="h-5 w-5 mr-2" />Tambah</Button>} />
      <div className="relative mb-4 max-w-sm"><Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" /><Input placeholder="Cari…" className="h-11 pl-9" value={q} onChange={(e) => setQ(e.target.value)} data-testid="crud-search-input" /></div>
      <div className="space-y-2">
        {shown.length === 0 && <div className="text-center text-slate-500 py-12 bg-white rounded-xl border border-dashed" data-testid="crud-empty">Belum ada data.</div>}
        {shown.map((item) => (
          <Row key={item.id} item={item} cfg={cfg} onEdit={(i) => setEditing({ ...i })} onDelete={remove} onInstagram={cfg.instagram && can("editor") ? toInstagram : null} canDelete={cfg.res !== "news" || can("editor") || ["draf", "diajukan"].includes(item.status)} />
        ))}
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" data-testid="crud-dialog">
          <DialogHeader><DialogTitle>{editing?.id ? `Ubah ${cfg.title}` : `Tambah ${cfg.title}`}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid sm:grid-cols-2 gap-4">
              {cfg.fields.map((f) => <FieldInput key={f.key} field={f} value={editing[f.key]} onChange={(v) => setEditing((e) => ({ ...e, [f.key]: v }))} />)}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11" onClick={() => setEditing(null)} data-testid="crud-cancel-btn">Batal</Button>
            <Button className="h-11 px-6 bg-sky-600 hover:bg-sky-700" onClick={save} disabled={busy} data-testid="crud-save-btn">{busy ? "Menyimpan…" : "Simpan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
