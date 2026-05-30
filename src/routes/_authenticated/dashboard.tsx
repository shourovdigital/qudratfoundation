import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBDT } from "@/lib/format";
import { Heart, Clock, CheckCircle, XCircle, Pause, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, roles, isAdmin } = useAuth();

  const { data: myDonations } = useQuery({
    queryKey: ["my-donations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("donations")
        .select("*, project:projects(title,slug)")
        .or(`user_id.eq.${user!.id},donor_email.eq.${user!.email}`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: myVolunteer } = useQuery({
    queryKey: ["my-volunteer", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("volunteers")
        .select("*")
        .or(`user_id.eq.${user!.id},email.eq.${user!.email}`)
        .maybeSingle();
      return data;
    },
  });

  const statusIcon = (s?: string) => {
    switch (s) {
      case "approved": return <CheckCircle className="size-5 text-heritage-green" />;
      case "declined": return <XCircle className="size-5 text-heritage-red" />;
      case "postponed": return <Pause className="size-5 text-amber-500" />;
      case "blocked": return <XCircle className="size-5 text-ink" />;
      default: return <Clock className="size-5 text-amber-500" />;
    }
  };

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <p className="text-sm text-ink-soft mb-1">Signed in as <strong>{user?.email}</strong></p>
          <h1 className="font-display text-4xl md:text-5xl text-heritage-green">My Dashboard</h1>
        </div>
        {isAdmin && (
          <Link to="/admin" className="btn-primary">
            <Shield className="size-4" /> Open Admin Panel
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <StatCard label="My Role" value={roles[0] ?? "user"} />
        <StatCard label="My Donations" value={String(myDonations?.length ?? 0)} />
        <StatCard label="Volunteer Status" value={myVolunteer?.status ?? "Not applied"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="card-surface p-6 md:p-8">
          <h2 className="font-display text-2xl mb-5 flex items-center gap-2">
            <Heart className="size-5 text-heritage-red" /> My Donations
          </h2>
          {myDonations && myDonations.length > 0 ? (
            <ul className="divide-y divide-heritage-green/10">
              {myDonations.map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {(d.project as { title?: string } | null)?.title ?? "General Donation"}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {new Date(d.created_at).toLocaleDateString()} · {d.payment_method} · {d.status}
                    </p>
                  </div>
                  <span className="text-heritage-green font-bold shrink-0">{formatBDT(d.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-soft text-sm">No donations yet. <Link to="/projects" className="text-heritage-green underline">Explore projects →</Link></p>
          )}
        </section>

        <section className="card-surface p-6 md:p-8">
          <h2 className="font-display text-2xl mb-5">Volunteer Application</h2>
          {myVolunteer ? (
            <div>
              <div className="flex items-center gap-3 mb-4">
                {statusIcon(myVolunteer.status)}
                <span className="font-bold capitalize">{myVolunteer.status}</span>
              </div>
              <dl className="text-sm space-y-2">
                <Row label="District" value={myVolunteer.district} />
                <Row label="Skills" value={myVolunteer.skills?.join(", ") || "—"} />
                <Row label="Applied" value={new Date(myVolunteer.created_at).toLocaleDateString()} />
                {myVolunteer.admin_notes && <Row label="Admin Note" value={myVolunteer.admin_notes} />}
              </dl>
            </div>
          ) : (
            <div>
              <p className="text-ink-soft text-sm mb-4">You haven't applied as a volunteer yet.</p>
              <Link to="/volunteer" className="btn-outline">Apply now</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-6">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft mb-2">{label}</p>
      <p className="font-display text-3xl text-heritage-green capitalize">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b border-heritage-green/5 last:border-0">
      <dt className="text-ink-soft text-xs uppercase tracking-wider">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
