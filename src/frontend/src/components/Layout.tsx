import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@tanstack/react-router";
import {
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  LogIn,
  LogOut,
  Menu,
  Search,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";
import SearchDropdown from "./SearchDropdown";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/events", label: "Events", icon: ListChecks },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/team", label: "Team", icon: UsersRound },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
  onClick?: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      activeOptions={{ exact: to === "/" }}
      className="sidebar-nav-item"
      activeProps={{ className: "sidebar-nav-item active" }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1">{label}</span>
    </Link>
  );
}

function MobileNavItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-colors text-muted-foreground hover:text-foreground"
      activeProps={{
        className:
          "flex flex-col items-center gap-0.5 px-3 py-1 rounded-md transition-colors text-accent",
      }}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}

function SidebarContent({
  onClose,
  searchQuery,
  setSearchQuery,
  showSearch,
  setShowSearch,
}: {
  onClose?: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
}) {
  const { login, clear, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { data: profile } = useUserProfile();
  const isLoggedIn = loginStatus === "success" || !!identity;
  const principalStr = identity?.getPrincipal().toString() ?? "";
  const displayName =
    profile?.name || (principalStr ? `${principalStr.slice(0, 8)}…` : "Guest");
  const initials = (profile?.name ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full">
      {/* ── Logo ──────────────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-5 flex items-center justify-between border-b border-sidebar-border/60">
        <div className="flex items-center gap-3">
          {/* Logo mark — amber square with calendar icon */}
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center shadow-sm">
            <CalendarDays className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <span className="font-display font-bold text-sidebar-foreground text-base tracking-tight leading-none block">
              EventFlow
            </span>
            <span className="text-[10px] text-sidebar-foreground/40 font-medium uppercase tracking-widest">
              Pro
            </span>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Search ────────────────────────────────────────────── */}
      <div className="px-3 pt-4 pb-3 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/35" />
          <input
            type="text"
            placeholder="Search events…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-sidebar-accent rounded-lg text-sidebar-foreground placeholder:text-sidebar-foreground/35 border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-ring transition-colors"
          />
        </div>
        {showSearch && searchQuery.trim().length > 0 && (
          <SearchDropdown
            keyword={searchQuery}
            onClose={() => {
              setShowSearch(false);
              setSearchQuery("");
            }}
          />
        )}
      </div>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
        <p className="px-3 py-1.5 mb-0.5 text-[10px] font-bold text-sidebar-foreground/35 uppercase tracking-[0.12em]">
          Menu
        </p>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavItem
            key={to}
            to={to}
            label={label}
            icon={icon}
            onClick={onClose}
          />
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border mt-2">
        {isInitializing ? (
          <div className="flex items-center gap-3 px-1">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="flex-1 h-4 rounded" />
          </div>
        ) : isLoggedIn ? (
          <div className="flex items-center gap-3">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              {profile?.role && (
                <p className="text-xs text-sidebar-foreground/50 capitalize">
                  {profile.role}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={clear}
              title="Log out"
              className="text-sidebar-foreground/40 hover:text-destructive transition-colors p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Button
            size="sm"
            className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
            onClick={login}
            disabled={loginStatus === "logging-in"}
          >
            <LogIn className="w-3.5 h-3.5 mr-2" />
            {loginStatus === "logging-in" ? "Connecting…" : "Sign In"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-sidebar border-r border-sidebar-border">
        <SidebarContent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border z-50 flex flex-col lg:hidden"
            >
              <SidebarContent
                onClose={() => setSidebarOpen(false)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showSearch={showSearch}
                setShowSearch={setShowSearch}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            <span className="font-display font-bold text-foreground">
              EventFlow
            </span>
          </div>
          <div className="w-9" />
        </header>

        {/* Page Content */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: dismiss search on main content click */}
        <main
          className="flex-1 overflow-y-auto"
          onClick={() => {
            if (showSearch) setShowSearch(false);
          }}
        >
          <motion.div
            key={router.state.location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="lg:hidden flex items-center justify-around border-t border-border bg-card px-2 py-2 shrink-0">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <MobileNavItem key={to} to={to} label={label} icon={icon} />
          ))}
        </nav>
      </div>
    </div>
  );
}
