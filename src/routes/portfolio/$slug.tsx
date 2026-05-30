import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT, formatNumber } from "@/lib/format";
import { ArrowLeft, Users, MapPin, Calendar, Coins } from "lucide-react";

type Portfolio = {
  id: string;
  title: string;
  slug: string;
  category: string;
  district: string | null;
  short_description: string;
  description: string;
  cover_image_url: string | null;
  gallery_urls: string[];
  impact_summary: string | null;
  beneficiaries: number;
  budget_spent: number;
  completed_date: string | null;
};

export const Route = createFileRoute("/portfolio/$slug")({
  component: PortfolioDetail,
  errorComponent: ({ error }) => <div className="container-page py-20">Error: {error.message}</div>,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-3xl text-heritage-green">Portfolio not found</h1>
      <Link to="/portfolio" className="btn-outline mt-4 inline-flex">Back to portfolio</Link>
    </div>
  ),
});

function PortfolioDetail() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["portfolio", slug],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("portfolios")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as Portfolio;
    },
  });

  if (isLoading) return <div className="container-page py-20 text-ink-soft">Loading…</div>;
  if (!data) return null;

  return (
    <div className="container-page py-10 md:py-16">
      <Link to="/portfolio" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-heritage-green mb-6">
        <ArrowLeft className="size-4" /> Back to portfolio
      </Link>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        <article className="lg:col-span-2">
          <span className="inline-block px-3 py-1 bg-heritage-green-soft text-heritage-green text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
            {data.category}
          </span>
          <h1 className="font-display text-4xl md:text-6xl text-heritage-green leading-tight mb-4">{data.title}</h1>
          <p className="text-lg text-ink-soft mb-8">{data.short_description}</p>

          {data.cover_image_url && (
            <img src={data.cover_image_url} alt={data.title} className="w-full aspect-video object-cover rounded-2xl mb-8" />
          )}

          <div className="prose prose-lg max-w-none">
            {data.description.split("\n").map((para, i) => (
              <p key={i} className="text-ink leading-relaxed mb-4">{para}</p>
            ))}
          </div>

          {data.gallery_urls?.length > 0 && (
            <div className="mt-10">
              <h3 className="font-display text-2xl text-heritage-green mb-4">Gallery</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.gallery_urls.map((url, i) => (
                  <img key={i} src={url} alt={`${data.title} ${i + 1}`} className="w-full aspect-square object-cover rounded-xl" />
                ))}
              </div>
            </div>
          )}
        </article>

        <aside className="lg:sticky lg:top-24 self-start space-y-4">
          {data.impact_summary && (
            <div className="card-surface p-6 bg-heritage-green text-white">
              <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-2">Impact</p>
              <p className="font-display text-xl leading-snug">{data.impact_summary}</p>
            </div>
          )}
          <div className="card-surface p-6 space-y-4">
            <Stat icon={Users} label="Beneficiaries" value={formatNumber(data.beneficiaries)} />
            <Stat icon={Coins} label="Budget spent" value={formatBDT(data.budget_spent)} />
            {data.district && <Stat icon={MapPin} label="Location" value={data.district} />}
            {data.completed_date && <Stat icon={Calendar} label="Completed" value={new Date(data.completed_date).toLocaleDateString()} />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="size-10 rounded-full bg-heritage-green-soft text-heritage-green grid place-items-center">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-widest font-bold text-ink-soft">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </div>
  );
}
