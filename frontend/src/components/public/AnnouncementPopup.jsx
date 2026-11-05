import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Megaphone, CalendarDays, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useSite } from "@/lib/site";
import { api, fileUrl, formatDate, isValidUrl } from "@/lib/api";
import { activeHolidays, todayWIB, useHolidays } from "@/lib/holidays";

export const THEME = {
  "merah-putih": "bg-white text-white border border-red-100",
  islami: "bg-gradient-to-br from-emerald-600 to-emerald-900 text-white",
  natal: "bg-gradient-to-br from-red-700 to-emerald-800 text-white",
  imlek: "bg-gradient-to-br from-red-600 to-red-900 text-amber-100",
  festive: "bg-gradient-to-br from-amber-400 to-orange-600 text-white",
  nasional: "bg-gradient-to-br from-sky-600 to-sky-900 text-white",
};

const SEEN = "pw_popup_hidden";
const hiddenToday = () => {
  try {
    const v = JSON.parse(localStorage.getItem(SEEN));
    return v?.day === todayWIB() ? v.ids : [];
  } catch {
    return [];
  }
};

const sortKey = (a) => a.start_at || a.created_at || "";
export const activeAnnouncements = (items, now = new Date().toISOString()) =>
  items
    .filter((a) => a.visible !== false && (!a.start_at || a.start_at <= now) && (!a.end_at || a.end_at >= now))
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)));

export const dateRange = (h) => (h.end && h.end !== h.date ? `${formatDate(h.date)} – ${formatDate(h.end)}` : formatDate(h.date));

const HolidaySlide = ({ h }) => {
  const { settings } = useSite();
  const mp = h.theme === "merah-putih";
  const head = h.kind === "cuti" ? `PEMBERITAHUAN ${settings.site_name?.toUpperCase()}` : `KELUARGA BESAR ${settings.site_name?.toUpperCase()} MENGUCAPKAN`;
  return (
    <div className={`rounded-3xl overflow-hidden ${THEME[h.theme] || THEME.nasional}`} data-testid="popup-holiday">
      <div className={`p-7 sm:p-9 text-center ${mp ? "pb-6 bg-red-600 text-white" : ""}`}>
        <img src={fileUrl(settings.logo)} alt="" className="h-14 w-14 mx-auto object-contain bg-white rounded-2xl p-1.5" />
        <div className="text-[11px] font-bold tracking-[0.2em] mt-4 opacity-90">{head}</div>
        <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 leading-tight" data-testid="popup-holiday-title">{h.title}</h2>
      </div>
      <div className={`px-7 sm:px-9 pb-8 text-center ${mp ? "text-slate-800 pt-6" : ""}`}>
        <p className={`text-sm sm:text-base whitespace-pre-line ${mp ? "" : "opacity-90"}`} data-testid="popup-holiday-message">{h.message}</p>
        <div className={`text-xs mt-4 ${mp ? "text-slate-500" : "opacity-75"}`}>{h.name} · {dateRange(h)}</div>
      </div>
    </div>
  );
};

const AnnouncementSlide = ({ a }) => (
  <div data-testid="popup-announcement">
    {a.image && <img src={fileUrl(a.image)} alt={a.title} className="w-full max-h-72 object-cover rounded-3xl" />}
    <div className="pt-5">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-sky-100 text-sky-800 rounded-full px-3 py-1"><Megaphone className="h-3.5 w-3.5" />{a.type || "Pengumuman Resmi"}</span>
      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3" data-testid="popup-announcement-title">{a.title}</h2>
      {(a.start_at || a.end_at) && <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Berlaku {a.start_at ? formatDate(a.start_at) : ""}{a.end_at ? ` s.d. ${formatDate(a.end_at)}` : ""}</div>}
      <p className="text-sm text-slate-700 mt-3 whitespace-pre-line max-h-60 overflow-y-auto">{a.content}</p>
      {isValidUrl(a.link) && <a href={a.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-sky-700 hover:underline" data-testid="popup-announcement-link">Selengkapnya <ExternalLink className="h-3.5 w-3.5" /></a>}
    </div>
  </div>
);

export function PopupDialog({ items, open, onClose, showHide = true }) {
  const [i, setI] = useState(0);
  const [hide, setHide] = useState(false);
  useEffect(() => {
    setI(0);
  }, [items]);
  if (!items.length) return null;
  const it = items[Math.min(i, items.length - 1)];
  const close = () => onClose(hide);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-lg rounded-3xl p-4 sm:p-5 max-h-[92vh] overflow-y-auto" data-testid="announcement-popup">
        <DialogTitle className="sr-only">{it.title}</DialogTitle>
        <DialogDescription className="sr-only">Pengumuman resmi kelurahan</DialogDescription>
        {it.auto ? <HolidaySlide h={it} /> : <AnnouncementSlide a={it} />}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          {showHide ? (
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer" data-testid="popup-hide-today"><Checkbox checked={hide} onCheckedChange={(v) => setHide(!!v)} />Jangan tampilkan lagi hari ini</label>
          ) : <span />}
          <div className="flex items-center gap-2">
            {items.length > 1 && <>
              <Button variant="outline" size="icon" className="rounded-full" onClick={() => setI((i - 1 + items.length) % items.length)} data-testid="popup-prev" aria-label="Sebelumnya"><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-xs text-slate-500 tabular-nums" data-testid="popup-counter">{i + 1}/{items.length}</span>
              <Button variant="outline" size="icon" className="rounded-full" onClick={() => setI((i + 1) % items.length)} data-testid="popup-next" aria-label="Berikutnya"><ChevronRight className="h-4 w-4" /></Button>
            </>}
            <Button className="rounded-full bg-sky-600 hover:bg-sky-700" onClick={close} data-testid="popup-close-btn">Tutup</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Popup sekali per kunjungan: pengumuman resmi aktif + ucapan hari besar (hari-H s.d. H+2, WIB).
export default function AnnouncementPopup() {
  const { settings } = useSite();
  const auto = settings.auto_holidays;
  const { list, meta } = useHolidays(auto);
  const [ann, setAnn] = useState(null);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    api.get("/public/announcements").then((r) => setAnn(r.data.items)).catch(() => setAnn([]));
  }, []);
  useEffect(() => {
    if (ann === null || meta.status === "loading" || sessionStorage.getItem("pw_popup_shown")) return;
    const holidays = auto?.enabled === false ? [] : activeHolidays(list);
    const hidden = hiddenToday();
    const next = [...holidays, ...activeAnnouncements(ann).filter((a) => a.popup !== false)].filter((x) => !hidden.includes(x.id));
    setItems(next);
    setOpen(next.length > 0);
  }, [ann, list, meta.status, auto]);
  const onClose = (hide) => {
    sessionStorage.setItem("pw_popup_shown", "1");
    if (hide) localStorage.setItem(SEEN, JSON.stringify({ day: todayWIB(), ids: [...hiddenToday(), ...items.map((x) => x.id)] }));
    setOpen(false);
  };
  return <PopupDialog items={items} open={open} onClose={onClose} />;
}
