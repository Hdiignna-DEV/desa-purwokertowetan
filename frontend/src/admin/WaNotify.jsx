import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSite } from "@/lib/site";
import { waLink } from "@/lib/api";
import { statusMsg } from "@/lib/templates";
import { copyText } from "@/components/public/TicketCard";
import { WhatsAppIcon } from "@/components/public/BrandIcons";

// Notifikasi WhatsApp manual satu klik: membuka wa.me ke nomor warga dengan template pesan siap kirim.
export default function WaNotify({ phone, testid = "wa-notify", label = "Kirim Notifikasi WA", ...msg }) {
  const { settings } = useSite();
  const text = statusMsg({ site: settings.site_name, ...msg });
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3 space-y-2 no-print" data-testid={testid}>
      <div className="text-xs font-semibold text-emerald-800">Pratinjau pesan untuk {phone}</div>
      <pre className="text-xs whitespace-pre-wrap font-sans bg-white rounded-xl border p-3 max-h-48 overflow-y-auto text-slate-700" data-testid={`${testid}-preview`}>{text}</pre>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button asChild className="h-11 bg-[#25D366] hover:bg-[#1ebe5a] text-white" data-testid={`${testid}-btn`}>
          <a href={waLink(phone, text)} target="_blank" rel="noreferrer"><WhatsAppIcon className="h-4 w-4 mr-2" />{label}</a>
        </Button>
        <Button variant="outline" className="h-11" onClick={async () => { await copyText(text); toast.success("Template pesan disalin"); }} data-testid={`${testid}-copy`} aria-label="Salin pesan"><Copy className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
