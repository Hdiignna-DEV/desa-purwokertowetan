import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/public/Common";
import { RegisterForm, STEPS } from "./Potensi";

export default function PotensiDaftar() {
  return (
    <div data-testid="potensi-daftar-page">
      <PageHeader title="Portal Pendaftaran Potensi & UMKM" desc="Daftarkan usaha atau potensi wilayah Anda agar dipromosikan melalui website resmi kelurahan." crumb="Potensi & UMKM / Pendaftaran" />
      <section className="container-x mt-10">
        <Link to="/potensi" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:underline mb-6" data-testid="umkm-back-link"><ArrowLeft className="h-4 w-4" />Kembali ke katalog Potensi & UMKM</Link>
        <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-8 shadow-sm"><RegisterForm /></div>
          <aside className="bg-sky-50 border border-sky-100 rounded-3xl p-6 lg:sticky lg:top-28" data-testid="umkm-steps">
            <h3 className="font-bold text-lg mb-4">Alur pendaftaran</h3>
            <ol className="space-y-4">
              {STEPS.map(({ icon: Icon, t, d }, i) => (
                <li key={t} className="flex gap-3">
                  <span className="h-10 w-10 rounded-2xl bg-sky-600 text-white grid place-items-center shrink-0"><Icon className="h-5 w-5" /></span>
                  <div><div className="font-semibold text-slate-900">{i + 1}. {t}</div><div className="text-sm text-slate-600">{d}</div></div>
                </li>
              ))}
            </ol>
            <Link to="/lacak" className="inline-block mt-5 text-sm font-semibold text-sky-700 hover:underline" data-testid="umkm-track-link">Sudah mendaftar? Lacak status →</Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
