import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { TeamMemberRole } from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { identity, login, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { actor } = useActor();
  const qc = useQueryClient();
  const registeredRef = useRef(false);

  // Auto-register user profile on first login
  useEffect(() => {
    if (!actor || !identity || registeredRef.current) return;
    registeredRef.current = true;
    (async () => {
      try {
        const profile = await actor.getCallerUserProfile();
        if (!profile) {
          await actor.saveCallerUserProfile({
            name: "Team Member",
            email: "",
            role: TeamMemberRole.member,
            isActive: true,
          });
          qc.invalidateQueries({ queryKey: ["userProfile"] });
        }
        // Refetch all data now that user is registered
        qc.invalidateQueries();
      } catch (e) {
        console.error("Auto-registration failed", e);
      }
    })();
  }, [actor, identity, qc]);

  // Full-screen spinner while initializing stored identity
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sidebar-primary flex items-center justify-center shadow-lg">
            <CalendarDays className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Login screen for unauthenticated users
  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative background elements */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.04] blur-3xl bg-sidebar-primary" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full opacity-[0.03] blur-3xl bg-accent" />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(var(--foreground) / 1) 1px, transparent 1px), linear-gradient(90deg, oklch(var(--foreground) / 1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            {/* Amber top accent line */}
            <div className="h-1 bg-accent w-full" />

            <div className="p-8 sm:p-10">
              {/* Logo */}
              <div className="flex flex-col items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-sidebar flex items-center justify-center shadow-lg">
                  <CalendarDays className="w-7 h-7 text-accent" />
                </div>
                <div className="text-center">
                  <h1 className="font-display font-bold text-2xl tracking-tight text-foreground">
                    EventFlow <span className="text-accent">Pro</span>
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Professional event management for your team
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-border" />
                <Lock className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Sign in prompt */}
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground">
                  Sign in to access your events, clients, and team dashboard.
                </p>
              </div>

              {/* Sign in button */}
              <Button
                size="lg"
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-base h-12"
                onClick={login}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Sign In with Internet Identity
                  </>
                )}
              </Button>

              {/* Note */}
              <p className="text-xs text-muted-foreground/60 text-center mt-4 leading-relaxed">
                Secure, decentralized login — no passwords required
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground/40 mt-6">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
