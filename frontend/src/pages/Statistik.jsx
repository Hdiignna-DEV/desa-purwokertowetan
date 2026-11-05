import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText } from "lucide-react";
import { usePublic } from "@/lib/site";
import { fileUrl, formatDate } from "@/lib/api";
import { PageHeader, SectionHead, CtaBand } from "@/components/public/Common";
import StatCards from "@/components/public/StatCards";

const COLORS = ["#0284C7", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444", "#14B8A6", "#EC4899"];
const fmt = (n) => Number(n || 0).toLocaleString("id-ID");

const ChartTip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl">
      <div className="font-bold">{p.label}</div>
      <div>{fmt(p.value)} jiwa · {total ? ((p.value / total) * 100).toFixed(1) : 0}%</div>
    </div>
  );
};

const Legend = ({ data, total }) => (
  <ul className="space-y-2 mt-4">
    {data.map((d, i) => (
      <li key={d.label} className="flex items-center gap-3 text-sm">
        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
        <span className="flex-1 text-slate-700">{d.label}</span>
        <span className="font-bold tabular-nums">{fmt(d.value)}</span>
        <span className="w-14 text-right text-slate-500 tabular-nums">{total ? ((d.value / total) * 100).toFixed(1) : 0}%</span>
      </li>
    ))}
  </ul>
);

const Donut = ({ data, total }) => (
  <div className="relative h-64">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="90%" paddingAngle={3} cornerRadius={10} stroke="none" animationDuration={1100}>
          {data.map((d, i) => <Cell key={d.label} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip content={<ChartTip total={total} />} />
      </PieChart>
    </ResponsiveContainer>
    <div className="absolute inset-0 grid place-items-center pointer-events-none text-center">
      <div><div className="text-2xl font-extrabold tabular-nums">{fmt(total)}</div><div className="text-xs text-slate-500">Total jiwa</div></div>
    </div>
  </div>
);

const Bars = ({ data, total, gid }) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 24, right: 8, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38BDF8" /><stop offset="100%" stopColor="#0369A1" /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#475569" }} tickFormatter={(v) => String(v).replace(/\s*tahun$/i, "")} axisLine={false} tickLine={false} interval={0} />
        <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={fmt} axisLine={false} tickLine={false} width={48} />
        <Tooltip content={<ChartTip total={total} />} cursor={{ fill: "rgba(14,165,233,.08)", radius: 12 }} />
        <Bar dataKey="value" fill={`url(#${gid})`} radius={[12, 12, 4, 4]} maxBarSize={56} animationDuration={1100}>
          <LabelList dataKey="value" position="top" formatter={fmt} style={{ fontSize: 11, fontWeight: 700, fill: "#0F172A" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default function Statistik() {
  const stats = usePublic("statistics");
  const docs = usePublic("documents");
  const groups = [...new Set(stats.items.map((s) => s.group))];
  return (
    <div data-testid="statistik-page">
      <PageHeader title="Data & Statistik" desc="Data kependudukan dan dokumen publik kelurahan." crumb="Data & Statistik" />
      <section className="container-x mt-12"><StatCards /></section>
      <section className="container-x mt-12 grid lg:grid-cols-2 gap-6">
        {groups.map((g, gi) => {
          const data = stats.items.filter((s) => s.group === g).map((s) => ({ ...s, value: Number(s.value) || 0 }));
          const total = data.reduce((a, b) => a + b.value, 0);
          return (
            <div key={g} className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm" data-testid={`chart-${g}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div><div className="eyebrow">Grafik</div><h3 className="font-bold text-lg">{g}{data.length > 3 && /tahun/i.test(data[0]?.label) ? " (tahun)" : ""}</h3></div>
                <span className="text-xs font-semibold bg-sky-50 text-sky-800 rounded-full px-3 py-1">{fmt(total)} jiwa</span>
              </div>
              {data.length <= 3 ? <Donut data={data} total={total} /> : <Bars data={data} total={total} gid={`grad-${gi}`} />}
              <Legend data={data} total={total} />
            </div>
          );
        })}
      </section>
      <section className="container-x mt-14">
        <SectionHead eyebrow="Dokumen Publik" title="Dokumen Unduhan" />
        {docs.items.length === 0 && <p className="text-slate-500" data-testid="docs-empty">Belum ada dokumen yang diunggah.</p>}
        <div className="grid gap-3 md:grid-cols-2">
          {docs.items.map((d) => (
            <a key={d.id} href={fileUrl(d.file)} target="_blank" rel="noreferrer" download={d.file?.startsWith("data:") ? `${d.title}.pdf` : undefined} data-testid={`doc-${d.id}`} className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 hover:border-sky-400">
              <span className="h-11 w-11 rounded-xl bg-sky-100 text-sky-700 grid place-items-center"><FileText className="h-5 w-5" /></span>
              <div className="flex-1"><div className="font-semibold">{d.title}</div><div className="text-xs text-slate-500">{d.category} · {formatDate(d.created_at)}</div></div>
              <Download className="h-5 w-5 text-sky-700" />
            </a>
          ))}
        </div>
      </section>
      <CtaBand />
    </div>
  );
}
