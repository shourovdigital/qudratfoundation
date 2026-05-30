import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatBDT } from "@/lib/format";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Pause, Ban, Plus, Trash2, Upload, Image as ImageIcon, Play, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/login" });
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
    if (!roles?.some((r) => r.role === "admin")) throw redirect({ to: "/dashboard" });
  },
  component: Admin,
});

type Tab = "donations" | "projects" | "portfolios" | "news" | "volunteers" | "messages" | "settings";

function Admin() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("donations");
  if (!isAdmin) return null;

  const tabs: Tab[] = ["donations", "projects", "portfolios", "news", "volunteers", "messages", "settings"];

  return (
    <div className="container-page py-12 md:py-16">
      <div className="flex items-center gap-3 mb-2">
        <Shield className="size-6 text-heritage-red" />
        <h1 className="font-display text-4xl md:text-5xl text-heritage-green">Admin Panel</h1>
      </div>
      <p className="text-ink-soft mb-8">Manage everything — donations, projects, news, volunteers and foundation settings.</p>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-semibold capitalize whitespace-nowrap transition-all ${
              tab === t ? "bg-heritage-green text-white" : "bg-heritage-green-soft text-heritage-green"
            }`}>{t}</button>
        ))}
      </div>

      {tab === "donations" && <DonationsTab />}
      {tab === "projects" && <ProjectsTab />}
      {tab === "portfolios" && <PortfoliosTab />}
      {tab === "news" && <NewsTab />}
      {tab === "volunteers" && <VolunteersTab />}
      {tab === "messages" && <MessagesTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

function DonationsTab() {
  const qc = useQueryClient();
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const { data: projects } = useQuery({
    queryKey: ["all-projects-mini"],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("id, title").order("title");
      return data ?? [];
    },
  });

  const { data } = useQuery({
    queryKey: ["admin-donations", projectFilter, statusFilter, from, to],
    queryFn: async () => {
      let q = supabase.from("donations").select("*, project:projects(title)").order("created_at", { ascending: false }).limit(500);
      if (projectFilter === "__general__") q = q.is("project_id", null);
      else if (projectFilter) q = q.eq("project_id", projectFilter);
      if (statusFilter) q = q.eq("status", statusFilter as "pending" | "verified" | "rejected");
      if (from) q = q.gte("created_at", new Date(from).toISOString());
      if (to) {
        const end = new Date(to); end.setHours(23, 59, 59, 999);
        q = q.lte("created_at", end.toISOString());
      }
      const { data } = await q;
      return data ?? [];
    },
  });

  const totalVerified = (data ?? []).filter((d) => d.status === "verified").reduce((a, b) => a + Number(b.amount), 0);
  const totalPending = (data ?? []).filter((d) => d.status === "pending").reduce((a, b) => a + Number(b.amount), 0);

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
    <div className="space-y-4">
      {/* Filters */}
      <div className="card-surface p-4 grid md:grid-cols-5 gap-3">
        <select className="input-base" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All projects</option>
          <option value="__general__">General (no project)</option>
          {projects?.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select className="input-base" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <input className="input-base" type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
        <input className="input-base" type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" />
        <button className="btn-ghost" onClick={() => { setProjectFilter(""); setStatusFilter(""); setFrom(""); setTo(""); }}>Reset</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card-surface p-4">
          <p className="text-[10px] uppercase tracking-widest text-ink-soft font-bold">Verified Total</p>
          <p className="font-display text-2xl text-heritage-green">{formatBDT(totalVerified)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-[10px] uppercase tracking-widest text-ink-soft font-bold">Pending Total</p>
          <p className="font-display text-2xl text-amber-600">{formatBDT(totalPending)}</p>
        </div>
        <div className="card-surface p-4">
          <p className="text-[10px] uppercase tracking-widest text-ink-soft font-bold">Records</p>
          <p className="font-display text-2xl">{data?.length ?? 0}</p>
        </div>
      </div>

      <div className="bg-ink text-white rounded-2xl p-4 md:p-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-white/40 text-[10px] uppercase tracking-widest border-b border-white/10">
              <th className="text-left pb-3">Date</th>
              <th className="text-left pb-3">Donor</th><th className="text-left pb-3">Project</th>
              <th className="text-left pb-3">Amount</th><th className="text-left pb-3">Method / Txn</th>
              <th className="text-left pb-3">Status</th><th className="text-left pb-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((d) => (
              <tr key={d.id} className="border-b border-white/5">
                <td className="py-3 text-xs text-white/60 whitespace-nowrap">{new Date(d.created_at).toLocaleDateString("en-GB")}</td>
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
            {(data?.length ?? 0) === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-white/40">No donations match the filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
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

function PortfoliosTab() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin-portfolios"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("portfolios").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Array<{ id: string; title: string; slug: string; category: string; district: string | null; beneficiaries: number; budget_spent: number; is_published: boolean; is_featured: boolean; completed_date: string | null }>;
    },
  });

  const toggle = async (id: string, field: "is_published" | "is_featured", value: boolean) => {
    const { error } = await (supabase as any).from("portfolios").update({ [field]: value }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-portfolios"] }); }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this portfolio entry?")) return;
    const { error } = await (supabase as any).from("portfolios").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-portfolios"] }); }
  };

  return (
    <div>
      <button onClick={() => setShowNew(!showNew)} className="btn-primary mb-4">
        <Plus className="size-4" /> New Portfolio
      </button>
      {showNew && <NewPortfolioForm onDone={() => { setShowNew(false); qc.invalidateQueries({ queryKey: ["admin-portfolios"] }); }} />}

      <div className="grid gap-4 mt-4">
        {data?.map((p) => (
          <div key={p.id} className="card-surface p-5">
            <div className="flex flex-col md:flex-row md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold">{p.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 bg-heritage-green-soft text-heritage-green rounded-full uppercase font-bold">{p.category}</span>
                  {p.is_featured && <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full uppercase font-bold">Featured</span>}
                  {!p.is_published && <span className="text-[10px] px-2 py-0.5 bg-ink text-white rounded-full uppercase font-bold">Draft</span>}
                </div>
                <p className="text-sm text-ink-soft">/{p.slug} · {p.district ?? "—"}</p>
                <p className="text-sm mt-2"><strong>{formatBDT(p.budget_spent)}</strong> spent · {p.beneficiaries} reached{p.completed_date ? ` · ${new Date(p.completed_date).toLocaleDateString()}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-1 shrink-0">
                <button onClick={() => toggle(p.id, "is_published", !p.is_published)} className="text-xs px-3 py-1.5 bg-heritage-green-soft text-heritage-green rounded">
                  {p.is_published ? "Unpublish" : "Publish"}
                </button>
                <button onClick={() => toggle(p.id, "is_featured", !p.is_featured)} className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded">
                  {p.is_featured ? "Unfeature" : "Feature"}
                </button>
                <button onClick={() => del(p.id)} className="text-xs px-2 py-1.5 text-heritage-red"><Trash2 className="size-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewPortfolioForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    title: "", slug: "", category: "Education", district: "Dhaka",
    short_description: "", description: "", cover_image_url: "", impact_summary: "",
    beneficiaries: 0, budget_spent: 0, completed_date: "", is_featured: false,
  });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const payload = {
      ...form, slug,
      cover_image_url: form.cover_image_url || null,
      impact_summary: form.impact_summary || null,
      completed_date: form.completed_date || null,
    };
    const { error } = await (supabase as any).from("portfolios").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Portfolio created"); onDone(); }
  };
  return (
    <form onSubmit={submit} className="card-surface p-6 space-y-3 mb-4">
      <input className="input-base" placeholder="Title" required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
      <input className="input-base" placeholder="Slug (auto)" value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} />
      <input className="input-base" placeholder="Short description" required value={form.short_description} onChange={(e) => setForm({...form, short_description: e.target.value})} />
      <textarea className="input-base resize-none" rows={4} placeholder="Full description (newline = paragraph)" required value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input-base" placeholder="Category" required value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} />
        <input className="input-base" placeholder="District" value={form.district} onChange={(e) => setForm({...form, district: e.target.value})} />
      </div>
      <input className="input-base" placeholder="Cover image URL" value={form.cover_image_url} onChange={(e) => setForm({...form, cover_image_url: e.target.value})} />
      <input className="input-base" placeholder="Impact summary (one line)" value={form.impact_summary} onChange={(e) => setForm({...form, impact_summary: e.target.value})} />
      <div className="grid grid-cols-3 gap-3">
        <input className="input-base" type="number" placeholder="Beneficiaries" value={form.beneficiaries} onChange={(e) => setForm({...form, beneficiaries: Number(e.target.value)})} />
        <input className="input-base" type="number" placeholder="Budget spent (BDT)" value={form.budget_spent} onChange={(e) => setForm({...form, budget_spent: Number(e.target.value)})} />
        <input className="input-base" type="date" value={form.completed_date} onChange={(e) => setForm({...form, completed_date: e.target.value})} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({...form, is_featured: e.target.checked})} />
        Mark as featured
      </label>
      <button className="btn-primary w-full" type="submit">Create Portfolio</button>
    </form>
  );
}
