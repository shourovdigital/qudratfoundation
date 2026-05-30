import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Odhikar Foundation" },
      { name: "description", content: "Get in touch with the Odhikar Foundation team." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(2000),
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name, email: form.email, phone: form.phone || null,
      subject: form.subject, message: form.message,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Message sent! We'll respond within 48 hours.");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="container-page py-12 md:py-20">
      <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <div>
          <h1 className="font-display text-5xl md:text-6xl text-heritage-green leading-tight mb-5">
            Let's talk.
          </h1>
          <p className="text-lg text-ink-soft mb-10 leading-relaxed">
            For partnerships, press, project proposals, or just a hello — reach us directly.
          </p>

          <div className="space-y-5">
            <ContactItem icon={<Mail />} label="Email" value="hello@odhikar.org" href="mailto:hello@odhikar.org" />
            <ContactItem icon={<Phone />} label="Phone" value="+880 1700 000000" href="tel:+8801700000000" />
            <ContactItem icon={<MapPin />} label="Office" value="House 12, Road 7, Gulshan-2, Dhaka 1212" />
          </div>

          <div className="mt-10 p-6 rounded-2xl bg-heritage-green-soft">
            <p className="text-sm text-ink-soft">
              <strong className="text-heritage-green">Response time:</strong> We aim to respond to all
              messages within 48 hours, Sunday through Thursday.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="card-surface p-6 md:p-8 space-y-5 lg:sticky lg:top-24 self-start">
          <h2 className="font-display text-2xl mb-1">Send a message</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <input className="input-base" placeholder="Your Name *" required
              value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            <input className="input-base" placeholder="Email *" type="email" required
              value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
          </div>
          <input className="input-base" placeholder="Phone (optional)"
            value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
          <input className="input-base" placeholder="Subject *" required
            value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} />
          <textarea className="input-base resize-none" rows={6} required
            placeholder="Your message *"
            value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} />

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            <Send className="size-4" /> {submitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ContactItem({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href?: string }) {
  const Tag = href ? "a" : "div";
  return (
    <Tag href={href} className="flex items-start gap-4 group">
      <div className="size-11 rounded-full bg-heritage-green-soft text-heritage-green grid place-items-center shrink-0 group-hover:bg-heritage-green group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-soft">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </Tag>
  );
}
