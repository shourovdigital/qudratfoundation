import { Link } from "@tanstack/react-router";
import { formatBDT, progressPercent, daysLeft } from "@/lib/format";

export interface ProjectCardData {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  category: string;
  district: string | null;
  image_url: string | null;
  target_amount: number | string;
  raised_amount: number | string;
  donor_count: number;
  status: "active" | "closed" | "paused";
  end_date: string | null;
}

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const pct = progressPercent(project.raised_amount, project.target_amount);
  const dl = daysLeft(project.end_date);
  const isClosed = project.status === "closed";
  const isPaused = project.status === "paused";

  return (
    <Link
      to="/projects/$slug"
      params={{ slug: project.slug }}
      className="group block card-surface overflow-hidden hover:shadow-elevated transition-all"
    >
      <div className="aspect-video bg-heritage-green-soft relative overflow-hidden">
        {project.image_url ? (
          <img src={project.image_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-heritage-green/40">
              {project.category}
            </span>
          </div>
        )}
        {isClosed && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-heritage-green text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
            Target Achieved
          </div>
        )}
        {isPaused && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-ink/70 text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
            Paused
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="px-2 py-0.5 bg-heritage-green-soft text-heritage-green text-[10px] font-bold uppercase tracking-wider rounded-full">
            {project.category}
          </span>
          {project.district && (
            <span className="text-xs text-ink-soft">{project.district}</span>
          )}
        </div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-heritage-green transition-colors line-clamp-1">
          {project.title}
        </h3>
        <p className="text-sm text-ink-soft mb-5 line-clamp-2">{project.short_description}</p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-heritage-green">{formatBDT(project.raised_amount)}</span>
            <span className="text-ink-soft">{pct}%</span>
          </div>
          <div className="w-full h-1.5 bg-heritage-green/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isClosed ? "bg-heritage-green" : "bg-heritage-red"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-ink-soft pt-1">
            <span>Goal {formatBDT(project.target_amount)}</span>
            <span>
              {project.donor_count} donors{dl !== null && dl > 0 && !isClosed ? ` · ${dl}d left` : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
