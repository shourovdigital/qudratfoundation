import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar } from "lucide-react";

type News = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
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

export const Route = createFileRoute("/news/$slug")({
  component: NewsDetail,
  errorComponent: ({ error }) => <div className="container-page py-20">Error: {error.message}</div>,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-3xl text-heritage-green">News article not found</h1>
      <Link to="/news" className="btn-outline mt-4 inline-flex">Back to news</Link>
    </div>
  ),
});

function NewsDetail() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["news", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("news").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as News;
    },
  });

  if (isLoading) return <div className="container-page py-20 text-ink-soft">Loading…</div>;
  if (!data) return null;

  const yid = ytId(data.youtube_url);

  return (
    <article className="container-page py-10 md:py-16 max-w-3xl">
      <Link to="/news" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-heritage-green mb-6">
        <ArrowLeft className="size-4" /> Back to news
      </Link>

      <span className="inline-block px-3 py-1 bg-heritage-green-soft text-heritage-green text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
        {data.category}
      </span>
      <h1 className="font-display text-4xl md:text-6xl text-heritage-green leading-tight mb-3">{data.title}</h1>
      <p className="text-sm text-ink-soft mb-8 inline-flex items-center gap-2">
        <Calendar className="size-4" />
        {new Date(data.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      {data.media_type === "video" && yid ? (
        <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${yid}`}
            title={data.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : data.cover_image_url ? (
        <img src={data.cover_image_url} alt={data.title} className="w-full aspect-video object-cover rounded-2xl mb-8" />
      ) : null}

      {data.excerpt && <p className="text-lg text-ink-soft leading-relaxed mb-6">{data.excerpt}</p>}
      {data.content && (
        <div className="prose prose-lg max-w-none">
          {data.content.split("\n").map((para, i) => (
            <p key={i} className="text-ink leading-relaxed mb-4">{para}</p>
          ))}
        </div>
      )}
    </article>
  );
}
