import { Printer, CheckCircle2, Copy, Camera, NotebookPen, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSite } from "@/lib/site";
import { waLink, formatDate } from "@/lib/api";
import { ticketSaveMsg } from "@/lib/templates";
import PrintSlip from "./PrintSlip";
import { WhatsAppIcon } from "./BrandIcons";

export const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const t = document.createElement("textarea");
    t.value = text;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    t.remove();
  }
};

export const SaveTicketTips = () => (
  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 no-print" data-testid="ticket-save-tips">
    <div className="font-bold flex items-center gap-2"><Info className="h-4 w-4" />Penting: simpan nomor tiket Anda</div>
    <p className="mt-1">Nomor tiket diperlukan untuk melacak status dan ditunjukkan ke petugas. Pilih salah satu cara:</p>
    <ul className="mt-2 space-y-1.5">
      <li className="flex gap-2"><Copy className="h-4 w-4 mt-0.5 shrink-0" /><span><b>Salin</b> nomor tiket lalu tempel di catatan ponsel.</span></li>
      <li className="flex gap-2"><WhatsAppIcon className="h-4 w-4 mt-0.5 shrink-0" /><span><b>Simpan ke WhatsApp</b>, yaitu kirim bukti ke nomor Anda sendiri.</span></li>
      <li className="flex gap-2"><Camera className="h-4 w-4 mt-0.5 shrink-0" /><span><b>Tangkapan layar</b> (screenshot) halaman ini, atau <b>cetak</b>.</span></li>
      <li className="flex gap-2"><NotebookPen className="h-4 w-4 mt-0.5 shrink-0" /><span><b>Catat</b> di kertas. Ingat juga 4 digit akhir nomor WhatsApp yang Anda isi.</span></li>
    </ul>
  </div>
);

export default function TicketCard({ ticket, title, docTitle = "BUKTI PENGAJUAN", name, phone, lines = [], listTitle = "Berkas yang perlu dibawa ke kantor", extraRows = [] }) {
  const { settings } = useSite();
  const date = formatDate(new Date().toISOString(), true);
  const msg = ticketSaveMsg({ site: settings.site_name, docTitle: docTitle.charAt(0) + docTitle.slice(1).toLowerCase(), ticket, title, date, lines });
  const copy = async () => {
    await copyText(ticket.trim());
    toast.success(`Nomor tiket ${ticket} disalin`);
  };
  return (
    <div className="space-y-4" data-testid="ticket-result">
      <div className="flex items-center gap-2 text-emerald-700 font-semibold no-print"><CheckCircle2 className="h-6 w-6" />Berhasil dikirim</div>
      <PrintSlip docTitle={docTitle} ticket={ticket} rows={[["Perihal", title], ["Nama", name], ["Tanggal", date], ...extraRows]} list={lines} listTitle={listTitle} />
      <SaveTicketTips />
      <div className="grid sm:grid-cols-3 gap-2 no-print">
        <Button variant="outline" className="h-11" onClick={copy} data-testid="ticket-copy-btn"><Copy className="h-4 w-4 mr-2" />Salin No. Tiket</Button>
        <Button variant="outline" className="h-11" onClick={() => window.print()} data-testid="ticket-print-btn"><Printer className="h-4 w-4 mr-2" />Cetak</Button>
        <Button asChild className="h-11 bg-[#25D366] hover:bg-[#1ebe5a] text-white" data-testid="ticket-whatsapp-btn">
          <a href={waLink(phone || "", msg)} target="_blank" rel="noreferrer"><WhatsAppIcon className="h-4 w-4 mr-2" />Simpan ke WA</a>
        </Button>
      </div>
    </div>
  );
}
