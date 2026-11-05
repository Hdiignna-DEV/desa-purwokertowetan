import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FieldInput from "./FieldInput";

export const THEMES = [
  { value: "nasional", label: "Biru (umum)" },
  { value: "merah-putih", label: "Merah putih" },
  { value: "islami", label: "Hijau (islami)" },
  { value: "natal", label: "Merah hijau (Natal/Paskah)" },
  { value: "imlek", label: "Merah emas (Imlek)" },
  { value: "festive", label: "Jingga (perayaan)" },
];

const TEXT_FIELDS = [
  { key: "title", label: "Judul ucapan", required: true, full: true },
  { key: "message", label: "Isi ucapan", type: "textarea", rows: 4, full: true },
  { key: "theme", label: "Warna tampilan", type: "select", options: THEMES },
];
const CUSTOM_FIELDS = [
  { key: "name", label: "Nama hari besar", required: true, full: true, help: "contoh: Hari Jadi Kelurahan, Sedekah Bumi" },
  { key: "date", label: "Tanggal", type: "date", required: true },
  { key: "yearly", label: "Berulang setiap tahun", type: "switch" },
  { key: "title", label: "Judul ucapan", full: true, help: "Kosongkan untuk memakai \"Selamat <nama hari besar>\"." },
  { key: "message", label: "Isi ucapan", type: "textarea", rows: 4, full: true },
  { key: "theme", label: "Warna tampilan", type: "select", options: THEMES },
];

// Dialog ubah teks (hari besar otomatis) atau tambah/ubah hari besar buatan admin.
export default function HolidayDialog({ value, custom, onClose, onSave, onReset }) {
  const [form, setForm] = useState(null);
  useEffect(() => {
    setForm(value ? { ...value } : null);
  }, [value]);
  const fields = custom ? CUSTOM_FIELDS : TEXT_FIELDS;
  const missing = form && fields.find((f) => f.required && !form[f.key]);
  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto" data-testid="holiday-dialog">
        <DialogHeader><DialogTitle>{custom ? (value?.cid ? "Ubah Hari Besar Lokal" : "Tambah Hari Besar Lokal") : `Ubah Ucapan: ${value?.name || ""}`}</DialogTitle></DialogHeader>
        {form && (
          <div className="grid sm:grid-cols-2 gap-4">
            {fields.map((f) => <FieldInput key={f.key} field={f} value={form[f.key]} onChange={(v) => setForm((x) => ({ ...x, [f.key]: v }))} />)}
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          {onReset ? <Button variant="ghost" className="text-slate-600" onClick={onReset} data-testid="holiday-reset-btn">Kembalikan teks otomatis</Button> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} data-testid="holiday-cancel-btn">Batal</Button>
            <Button className="bg-sky-600 hover:bg-sky-700" disabled={!!missing} onClick={() => onSave(form)} data-testid="holiday-save-btn">Simpan</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
