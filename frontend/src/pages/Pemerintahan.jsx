import { useEffect, useState } from "react";
import { Landmark, HeartHandshake, Users, ShieldCheck, Baby, Building2, UserRound, Home as HomeIcon, Star } from "lucide-react";
import { usePublic } from "@/lib/site";
import { PageHeader, SectionHead, Photo, CtaBand } from "@/components/public/Common";

const usePerRow = () => {
  const get = () => (window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : 4);
  const [n, setN] = useState(get);
  useEffect(() => {
    const on = () => setN(get());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return n;
};

const VLine = ({ h = "h-8" }) => <div className={`w-0.5 ${h} bg-sky-300 mx-auto`} />;

// Bingkai foto berbeda per tingkat jabatan: 1 = Lurah (emas), 2 = Sekretaris (biru), 3 = Kasi/staf (perak)
const FRAME = {
  1: { card: "w-56 sm:w-64 border-amber-300 shadow-xl shadow-amber-900/10", outer: "p-[5px] bg-gradient-to-br from-amber-200 via-yellow-500 to-amber-700 rounded-[1.6rem]", inner: "p-1 rounded-[1.3rem]", photo: "rounded-[1.05rem]", badge: "text-white bg-gradient-to-r from-amber-500 to-amber-700", name: "text-base sm:text-lg" },
  2: { card: "w-48 sm:w-56 border-sky-200 shadow-lg shadow-sky-900/10", outer: "p-1 bg-gradient-to-br from-sky-300 via-sky-500 to-sky-800 rounded-[1.4rem]", inner: "p-[3px] rounded-[1.15rem]", photo: "rounded-2xl", badge: "text-white bg-sky-700", name: "text-sm sm:text-base" },
  3: { card: "w-[9.5rem] sm:w-48 lg:w-52 max-w-full border-slate-200 shadow-sm", outer: "p-[3px] bg-gradient-to-br from-slate-200 via-sky-200 to-slate-400 rounded-[1.25rem]", inner: "p-[2px] rounded-[1.05rem]", photo: "rounded-2xl", badge: "text-sky-800 bg-sky-50", name: "text-sm sm:text-base" },
};

const OfficialCard = ({ o, tier = 3 }) => {
  const f = FRAME[tier];
  return (
    <div className={`relative bg-white border rounded-3xl text-center hover:shadow-xl transition-shadow ${f.card}`} data-testid={`official-${o.id}`}>
      {tier === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 h-7 w-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 text-white grid place-items-center shadow ring-4 ring-white"><Star className="h-3.5 w-3.5 fill-white" /></span>}
      <div className="p-3 pb-0" data-testid={`official-frame-${tier}`}>
        <div className={f.outer}><div className={`bg-white ${f.inner}`}><Photo src={o.photo} alt={o.name} className={`w-full aspect-[4/5] ${f.photo}`} /></div></div>
      </div>
      <div className="p-3 sm:p-4">
        <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${f.badge} rounded-full px-2.5 py-1 inline-block`}>{o.position}</div>
        <div className={`font-bold text-slate-900 mt-2 leading-snug ${f.name}`}>{o.name}</div>
      </div>
    </div>
  );
};

// Baris anggota dengan garis penghubung horizontal di atas (dari tengah kartu pertama ke tengah kartu terakhir)
const Row = ({ items }) => (
  <div className="relative flex justify-center gap-3 sm:gap-5 [--cw:9.5rem] sm:[--cw:12rem] lg:[--cw:13rem]">
    {items.length > 1 && <div className="absolute top-0 h-0.5 bg-sky-300" style={{ left: "calc(var(--cw) / 2)", right: "calc(var(--cw) / 2)" }} />}
    {items.map((o) => (
      <div key={o.id} className="w-[var(--cw)] pt-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-sky-300" />
        <OfficialCard o={o} />
      </div>
    ))}
  </div>
);

const OrgChart = ({ officials }) => {
  const per = usePerRow();
  const by = (lv) => officials.filter((o) => (o.level || 3) === lv);
  const l3 = by(3);
  const rows = [];
  for (let i = 0; i < l3.length; i += per) rows.push(l3.slice(i, i + per));
  const top = [...by(1), ...by(2)];
  return (
    <div className="bg-gradient-to-b from-sky-50 to-white border border-sky-100 rounded-3xl py-10 px-3 overflow-x-auto" data-testid="org-chart">
      <div className="flex flex-col items-center min-w-fit">
        {top.map((o, i) => (
          <div key={o.id} className="flex flex-col items-center">
            {i > 0 && <VLine />}
            <OfficialCard o={o} tier={i === 0 ? 1 : 2} />
          </div>
        ))}
        {rows.map((r, i) => (
          <div key={i} className="relative flex flex-col items-center">
            {i < rows.length - 1 && <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-sky-300" />}
            {(top.length > 0 || i > 0) && <VLine h={i > 0 ? "h-6" : "h-8"} />}
            <div className="relative z-10"><Row items={r} /></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const INST_ICON = [Landmark, HeartHandshake, Users, ShieldCheck, Baby, Building2];

export default function Pemerintahan() {
  const officials = usePublic("officials");
  const inst = usePublic("institutions");
  const rw = usePublic("rw");
  const totalRt = rw.items.reduce((a, b) => a + Number(b.rt_count || 0), 0);
  return (
    <div data-testid="pemerintahan-page">
      <PageHeader title="Pemerintahan Kelurahan" desc="Struktur organisasi, perangkat kelurahan, dan lembaga kemasyarakatan." crumb="Pemerintahan" />
      <section className="container-x mt-14">
        <SectionHead eyebrow="Struktur Organisasi" title="Perangkat Kelurahan" desc="Aparatur yang melayani masyarakat Kelurahan Purwokerto Wetan." />
        <OrgChart officials={officials.items} />
      </section>
      <section className="container-x mt-16">
        <SectionHead eyebrow="Kelembagaan" title="Lembaga Kemasyarakatan" desc="Mitra kelurahan dalam pembangunan dan pemberdayaan masyarakat." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inst.items.map((it, i) => {
            const Icon = INST_ICON[i % INST_ICON.length];
            return (
              <div key={it.id} className="h-full flex gap-4 bg-white border border-slate-200 rounded-3xl p-5 hover:border-sky-300 hover:shadow-md transition-[box-shadow,border-color]" data-testid={`institution-${it.id}`}>
                <span className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white grid place-items-center shrink-0 shadow"><Icon className="h-6 w-6" /></span>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 leading-snug">{it.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{it.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="container-x mt-16">
        <SectionHead eyebrow="Wilayah" title="Daftar Rukun Warga" />
        <div className="grid grid-cols-2 gap-3 mb-5 max-w-md">
          <div className="rounded-2xl bg-sky-700 text-white p-4"><div className="text-3xl font-extrabold">{rw.items.length}</div><div className="text-sm text-sky-100">Rukun Warga</div></div>
          <div className="rounded-2xl bg-amber-400 text-slate-900 p-4"><div className="text-3xl font-extrabold">{totalRt}</div><div className="text-sm">Rukun Tetangga</div></div>
        </div>
        <div className="grid gap-4 grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {rw.items.map((r) => (
            <div key={r.id} className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-lg transition-shadow" data-testid={`rw-${r.id}`}>
              <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-sky-100" />
              <div className="relative flex items-center gap-3">
                <span className="h-12 w-12 rounded-2xl bg-sky-700 text-white font-extrabold grid place-items-center text-lg">{(r.name || "").replace(/\D/g, "") || "–"}</span>
                <div><div className="text-[11px] font-bold tracking-widest text-sky-700">RUKUN WARGA</div><div className="font-extrabold text-slate-900 text-lg leading-tight">{r.name}</div></div>
              </div>
              <div className="relative mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-700"><UserRound className="h-4 w-4 text-sky-600 shrink-0" /><span className="truncate">{r.chairman || "-"}</span></div>
                <div className="flex items-center gap-2"><HomeIcon className="h-4 w-4 text-sky-600 shrink-0" /><span className="font-semibold bg-sky-50 text-sky-800 rounded-full px-2.5 py-0.5 text-xs">{r.rt_count || 0} RT</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <CtaBand />
    </div>
  );
}
