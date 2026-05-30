import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Users, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/volunteer")({
  head: () => ({
    meta: [
      { title: "Volunteer — Qudrat Foundation" },
      { name: "description", content: "Join 2,400+ volunteers working across 64 districts of Bangladesh." },
    ],
  }),
  component: Volunteer,
});

const districts = ["Dhaka","Chittagong","Sylhet","Rajshahi","Khulna","Barishal","Rangpur","Mymensingh","Comilla","Gazipur","Narayanganj","Bogura","Jessore","Dinajpur","Kushtia","Faridpur"];

const skillOptions = ["Teaching","Medical","Logistics","Fundraising","Content Writing","Photography","Web/Tech","Translation","Field Coordination","Counselling"];

const schema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(10).max(20),
  district: z.string().min(1),
  age: z.number().min(15).max(80).optional(),
  occupation: z.string().trim().max(100).optional().or(z.literal("")),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  motivation: z.string().trim().min(20, "Tell us a bit more (min 20 chars)").max(1000),
  availability: z.string().trim().max(200).optional().or(z.literal("")),
});

function Volunteer() {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: user?.email ?? "", phone: "", district: "",
    age: "", occupation: "", motivation: "", availability: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggle = (s: string) =>
    setSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      ...form,
      age: form.age ? Number(form.age) : undefined,
      skills,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please complete the form");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("volunteers").insert({
      user_id: user?.id ?? null,
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      district: form.district,
      age: form.age ? Number(form.age) : null,
      occupation: form.occupation || null,
      skills,
      motivation: form.motivation,
      availability: form.availability || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setSubmitted(true);
    toast.success("Application submitted!");
  };

  if (submitted) {
    return (
      <div className="container-page py-20 max-w-2xl text-center">
        <CheckCircle2 className="size-16 text-heritage-green mx-auto mb-6" strokeWidth={1.5} />
        <h1 className="font-display text-4xl md:text-5xl text-heritage-green mb-4">
          Application received!
        </h1>
        <p className="text-lg text-ink-soft mb-8">
          Thank you for stepping forward. Our team will review your application within 48 hours and
          contact you on the email/phone you provided. If you don't already have a member login,
          create one with the same email to access your dashboard once approved.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="/login" className="btn-primary">Create Login</a>
          <a href="/projects" className="btn-outline">Browse Projects</a>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12 md:py-20">
      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div>
          <Users className="size-10 text-heritage-green mb-5" strokeWidth={1.5} />
          <h1 className="font-display text-5xl md:text-6xl text-heritage-green leading-tight mb-5">
            Be part of the change.
          </h1>
          <p className="text-lg text-ink-soft mb-8 leading-relaxed">
            Whether you have a few hours a month or a few hours a week — every skill matters.
            Apply below and our coordinators will match you with active projects in your district.
          </p>
          <div className="card-surface p-6 mb-4">
            <h3 className="font-bold mb-3">What to expect</h3>
            <ol className="space-y-2 text-sm text-ink-soft">
              <li>1. Submit this application.</li>
              <li>2. Admin reviews within 48 hours — approved / postponed / declined.</li>
              <li>3. Approved members get login access to the member dashboard.</li>
              <li>4. Get matched with district coordinators for active projects.</li>
            </ol>
          </div>
        </div>

        <form onSubmit={submit} className="card-surface p-6 md:p-8 space-y-5">
          <h2 className="font-display text-2xl mb-2">Volunteer Application</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input className="input-base" placeholder="Full Name *" required
              value={form.full_name} onChange={(e) => setForm({...form, full_name: e.target.value})} />
            <input className="input-base" placeholder="Email *" type="email" required
              value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input className="input-base" placeholder="Phone *" required
              value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
            <select className="input-base" required
              value={form.district} onChange={(e) => setForm({...form, district: e.target.value})}>
              <option value="">Select District *</option>
              {districts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <input className="input-base" placeholder="Age" type="number" min={15} max={80}
              value={form.age} onChange={(e) => setForm({...form, age: e.target.value})} />
            <input className="input-base" placeholder="Occupation"
              value={form.occupation} onChange={(e) => setForm({...form, occupation: e.target.value})} />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-ink-soft mb-2 block">
              Skills * (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map((s) => (
                <button key={s} type="button" onClick={() => toggle(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    skills.includes(s)
                      ? "bg-heritage-green text-white border-heritage-green"
                      : "border-heritage-green/20 text-heritage-green hover:bg-heritage-green-soft"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <textarea className="input-base resize-none" rows={4} required
            placeholder="Why do you want to volunteer with us? *"
            value={form.motivation} onChange={(e) => setForm({...form, motivation: e.target.value})} />
          <input className="input-base"
            placeholder="When are you available? (e.g. Weekends, 4 hrs/week)"
            value={form.availability} onChange={(e) => setForm({...form, availability: e.target.value})} />

          <button type="submit" disabled={submitting} className="btn-primary w-full text-base py-3">
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
          <p className="text-[10px] text-center text-ink-soft uppercase tracking-widest">
            Member access granted following admin approval
          </p>
        </form>
      </div>
    </div>
  );
}
