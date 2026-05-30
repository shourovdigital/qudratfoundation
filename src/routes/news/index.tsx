import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Play, ImageIcon, FileText, Calendar } from "lucide-react";

type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  youtube_url: string | null;
  media_type: "image" | "video" | "text";
  category: string;
  published_at: string;
};

function ytId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News & Media — Qudrat Foundation" },
      { name: "description", content: "Latest news, photos and videos from Qudrat Foundation projects across Bangladesh." },
      { property: "og:title", content: "News & Media — Qudrat Foundation" },
      { property: "og:description", content: "Stories, photos, and videos from our work across Bangladesh." },
    ],
  }),
  component: NewsIndex,
  errorComponent: ({ error }) => <div className="container-page py-20">Error: {error.message}</div>,
  notFoundComponent: () => <div className="container-page py-20">Not found.</div>,
});

function NewsIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["news-list"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("news")
        .select("*")
        .eq("is_published", true)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data as NewsRow[];
    },
  });

  return (
    <div className="container-page py-12 md:py-20">
      <header className="mb-12">
        <span className="inline-block px-3 py-1 bg-heritage-green-soft text-heritage-green text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
          Newsroom
        </span>
        <h1 className="font-display text-5xl md:text-6xl text-heritage-green mb-3">News &amp; Media</h1>
        <p className="text-ink-soft max-w-2xl">Stories, photos, and videos from Qudrat Foundation's work across Bangladesh.</p>
      </header>

      {isLoading && <p className="text-ink-soft">Loading…</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="card-surface p-12 text-center text-ink-soft">No news posted yet.</div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {data?.map((n) => {
          const id = ytId(n.youtube_url);
          return (
            <Link
              key={n.id}
              to="/news/$slug"
              params={{ slug: n.slug }}
              className="card-surface overflow-hidden group hover:shadow-elevated transition-all flex flex-col"
            >
              <div className="aspect-video bg-heritage-green/10 relative overflow-hidden">
                {n.media_type === "video" && id ? (
                  <>
                    <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt={n.title} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 grid place-items-center bg-black/30 group-hover:bg-black/40 transition-colors">
                      <div className="size-14 rounded-full bg-heritage-red text-white grid place-items-center shadow-elevated">
                        <Play className="size-6 fill-white" />
                      </div>
                    </div>
                  </>
                ) : n.cover_image_url ? (
                  <img src={n.cover_image_url} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-heritage-green/30">
                    <FileText className="size-12" strokeWidth={1.2} />
                  </div>
                )}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[10px] font-bold uppercase tracking-widest text-heritage-green px-2 py-1 rounded-full">
                  {n.media_type === "video" ? <Play className="size-3" /> : n.media_type === "image" ? <ImageIcon className="size-3" /> : <FileText className="size-3" />}
                  {n.category}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-display text-xl text-heritage-green mb-2 line-clamp-2">{n.title}</h3>
                {n.excerpt && <p className="text-sm text-ink-soft line-clamp-2 mb-4">{n.excerpt}</p>}
                <div className="mt-auto text-[11px] text-ink-soft inline-flex items-center gap-1 pt-2 border-t border-heritage-green/10">
                  <Calendar className="size-3" />
                  {new Date(n.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
