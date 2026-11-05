import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSite } from "@/lib/site";
import { WhatsAppIcon, InstagramIcon } from "./BrandIcons";

export const NAV = [
  { to: "/", label: "Beranda" },
  { to: "/profil", label: "Profil" },
  { to: "/pemerintahan", label: "Pemerintahan" },
  { to: "/statistik", label: "Data & Statistik" },
  { to: "/layanan", label: "Layanan" },
  { to: "/potensi", label: "Potensi & UMKM" },
  { to: "/berita", label: "Berita" },
  { to: "/galeri", label: "Galeri" },
  { to: "/partisipasi", label: "Partisipasi Warga" },
  { to: "/kontak", label: "Kontak" },
];

const linkCls = ({ isActive }) =>
  `px-2.5 py-2 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${isActive ? "text-sky-700 bg-sky-50" : "text-slate-700 hover:text-sky-700 hover:bg-sky-50"}`;

export const Brand = ({ light, compact }) => {
  const { settings } = useSite();
  return (
    <Link to="/" className="flex items-center gap-3 min-w-0" data-testid="brand-home-link">
      <img src={settings.logo} alt="Logo Kabupaten Banyumas" className="h-11 w-11 object-contain shrink-0" />
      <div className={`min-w-0 ${compact ? "xl:hidden 2xl:block" : ""}`}>
        <div className={`font-extrabold leading-tight truncate ${light ? "text-white" : "text-slate-900"}`}>{settings.site_name}</div>
        <div className={`text-xs truncate ${light ? "text-sky-100" : "text-slate-500"}`}>Kec. Purwokerto Timur · Kab. Banyumas</div>
      </div>
    </Link>
  );
};

export default function SiteHeader() {
  const { settings } = useSite();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30">
      <div className="bg-sky-800 text-sky-50 text-xs hidden md:block">
        <div className="container-x flex justify-between py-2">
          <span>Situs Resmi {settings.site_name} · Pemerintah Kabupaten Banyumas</span>
          <span className="flex gap-4">
            <span className="flex items-center gap-1.5"><WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" /> {settings.whatsapp?.[0]}</span>
            <span className="flex items-center gap-1.5"><InstagramIcon className="h-3.5 w-3.5 text-pink-300" /> @{settings.instagram}</span>
          </span>
        </div>
      </div>
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto flex items-center justify-between h-16 lg:h-[72px] gap-4">
          <Brand compact />
          <nav className="hidden xl:flex items-center gap-0.5" data-testid="desktop-nav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.to === "/"} className={linkCls} data-testid={`nav-${n.to.replace("/", "") || "beranda"}`}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/lacak" data-testid="header-track-btn" className="hidden sm:flex items-center gap-1.5 whitespace-nowrap rounded-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2 transition-colors">
              <Search className="h-4 w-4" /> Lacak Layanan
            </Link>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button className="xl:hidden h-11 w-11 grid place-items-center rounded-md border border-slate-200" data-testid="mobile-menu-btn" aria-label="Buka menu">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm">
                <SheetTitle className="text-left mb-4">Menu</SheetTitle>
                <nav className="flex flex-col gap-1" data-testid="mobile-nav">
                  {[...NAV, { to: "/lacak", label: "Lacak Status Layanan" }].map((n) => (
                    <NavLink key={n.to} to={n.to} end={n.to === "/"} onClick={() => setOpen(false)} className={({ isActive }) => `${linkCls({ isActive })} text-base py-3`} data-testid={`mobile-nav-${n.to.replace("/", "") || "beranda"}`}>
                      {n.label}
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
