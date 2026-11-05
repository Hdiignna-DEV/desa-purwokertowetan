import { useEffect, useState } from "react";
import { Megaphone, CalendarDays, ArrowRight } from "lucide-react";
import { api, fileUrl, formatDate } from "@/lib/api";
import { SectionHead } from "./Common";
import { PopupDialog, activeAnnouncements } from "./AnnouncementPopup";

// Daftar pengumuman resmi yang sedang berlaku di beranda (terbaru di atas).
export default function AnnouncementsSection() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(null);
  useEffect(() => {
    api.get("/public/announcements").then((r) => setItems(activeAnnouncements(r.data.items))).catch(() => {});
  }, []);
  if (!items.length) return null;
  return (
    <section className="container-x mt-16" data-testid="home-announcements">
      <SectionHead eyebrow="Pengumuman" title="Pengumuman Resmi Kelurahan" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <button key={a.id} type="button" onClick={() => setOpen(a)} className="group text-left bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-sky-200 transition-shadow" data-testid={`home-announcement-${a.id}`}>
            {a.image && <img src={fileUrl(a.image)} alt="" className="w-full h-40 object-cover" />}
            <div className="p-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-full px-3 py-1"><Megaphone className="h-3.5 w-3.5" />{a.type || "Pengumuman Resmi"}</span>
              <h3 className="font-bold text-slate-900 mt-3 line-clamp-2">{a.title}</h3>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(a.start_at || a.created_at)}{a.end_at ? ` s.d. ${formatDate(a.end_at)}` : ""}</div>
              <p className="text-sm text-slate-600 mt-2 line-clamp-3 whitespace-pre-line">{a.content}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700 mt-3 group-hover:gap-2 transition-[gap]">Baca selengkapnya <ArrowRight className="h-4 w-4" /></span>
            </div>
          </button>
        ))}
      </div>
      <PopupDialog items={open ? [open] : []} open={!!open} onClose={() => setOpen(null)} showHide={false} />
    </section>
  );
}
