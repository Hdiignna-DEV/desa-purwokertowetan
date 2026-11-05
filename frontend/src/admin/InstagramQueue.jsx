import { useCallback, useEffect, useState } from "react";
import { Instagram, Copy, Download, Check, Send, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api, errMsg, fileUrl, formatDate } from "@/lib/api";
import { PageTitle } from "./Dashboard";
import ConfirmButton from "./ConfirmButton";

const STATUS = { menunggu: "bg-amber-100 text-amber-800", terposting: "bg-emerald-100 text-emerald-800", dibatalkan: "bg-slate-100 text-slate-600" };

export default function InstagramQueue() {
  const [data, setData] = useState({ connected: false, items: [] });
  const load = useCallback(() => api.get("/admin/instagram").then((r) => setData(r.data)), []);
  useEffect(() => {
    load();
  }, [load]);
  const update = async (id, body, msg) => {
    try {
      await api.put(`/admin/instagram/${id}`, body);
      if (msg) toast.success(msg);
      load();
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  const publish = async (id) => {
    try {
      await api.post(`/admin/instagram/${id}/publish`);
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <div data-testid="instagram-page">
      <PageTitle title="Antrean Instagram" desc="Berita yang sudah di-ACC dan siap dipublikasikan ke Instagram resmi kelurahan." />
      <div className={`flex gap-3 rounded-xl p-4 mb-6 border ${data.connected ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`} data-testid="instagram-connection-status">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="text-sm">
          {data.connected ? <b>Instagram terhubung.</b> : (
            <>
              <b>Instagram belum tersambung (alur sudah siap).</b> Sementara ini, unduh gambar dan salin caption, unggah manual di aplikasi Instagram, lalu tekan “Tandai sudah diposting”.
              Untuk posting otomatis diperlukan akun Instagram Bisnis yang terhubung ke Facebook Page beserta token akses (Instagram Graph API, gratis).
            </>
          )}
        </div>
      </div>
      {data.items.length === 0 && <div className="text-center text-slate-500 py-12 bg-white rounded-xl border border-dashed" data-testid="instagram-empty">Antrean kosong. Berita bisa ditambahkan dari menu Berita (ikon Instagram) atau saat ACC kiriman warga.</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {data.items.map((q) => (
          <div key={q.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col" data-testid={`ig-item-${q.id}`}>
            <div className="aspect-square bg-gradient-to-br from-pink-100 to-amber-100 relative">
              {q.image ? <img src={fileUrl(q.image)} alt="" className="w-full h-full object-cover" /> : <Instagram className="h-12 w-12 text-pink-400 absolute inset-0 m-auto" />}
              <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS[q.status]}`}>{q.status}</span>
            </div>
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="text-xs text-slate-500">{q.source} · {formatDate(q.created_at, true)}</div>
              <Textarea rows={5} defaultValue={q.caption} onBlur={(e) => e.target.value !== q.caption && update(q.id, { caption: e.target.value }, "Caption disimpan")} data-testid={`ig-caption-${q.id}`} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(q.caption); toast.success("Caption disalin"); }} data-testid={`ig-copy-${q.id}`}><Copy className="h-4 w-4 mr-2" />Salin caption</Button>
                {q.image ? <Button variant="outline" asChild data-testid={`ig-download-${q.id}`}><a href={fileUrl(q.image)} target="_blank" rel="noreferrer" download><Download className="h-4 w-4 mr-2" />Gambar</a></Button> : <span />}
                {q.status === "menunggu" && <Button className="bg-pink-600 hover:bg-pink-700" onClick={() => publish(q.id)} data-testid={`ig-publish-${q.id}`}><Send className="h-4 w-4 mr-2" />Posting otomatis</Button>}
                {q.status === "menunggu" && <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => update(q.id, { status: "terposting" }, "Ditandai sudah diposting")} data-testid={`ig-mark-${q.id}`}><Check className="h-4 w-4 mr-2" />Sudah diposting</Button>}
              </div>
              <ConfirmButton onConfirm={async () => { await api.delete(`/admin/instagram/${q.id}`); load(); }} testid={`ig-delete-${q.id}`} title="Hapus dari antrean?" className="h-9 text-red-600 self-start" variant="ghost"><Trash2 className="h-4 w-4 mr-1" />Hapus</ConfirmButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
