import { useSite } from "@/lib/site";
import { fileUrl } from "@/lib/api";

// Template cetak resmi: kop kelurahan, nomor tiket, tabel rincian, daftar berkas, catatan kaki.
export default function PrintSlip({ docTitle, ticket, rows = [], list = [], listTitle, footer, testid = "print-slip" }) {
  const { settings } = useSite();
  return (
    <div className="print-area bg-white rounded-2xl border border-slate-200 overflow-hidden" data-testid={testid}>
      <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-sky-700">
        <img src={fileUrl(settings.logo)} alt="" className="h-12 w-12 object-contain" />
        <div className="leading-tight">
          <div className="text-[11px] font-bold tracking-widest text-slate-500">PEMERINTAH KABUPATEN BANYUMAS</div>
          <div className="font-extrabold text-slate-900">{settings.site_name?.toUpperCase()}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">{settings.address}</div>
        </div>
      </div>
      <div className="px-5 py-5">
        <div className="text-center">
          <div className="text-xs font-bold tracking-[0.2em] text-sky-700">{docTitle}</div>
          <div className="mt-2 inline-block rounded-xl bg-sky-50 border border-sky-200 px-4 py-2">
            <div className="text-[10px] font-semibold text-slate-500 tracking-widest">NOMOR TIKET</div>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-sky-800 tracking-wider" data-testid="ticket-number">{ticket}</div>
          </div>
        </div>
        {rows.length > 0 && (
          <table className="w-full text-sm mt-5"><tbody>
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <tr key={k} className="border-b border-slate-100 last:border-0"><td className="py-2 pr-3 text-slate-500 w-32 align-top">{k}</td><td className="py-2 font-semibold text-slate-900 whitespace-pre-line">{v}</td></tr>
            ))}
          </tbody></table>
        )}
        {list.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="text-sm font-bold text-slate-800">{listTitle}</div>
            <ol className="text-sm text-slate-700 mt-2 space-y-1 list-decimal pl-5">{list.map((l) => <li key={l}>{l}</li>)}</ol>
          </div>
        )}
        <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">{footer || `Lacak status di ${window.location.origin}/lacak dengan nomor tiket dan 4 digit akhir nomor WhatsApp.`}</p>
      </div>
    </div>
  );
}
