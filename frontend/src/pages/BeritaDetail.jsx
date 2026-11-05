import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MessageCircle, Link2, Calendar, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api, fileUrl, formatDate } from "@/lib/api";
import { usePublic } from "@/lib/site";
import { Paragraphs, NewsCard } from "@/components/public/Common";
import NotFound from "./NotFound";

export default function BeritaDetail() {
  const { slug } = useParams();
  const [n, setN] = useState(null);
  const [missing, setMissing] = useState(false);
  const latest = usePublic("news", { limit: 4 });
  useEffect(() => {
    setN(null);
    api.get(`/public/news/${slug}`).then((r) => setN(r.data)).catch(() => setMissing(true));
  }, [slug]);
  if (missing) return <NotFound />;
  if (!n) return <div className="container-x py-24 text-slate-500">Memuat berita…</div>;
  const url = window.location.href;
  return (
    <article className="container-x mt-10 grid lg:grid-cols-[1fr_320px] gap-10" data-testid="berita-detail-page">
      <div>
        <div className="text-sm text-slate-500 mb-3"><Link to="/berita" className="hover:underline text-sky-700">Berita</Link> › {n.category}</div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900" data-testid="news-title">{n.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-3">
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(n.published_at)}</span>
          <span className="flex items-center gap-1"><User className="h-4 w-4" />{n.author_name}</span>
        </div>
        {n.cover && <img src={fileUrl(n.cover)} alt={n.title} className="w-full aspect-[16/9] object-cover rounded-xl mt-6" />}
        <div className="mt-6 text-base"><Paragraphs text={n.content} /></div>
        {n.images?.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">{n.images.slice(1).map((im) => <img key={im} src={fileUrl(im)} alt="" className="rounded-lg aspect-square object-cover" />)}</div>
        )}
        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-slate-200">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700" data-testid="share-whatsapp-btn"><a href={`https://wa.me/?text=${encodeURIComponent(`${n.title}\n${url}`)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4 mr-2" />Bagikan ke WhatsApp</a></Button>
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(url); toast.success("Tautan disalin"); }} data-testid="copy-link-btn"><Link2 className="h-4 w-4 mr-2" />Salin tautan</Button>
        </div>
      </div>
      <aside className="space-y-4">
        <h3 className="font-bold">Berita lainnya</h3>
        {latest.items.filter((x) => x.id !== n.id).slice(0, 3).map((x) => <NewsCard key={x.id} n={x} />)}
      </aside>
    </article>
  );
}
