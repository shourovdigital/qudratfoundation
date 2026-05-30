import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT, formatNumber } from "@/lib/format";
import { ArrowRight, MapPin, Users } from "lucide-react";

type Portfolio = {
  id: string;
  title: string;
  slug: string;
  category: string;
  district: string | null;
  short_description: string;
  cover_image_url: string | null;
  beneficiaries: number;
  budget_spent: number;
  completed_date: string | null;
  is_featured: boolean;
};

export const Route = createFileRoute("/portfolio/")({
  head: () => ({
    meta: [
      { title: "Portfolio — Qudrat Foundation" },
      { name: "description", content: "Completed social work projects showcasing the impact of Qudrat Foundation across Bangladesh." },
      { property: "og:title", content: "Portfolio — Qudrat Foundation" },
      { property: "og:description", content: "Showcase of completed community projects, real impact, real numbers." },
    ],
    links: [{ rel: "canonical", href: "/portfolio" }],
  }),
  component: PortfolioIndex,
  errorComponent: ({ error }) => <div className="container-page py-20">Error: {error.message}</div>,
  notFoundComponent: () => <div className="container-page py-20">Not found.</div>,
});

function PortfolioIndex() {
  const { data, isLoading } = useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("portfolios")
        .select("*")
        .eq("is_published", true)
        .order("is_featured", { ascending: false })
        .order("order_index", { ascending: false })
        .order("completed_date", { ascending: false });
      if (error) throw error;
      return data as Portfolio[];
    },
  });

  return (
    <div className="container-page py-12 md:py-20">
      <header className="mb-12">
        <span className="inline-block px-3 py-1 bg-heritage-green-soft text-heritage-green text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
          Our Work
        </span>
        <h1 className="font-display text-5xl md:text-6xl text-heritage-green mb-3">Portfolio</h1>
        <p className="text-ink-soft max-w-2xl">
          Completed social work projects — real impact, real numbers, real communities across Bangladesh.
        </p>
      </header>

      {isLoading && <p className="text-ink-soft">Loading…</p>}
      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="card-surface p-12 text-center">
          <p className="text-ink-soft">No portfolio entries yet. Check back soon.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {data?.map((p) => (
          <Link
            key={p.id}
            to="/portfolio/$slug"
            params={{ slug: p.slug }}
            className="card-surface overflow-hidden group hover:shadow-elevated transition-all"
          >
            <div className="aspect-[4/3] bg-heritage-green/10 relative overflow-hidden">
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full grid place-items-center text-heritage-green/30 font-display text-5xl">
                  {p.title.charAt(0)}
                </div>
              )}
              <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[10px] font-bold uppercase tracking-widest text-heritage-green px-2 py-1 rounded-full">
                {p.category}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display text-xl text-heritage-green mb-2 line-clamp-2">{p.title}</h3>
              <p className="text-sm text-ink-soft line-clamp-2 mb-4">{p.short_description}</p>
              <div className="flex items-center justify-between text-xs text-ink-soft border-t border-heritage-green/10 pt-3">
                <span className="inline-flex items-center gap-1"><Users className="size-3" /> {formatNumber(p.beneficiaries)} reached</span>
                {p.district && <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {p.district}</span>}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-heritage-green">{formatBDT(p.budget_spent)} spent</span>
                <ArrowRight className="size-4 text-heritage-red group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
