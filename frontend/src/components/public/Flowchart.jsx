import { ArrowDown, ArrowRight, Clock, CornerDownLeft, User, Building2, PenLine } from "lucide-react";
import { useSite } from "@/lib/site";

const ACTOR_ICON = { Warga: User, Petugas: Building2, Lurah: PenLine };

const Node = ({ s, i }) => {
  const Icon = ACTOR_ICON[s.actor] || Building2;
  if (s.decision) {
    return (
      <div className="flex flex-col items-center" data-testid={`flow-step-${i}`}>
        <div className="relative h-36 w-36 lg:h-40 lg:w-40 grid place-items-center">
          <div className="absolute inset-4 rotate-45 rounded-lg bg-amber-50 border-2 border-amber-400" />
          <div className="relative text-center px-3">
            <div className="text-[10px] font-bold text-amber-700 tracking-widest">LANGKAH {i + 1}</div>
            <div className="font-bold text-slate-900 text-sm leading-tight">{s.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold text-red-600 mt-1"><CornerDownLeft className="h-3.5 w-3.5" />Tidak: lengkapi berkas</div>
        <div className="text-xs font-semibold text-emerald-700">Ya: lanjut</div>
      </div>
    );
  }
  return (
    <div className="bg-white border-2 border-sky-200 rounded-xl p-4 w-full lg:w-44 shadow-sm hover:border-sky-500 transition-colors" data-testid={`flow-step-${i}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="h-8 w-8 rounded-full bg-sky-600 text-white text-sm font-bold grid place-items-center">{i + 1}</span>
        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500"><Icon className="h-3.5 w-3.5" />{s.actor}</span>
      </div>
      <div className="font-bold text-slate-900 leading-tight">{s.title}</div>
      <p className="text-xs text-slate-600 mt-1">{s.desc}</p>
      <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-800 bg-sky-50 rounded-full px-2 py-0.5"><Clock className="h-3 w-3" />{s.duration}</div>
    </div>
  );
};

export default function Flowchart() {
  const { settings } = useSite();
  const alur = settings.alur || { steps: [] };
  return (
    <div data-testid="service-flowchart">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8 bg-gradient-to-r from-sky-600 to-sky-500 text-white rounded-xl p-5">
        <Clock className="h-9 w-9 shrink-0" />
        <div>
          <div className="text-xs font-bold tracking-widest text-sky-100">ESTIMASI WAKTU LAYANAN SEDERHANA</div>
          <div className="text-2xl font-extrabold" data-testid="flow-estimate">{alur.estimasi}</div>
          <p className="text-sm text-sky-50 mt-1">{alur.note}</p>
        </div>
      </div>
      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-3 lg:gap-2 lg:justify-between">
        {alur.steps.map((s, i) => (
          <div key={i} className="contents">
            <Node s={s} i={i} />
            {i < alur.steps.length - 1 && (
              <>
                <ArrowDown className="lg:hidden h-6 w-6 text-sky-400 shrink-0" />
                <ArrowRight className="hidden lg:block h-6 w-6 text-sky-400 shrink-0 mt-16" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
