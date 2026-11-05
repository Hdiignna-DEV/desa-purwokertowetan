import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { SiteProvider } from "@/lib/site";
import { AuthProvider } from "@/lib/auth";
import PublicLayout from "@/components/public/PublicLayout";
import Home from "@/pages/Home";
import Profil from "@/pages/Profil";
import Pemerintahan from "@/pages/Pemerintahan";
import Statistik from "@/pages/Statistik";
import Layanan from "@/pages/Layanan";
import Lacak from "@/pages/Lacak";
import Potensi from "@/pages/Potensi";
import Berita from "@/pages/Berita";
import BeritaDetail from "@/pages/BeritaDetail";
import Galeri from "@/pages/Galeri";
import Partisipasi from "@/pages/Partisipasi";
import Kontak from "@/pages/Kontak";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/admin/AdminLogin";
import AdminLayout from "@/admin/AdminLayout";
import Dashboard from "@/admin/Dashboard";
import CrudPage from "@/admin/CrudPage";
import { RESOURCES } from "@/admin/resources";
import Moderasi from "@/admin/Moderasi";
import InstagramQueue from "@/admin/InstagramQueue";
import TicketsPage from "@/admin/TicketsPage";
import SettingsPage from "@/admin/SettingsPage";
import Accounts from "@/admin/Accounts";
import Activity from "@/admin/Activity";
import MyProfile from "@/admin/MyProfile";
import UmkmPage from "@/admin/UmkmPage";
import AnnouncementsPage from "@/admin/AnnouncementsPage";
import PotensiDaftar from "@/pages/PotensiDaftar";
import HolidaysPage from "@/admin/HolidaysPage";

function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
        <AuthProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="profil" element={<Profil />} />
              <Route path="pemerintahan" element={<Pemerintahan />} />
              <Route path="statistik" element={<Statistik />} />
              <Route path="layanan" element={<Layanan />} />
              <Route path="lacak" element={<Lacak />} />
              <Route path="potensi" element={<Potensi />} />
              <Route path="potensi/daftar" element={<PotensiDaftar />} />
              <Route path="berita" element={<Berita />} />
              <Route path="berita/:slug" element={<BeritaDetail />} />
              <Route path="galeri" element={<Galeri />} />
              <Route path="partisipasi" element={<Partisipasi />} />
              <Route path="kontak" element={<Kontak />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin/login" element={<AdminLogin />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              {Object.entries(RESOURCES).map(([path, cfg]) => (
                <Route key={path} path={path} element={<CrudPage key={path} config={cfg} />} />
              ))}
              <Route path="kiriman-warga" element={<Moderasi />} />
              <Route path="pendaftaran-umkm" element={<UmkmPage />} />
              <Route path="pengumuman" element={<AnnouncementsPage />} />
              <Route path="hari-besar" element={<HolidaysPage />} />
              <Route path="instagram" element={<InstagramQueue />} />
              <Route path="permohonan" element={<TicketsPage kind="requests" />} />
              <Route path="pengaduan" element={<TicketsPage kind="complaints" />} />
              <Route path="konten" element={<SettingsPage scope="konten" />} />
              <Route path="pengaturan" element={<SettingsPage scope="situs" />} />
              <Route path="akun" element={<Accounts />} />
              <Route path="riwayat" element={<Activity />} />
              <Route path="profil-saya" element={<MyProfile />} />
            </Route>
          </Routes>
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </SiteProvider>
    </BrowserRouter>
  );
}

export default App;
