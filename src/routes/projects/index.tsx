import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectCard, type ProjectCardData } from "@/components/ProjectCard";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — Odhikar Foundation" },
      { name: "description", content: "Browse all active and completed social work projects across Bangladesh." },
    ],
  }),
  component: ProjectsList,
});

const filters = ["all", "active", "closed", "paused"] as const;

function ProjectsList() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["projects", filter],
    queryFn: async () => {
      let q = supabase.from("projects").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as ProjectCardData[];
    },
  });

  return (
    <div className="container-page py-12 md:py-20">
      <div className="max-w-3xl mb-12">
        <h1 className="font-display text-5xl md:text-6xl text-heritage-green mb-4">
          Our Projects
        </h1>
        <p className="text-lg text-ink-soft">
          Every project has a target, a timeline, and live tracking. Pick one that moves you.
        </p>
      </div>

      <div className="flex gap-2 mb-10 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${
              filter === f
                ? "bg-heritage-green text-white"
                : "bg-heritage-green-soft text-heritage-green hover:bg-heritage-green/15"
            }`}
          >
            {f === "all" ? "All Projects" : f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-surface h-96 animate-pulse" />
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {data.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="card-surface p-12 text-center">
          <p className="text-ink-soft">No projects found.</p>
        </div>
      )}
    </div>
  );
}
