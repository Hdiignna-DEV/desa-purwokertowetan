import { useState } from "react";
import { CalendarHeart, Eye, Pencil, Plus, RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { api, errMsg, formatDate } from "@/lib/api";
import { useSite } from "@/lib/site";
import { activeHolidays, showUntil, todayWIB, useHolidays } from "@/lib/holidays";
import { PopupDialog, dateRange } from "@/components/public/AnnouncementPopup";
import { PageTitle } from "./Dashboard";
import ConfirmButton from "./ConfirmButton";
import HolidayDialog from "./HolidayDialog";

const KIND = {
  libur: ["Libur Nasional", "bg-red-100 text-red-800"],
  cuti: ["Cuti Bersama", "bg-amber-100 text-amber-800"],
  peringatan: ["Hari Peringatan", "bg-sky-100 text-sky-800"],
  custom: ["Buatan Admin", "bg-violet-100 text-violet-800"],
};
const STATUS = {
  online: "Data resmi terbaru berhasil diambil",
  cache: "Memakai data resmi tersimpan",
  "offline-cache": "Layanan data sedang tidak dapat diakses — memakai data tersimpan terakhir",
  offline: "Layanan data tidak dapat diakses — memakai perkiraan kalender",
  loading: "Mengambil data…",
};

const SourceCard = ({ meta, onRefresh, auto, onToggle }) => {
  const [busy, setBusy] = useState(false);
  const ok = meta.entries?.length > 0;
  const refresh = async () => {
    setBusy(true);
    await onRefresh(true);
    setBusy(false);
  };
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center gap-4" data-testid="holiday-source-card">
      <span className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{ok ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}</span>
      <div className="flex-1 min-w-[220px]">
        <div className="font-semibold" data-testid="holiday-source-status">{STATUS[meta.status] || STATUS.cache}</div>
        <div className="text-xs text-slate-500">{meta.source || "Kalender libur nasional & cuti bersama"}{meta.fetched_at ? ` · diperbarui ${formatDate(meta.fetched_at, true)}` : ""}</div>
      </div>
      <Button variant="outline" onClick={refresh} disabled={busy} data-testid="holiday-refresh-btn"><RefreshCw className={`h-4 w-4 mr-2 ${busy ? "animate-spin" : ""}`} />Perbarui data</Button>
      <label className="flex items-center gap-2 font-semibold text-sm"><Switch checked={auto.enabled !== false} onCheckedChange={onToggle} data-testid="auto-holidays-toggle" />Ucapan otomatis aktif</label>
    </section>
  );
};

const Row = ({ h, today, onPreview, onEdit, onToggle, onDelete, disabledAll }) => {
  const [label, cls] = KIND[h.kind] || KIND.peringatan;
  const live = !h.hidden && h.date <= today && today <= showUntil(h);
  return (
    <div className={`flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 py-3 ${h.hidden ? "opacity-60" : ""}`} data-testid={`holiday-row-${h.id}`}>
      <div className="w-40 shrink-0 text-sm font-semibold text-slate-700">{dateRange(h)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{h.name}</span>
          <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${cls}`}>{label}</span>
          {h.source === "perkiraan" && <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-slate-100 text-slate-600">Perkiraan</span>}
          {h.edited && <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-slate-100 text-slate-600">Teks diubah</span>}
          {live && <span className="text-[11px] font-bold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-800" data-testid={`holiday-live-${h.id}`}>Sedang tampil</span>}
        </div>
        <div className="text-xs text-slate-500 truncate">{h.title} · tampil s.d. {formatDate(showUntil(h))}</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onPreview(h)} data-testid={`holiday-preview-${h.id}`}><Eye className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Pratinjau</span></Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(h)} data-testid={`holiday-edit-${h.id}`}><Pencil className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Ubah</span></Button>
        {h.kind === "custom" && <ConfirmButton onConfirm={() => onDelete(h)} testid={`holiday-delete-${h.id}`} title="Hapus hari besar ini?" desc="Hari besar buatan admin ini akan dihapus."><Trash2 className="h-4 w-4" /></ConfirmButton>}
        <Switch checked={!h.hidden} disabled={disabledAll} onCheckedChange={(v) => onToggle(h, v)} data-testid={`holiday-switch-${h.id}`} aria-label="Tampilkan" title="Tampilkan/sembunyikan hari besar ini (berlaku setiap tahun)" />
      </div>
    </div>
  );
};

export default function HolidaysPage() {
  const { settings, reload } = useSite();
  const auto = settings.auto_holidays || { enabled: true, disabled: [] };
  const today = todayWIB();
  const year = Number(today.slice(0, 4));
  const [shownYear, setShownYear] = useState(year);
  const { list, meta, refresh } = useHolidays(settings.auto_holidays, [year - 1, year, year + 1]);
  const [preview, setPreview] = useState(null);
  const [editing, setEditing] = useState(null);
  const save = async (next, msg = "Pengaturan hari besar disimpan") => {
    try {
      await api.put("/admin/settings", { auto_holidays: next });
      await reload();
      toast.success(msg);
      return true;
    } catch (e) {
      toast.error(errMsg(e));
      return false;
    }
  };
  const toggleKey = (h, on) => save({ ...auto, disabled: on ? (auto.disabled || []).filter((k) => k !== h.key) : [...(auto.disabled || []), h.key] }, on ? "Hari besar ditampilkan" : "Hari besar disembunyikan");
  const custom = auto.custom || [];
  const onSave = async (form) => {
    let next;
    if (editing.isCustom) {
      const item = { cid: form.cid || Date.now().toString(36), name: form.name, date: form.date, yearly: form.yearly !== false, title: form.title || "", message: form.message || "", theme: form.theme || "nasional" };
      next = { ...auto, custom: form.cid ? custom.map((c) => (c.cid === form.cid ? item : c)) : [...custom, item] };
    } else {
      next = { ...auto, overrides: { ...(auto.overrides || {}), [editing.id]: { title: form.title, message: form.message, theme: form.theme } } };
    }
    if (await save(next)) setEditing(null);
  };
  const onReset = async () => {
    const overrides = { ...(auto.overrides || {}) };
    delete overrides[editing.id];
    if (await save({ ...auto, overrides }, "Teks ucapan dikembalikan otomatis")) setEditing(null);
  };
  const openEdit = (h) => {
    if (h.kind !== "custom") return setEditing({ ...h, isCustom: false });
    const c = custom.find((x) => x.cid === h.cid);
    setEditing({ ...c, isCustom: true });
  };
  const rows = list.filter((h) => h.date.startsWith(String(shownYear)));
  const live = activeHolidays(list, today);
  return (
    <div data-testid="holidays-admin-page">
      <PageTitle title="Hari Besar" desc="Ucapan hari besar muncul otomatis sebagai popup dan banner beranda pada hari-H sampai 2 hari sesudahnya (WIB). Daftar libur nasional & cuti bersama diperbarui otomatis dari kalender resmi." action={<Button className="h-12 px-5 text-base bg-sky-600 hover:bg-sky-700" onClick={() => setEditing({ isCustom: true, yearly: true, theme: "nasional" })} data-testid="holiday-add-btn"><Plus className="h-5 w-5 mr-2" />Tambah Hari Besar</Button>} />
      <SourceCard meta={meta} onRefresh={refresh} auto={auto} onToggle={(v) => save({ ...auto, enabled: v })} />
      <div className="mt-4 bg-sky-50 border border-sky-100 rounded-2xl px-5 py-3 text-sm flex items-center gap-2" data-testid="holiday-live-summary">
        <CalendarHeart className="h-4 w-4 text-sky-700 shrink-0" />
        {auto.enabled === false ? "Ucapan otomatis sedang dimatikan." : live.length ? <span>Sedang tampil hari ini: <b>{live.map((h) => h.title).join(", ")}</b></span> : "Tidak ada ucapan hari besar yang tampil hari ini."}
        <span className="ml-auto text-xs text-slate-500 hidden md:inline">Sakelar di tiap baris menyembunyikan hari besar itu untuk setiap tahun.</span>
      </div>
      <div className="flex gap-2 mt-6">
        {[year, year + 1].map((y) => <Button key={y} variant={shownYear === y ? "default" : "outline"} className={shownYear === y ? "bg-sky-600 hover:bg-sky-700" : ""} onClick={() => setShownYear(y)} data-testid={`holiday-year-${y}`}>{y}</Button>)}
      </div>
      <div className="mt-3 divide-y bg-white border border-slate-200 rounded-2xl" data-testid="holiday-list">
        {rows.map((h) => <Row key={h.id} h={h} today={today} onPreview={setPreview} onEdit={openEdit} onToggle={toggleKey} disabledAll={auto.enabled === false} onDelete={(x) => save({ ...auto, custom: custom.filter((c) => c.cid !== x.cid) }, "Hari besar dihapus")} />)}
      </div>
      <PopupDialog items={preview ? [preview] : []} open={!!preview} onClose={() => setPreview(null)} showHide={false} />
      <HolidayDialog value={editing} custom={editing?.isCustom} onClose={() => setEditing(null)} onSave={onSave} onReset={editing && !editing.isCustom && editing.edited ? onReset : null} />
    </div>
  );
}
