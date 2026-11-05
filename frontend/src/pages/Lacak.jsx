import { useState } from "react";
import { Search, Circle, CalendarClock, Ticket, Copy, Camera, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, errMsg, formatDate, REQUEST_STATUS, statusLabel } from "@/lib/api";
import { PageHeader } from "@/components/public/Common";
import { WhatsAppIcon } from "@/components/public/BrandIcons";

export const StatusBadge = ({ s, kind }) => (
  <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${REQUEST_STATUS[s]?.cls || "bg-slate-100 text-slate-700"}`}>{statusLabel(s, kind)}</span>
);

const KIND_LABEL = { layanan: "PERMOHONAN LAYANAN", pengaduan: "PENGADUAN", kiriman: "KIRIMAN WARGA", umkm: "PENDAFTARAN POTENSI & UMKM" };
const PREFIX = [["PW-", "Permohonan layanan"], ["AD-", "Pengaduan"], ["KW-", "Kiriman berita/foto"], ["UM-", "Pendaftaran UMKM"]];

const Guide = () => (
  <aside className="bg-sky-50 border border-sky-100 rounded-3xl p-6 text-sm text-slate-700" data-testid="track-guide">
    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Ticket className="h-5 w-5 text-sky-600" />Tentang nomor tiket</h3>
    <p className="mt-2">Nomor tiket diberikan saat Anda mengirim formulir di website atau oleh petugas di loket. Contoh: <span className="font-mono font-bold text-sky-800">PW-261105-AB12</span>.</p>
    <div className="mt-4 grid grid-cols-2 gap-2">
      {PREFIX.map(([p, l]) => <div key={p} className="bg-white rounded-xl px-3 py-2 border border-sky-100"><span className="font-mono font-bold text-sky-700">{p}</span><div className="text-xs text-slate-500">{l}</div></div>)}
    </div>
    <div className="font-semibold text-slate-900 mt-5">Agar tidak lupa, simpan nomor tiket dengan:</div>
    <ul className="mt-2 space-y-1.5">
      <li className="flex gap-2"><Copy className="h-4 w-4 mt-0.5 shrink-0 text-sky-600" />Menyalin lalu menempel di catatan ponsel</li>
      <li className="flex gap-2"><WhatsAppIcon className="h-4 w-4 mt-0.5 shrink-0 text-[#25D366]" />Mengirim bukti ke WhatsApp Anda sendiri</li>
      <li className="flex gap-2"><Camera className="h-4 w-4 mt-0.5 shrink-0 text-sky-600" />Screenshot atau mencetak bukti pengajuan</li>
      <li className="flex gap-2"><NotebookPen className="h-4 w-4 mt-0.5 shrink-0 text-sky-600" />Mencatat di kertas bersama 4 digit akhir nomor WA</li>
    </ul>
    <p className="text-xs text-slate-500 mt-4">Lupa nomor tiket? Hubungi petugas kelurahan via WhatsApp dengan menyebutkan nama dan jenis pengajuan.</p>
  </aside>
);

export default function Lacak() {
  const [ticket, setTicket] = useState("");
  const [phone4, setPhone4] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setData(null);
    try {
      const r = await api.get(`/public/track/${encodeURIComponent(ticket.trim())}`, { params: { phone4 } });
      setData(r.data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div data-testid="lacak-page">
      <PageHeader title="Lacak Status Layanan" desc="Cek perkembangan permohonan layanan, pengaduan, kiriman warga, atau pendaftaran UMKM menggunakan nomor tiket." crumb="Lacak Layanan" />
      <section className="container-x mt-12 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <div>
          <form onSubmit={submit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm grid sm:grid-cols-[1fr_170px] gap-4">
            <div><Label htmlFor="tk">Nomor tiket</Label><Input id="tk" className="h-12 font-mono uppercase mt-1.5" placeholder="contoh: PW-261105-AB12" value={ticket} onChange={(e) => setTicket(e.target.value)} required data-testid="track-ticket-input" /></div>
            <div><Label htmlFor="p4">4 digit akhir WA</Label><Input id="p4" className="h-12 mt-1.5" inputMode="numeric" maxLength={4} placeholder="contoh: 0922" value={phone4} onChange={(e) => setPhone4(e.target.value.replace(/\D/g, ""))} required data-testid="track-phone-input" /></div>
            <Button type="submit" disabled={busy || phone4.length !== 4} className="sm:col-span-2 h-12 text-base bg-sky-600 hover:bg-sky-700" data-testid="track-submit-btn"><Search className="h-5 w-5 mr-2" />{busy ? "Mencari…" : "Cek Status"}</Button>
            <p className="sm:col-span-2 text-xs text-slate-500">Masukkan nomor tiket lengkap beserta 4 digit terakhir nomor WhatsApp yang Anda isi saat mengajukan.</p>
          </form>
          {error && <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 p-4" data-testid="track-error">{error}</div>}
          {data && (
            <div className="mt-6 bg-white border border-slate-200 rounded-3xl p-6 md:p-8" data-testid="track-result">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <div className="text-xs font-bold tracking-widest text-slate-500">{KIND_LABEL[data.kind] || "PENGAJUAN"}</div>
                  <div className="font-mono text-xl font-bold text-sky-700">{data.ticket}</div>
                  <div className="font-semibold mt-1">{data.title}</div>
                  <div className="text-sm text-slate-500">Atas nama {data.name} · {formatDate(data.created_at)}</div>
                </div>
                <div className="text-right"><StatusBadge s={data.status} kind={data.kind} />{data.estimate && <div className="text-xs text-slate-500 mt-2">Estimasi {data.estimate}</div>}</div>
              </div>
              {data.status === "dipanggil" && data.schedule && <div className="mt-5 bg-violet-50 border border-violet-200 rounded-2xl p-4 text-sm flex gap-3" data-testid="track-schedule"><CalendarClock className="h-5 w-5 text-violet-700 shrink-0" /><span><b>Anda diundang ke Kantor Kelurahan:</b> {data.schedule}. Bawa KTP dan nomor tiket ini.</span></div>}
              {data.response && <div className="mt-5 bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sm"><b>Tanggapan kelurahan:</b> {data.response}</div>}
              <ol className="mt-6 border-l-2 border-sky-200 ml-2 space-y-5">
                {[...data.history].reverse().map((h, i) => (
                  <li key={i} className="pl-5 relative">
                    <Circle className={`h-4 w-4 absolute -left-[9px] top-0.5 ${i === 0 ? "fill-sky-600 text-sky-600" : "fill-white text-sky-300"}`} />
                    <div className="flex flex-wrap items-center gap-2"><StatusBadge s={h.status} kind={data.kind} /><span className="text-xs text-slate-500">{formatDate(h.at, true)}</span></div>
                    {h.note && <p className="text-sm text-slate-700 mt-1">{h.note}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <Guide />
      </section>
    </div>
  );
}
