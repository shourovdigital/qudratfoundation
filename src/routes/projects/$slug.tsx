import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT, progressPercent, daysLeft, formatNumber } from "@/lib/format";
import { DonationForm } from "@/components/DonationForm";
import { ArrowLeft, Calendar, MapPin, Users, Target } from "lucide-react";

export const Route = createFileRoute("/projects/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Qudrat` },
    ],
  }),
  component: ProjectDetail,
  notFoundComponent: () => (
    <div className="container-page py-20 text-center">
      <h1 className="font-display text-4xl text-heritage-green mb-4">Project not found</h1>
      <Link to="/projects" className="btn-outline">Back to projects</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container-page py-20 text-center">
      <p className="text-ink-soft">{error.message}</p>
    </div>
  ),
});

function ProjectDetail() {
  const { slug } = Route.useParams();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: recentDonations } = useQuery({
    queryKey: ["donations", project?.id],
    enabled: !!project?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("donor_name,amount,message,is_anonymous,created_at")
        .eq("project_id", project!.id)
        .eq("status", "verified")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading || !project) {
    return <div className="container-page py-20"><div className="h-96 card-surface animate-pulse" /></div>;
  }

  const pct = progressPercent(project.raised_amount, project.target_amount);
  const dl = daysLeft(project.end_date);
  const isClosed = project.status === "closed";

  return (
    <div className="container-page py-10 md:py-16">
      <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-heritage-green mb-8">
        <ArrowLeft className="size-4" /> Back to projects
      </Link>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="aspect-video bg-heritage-green-soft rounded-3xl overflow-hidden">
            {project.image_url ? (
              <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full grid place-items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-heritage-green/40">
                  {project.category}
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-heritage-green-soft text-heritage-green text-[10px] font-bold uppercase tracking-widest rounded-full">
                {project.category}
              </span>
              {project.district && (
                <span className="flex items-center gap-1 text-xs text-ink-soft">
                  <MapPin className="size-3" /> {project.district}
                </span>
              )}
              {isClosed && (
                <span className="px-3 py-1 bg-heritage-green text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Target Achieved
                </span>
              )}
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-heritage-green leading-tight mb-4">
              {project.title}
            </h1>
            <p className="text-lg text-ink-soft mb-6">{project.short_description}</p>
            <div className="prose prose-sm max-w-none text-ink-soft whitespace-pre-line leading-relaxed">
              {project.description}
            </div>
          </div>

          {recentDonations && recentDonations.length > 0 && (
            <div className="card-surface p-6 md:p-8">
              <h3 className="font-display text-2xl mb-5">Recent Donors</h3>
              <ul className="divide-y divide-heritage-green/10">
                {recentDonations.map((d, i) => (
                  <li key={i} className="py-3 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm">
                        {d.is_anonymous ? "Anonymous" : d.donor_name}
                      </p>
                      {d.message && (
                        <p className="text-xs text-ink-soft mt-0.5 italic">"{d.message}"</p>
                      )}
                    </div>
                    <span className="text-heritage-green font-bold text-sm shrink-0">
                      {formatBDT(d.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 self-start space-y-6">
          <div className="card-surface p-6 md:p-7">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-display text-3xl text-heritage-green font-bold">
                {formatBDT(project.raised_amount)}
              </span>
              <span className="text-sm text-ink-soft font-semibold">{pct}%</span>
            </div>
            <p className="text-xs text-ink-soft mb-4">
              raised of {formatBDT(project.target_amount)} goal
            </p>
            <div className="w-full h-2.5 bg-heritage-green/10 rounded-full overflow-hidden mb-5">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${isClosed ? "bg-heritage-green" : "bg-heritage-red"}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center py-4 border-y border-heritage-green/10 mb-5">
              <Mini icon={<Users className="size-4" />} label="Donors" value={formatNumber(project.donor_count)} />
              <Mini icon={<Calendar className="size-4" />} label="Days Left" value={dl !== null && dl >= 0 ? `${dl}` : "—"} />
              <Mini icon={<Target className="size-4" />} label="Status" value={project.status} />
            </div>

            {isClosed ? (
              <div className="text-center py-6">
                <p className="font-display text-2xl text-heritage-green mb-2">Target Achieved!</p>
                <p className="text-sm text-ink-soft">Thank you to all donors who made this possible.</p>
              </div>
            ) : project.status === "paused" ? (
              <div className="text-center py-6">
                <p className="font-display text-2xl text-ink mb-2">Paused</p>
                <p className="text-sm text-ink-soft">This project is temporarily not accepting donations.</p>
              </div>
            ) : (
              <DonationForm projectId={project.id} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="text-heritage-green flex justify-center mb-1">{icon}</div>
      <p className="text-[10px] uppercase tracking-widest text-ink-soft">{label}</p>
      <p className="text-sm font-bold capitalize mt-0.5">{value}</p>
    </div>
  );
}
