import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, KeyRound, Unlock, Trash2, Power, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, errMsg, fileUrl, formatDate } from "@/lib/api";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import FieldInput from "./FieldInput";
import ConfirmButton from "./ConfirmButton";
import { PageTitle } from "./Dashboard";

const FIELDS = [
  { key: "photo", label: "Foto", type: "image", full: true },
  { key: "name", label: "Nama lengkap", required: true },
  { key: "username", label: "Nama pengguna (untuk login)", required: true },
  { key: "email", label: "Email" },
  { key: "position", label: "Jabatan" },
  { key: "phone", label: "Nomor telepon" },
  { key: "role", label: "Peran", type: "select", options: [{ value: "admin", label: "Administrator – semua akses" }, { value: "editor", label: "Editor – kelola konten" }, { value: "kontributor", label: "Kontributor – tulis draf berita" }] },
];

const statusOf = (u) => (u.locked_until && new Date(u.locked_until) > new Date() ? "terkunci" : u.status);
const BADGE = { aktif: "bg-emerald-100 text-emerald-800", nonaktif: "bg-slate-200 text-slate-700", menunggu: "bg-amber-100 text-amber-800", terkunci: "bg-red-100 text-red-800" };
const LABEL = { aktif: "Aktif", nonaktif: "Nonaktif", menunggu: "Menunggu aktivasi", terkunci: "Terkunci" };

export default function Accounts() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [temp, setTemp] = useState(null);
  const load = useCallback(() => api.get("/admin/users").then((r) => setUsers(r.data)), []);
  useEffect(() => {
    load();
  }, [load]);
  const act = async (fn, msg) => {
    try {
      const r = await fn();
      if (msg) toast.success(msg);
      load();
      return r;
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const save = async () => {
    if (!editing.name || !editing.username) return toast.error("Nama dan nama pengguna wajib diisi");
    if (editing.id) {
      const r = await act(() => api.put(`/admin/users/${editing.id}`, editing), "Akun diperbarui");
      if (r) setEditing(null);
    } else {
      const r = await act(() => api.post("/admin/users", editing));
      if (r) { setEditing(null); setTemp({ name: editing.name, pw: r.data.temp_password }); }
    }
  };
  const reset = async (u) => {
    const r = await act(() => api.post(`/admin/users/${u.id}/reset-password`));
    if (r) setTemp({ name: u.name, pw: r.data.temp_password });
  };
  return (
    <div data-testid="accounts-page">
      <PageTitle title="Akun Admin" desc="Akun hanya dibuat oleh Administrator. Tidak ada pendaftaran terbuka." action={<Button className="h-12 px-5 bg-sky-600 hover:bg-sky-700" onClick={() => setEditing({ role: "editor" })} data-testid="account-add-btn"><Plus className="h-5 w-5 mr-2" />Tambah akun</Button>} />
      <div className="space-y-2">
        {users.map((u) => {
          const st = statusOf(u);
          const self = u.id === me.id;
          return (
            <div key={u.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3" data-testid={`account-${u.username}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {u.photo ? <img src={fileUrl(u.photo)} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="h-12 w-12 rounded-full bg-sky-100 text-sky-700 font-bold grid place-items-center">{u.name?.[0]}</div>}
                <div className="min-w-0">
                  <div className="font-semibold truncate">{u.name} {self && <span className="text-xs text-slate-500">(Anda)</span>}</div>
                  <div className="text-sm text-slate-500 truncate">@{u.username} · {u.position || "-"} · {ROLE_LABEL[u.role]}</div>
                  <div className="text-xs text-slate-400">Login terakhir: {u.last_login ? formatDate(u.last_login, true) : "belum pernah"}</div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold self-start md:self-center ${BADGE[st]}`} data-testid={`account-status-${u.username}`}>{LABEL[st]}</span>
              <div className="flex flex-wrap gap-1.5">
                <Button variant="outline" className="h-10" onClick={() => setEditing({ ...u })} data-testid={`account-edit-${u.username}`}><Pencil className="h-4 w-4 mr-1" />Ubah</Button>
                <Button variant="outline" className="h-10" onClick={() => reset(u)} data-testid={`account-reset-${u.username}`}><KeyRound className="h-4 w-4 mr-1" />Atur ulang sandi</Button>
                {st === "terkunci" && <Button variant="outline" className="h-10" onClick={() => act(() => api.post(`/admin/users/${u.id}/unlock`), "Akun dibuka")} data-testid={`account-unlock-${u.username}`}><Unlock className="h-4 w-4 mr-1" />Buka kunci</Button>}
                {!self && (u.status === "nonaktif"
                  ? <Button variant="outline" className="h-10 text-emerald-700" onClick={() => act(() => api.put(`/admin/users/${u.id}`, { status: "aktif" }), "Akun diaktifkan")} data-testid={`account-activate-${u.username}`}><Power className="h-4 w-4 mr-1" />Aktifkan</Button>
                  : <ConfirmButton title={`Nonaktifkan ${u.name}?`} desc="Akun tidak bisa login, tetapi data dan riwayatnya tetap tersimpan." onConfirm={() => act(() => api.put(`/admin/users/${u.id}`, { status: "nonaktif" }), "Akun dinonaktifkan")} testid={`account-deactivate-${u.username}`} className="h-10 text-amber-700"><Power className="h-4 w-4 mr-1" />Nonaktifkan</ConfirmButton>)}
                {!self && <ConfirmButton title={`Hapus akun ${u.name} permanen?`} desc="Hanya bisa untuk akun yang belum punya konten atau riwayat." onConfirm={() => act(() => api.delete(`/admin/users/${u.id}`), "Akun dihapus")} testid={`account-delete-${u.username}`}><Trash2 className="h-4 w-4" /></ConfirmButton>}
              </div>
            </div>
          );
        })}
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" data-testid="account-dialog">
          <DialogHeader><DialogTitle>{editing?.id ? "Ubah akun" : "Tambah akun"}</DialogTitle><DialogDescription>{!editing?.id && "Kata sandi sementara akan dibuat otomatis dan wajib diganti saat login pertama."}</DialogDescription></DialogHeader>
          {editing && <div className="grid sm:grid-cols-2 gap-4">{FIELDS.filter((f) => !(editing.id && f.key === "username")).map((f) => <FieldInput key={f.key} field={f} value={editing[f.key]} onChange={(v) => setEditing((e) => ({ ...e, [f.key]: v }))} />)}</div>}
          <DialogFooter className="gap-2"><Button variant="outline" onClick={() => setEditing(null)}>Batal</Button><Button className="bg-sky-600 hover:bg-sky-700 h-11 px-6" onClick={save} data-testid="account-save-btn">Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!temp} onOpenChange={(o) => !o && setTemp(null)}>
        <DialogContent data-testid="temp-password-dialog">
          <DialogHeader><DialogTitle>Kata sandi sementara</DialogTitle><DialogDescription>Berikan kepada {temp?.name}. Kata sandi ini hanya ditampilkan sekali dan wajib diganti saat login.</DialogDescription></DialogHeader>
          <div className="font-mono text-2xl font-bold text-center bg-sky-50 rounded-lg p-4" data-testid="temp-password-value">{temp?.pw}</div>
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(temp.pw); toast.success("Disalin"); }}><Copy className="h-4 w-4 mr-2" />Salin</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
