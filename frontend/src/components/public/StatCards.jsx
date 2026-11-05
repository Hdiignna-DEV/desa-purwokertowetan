import { useEffect, useState } from "react";
import { Users, Home as HomeIcon, MapPinned, Store } from "lucide-react";
import { useSite } from "@/lib/site";

const CountUp = ({ value }) => {
  const raw = String(value ?? "");
  const num = Number(raw.replace(/\D/g, ""));
  const suffix = raw.replace(/[\d.,\s]/g, "");
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!num) return undefined;
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 1200);
      setN(Math.round(num * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [num]);
  if (!num) return <>{raw || "–"}</>;
  return <>{n.toLocaleString("id-ID")}{suffix}</>;
};

export default function StatCards({ floating }) {
  const { settings } = useSite();
  const r = settings.ringkasan || {};
  const items = [
    { icon: Users, v: r.penduduk, l: "Jiwa Penduduk", sub: "Total warga terdata", tone: "from-sky-500 to-sky-700" },
    { icon: HomeIcon, v: r.kk, l: "Kepala Keluarga", sub: "Jumlah KK terdaftar", tone: "from-emerald-500 to-emerald-700" },
    { icon: MapPinned, v: r.rw, l: "Rukun Warga", sub: `Terdiri atas ${r.rt || "–"} Rukun Tetangga`, tone: "from-amber-400 to-orange-600" },
    { icon: Store, v: r.umkm, l: "UMKM Binaan", sub: "Usaha warga terdata", tone: "from-violet-500 to-indigo-700" },
  ];
  return (
    <div className={floating ? "bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-sky-900/10 border border-white p-3 md:p-4" : ""} data-testid="stat-cards">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map(({ icon: Icon, v, l, sub, tone }, i) => (
          <div key={l} className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 p-4 md:p-5 reveal" style={{ animationDelay: `${i * 90}ms` }} data-testid={`stat-${l.toLowerCase().replace(/\s/g, "-")}`}>
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${tone} opacity-10`} />
            <div className={`h-11 w-11 rounded-2xl bg-gradient-to-br ${tone} text-white grid place-items-center shadow-md`}><Icon className="h-5 w-5" /></div>
            <div className="mt-3 text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums"><CountUp value={v} /></div>
            <div className="text-sm font-bold text-slate-800">{l}</div>
            <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 mt-3 px-1">Data per {settings.data_info?.date || "-"} · Sumber: {settings.data_info?.source || "-"}</p>
    </div>
  );
}
