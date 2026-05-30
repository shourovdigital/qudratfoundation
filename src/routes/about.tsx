import { createFileRoute } from "@tanstack/react-router";
import { Heart, Eye, Hand, Users } from "lucide-react";
import teamImage from "@/assets/about-team.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Qudrat Foundation" },
      { name: "description", content: "Our mission, values, and the story behind Qudrat Foundation." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="container-page py-12 md:py-20">
      <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-center mb-20">
        <div className="lg:col-span-3">
          <h1 className="font-display text-5xl md:text-7xl text-heritage-green leading-tight mb-6">
            A foundation built on <span className="text-heritage-red">trust</span>, not promises.
          </h1>
          <p className="text-xl text-ink-soft leading-relaxed">
            Qudrat Foundation is a registered non-profit organization based in Dhaka, working
            across all 64 districts of Bangladesh to deliver dignified aid, sustainable livelihoods,
            and educational opportunity — with radical transparency at every step.
          </p>
        </div>
        <div className="lg:col-span-2">
          <img
            src={teamImage}
            alt="Qudrat Foundation team collaborating"
            className="w-full aspect-[4/3] object-cover rounded-3xl shadow-elevated"
            loading="lazy"
            width={1600}
            height={1067}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-20">
        <div className="card-surface p-8">
          <Eye className="size-8 text-heritage-green mb-4" strokeWidth={1.5} />
          <h2 className="font-display text-2xl mb-3">Our Vision</h2>
          <p className="text-ink-soft leading-relaxed">
            A Bangladesh where every citizen has access to basic needs, dignified work, and the
            opportunity to thrive — regardless of geography, gender, or circumstance.
          </p>
        </div>
        <div className="card-surface p-8">
          <Heart className="size-8 text-heritage-red mb-4" strokeWidth={1.5} />
          <h2 className="font-display text-2xl mb-3">Our Mission</h2>
          <p className="text-ink-soft leading-relaxed">
            To channel collective generosity into measurable, locally-led impact through transparent
            project-based giving and an army of skilled volunteers.
          </p>
        </div>
      </div>

      <div className="bg-heritage-green text-white rounded-3xl p-8 md:p-16 mb-20">
        <h2 className="font-display text-3xl md:text-4xl mb-10">Our Values</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Eye, title: "Radical Transparency", desc: "Every taka tracked publicly. Audits annually published." },
            { icon: Hand, title: "Dignified Aid", desc: "We work with communities, not on them." },
            { icon: Users, title: "Local Leadership", desc: "District-level teams make district-level decisions." },
          ].map((v) => (
            <div key={v.title}>
              <v.icon className="size-7 mb-3 opacity-90" strokeWidth={1.5} />
              <h3 className="font-display text-xl mb-2">{v.title}</h3>
              <p className="text-white/75 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl">
        <h2 className="font-display text-3xl md:text-4xl text-heritage-green mb-6">Our Story</h2>
        <div className="space-y-5 text-ink-soft leading-relaxed">
          <p>
            Qudrat Foundation began in 2020 as a small WhatsApp group of friends collecting funds
            for COVID-affected rickshaw pullers in Dhaka. Within months, we had distributed aid to
            over 4,000 families. By the end of the year, what started as a temporary initiative
            became a permanent commitment.
          </p>
          <p>
            Today, Qudrat runs structured, target-based campaigns across food security, education,
            health, and emergency relief. Every donation is project-tagged. Every project has a
            target. When the target is reached, donations close automatically — no overflow, no waste.
          </p>
          <p>
            We are accountable to our donors, our volunteers, and the communities we serve.
            Transparency is not a marketing feature for us — it is the foundation itself.
          </p>
        </div>
      </div>
    </div>
  );
}
