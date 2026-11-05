import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePublic } from "@/lib/site";
import { fileUrl } from "@/lib/api";
import { PageHeader } from "@/components/public/Common";

export default function Galeri() {
  const { items } = usePublic("gallery");
  const [album, setAlbum] = useState("Semua");
  const [open, setOpen] = useState(null);
  const albums = ["Semua", ...new Set(items.map((g) => g.album).filter(Boolean))];
  const shown = album === "Semua" ? items : items.filter((g) => g.album === album);
  return (
    <div data-testid="galeri-page">
      <PageHeader title="Galeri Kegiatan" desc="Dokumentasi kegiatan kelurahan dan warga." crumb="Galeri" />
      <section className="container-x mt-12">
        <div className="flex flex-wrap justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {albums.map((a) => (
              <button key={a} onClick={() => setAlbum(a)} data-testid={`album-filter-${a}`} className={`px-4 py-2 rounded-full text-sm font-semibold border ${album === a ? "bg-sky-600 text-white border-sky-600" : "bg-white border-slate-200"}`}>{a}</button>
            ))}
          </div>
          <Link to="/partisipasi" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700" data-testid="gallery-submit-link"><Upload className="h-4 w-4" />Kirim foto kegiatan warga</Link>
        </div>
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>*]:mb-4">
          {shown.map((g) => (
            <button key={g.id} onClick={() => setOpen(g)} className="block w-full break-inside-avoid rounded-xl overflow-hidden group relative" data-testid={`gallery-item-${g.id}`}>
              <img src={fileUrl(g.image)} alt={g.title} className="w-full group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{g.title}</div>
            </button>
          ))}
        </div>
      </section>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl p-2" data-testid="gallery-lightbox">
          <DialogTitle className="sr-only">{open?.title}</DialogTitle>
          {open && (
            <>
              <img src={fileUrl(open.image)} alt={open.title} className="w-full max-h-[75vh] object-contain rounded" />
              <div className="p-3"><div className="font-bold">{open.title}</div><div className="text-sm text-slate-600">{open.caption}</div></div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
