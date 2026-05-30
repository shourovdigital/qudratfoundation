import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DonationForm } from "@/components/DonationForm";
import { formatBDT, formatNumber } from "@/lib/format";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate — Qudrat Foundation" },
      { name: "description", content: "Make a general donation to support our ongoing work across Bangladesh." },
    ],
  }),
  component: Donate,
});

function Donate() {
  const { data: stats } = useQuery({
    queryKey: ["donate-stats"],
    queryFn: async () => {
      const [{ count }, { data }] = await Promise.all([
        supabase.from("donations").select("id", { count: "exact", head: true }).eq("status", "verified"),
        supabase.from("donations").select("amount").eq("status", "verified"),
      ]);
      const total = (data ?? []).reduce((a, b) => a + Number(b.amount), 0);
      return { totalRaised: total, donorCount: count ?? 0 };
    },
  });

  return (
    <div className="container-page py-12 md:py-20">
      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div>
          <Heart className="size-10 text-heritage-red mb-5" strokeWidth={1.5} />
          <h1 className="font-display text-5xl md:text-6xl text-heritage-green leading-tight mb-5">
            Give where it matters most.
          </h1>
          <p className="text-lg text-ink-soft mb-8 leading-relaxed">
            Your general donation goes to our most urgent active project, or supports the foundation's
            operational capacity to reach more communities.
          </p>

          <div className="card-surface p-6 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-soft mb-2">
              Total Raised
            </p>
            <p className="font-display text-4xl text-heritage-green font-bold mb-1">
              {formatBDT(stats?.totalRaised)}
            </p>
            <p className="text-sm text-ink-soft">
              from {formatNumber(stats?.donorCount)} verified donors
            </p>
          </div>

          <div className="rounded-2xl bg-heritage-green-soft p-6">
            <h3 className="font-bold text-heritage-green mb-3">Where your money goes</h3>
            <ul className="space-y-2 text-sm text-ink-soft">
              <li>• <strong>92%</strong> directly to active projects</li>
              <li>• <strong>5%</strong> volunteer training and logistics</li>
              <li>• <strong>3%</strong> audit, compliance, and transparency reporting</li>
            </ul>
          </div>
        </div>

        <div className="card-surface p-6 md:p-8 lg:sticky lg:top-24 self-start">
          <h2 className="font-display text-2xl mb-2">General Donation</h2>
          <p className="text-sm text-ink-soft mb-6">
            Want to donate to a specific project? <a href="/projects" className="text-heritage-green underline">Browse projects →</a>
          </p>
          <DonationForm />
        </div>
      </div>
    </div>
  );
}
