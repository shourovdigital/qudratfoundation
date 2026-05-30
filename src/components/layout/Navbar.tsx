import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/organogram", label: "Organogram" },
  { to: "/projects", label: "Projects" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/news", label: "News & Media" },
  { to: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("site_settings").select("foundation_name, logo_url").eq("id", 1).maybeSingle();
      return data as { foundation_name: string; logo_url: string | null } | null;
    },
    staleTime: 60_000,
  });

  return (
    <nav className="sticky top-0 z-50 bg-sand-light/85 backdrop-blur-md border-b border-heritage-green/10">
      <div className="container-page flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 group">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={settings.foundation_name} className="size-9 rounded-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="size-9 bg-heritage-green rounded-full flex items-center justify-center text-white font-bold font-display group-hover:scale-105 transition-transform">
              ক
            </div>
          )}
          <span className="font-display text-lg tracking-tight text-heritage-green font-bold">
            {settings?.foundation_name ?? "Qudrat"}
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to || (l.to !== "/" && pathname.startsWith(l.to));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 text-sm font-medium rounded-full transition-colors ${
                  active ? "text-heritage-green bg-heritage-green-soft" : "text-ink-soft hover:text-heritage-green"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2">
          {user ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="btn-ghost text-heritage-red">Admin</Link>
              )}
              <Link to="/dashboard" className="btn-outline">
                <UserIcon className="size-4" /> Dashboard
              </Link>
              <button onClick={signOut} className="btn-ghost" aria-label="Sign out">
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-outline">Login</Link>
          )}
          <Link to="/volunteer" className="btn-outline">Volunteer</Link>
          <Link to="/donate" className="btn-primary">Donate Now</Link>
        </div>

        <button
          className="lg:hidden p-2 text-heritage-green"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-heritage-green/10 bg-sand-light">
          <div className="container-page py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-ink-soft hover:text-heritage-green rounded-lg"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-heritage-green/10 mt-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setOpen(false)} className="btn-ghost justify-start">
                      Admin Panel
                    </Link>
                  )}
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-outline">
                    Dashboard
                  </Link>
                  <button onClick={() => { signOut(); setOpen(false); }} className="btn-ghost">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)} className="btn-outline">Login</Link>
              )}
              <Link to="/donate" onClick={() => setOpen(false)} className="btn-primary">
                Donate Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
