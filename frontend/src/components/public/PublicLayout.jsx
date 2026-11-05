import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { WhatsAppIcon } from "./BrandIcons";
import { api, waLink } from "@/lib/api";
import { useSite } from "@/lib/site";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import AnnouncementPopup from "./AnnouncementPopup";

export default function PublicLayout() {
  const { pathname } = useLocation();
  const { settings } = useSite();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useEffect(() => {
    if (!sessionStorage.getItem("pw_visit")) {
      sessionStorage.setItem("pw_visit", "1");
      api.post("/public/visit").catch(() => {});
    }
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <AnnouncementPopup />
      {settings.whatsapp?.[0] && (
        <a
          href={waLink(settings.whatsapp[0])}
          target="_blank"
          rel="noreferrer"
          data-testid="floating-whatsapp-btn"
          aria-label="Hubungi via WhatsApp"
          className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-[#25D366] text-white grid place-items-center shadow-lg hover:bg-[#1ebe5a] hover:scale-105 transition-transform"
        >
          <WhatsAppIcon className="h-7 w-7" />
        </a>
      )}
    </div>
  );
}
