import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { useSite } from "@/lib/site";
import { errMsg, fileUrl } from "@/lib/api";

export default function AdminLogin() {
  const { login, user, ready } = useAuth();
  const { settings } = useSite();
  const nav = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (ready && user) return <Navigate to="/admin" replace />;
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(form.username, form.password);
      nav("/admin");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen relative grid place-items-center p-4" data-testid="admin-login-page">
      <img src={fileUrl(settings.login_image || settings.hero_image)} alt="Kantor Kelurahan Purwokerto Wetan" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-sky-950/80 via-sky-900/60 to-sky-700/40" />
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8 reveal">
        <div className="flex items-center gap-3 mb-6">
          <img src={settings.logo} alt="Logo" className="h-14 w-14 object-contain" />
          <div>
            <div className="font-extrabold text-slate-900 leading-tight">{settings.site_name}</div>
            <div className="text-sm text-slate-500">Panel Admin Website</div>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-1">Masuk</h1>
        <p className="text-sm text-slate-600 mb-6">Khusus petugas kelurahan yang memiliki akun.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="u">Nama pengguna atau email</Label>
            <div className="relative mt-1.5"><User className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" /><Input id="u" className="h-11 pl-9" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required data-testid="login-username-input" /></div>
          </div>
          <div>
            <Label htmlFor="p">Kata sandi</Label>
            <div className="relative mt-1.5">
              <Lock className="h-4 w-4 absolute left-3 top-3.5 text-slate-400" />
              <Input id="p" type={show ? "text" : "password"} className="h-11 pl-9 pr-10" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required data-testid="login-password-input" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-3 text-slate-500" aria-label="Tampilkan kata sandi" data-testid="login-toggle-password">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
            </div>
          </div>
          {error && <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg p-3" data-testid="login-error">{error}</div>}
          <Button type="submit" disabled={busy} className="w-full h-12 text-base bg-sky-600 hover:bg-sky-700" data-testid="login-submit-btn">{busy ? "Memeriksa…" : "Masuk ke Panel Admin"}</Button>
        </form>
        <a href="/" className="block text-center text-sm text-sky-700 mt-5 hover:underline" data-testid="login-back-home">← Kembali ke website</a>
      </div>
    </div>
  );
}
