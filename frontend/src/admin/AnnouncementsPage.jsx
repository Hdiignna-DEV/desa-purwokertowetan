import { Link } from "react-router-dom";
import { CalendarHeart, ArrowRight } from "lucide-react";
import CrudPage from "./CrudPage";
import { ANNOUNCEMENTS } from "./resources";

export default function AnnouncementsPage() {
  return (
    <div data-testid="announcements-admin-page">
      <CrudPage config={ANNOUNCEMENTS} />
      <Link to="/admin/hari-besar" className="mt-8 flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-5 hover:border-sky-300 transition-colors" data-testid="goto-holidays-link">
        <span className="h-11 w-11 rounded-xl bg-red-100 text-red-700 grid place-items-center shrink-0"><CalendarHeart className="h-6 w-6" /></span>
        <span className="flex-1"><span className="block font-bold">Ucapan Hari Besar Otomatis</span><span className="block text-sm text-slate-600">Libur nasional, cuti bersama, dan hari besar lokal diatur di menu Hari Besar.</span></span>
        <ArrowRight className="h-5 w-5 text-slate-400" />
      </Link>
    </div>
  );
}
