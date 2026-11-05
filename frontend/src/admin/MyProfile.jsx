import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, errMsg } from "@/lib/api";
import { useAuth, ROLE_LABEL } from "@/lib/auth";
import FieldInput from "./FieldInput";
import { PasswordForm } from "./ChangePasswordDialog";
import { PageTitle } from "./Dashboard";

const FIELDS = [
  { key: "photo", label: "Foto profil", type: "image", full: true },
  { key: "name", label: "Nama lengkap" },
  { key: "position", label: "Jabatan" },
  { key: "phone", label: "Nomor telepon" },
];

export default function MyProfile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user.name, position: user.position, phone: user.phone, photo: user.photo });
  const save = async () => {
    try {
      const r = await api.put("/auth/me", f);
      setUser({ ...user, ...r.data });
      toast.success("Profil disimpan");
    } catch (e) {
      toast.error(errMsg(e));
    }
  };
  return (
    <div data-testid="my-profile-page">
      <PageTitle title="Profil Saya" desc={`@${user.username} · ${ROLE_LABEL[user.role]}`} />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="font-bold">Data diri</h2>
          <div className="grid sm:grid-cols-2 gap-4">{FIELDS.map((x) => <FieldInput key={x.key} field={x} value={f[x.key]} onChange={(v) => setF({ ...f, [x.key]: v })} />)}</div>
          <Button className="h-11 bg-sky-600 hover:bg-sky-700" onClick={save} data-testid="profile-save-btn">Simpan profil</Button>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-bold mb-4">Ganti kata sandi</h2>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
