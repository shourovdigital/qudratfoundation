import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard, type ProjectCardData } from "@/components/ProjectCard";
import { formatBDT, formatNumber } from "@/lib/format";
import { ArrowRight, Heart, Users, Sparkles, Shield } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Odhikar Foundation — Empowering Bangladesh" },
      { name: "description", content: "Transparency-first Bangladeshi foundation. Live-tracked donations, project-wise giving, and community-driven social work." },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: projects } = useQuery({
    queryKey: ["featured-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data as unknown as ProjectCardData[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["foundation-stats"],
    queryFn: async () => {
      const [{ data: pAll }, { count: dCount }, { data: dSum }] = await Promise.all([
        supabase.from("projects").select("raised_amount,status"),
        supabase.from("donations").select("id", { count: "exact", head: true }).eq("status", "verified"),
        supabase.from("donations").select("amount").eq("status", "verified"),
      ]);
      const totalRaised = (dSum ?? []).reduce((a, b) => a + Number(b.amount), 0);
      const activeProjects = (pAll ?? []).filter((p) => p.status === "active").length;
      const closedProjects = (pAll ?? []).filter((p) => p.status === "closed").length;
      return { totalRaised, donorCount: dCount ?? 0, activeProjects, closedProjects };
    },
  });

  const featured = projects?.[0];

  return (
    <>
      {/* HERO */}
      <header className="relative px-5 md:px-8 py-12 md:py-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          <div className="animate-fade-up">
            <span className="inline-block px-3 py-1 bg-heritage-green-soft text-heritage-green text-[10px] font-bold uppercase tracking-widest rounded-full mb-6">
              Foundation · Est. 2020 · Dhaka
            </span>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-heritage-green mb-6">
              Empowering<br />
              <span className="text-heritage-red underline decoration-4 underline-offset-8">Bangladesh</span>
            </h1>
            <p className="text-base md:text-lg text-ink-soft max-w-lg mb-8 leading-relaxed">
              A transparency-first foundation building sustainable futures through direct community
              action and live-tracked social projects across 64 districts.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/donate" className="btn-primary">
                Donate Now <ArrowRight className="size-4" />
              </Link>
              <Link to="/projects" className="btn-outline">Explore Projects</Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="size-10 rounded-full border-2 border-sand-light bg-heritage-green/20" />
                <div className="size-10 rounded-full border-2 border-sand-light bg-heritage-green/40" />
                <div className="size-10 rounded-full border-2 border-sand-light bg-heritage-green/60" />
                <div className="size-10 rounded-full border-2 border-sand-light bg-heritage-green flex items-center justify-center text-[10px] text-white font-bold">
                  +2k
                </div>
              </div>
              <div className="text-xs">
                <p className="font-bold">Join 2,400+ Volunteers</p>
                <p className="text-ink-soft">Across 64 districts</p>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-up [animation-delay:200ms]">
            <div className="w-full aspect-[4/5] bg-gradient-to-br from-heritage-green to-heritage-green/70 rounded-3xl overflow-hidden grid place-items-center relative">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              }} />
              <div className="text-center text-white relative z-10 px-8">
                <Heart className="size-16 mx-auto mb-4 opacity-90" strokeWidth={1.5} />
                <p className="font-display text-3xl md:text-4xl leading-tight mb-2">
                  Hands cupped<br />together
                </p>
                <p className="text-sm opacity-80 max-w-xs mx-auto">
                  Collective effort, dignified giving, real impact.
                </p>
              </div>
            </div>

            {featured && (
              <Link
                to="/projects/$slug"
                params={{ slug: featured.slug }}
                className="absolute -bottom-6 -left-2 md:-left-6 bg-white p-5 md:p-6 rounded-2xl shadow-elevated max-w-[280px] block hover:scale-[1.02] transition-transform"
              >
                <p className="text-[10px] font-bold uppercase text-heritage-red tracking-widest mb-2">
                  Live Target
                </p>
                <h3 className="text-lg md:text-xl font-display font-bold text-heritage-green mb-2 line-clamp-1">
                  {featured.title}
                </h3>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span>{formatBDT(featured.raised_amount)} raised</span>
                  <span>{Math.round((Number(featured.raised_amount) / Number(featured.target_amount)) * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-heritage-green/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-heritage-green rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (Number(featured.raised_amount) / Number(featured.target_amount)) * 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-ink-soft italic">
                  Goal: {formatBDT(featured.target_amount)}. Auto-closes on target.
                </p>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* LIVE STATS */}
      <section className="container-page mt-16 md:mt-24">
        <div className="bg-ink rounded-3xl p-8 md:p-12 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6">
            <Stat label="Total Raised" value={formatBDT(stats?.totalRaised)} />
            <Stat label="Verified Donors" value={formatNumber(stats?.donorCount)} />
            <Stat label="Active Projects" value={formatNumber(stats?.activeProjects)} />
            <Stat label="Completed" value={formatNumber(stats?.closedProjects)} />
          </div>
        </div>
      </section>

      {/* ACTIVE MISSIONS */}
      <section className="container-page py-20 md:py-28">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h2 className="font-display text-4xl md:text-5xl text-heritage-green mb-2">
              Active Missions
            </h2>
            <p className="text-ink-soft">Choose a specific project to fund or join.</p>
          </div>
          <Link to="/projects" className="text-sm font-bold text-heritage-green flex items-center gap-2 hover:gap-3 transition-all underline decoration-1 underline-offset-4">
            View all projects <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {projects?.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      </section>

      {/* VALUES */}
      <section className="container-page py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Transparency First", desc: "Every taka tracked. Live counters, public audits, donor wall." },
            { icon: Heart, title: "Dignified Aid", desc: "We work with communities, not on them. No pity-porn, ever." },
            { icon: Sparkles, title: "Local Impact", desc: "Volunteer-led, district-rooted. From char to coast." },
          ].map((v) => (
            <div key={v.title} className="card-surface p-8">
              <v.icon className="size-8 text-heritage-red mb-4" strokeWidth={1.5} />
              <h3 className="font-display text-xl mb-2">{v.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VOLUNTEER CTA */}
      <section className="container-page py-16">
        <div className="bg-heritage-green rounded-3xl p-8 md:p-16 text-white relative overflow-hidden">
          <div className="absolute -top-20 -right-20 size-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-32 -left-10 size-72 rounded-full bg-heritage-red/10" />
          <div className="relative grid md:grid-cols-2 gap-10 items-center">
            <div>
              <Users className="size-10 mb-4 opacity-80" strokeWidth={1.5} />
              <h2 className="font-display text-4xl md:text-5xl mb-4 leading-tight">
                Lend your hands to the collective effort.
              </h2>
              <p className="text-white/80 max-w-md mb-6">
                Join over 2,400 active volunteers. Your skills in logistics, teaching, or
                medicine can change lives across Bangladesh.
              </p>
              <Link to="/volunteer" className="inline-flex items-center gap-2 bg-white text-heritage-green px-6 py-3 rounded-full font-bold hover:bg-sand-light transition-colors">
                Apply as Volunteer <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="hidden md:block">
              <blockquote className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                <p className="font-display text-xl leading-snug mb-4">
                  "The most rewarding work I've ever done. Every weekend I see real change in real lives."
                </p>
                <footer className="text-sm opacity-80">— Nusrat J., Project Coordinator, Dhaka</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-2">{label}</p>
      <p className="font-display text-3xl md:text-4xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
