import { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, compressImage, errMsg, fileUrl } from "@/lib/api";

export const UploadField = ({ value, onChange, accept = "image/*", testid, isFile }) => {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setBusy(true);
    const fd = new FormData();
    try {
      const up = await compressImage(f);
      if (up.size > 4 * 1024 * 1024) throw new Error("Ukuran berkas maksimal 4 MB");
      fd.append("file", up);
      const r = await api.post("/admin/upload", fd);
      onChange(r.data.url);
      toast.success("Berkas terunggah");
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };
  return (
    <div className="flex items-center gap-3">
      {value ? (
        isFile ? <a href={fileUrl(value)} target="_blank" rel="noreferrer" className="h-20 w-20 rounded-lg border grid place-items-center bg-slate-50"><FileText className="h-8 w-8 text-sky-600" /></a>
          : <img src={fileUrl(value)} alt="" className="h-20 w-20 rounded-lg object-cover border" />
      ) : <div className="h-20 w-20 rounded-lg border-2 border-dashed grid place-items-center text-slate-400"><Upload className="h-6 w-6" /></div>}
      <div className="flex flex-col gap-2">
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={pick} data-testid={`${testid}-file`} />
        <Button type="button" variant="outline" onClick={() => ref.current.click()} disabled={busy} data-testid={`${testid}-upload-btn`}><Upload className="h-4 w-4 mr-2" />{busy ? "Mengunggah…" : value ? "Ganti" : "Unggah"}</Button>
        {value && <Button type="button" variant="ghost" size="sm" className="text-red-600" onClick={() => onChange("")} data-testid={`${testid}-remove-btn`}><X className="h-4 w-4 mr-1" />Hapus</Button>}
      </div>
    </div>
  );
};

// Tampilkan waktu lokal (WIB) di input, bukan UTC, agar jam tidak bergeser setiap kali disunting.
const toLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function FieldInput({ field, value, onChange }) {
  const id = `f-${field.key}`;
  const testid = `field-${field.key}`;
  let input;
  switch (field.type) {
    case "textarea":
      input = <Textarea id={id} rows={field.rows || 5} value={value || ""} onChange={(e) => onChange(e.target.value)} data-testid={testid} />;
      break;
    case "number":
      input = <Input id={id} type="number" className="h-11" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} data-testid={testid} />;
      break;
    case "switch":
      input = <div className="flex items-center gap-3 h-11"><Switch id={id} checked={value !== false} onCheckedChange={onChange} data-testid={testid} /><span className="text-sm">{value !== false ? "Ya" : "Tidak"}</span></div>;
      break;
    case "select":
      input = (
        <Select value={value != null ? String(value) : ""} onValueChange={(v) => onChange(field.numeric ? Number(v) : v)}>
          <SelectTrigger id={id} className="h-11" data-testid={testid}><SelectValue placeholder="Pilih" /></SelectTrigger>
          <SelectContent>{field.options.map((o) => <SelectItem key={o.value ?? o} value={String(o.value ?? o)}>{o.label ?? o}</SelectItem>)}</SelectContent>
        </Select>
      );
      break;
    case "image":
      input = <UploadField value={value} onChange={onChange} testid={testid} />;
      break;
    case "file":
      input = <UploadField value={value} onChange={onChange} testid={testid} accept="application/pdf,image/*" isFile />;
      break;
    case "list":
      input = <Textarea id={id} rows={4} value={(value || []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} onBlur={() => onChange((value || []).map((s) => s.trim()).filter(Boolean))} data-testid={testid} />;
      break;
    case "date":
      input = <Input id={id} type="date" className="h-11" value={value || ""} onChange={(e) => onChange(e.target.value)} data-testid={testid} />;
      break;
    case "datetime":
      input = <Input id={id} type="datetime-local" className="h-11" value={toLocal(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : "")} data-testid={testid} />;
      break;
    default:
      input = <Input id={id} className="h-11" value={value || ""} onChange={(e) => onChange(e.target.value)} data-testid={testid} />;
  }
  return (
    <div className={field.full ? "sm:col-span-2" : ""}>
      <Label htmlFor={id} className="font-semibold">{field.label}{field.required && " *"}</Label>
      <div className="mt-1.5">{input}</div>
      {field.help && <p className="text-xs text-slate-500 mt-1">{field.help}</p>}
    </div>
  );
}
