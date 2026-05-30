import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login — Odhikar Foundation" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created! You can now login.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-16rem)] grid place-items-center px-5 py-16">
      <div className="card-surface p-8 md:p-10 w-full max-w-md">
        <h1 className="font-display text-3xl text-heritage-green mb-2">
          {mode === "login" ? "Welcome back" : "Create account"}
        </h1>
        <p className="text-sm text-ink-soft mb-6">
          {mode === "login"
            ? "Login to access your member dashboard."
            : "Create your member account. Volunteer approval grants full access."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <input className="input-base" placeholder="Full Name" required
              value={fullName} onChange={(e) => setFullName(e.target.value)} />
          )}
          <input className="input-base" placeholder="Email" type="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-base" placeholder="Password" type="password" required minLength={6}
            value={password} onChange={(e) => setPassword(e.target.value)} />

          <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-ink-soft">
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button onClick={() => setMode("signup")} className="text-heritage-green font-semibold hover:underline">
                Sign up
              </button>
            </>
          ) : (
            <>Already a member?{" "}
              <button onClick={() => setMode("login")} className="text-heritage-green font-semibold hover:underline">
                Login
              </button>
            </>
          )}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-heritage-green-soft text-xs text-ink-soft">
          Want to volunteer with us? <Link to="/volunteer" className="text-heritage-green font-bold underline">Apply here →</Link>
        </div>
      </div>
    </div>
  );
}
