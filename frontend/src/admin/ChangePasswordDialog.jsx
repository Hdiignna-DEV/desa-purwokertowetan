import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api, errMsg } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const PasswordForm = ({ onDone }) => {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ old_password: "", new_password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (f.new_password !== f.confirm) return toast.error("Konfirmasi kata sandi tidak sama");
    setBusy(true);
    try {
      await api.post("/auth/change-password", { old_password: f.old_password, new_password: f.new_password });
      toast.success("Kata sandi berhasil diganti");
      setUser({ ...user, must_change_password: false });
      setF({ old_password: "", new_password: "", confirm: "" });
      onDone?.();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };
  const field = (k, label) => (
    <div><Label htmlFor={k}>{label}</Label><Input id={k} type="password" className="h-11 mt-1" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} required data-testid={`pw-${k}-input`} /></div>
  );
  return (
    <form onSubmit={submit} className="space-y-4">
      {field("old_password", "Kata sandi saat ini / sementara")}
      {field("new_password", "Kata sandi baru (min. 8 karakter)")}
      {field("confirm", "Ulangi kata sandi baru")}
      <Button type="submit" disabled={busy} className="w-full h-11 bg-sky-600 hover:bg-sky-700" data-testid="pw-submit-btn">Simpan Kata Sandi</Button>
    </form>
  );
};

export default function ChangePasswordDialog({ forced }) {
  return (
    <Dialog open>
      <DialogContent className="max-w-md [&>button]:hidden" onInteractOutside={(e) => forced && e.preventDefault()} data-testid="force-password-dialog">
        <DialogHeader>
          <DialogTitle>Ganti Kata Sandi Sementara</DialogTitle>
          <DialogDescription>Demi keamanan, ganti kata sandi sementara Anda sebelum mulai menggunakan panel.</DialogDescription>
        </DialogHeader>
        <PasswordForm />
      </DialogContent>
    </Dialog>
  );
}
