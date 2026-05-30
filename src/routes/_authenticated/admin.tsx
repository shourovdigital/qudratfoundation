import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBDT } from "@/lib/format";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Pause, Ban, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: Admin,
});

type Tab = "donations" | "projects" | "volunteers" | "messages";

function Admin() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("donations");
  if (!isAdmin) return null;

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="size-6 text-heritage-red" />
        <h1 className="font-display text-4xl md:text-5xl text-heritage-green">Admin Panel</h1>
      </div>
      <p className="text-ink-soft mb-8">Verify donations, manage projects, review volunteer applications.</p>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {(["donations","projects","volunteers","messages"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${
              tab === t ? "bg-heritage-green text-white" : "bg-heritage-green-soft text-heritage-green"
            }`}>{t}</button>
        ))}
      </div>

      {tab === "donations" && <DonationsTab />}
      {tab === "projects" && <ProjectsTab />}
      {tab === "volunteers" && <VolunteersTab />}
      {tab === "messages" && <MessagesTab />}
    </div>
  );
}

function DonationsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-donations"],
    queryFn: async () => {
      const { data } = await supabase.from("donations")
        .select("*, project:projects(title)")
        .order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const update = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase.from("donations").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-donations"] }); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this donation?")) return;
    const { error } = await supabase.from("donations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-donations"] }); }
  };

  return (
    <div className="bg-ink text-white rounded-2xl p-4 md:p-6 overflow-x-auto">
      <table className="w-full text-sm min-w-[800px]">
        <thead>
          <tr className="text-white/40 text-[10px] uppercase tracking-widest border-b border-white/10">
            <th className="text-left pb-3">Donor</th><th className="text-left pb-3">Project</th>
            <th className="text-left pb-3">Amount</th><th className="text-left pb-3">Method / Txn</th>
            <th className="text-left pb-3">Status</th><th className="text-left pb-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data?.map((d) => (
            <tr key={d.id} className="border-b border-white/5">
              <td className="py-3">
                <p className="font-semibold">{d.is_anonymous ? "Anonymous" : d.donor_name}</p>
                <p className="text-xs text-white/40">{d.donor_email}</p>
              </td>
              <td className="py-3 text-white/70">{(d.project as { title?: string } | null)?.title ?? "General"}</td>
              <td className="py-3 font-bold">{formatBDT(d.amount)}</td>
              <td className="py-3 text-xs text-white/70">{d.payment_method}<br/><span className="text-white/40">{d.transaction_ref}</span></td>
              <td className="py-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  d.status === "verified" ? "bg-green-500/20 text-green-300" :
                  d.status === "rejected" ? "bg-red-500/20 text-red-300" :
                  "bg-yellow-500/20 text-yellow-300"
                }`}>{d.status}</span>
              </td>
              <td className="py-3">
                <div className="flex gap-1">
                  {d.status !== "verified" && (
                    <button onClick={() => update(d.id, "verified")} className="text-xs px-2 py-1 bg-heritage-green rounded">Verify</button>
                  )}
                  {d.status !== "rejected" && (
                    <button onClick={() => update(d.id, "rejected")} className="text-xs px-2 py-1 bg-white/10 rounded">Reject</button>
                  )}
                  <button onClick={() => del(d.id)} className="text-xs px-2 py-1 hover:text-heritage-red"><Trash2 className="size-3" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VolunteersTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-volunteers"],
    queryFn: async () => {
      const { data } = await supabase.from("volunteers").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const update = async (id: string, status: "approved" | "declined" | "postponed" | "blocked") => {
    const note = prompt(`Admin note for ${status}?`) ?? null;
    const { error } = await supabase.from("volunteers")
      .update({ status, admin_notes: note, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Marked ${status}`); qc.invalidateQueries({ queryKey: ["admin-volunteers"] }); }
  };

  return (
    <div className="grid gap-4">
      {data?.map((v) => (
        <div key={v.id} className="card-surface p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-bold text-lg">{v.full_name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  v.status === "approved" ? "bg-heritage-green text-white" :
                  v.status === "declined" || v.status === "blocked" ? "bg-heritage-red/10 text-heritage-red" :
                  v.status === "postponed" ? "bg-amber-100 text-amber-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>{v.status}</span>
              </div>
              <p className="text-sm text-ink-soft">{v.email} · {v.phone} · {v.district}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {v.skills?.map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 bg-heritage-green-soft text-heritage-green rounded-full">{s}</span>
                ))}
              </div>
              <p className="text-sm mt-3 text-ink-soft italic">"{v.motivation}"</p>
              {v.admin_notes && <p className="text-xs mt-2 text-heritage-red">Note: {v.admin_notes}</p>}
            </div>
            <div className="grid grid-cols-2 md:flex md:flex-col gap-1 shrink-0">
              <button onClick={() => update(v.id, "approved")} className="text-xs px-3 py-1.5 bg-heritage-green text-white rounded inline-flex items-center gap-1">
                <CheckCircle className="size-3" /> Approve
              </button>
              <button onClick={() => update(v.id, "postponed")} className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded inline-flex items-center gap-1">
                <Pause className="size-3" /> Postpone
              </button>
              <button onClick={() => update(v.id, "declined")} className="text-xs px-3 py-1.5 bg-heritage-red/10 text-heritage-red rounded inline-flex items-center gap-1">
                <XCircle className="size-3" /> Decline
              </button>
              <button onClick={() => update(v.id, "blocked")} className="text-xs px-3 py-1.5 bg-ink text-white rounded inline-flex items-center gap-1">
                <Ban className="size-3" /> Block
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectsTab() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const updateTarget = async (id: string, newTarget: number) => {
    const { error } = await supabase.from("projects").update({ target_amount: newTarget, status: "active" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Target updated"); qc.invalidateQueries({ queryKey: ["admin-projects"] }); }
  };

  const updateStatus = async (id: string, status: "active" | "paused" | "closed") => {
    const { error } = await supabase.from("projects").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-projects"] }); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-projects"] }); }
  };

  return (
    <div>
      <button onClick={() => setShowNew(!showNew)} className="btn-primary mb-4">
        <Plus className="size-4" /> New Project
      </button>
      {showNew && <NewProjectForm onDone={() => { setShowNew(false); qc.invalidateQueries({ queryKey: ["admin-projects"] }); }} />}

      <div className="grid gap-4 mt-4">
        {data?.map((p) => (
          <div key={p.id} className="card-surface p-5">
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold">{p.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-heritage-green-soft text-heritage-green rounded-full uppercase font-bold">{p.status}</span>
                </div>
                <p className="text-sm text-ink-soft">{p.category} · {p.district}</p>
                <p className="text-sm mt-2"><strong>{formatBDT(p.raised_amount)}</strong> / {formatBDT(p.target_amount)} · {p.donor_count} donors</p>
              </div>
              <div className="flex flex-wrap gap-1 shrink-0">
                <button onClick={() => { const n = prompt("New target amount (BDT):", String(p.target_amount)); if (n) updateTarget(p.id, Number(n)); }}
                  className="text-xs px-3 py-1.5 bg-heritage-green-soft text-heritage-green rounded">Reschedule Target</button>
                {p.status !== "active" && <button onClick={() => updateStatus(p.id, "active")} className="text-xs px-3 py-1.5 bg-heritage-green text-white rounded">Activate</button>}
                {p.status !== "paused" && <button onClick={() => updateStatus(p.id, "paused")} className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded">Pause</button>}
                {p.status !== "closed" && <button onClick={() => updateStatus(p.id, "closed")} className="text-xs px-3 py-1.5 bg-ink text-white rounded">Close</button>}
                <button onClick={() => del(p.id)} className="text-xs px-2 py-1.5 text-heritage-red"><Trash2 className="size-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewProjectForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ title: "", slug: "", short_description: "", description: "", category: "Education", district: "Dhaka", target_amount: 100000, end_date: "" });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("projects").insert({ ...form, slug, end_date: form.end_date || null });
    if (error) toast.error(error.message);
    else { toast.success("Project created"); onDone(); }
  };
  return (
    <form onSubmit={submit} className="card-surface p-6 space-y-3 mb-4">
      <input className="input-base" placeholder="Title" required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
      <input className="input-base" placeholder="Slug (auto)" value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} />
      <input className="input-base" placeholder="Short description" required value={form.short_description} onChange={(e) => setForm({...form, short_description: e.target.value})} />
      <textarea className="input-base resize-none" rows={4} placeholder="Full description" required value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input-base" placeholder="Category" required value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} />
        <input className="input-base" placeholder="District" value={form.district} onChange={(e) => setForm({...form, district: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input className="input-base" type="number" placeholder="Target (BDT)" required value={form.target_amount} onChange={(e) => setForm({...form, target_amount: Number(e.target.value)})} />
        <input className="input-base" type="date" value={form.end_date} onChange={(e) => setForm({...form, end_date: e.target.value})} />
      </div>
      <button className="btn-primary w-full" type="submit">Create Project</button>
    </form>
  );
}

function MessagesTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const toggleRead = async (id: string, is_read: boolean) => {
    await supabase.from("contact_messages").update({ is_read: !is_read }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-messages"] });
  };
  return (
    <div className="grid gap-3">
      {data?.map((m) => (
        <div key={m.id} className={`card-surface p-5 ${m.is_read ? "opacity-60" : ""}`}>
          <div className="flex justify-between gap-3 mb-2">
            <div>
              <p className="font-bold">{m.subject}</p>
              <p className="text-xs text-ink-soft">{m.name} · {m.email}{m.phone ? ` · ${m.phone}` : ""} · {new Date(m.created_at).toLocaleString()}</p>
            </div>
            <button onClick={() => toggleRead(m.id, m.is_read)} className="text-xs btn-ghost">
              {m.is_read ? "Mark unread" : "Mark read"}
            </button>
          </div>
          <p className="text-sm text-ink-soft whitespace-pre-wrap">{m.message}</p>
        </div>
      ))}
    </div>
  );
}
