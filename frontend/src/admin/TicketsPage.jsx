import { useCallback, useEffect, useState } from "react";
import { Printer, Search, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, errMsg, formatDate, statusLabel } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import ConfirmButton from "./ConfirmButton";
import { StatusBadge } from "@/pages/Lacak";
import { PageTitle } from "./Dashboard";
import PrintSlip from "@/components/public/PrintSlip";
import WaNotify from "./WaNotify";

const KINDS = {
  requests: { title: "Permohonan Layanan", desc: "Permohonan online dari warga. Perbarui status agar warga bisa melacaknya.", statuses: ["diterima", "diverifikasi", "perlu_dilengkapi", "diproses", "selesai", "ditolak"], label: (i) => i.service_name },
  complaints: { title: "Pengaduan Warga", desc: "Laporan dan pengaduan dari warga.", statuses: ["diterima", "ditindaklanjuti", "selesai", "ditolak"], label: (i) => i.category },
};

const Detail = ({ item, kind, onClose, onSaved, onDeleted }) => {
  const { can } = useAuth();
  const sk = kind === "complaints" ? "pengaduan" : "layanan";
  const k = KINDS[kind];
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState("");
  const [response, setResponse] = useState(item.response || "");
  const save = async () => {
    try {
      const r = await api.put(`/admin/${kind}/${item.id}/status`, { status, note, response: kind === "complaints" ? response : undefined });
      toast.success("Status diperbarui");
      onSaved(r.data);
      setNote("");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const lastNote = item.history?.at(-1)?.note || "";
  return (
    <div className="space-y-5">
      <PrintSlip testid="print-ticket" docTitle={kind === "requests" ? "TANDA TERIMA PERMOHONAN LAYANAN" : "TANDA TERIMA PENGADUAN"} ticket={item.ticket}
        rows={[[kind === "requests" ? "Layanan" : "Kategori", k.label(item)], ["Nama", item.name], ["WhatsApp", item.phone], ["RT/RW", item.rt_rw || "-"], ["Tanggal", formatDate(item.created_at, true)], ["Status", statusLabel(item.status, sk)], ["Estimasi", item.estimate], ["Keperluan", item.note], ["Isi laporan", item.message]]}
        list={item.requirements || []} listTitle="Persyaratan berkas" />
      <Button variant="outline" className="h-11 w-full no-print" onClick={() => window.print()} data-testid="detail-print-btn"><Printer className="h-4 w-4 mr-2" />Cetak tanda terima</Button>
      <WaNotify testid="detail-wa" phone={item.phone} name={item.name} kindLabel={kind === "requests" ? "Permohonan Layanan" : "Pengaduan"} ticket={item.ticket} titleLabel={kind === "requests" ? "Layanan" : "Kategori"} title={k.label(item)} status={statusLabel(item.status, sk)} note={lastNote} label="Kirim Notifikasi Status via WA" />
      <div className="space-y-3 no-print border-t pt-4">
        <Label className="font-semibold">Ubah status</Label>
        <p className="text-xs text-slate-500">Setelah menyimpan, tekan tombol hijau di atas untuk mengirim notifikasi ke WhatsApp warga.</p>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11" data-testid="detail-status-select"><SelectValue /></SelectTrigger>
          <SelectContent>{k.statuses.map((s) => <SelectItem key={s} value={s}>{statusLabel(s, sk)}</SelectItem>)}</SelectContent>
        </Select>
        <Textarea placeholder="Catatan untuk warga (tampil di halaman lacak)" value={note} onChange={(e) => setNote(e.target.value)} data-testid="detail-note-input" />
        {kind === "complaints" && <Textarea placeholder="Tanggapan resmi kelurahan" value={response} onChange={(e) => setResponse(e.target.value)} data-testid="detail-response-input" />}
        <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Tutup</Button><Button className="flex-1 h-11 bg-sky-600 hover:bg-sky-700" onClick={save} data-testid="detail-save-btn">Simpan Status</Button></div>
        {can("admin") && <ConfirmButton title="Hapus data ini permanen?" desc="Gunakan hanya untuk data uji coba atau spam." onConfirm={async () => { await api.delete(`/admin/inbox/${kind}/${item.id}`); onDeleted(); }} testid="detail-delete-btn" className="h-9 text-red-600" variant="ghost">Hapus data</ConfirmButton>}
      </div>
    </div>
  );
};

export default function TicketsPage({ kind }) {
  const k = KINDS[kind];
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("aktif");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const load = useCallback(() => api.get(`/admin/${kind}`).then((r) => setItems(r.data)).catch((e) => toast.error(errMsg(e))), [kind]);
  useEffect(() => {
    load();
  }, [load]);
  const shown = items
    .filter((i) => filter === "semua" || (filter === "aktif" ? !["selesai", "ditolak"].includes(i.status) : i.status === filter))
    .filter((i) => `${i.ticket} ${i.name} ${i.phone}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div data-testid={`tickets-${kind}`}>
      <PageTitle title={k.title} desc={k.desc} />
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm"><Search className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" /><Input placeholder="Cari tiket, nama, atau nomor" className="h-11 pl-9" value={q} onChange={(e) => setQ(e.target.value)} data-testid="tickets-search-input" /></div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-11 sm:w-56" data-testid="tickets-filter-select"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="aktif">Belum selesai</SelectItem>
            <SelectItem value="semua">Semua</SelectItem>
            {k.statuses.map((s) => <SelectItem key={s} value={s}>{statusLabel(s, kind === "complaints" ? "pengaduan" : "layanan")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {shown.length === 0 && <div className="text-center text-slate-500 py-12 bg-white rounded-xl border border-dashed" data-testid="tickets-empty">Tidak ada data.</div>}
      <div className="space-y-2">
        {shown.map((i) => (
          <button key={i.id} onClick={() => setOpen(i)} className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 hover:border-sky-400" data-testid={`ticket-row-${i.ticket}`}>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono font-bold text-sky-700">{i.ticket}</span><StatusBadge s={i.status} kind={kind === "complaints" ? "pengaduan" : "layanan"} /></div>
              <div className="font-semibold mt-1 truncate">{k.label(i)}</div>
              <div className="text-sm text-slate-500">{i.name} · {formatDate(i.created_at, true)}</div>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </button>
        ))}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" data-testid="ticket-detail-dialog">
          <DialogHeader className="no-print"><DialogTitle>Detail {kind === "requests" ? "Permohonan" : "Pengaduan"}</DialogTitle></DialogHeader>
          {open && <Detail item={open} kind={kind} onClose={() => setOpen(null)} onSaved={(d) => { setOpen(d); load(); }} onDeleted={() => { setOpen(null); load(); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
