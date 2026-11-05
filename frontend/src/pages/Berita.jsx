import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePublic } from "@/lib/site";
import { PageHeader, NewsCard } from "@/components/public/Common";

const PER_PAGE = 9;

export default function Berita() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const { items, total, loading } = usePublic("news", { page, limit: PER_PAGE, q: query || undefined });
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  return (
    <div data-testid="berita-page">
      <PageHeader title="Berita Kelurahan" desc="Kabar dan kegiatan terbaru dari Kelurahan Purwokerto Wetan." crumb="Berita" />
      <section className="container-x mt-12">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(q); }} className="flex gap-2 max-w-md mb-8">
          <Input placeholder="Cari judul berita…" value={q} onChange={(e) => setQ(e.target.value)} className="h-11" data-testid="news-search-input" />
          <Button type="submit" className="h-11 bg-sky-600 hover:bg-sky-700" data-testid="news-search-btn"><Search className="h-4 w-4" /></Button>
        </form>
        {!loading && items.length === 0 && <p className="text-slate-500" data-testid="news-empty">Belum ada berita.</p>}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n, i) => <NewsCard key={n.id} n={n} i={i} />)}
        </div>
        {pages > 1 && (
          <div className="flex justify-center gap-2 mt-10" data-testid="news-pagination">
            {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`h-10 w-10 rounded-md font-semibold ${p === page ? "bg-sky-600 text-white" : "bg-white border border-slate-200"}`} data-testid={`news-page-${p}`}>{p}</button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
