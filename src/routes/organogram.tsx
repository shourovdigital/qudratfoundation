import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, User } from "lucide-react";

export const Route = createFileRoute("/organogram")({
  head: () => ({
    meta: [
      { title: "Organogram — Odhikar Foundation" },
      { name: "description", content: "Meet our leadership and team structure. Transparency in who does what." },
    ],
  }),
  component: Organogram,
});

interface Node {
  id: string;
  name: string;
  position: string;
  department: string | null;
  responsibilities: string | null;
  parent_id: string | null;
  level: number;
  order_index: number;
  email: string | null;
  phone: string | null;
}

function Organogram() {
  const { data, isLoading } = useQuery({
    queryKey: ["organogram"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organogram")
        .select("*")
        .order("level")
        .order("order_index");
      if (error) throw error;
      return data as Node[];
    },
  });

  const byLevel = (data ?? []).reduce<Record<number, Node[]>>((acc, n) => {
    (acc[n.level] ??= []).push(n);
    return acc;
  }, {});

  return (
    <div className="container-page py-12 md:py-20">
      <div className="max-w-3xl mb-12">
        <h1 className="font-display text-5xl md:text-6xl text-heritage-green mb-4">
          Our Structure
        </h1>
        <p className="text-lg text-ink-soft">
          Transparency starts with knowing who is accountable for what. Here's how Odhikar is organized.
        </p>
      </div>

      {isLoading ? (
        <div className="card-surface h-96 animate-pulse" />
      ) : (
        <div className="flex flex-col items-center gap-10 md:gap-14">
          {Object.entries(byLevel).map(([level, nodes], idx, arr) => (
            <div key={level} className="w-full">
              <div className={`grid gap-4 md:gap-6 ${
                nodes.length === 1 ? "max-w-md mx-auto" :
                nodes.length === 2 ? "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto" :
                "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto"
              }`}>
                {nodes.map((n) => <OrgCard key={n.id} node={n} />)}
              </div>
              {idx < arr.length - 1 && (
                <div className="w-px h-10 bg-heritage-green/30 mx-auto mt-10" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrgCard({ node }: { node: Node }) {
  const isRoot = node.level === 0;
  return (
    <div className={`card-surface p-5 md:p-6 ${isRoot ? "border-2 border-heritage-green shadow-elevated" : ""}`}>
      <div className="flex items-start gap-4">
        <div className={`size-12 rounded-full grid place-items-center shrink-0 ${
          isRoot ? "bg-heritage-green text-white" : "bg-heritage-green-soft text-heritage-green"
        }`}>
          <User className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-heritage-red uppercase tracking-widest mb-1">
            {node.position}
          </p>
          <h3 className="font-display text-lg font-bold truncate">{node.name}</h3>
          {node.department && (
            <p className="text-xs text-ink-soft">{node.department}</p>
          )}
        </div>
      </div>
      {node.responsibilities && (
        <p className="text-sm text-ink-soft mt-4 leading-relaxed">
          {node.responsibilities}
        </p>
      )}
      {(node.email || node.phone) && (
        <div className="mt-4 pt-4 border-t border-heritage-green/10 flex flex-wrap gap-3 text-xs text-ink-soft">
          {node.email && (
            <a href={`mailto:${node.email}`} className="flex items-center gap-1.5 hover:text-heritage-green">
              <Mail className="size-3" /> {node.email}
            </a>
          )}
          {node.phone && (
            <a href={`tel:${node.phone}`} className="flex items-center gap-1.5 hover:text-heritage-green">
              <Phone className="size-3" /> {node.phone}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
