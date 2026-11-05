import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Newspaper, Inbox, Instagram, FileCheck, MessageSquareWarning, Images, FileText, Users, ClipboardList,
  Store, BarChart3, FolderDown, Link2, Landmark, MapPinned, Settings, UserCog, History, UserCircle, LogOut, Menu, ExternalLink, BadgeCheck, Megaphone, CalendarHeart,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import { useSite } from "@/lib/site";
import { api, fileUrl, DATA_MODE } from "@/lib/api";
import ChangePasswordDialog from "./ChangePasswordDialog";

const GROUPS = [
  { title: "Utama", items: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, role: "kontributor", end: true },
    { to: "/admin/berita", label: "Berita", icon: Newspaper, role: "kontributor" },
    { to: "/admin/kiriman-warga", label: "Kiriman Warga (ACC)", icon: Inbox, role: "editor", badge: "submissions_pending" },
    { to: "/admin/pendaftaran-umkm", label: "Pendaftaran UMKM", icon: BadgeCheck, role: "editor", badge: "umkm_pending" },
    { to: "/admin/instagram", label: "Antrean Instagram", icon: Instagram, role: "editor", badge: "instagram_waiting" },
  ] },
  { title: "Pelayanan", items: [
    { to: "/admin/permohonan", label: "Permohonan Layanan", icon: FileCheck, role: "editor", badge: "requests_open" },
    { to: "/admin/pengaduan", label: "Pengaduan Warga", icon: MessageSquareWarning, role: "editor", badge: "complaints_open" },
    { to: "/admin/layanan", label: "Jenis Layanan", icon: ClipboardList, role: "editor" },
  ] },
  { title: "Konten Website", items: [
    { to: "/admin/konten", label: "Konten Halaman", icon: FileText, role: "editor" },
    { to: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone, role: "editor" },
    { to: "/admin/hari-besar", label: "Hari Besar", icon: CalendarHeart, role: "editor" },
    { to: "/admin/perangkat", label: "Perangkat Kelurahan", icon: Users, role: "editor" },
    { to: "/admin/galeri", label: "Galeri", icon: Images, role: "editor" },
    { to: "/admin/potensi", label: "Potensi & UMKM", icon: Store, role: "editor" },
    { to: "/admin/statistik", label: "Data Statistik", icon: BarChart3, role: "editor" },
    { to: "/admin/dokumen", label: "Dokumen Unduhan", icon: FolderDown, role: "editor" },
    { to: "/admin/tautan", label: "Tautan Layanan Digital", icon: Link2, role: "editor" },
    { to: "/admin/lembaga", label: "Lembaga", icon: Landmark, role: "editor" },
    { to: "/admin/rw", label: "Daftar RW", icon: MapPinned, role: "editor" },
  ] },
  { title: "Sistem", items: [
    { to: "/admin/pengaturan", label: "Pengaturan Situs", icon: Settings, role: "admin" },
    { to: "/admin/akun", label: "Akun Admin", icon: UserCog, role: "admin" },
    { to: "/admin/riwayat", label: "Riwayat Aktivitas", icon: History, role: "kontributor" },
    { to: "/admin/profil-saya", label: "Profil Saya", icon: UserCircle, role: "kontributor" },
  ] },
];

const allowed = (pathname, can) => {
  const item = GROUPS.flatMap((g) => g.items).find((i) => i.to !== "/admin" && pathname.startsWith(i.to));
  return !item || can(item.role);
};

const SideNav = ({ onNavigate, counts }) => {
  const { can } = useAuth();
  return (
    <nav className="space-y-6">
      {GROUPS.map((g) => {
        const items = g.items.filter((i) => can(i.role));
        if (!items.length) return null;
        return (
          <div key={g.title}>
            <div className="px-3 text-[11px] font-bold tracking-widest text-sky-300/80 mb-2">{g.title.toUpperCase()}</div>
            {items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} onClick={onNavigate} data-testid={`admin-nav-${to.split("/").pop() || "dashboard"}`}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? "bg-white text-sky-800" : "text-sky-50 hover:bg-white/10"}`}>
                <Icon className="h-[18px] w-[18px] shrink-0" /><span className="flex-1">{label}</span>
                {badge && counts[badge] > 0 && <span className="bg-amber-400 text-slate-900 text-xs font-bold rounded-full px-2">{counts[badge]}</span>}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
};

const Sidebar = ({ onNavigate, counts }) => {
  const { settings } = useSite();
  return (
    <div className="h-full flex flex-col bg-sky-800 text-white">
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <img src={fileUrl(settings.logo)} alt="" className="h-10 w-10 object-contain" />
        <div className="leading-tight"><div className="font-bold text-sm">Panel Admin</div><div className="text-xs text-sky-200">{settings.site_name}</div></div>
      </div>
      <div className="flex-1 overflow-y-auto p-3"><SideNav onNavigate={onNavigate} counts={counts} /></div>
    </div>
  );
};

export default function AdminLayout() {
  const { user, ready, logout, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({});
  const { pathname } = useLocation();
  useEffect(() => {
    if (user) api.get("/admin/dashboard").then((r) => setCounts(r.data)).catch(() => {});
  }, [user, pathname]);
  if (!ready) return <div className="min-h-screen grid place-items-center">Memuat…</div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[264px_1fr]" data-testid="admin-layout">
      <aside className="hidden lg:block sticky top-0 h-screen"><Sidebar counts={counts} /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-72 border-0"><SheetTitle className="sr-only">Menu admin</SheetTitle><Sidebar counts={counts} onNavigate={() => setOpen(false)} /></SheetContent>
      </Sheet>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 h-16 px-4 md:px-8 flex items-center justify-between gap-3">
          <button className="lg:hidden h-11 w-11 grid place-items-center rounded-md border" onClick={() => setOpen(true)} data-testid="admin-mobile-menu-btn" aria-label="Menu"><Menu className="h-5 w-5" /></button>
          <a href="/" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-sky-700" data-testid="admin-view-site-link"><ExternalLink className="h-4 w-4" />Lihat website</a>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-right leading-tight"><div className="text-sm font-bold" data-testid="admin-user-name">{user.name}</div><div className="text-xs text-slate-500">{ROLE_LABEL[user.role]}</div></div>
            <button onClick={logout} className="h-11 px-3 rounded-md border flex items-center gap-2 text-sm font-semibold hover:bg-red-50 hover:text-red-700" data-testid="admin-logout-btn"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Keluar</span></button>
          </div>
        </header>
        <main className="p-4 md:p-8 max-w-6xl">
          {DATA_MODE === "local" && <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3" data-testid="local-mode-banner">Mode penyimpanan lokal: data tersimpan di browser ini saja. Gunakan “Unduh cadangan data” secara berkala.</div>}
          {allowed(pathname, can) ? <Outlet context={{ counts }} /> : <div className="bg-white border rounded-xl p-10 text-center" data-testid="admin-no-access"><h1 className="text-xl font-bold">Tidak ada akses</h1><p className="text-slate-600 mt-2">Peran akun Anda tidak dapat membuka halaman ini.</p></div>}</main>
      </div>
      {user.must_change_password && <ChangePasswordDialog forced />}
    </div>
  );
}
