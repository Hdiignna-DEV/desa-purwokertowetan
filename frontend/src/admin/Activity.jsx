import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { api, formatDate } from "@/lib/api";
import { PageTitle } from "./Dashboard";

export default function Activity() {
  const [logs, setLogs] = useState([]);
  const [q, setQ] = useState("");
  useEffect(() => {
    api.get("/admin/activity").then((r) => setLogs(r.data));
  }, []);
  const shown = logs.filter((l) => `${l.user_name} ${l.action} ${l.target}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div data-testid="activity-page">
      <PageTitle title="Riwayat Aktivitas" desc="Catatan siapa mengubah apa dan kapan." />
      <Input placeholder="Saring menurut nama, tindakan, atau objek…" className="h-11 max-w-md mb-4" value={q} onChange={(e) => setQ(e.target.value)} data-testid="activity-search-input" />
      <div className="bg-white border border-slate-200 rounded-xl divide-y">
        {shown.length === 0 && <div className="p-8 text-center text-slate-500">Belum ada aktivitas.</div>}
        {shown.map((l) => (
          <div key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm" data-testid="activity-row">
            <span className="text-slate-500 sm:w-44 shrink-0">{formatDate(l.created_at, true)}</span>
            <span className="font-semibold sm:w-40 shrink-0">{l.user_name}</span>
            <span className="flex-1">{l.action}: <span className="text-slate-600">{l.target}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
