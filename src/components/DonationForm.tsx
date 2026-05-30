import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const presets = [500, 1000, 2500, 5000, 10000];

const schema = z.object({
  donor_name: z.string().trim().min(2, "Name required").max(100),
  donor_email: z.string().trim().email("Invalid email").max(255).or(z.literal("")),
  donor_phone: z.string().trim().max(20).optional().or(z.literal("")),
  amount: z.number().min(50, "Minimum ৳50").max(10000000),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  is_anonymous: z.boolean(),
  payment_method: z.string().min(1, "Select method"),
  transaction_ref: z.string().trim().min(2, "Transaction reference required").max(100),
});

export function DonationForm({ projectId, onDone }: { projectId?: string; onDone?: () => void }) {
  const [amount, setAmount] = useState<number>(1000);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [method, setMethod] = useState("bKash");
  const [txn, setTxn] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({
      donor_name: name, donor_email: email, donor_phone: phone,
      amount, message, is_anonymous: anonymous,
      payment_method: method, transaction_ref: txn,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("donations").insert({
      project_id: projectId ?? null,
      donor_name: name,
      donor_email: email || null,
      donor_phone: phone || null,
      amount,
      message: message || null,
      is_anonymous: anonymous,
      payment_method: method,
      transaction_ref: txn,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Donation submitted! It will appear after admin verification.");
    setName(""); setEmail(""); setPhone(""); setMessage(""); setTxn(""); setAmount(1000);
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="text-xs font-bold uppercase tracking-widest text-ink-soft mb-2 block">
          Amount (BDT)
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                amount === p
                  ? "bg-heritage-green text-white border-heritage-green"
                  : "border-heritage-green/20 text-heritage-green hover:bg-heritage-green-soft"
              }`}
            >
              ৳ {p.toLocaleString()}
            </button>
          ))}
        </div>
        <input
          type="number" min={50} value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="input-base" placeholder="Custom amount"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name *" className="input-base" required />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="input-base" />
      </div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="input-base" />

      <div className="grid md:grid-cols-2 gap-4">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="input-base">
          <option>bKash</option>
          <option>Nagad</option>
          <option>Rocket</option>
          <option>Bank Transfer</option>
          <option>Card</option>
        </select>
        <input value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="Transaction ID *" className="input-base" required />
      </div>

      <textarea
        value={message} onChange={(e) => setMessage(e.target.value)}
        placeholder="Leave a message (optional)" rows={3} className="input-base resize-none"
      />

      <label className="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}
          className="size-4 accent-heritage-green" />
        Donate anonymously
      </label>

      <div className="rounded-xl bg-heritage-green-soft p-4 text-xs text-ink-soft">
        <strong className="text-heritage-green">Payment instructions:</strong> Send the amount to bKash/Nagad
        <strong> 01XXXXXXXXX</strong> (Personal) and enter the transaction ID above. Your donation will reflect
        on the live counter after admin verification.
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full text-base py-3">
        {submitting ? "Submitting..." : `Donate ৳ ${amount.toLocaleString()}`}
      </button>
    </form>
  );
}
