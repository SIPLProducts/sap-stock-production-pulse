import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import reslLogo from "@/assets/resl-logo.png.asset.json";

const REMEMBER_KEY = "hbl-remembered-identifier";

export const Route = createFileRoute("/auth")({
  // The auth client uses browser-backed session storage. Keeping this route
  // client-only prevents preview storage timing from breaking the login page.
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — RESL MIS Portal" },
      {
        name: "description",
        content: "Sign in to the RESL MIS Portal to view SAP KPI dashboards and analytics reports.",
      },
      { property: "og:title", content: "Sign in — RESL MIS Portal" },
      {
        property: "og:description",
        content: "Access role-based SAP MIS dashboards and analytics reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const rememberedIdentifier = localStorage.getItem(REMEMBER_KEY);

    if (rememberedIdentifier) {
      setIdentifier(rememberedIdentifier);
      setRemember(true);
    }

    // Session restoration is an enhancement, never a prerequisite for showing
    // the form. A storage/network failure must leave the user on this page.
    try {
      void supabase.auth
        .getUser()
        .then(({ data, error }) => {
          if (active && !error && data.user) {
            void navigate({ to: "/launchpad", replace: true });
          }
        })
        .catch((error: unknown) => {
          console.warn("Unable to restore the existing login session", error);
        });
    } catch (error) {
      console.warn("Unable to initialize login session restoration", error);
    }

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      let loginEmail = identifier.trim();
      if (!loginEmail.includes("@")) {
        const { data, error } = await supabase.rpc("resolve_login_email", {
          _identifier: loginEmail,
        });
        if (error || !data) throw new Error("Invalid credentials or the account is inactive");
        loginEmail = data;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });
      if (error) {
        if (/confirm/i.test(error.message)) {
          throw new Error(
            "This account is not activated yet — ask your administrator to activate it in User Management.",
          );
        }
        throw new Error(error.message);
      }

      if (remember) localStorage.setItem(REMEMBER_KEY, identifier.trim());
      else localStorage.removeItem(REMEMBER_KEY);
      navigate({ to: "/launchpad" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="relative hidden flex-col overflow-hidden bg-[var(--neu-surface)] p-10 text-foreground lg:flex">
        {/* radial glow behind copy */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/10 blur-3xl"
        />

        <div className="relative flex flex-1 flex-col items-center justify-center text-center">
          <img src={reslLogo.url} alt="RESL logo" className="w-[22rem] max-w-full h-auto select-none" />


          <div className="mt-10 flex items-center justify-center gap-3">
            <span className="h-1 w-12 rounded-full bg-gold" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Management Information System
            </p>
            <span className="h-1 w-12 rounded-full bg-gold" />
          </div>
          <h2 className="mt-5 max-w-md text-3xl leading-tight font-light">
            RESL MIS Portal — SAP reports, KPIs and analytics in one launchpad.
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Role-based tiles, live KPIs and drill-down analytics across Sales, Finance, Quality,
            Production and more — delivered straight from your SAP landscape.
          </p>
        </div>

        <p className="relative text-center text-xs text-muted-foreground">RESL MIS Portal</p>
      </div>

      {/* Right sign-in panel */}
      <div className="relative flex items-center justify-center bg-[var(--neu-surface)] p-6">
        <div className="flex w-full max-w-[34rem] flex-col items-center justify-center rounded-3xl bg-[var(--neu-surface)] px-8 py-10 shadow-[var(--shadow-neu-raised)] md:aspect-square md:rounded-full md:px-20">
          <img src={reslLogo.url} alt="RESL logo" className="h-12 w-auto" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground">Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your account</p>

          <form onSubmit={handleSignIn} className="mt-7 w-full max-w-sm space-y-5">
            <div className="relative rounded-xl bg-[var(--neu-surface)] shadow-[var(--shadow-neu-inset)] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[image:var(--gradient-brand)]">
              <Label htmlFor="identifier" className="sr-only">Email or username</Label>
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="identifier" type="text" autoComplete="username" placeholder="Email or username" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="h-12 rounded-xl border-0 bg-transparent pl-11 shadow-none focus-visible:ring-0" />
            </div>
            <div className="relative rounded-xl bg-[var(--neu-surface)] shadow-[var(--shadow-neu-inset)] after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[image:var(--gradient-brand)]">
              <Label htmlFor="password" className="sr-only">Password</Label>
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl border-0 bg-transparent pl-11 shadow-none focus-visible:ring-0 pr-11" />
              <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} />
                Remember me
              </label>
              <button type="button" className="text-xs text-muted-foreground hover:text-foreground hover:underline" onClick={() => toast.info("Please contact your administrator to reset your password.")}>
                Forgot password?
              </button>
            </div>

            <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-[image:var(--gradient-brand)] text-sm font-bold tracking-[0.25em] text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-95">
              {busy ? "SIGNING IN…" : "SIGN IN"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Authorised RESL staff only</p>
          </form>
        </div>
      </div>
    </div>
  );
}
