import { useState } from "react";
import { CalendarHeart, ArrowRight } from "lucide-react";
import { useSite } from "@/lib/site";
import { activeHolidays, useHolidays } from "@/lib/holidays";
import { PopupDialog, THEME } from "./AnnouncementPopup";

// Banner tipis di atas beranda selama masa tampil hari besar (hari-H s.d. H+2).
export default function HolidayBanner() {
  const { settings } = useSite();
  const auto = settings.auto_holidays;
  const { list, meta } = useHolidays(auto);
  const [open, setOpen] = useState(false);
  if (auto?.enabled === false || meta.status === "loading") return null;
  const items = activeHolidays(list);
  if (!items.length) return null;
  const theme = items[0].theme === "merah-putih" ? "bg-red-600 text-white" : THEME[items[0].theme] || THEME.nasional;
  return (
    <section className="container-x pt-4" data-testid="holiday-banner">
      <button type="button" onClick={() => setOpen(true)} className={`group w-full flex items-center gap-3 rounded-2xl px-4 sm:px-5 py-3 text-left shadow-sm ${theme}`} data-testid="holiday-banner-btn">
        <span className="h-9 w-9 rounded-xl bg-white/20 grid place-items-center shrink-0"><CalendarHeart className="h-5 w-5" /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] sm:text-[11px] font-bold tracking-[0.18em] opacity-85">KELUARGA BESAR {settings.site_name?.toUpperCase()}</span>
          <span className="block font-bold text-sm sm:text-base truncate" data-testid="holiday-banner-text">{items.map((h) => h.title).join(" · ")}</span>
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold bg-white/15 rounded-full px-3 py-1.5 group-hover:bg-white/25 transition-colors">Lihat ucapan <ArrowRight className="h-4 w-4" /></span>
      </button>
      <PopupDialog items={items} open={open} onClose={() => setOpen(false)} showHide={false} />
    </section>
  );
}
