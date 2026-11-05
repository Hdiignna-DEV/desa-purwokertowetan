import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { useSite } from "@/lib/site";
import { waLink, isValidUrl } from "@/lib/api";
import { NAV, Brand } from "./SiteHeader";
import { BrandBadge } from "./BrandIcons";

export default function SiteFooter() {
  const { settings, links } = useSite();
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20" data-testid="site-footer">
      <div className="h-1.5 bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-500" />
      <div className="container-x py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Brand light />
          <p className="text-sm leading-relaxed text-slate-400">{settings.footer_text}</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 text-sm tracking-widest">MENU</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {NAV.map((n) => (
              <li key={n.to}><Link to={n.to} className="hover:text-sky-300">{n.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-4 text-sm tracking-widest">LAYANAN DIGITAL</h4>
          <ul className="space-y-2 text-sm">
            {links.filter((l) => isValidUrl(l.url) || isValidUrl(l.app_url)).map((l) => (
              <li key={l.id}><a href={l.url || l.app_url} target="_blank" rel="noreferrer" className="hover:text-sky-300">{l.title}</a></li>
            ))}
            {isValidUrl(settings.survey?.url) && <li><a href={settings.survey.url} target="_blank" rel="noreferrer" className="hover:text-sky-300">Survei Kepuasan Masyarakat</a></li>}
            <li><Link to="/lacak" className="hover:text-sky-300">Lacak Status Layanan</Link></li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <h4 className="text-white font-bold mb-4 text-sm tracking-widest">KONTAK</h4>
          <p className="flex items-start gap-3"><BrandBadge kind="maps" size="sm" /><span>{settings.address}</span></p>
          {settings.whatsapp?.map((w) => (
            <a key={w} href={waLink(w)} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-sky-300"><BrandBadge kind="whatsapp" size="sm" />WhatsApp {w}</a>
          ))}
          <a href={`https://www.instagram.com/${settings.instagram}/`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-sky-300 break-all"><BrandBadge kind="instagram" size="sm" />@{settings.instagram}</a>
          {settings.hours?.[0] && <p className="flex items-center gap-3"><span className="h-7 w-7 rounded-lg bg-sky-600 text-white grid place-items-center shrink-0"><Clock className="h-4 w-4" /></span>{settings.hours[0].day}, {settings.hours[0].time}</p>}
        </div>
      </div>
      <div className="border-t border-slate-800">
        <div className="container-x py-5 flex flex-col sm:flex-row gap-2 justify-between text-xs text-slate-500">
          <span>© {new Date().getFullYear()} Pemerintah {settings.site_name}. Seluruh hak cipta dilindungi.</span>
          <Link to="/admin/login" className="hover:text-sky-300" data-testid="footer-admin-login-link">Login Admin</Link>
        </div>
      </div>
    </footer>
  );
}
