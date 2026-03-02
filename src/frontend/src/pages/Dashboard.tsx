import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import { StatusBadge, getStatusLabel } from "../components/EventBadges";
import { EventStatus, useAllClients, useDashboard } from "../hooks/useQueries";
import { formatDate, formatTime, nsToDate } from "../utils/dateTime";

const STATUS_ORDER: EventStatus[] = [
  EventStatus.planned,
  EventStatus.confirmed,
  EventStatus.inProgress,
  EventStatus.completed,
  EventStatus.cancelled,
];

// ─── Stat Card — refined KPI tile ────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  accentClass,
  borderClass,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accentClass: string;
  borderClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card
        className={`shadow-card hover:shadow-card-hover transition-shadow overflow-hidden border-l-4 ${borderClass}`}
      >
        <CardContent className="pt-5 pb-4 px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest truncate">
                {label}
              </p>
              <p className="text-4xl font-display font-bold mt-2 tracking-tight leading-none">
                {value}
              </p>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${accentClass}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: dashboard, isLoading } = useDashboard();
  const { data: clients = [] } = useAllClients();
  const navigate = useNavigate();

  const statusCounts = new Map<EventStatus, number>();
  for (const [status, count] of dashboard?.eventCountsByStatus ?? []) {
    statusCounts.set(status, Number(count));
  }

  const totalEventsTracked = STATUS_ORDER.reduce(
    (acc, s) => acc + (statusCounts.get(s) ?? 0),
    0,
  );

  const getClientName = (clientId: bigint) => {
    const c = clients.find((c) => c.id === clientId);
    return c?.name ?? "Unknown Client";
  };

  const today = new Date();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-16 w-72 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["a", "b", "c", "d"] as const).map((k) => (
            <Skeleton key={k} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  const todaysEvents = dashboard?.todaysEvents ?? [];
  const upcomingEvents = dashboard?.upcomingEvents ?? [];
  const overdueTasks = dashboard?.overdueTasks ?? [];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="pb-5 border-b border-border"
      >
        <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="text-accent font-semibold">
            {today.toLocaleDateString("en-US", { weekday: "long" })}
          </span>
          {", "}
          {today.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </motion.div>

      {/* ── Stats Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={CalendarDays}
          label="Total Events"
          value={totalEventsTracked}
          accentClass="bg-primary/10 text-primary"
          borderClass="border-l-primary/40"
          delay={0.05}
        />
        <StatCard
          icon={Clock}
          label="Today"
          value={todaysEvents.length}
          accentClass="bg-amber-100 text-amber-700"
          borderClass="border-l-amber-400"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Next 7 Days"
          value={upcomingEvents.length}
          accentClass="bg-emerald-50 text-emerald-600"
          borderClass="border-l-emerald-400"
          delay={0.15}
        />
        <StatCard
          icon={AlertTriangle}
          label="Overdue Tasks"
          value={overdueTasks.length}
          accentClass={
            overdueTasks.length > 0
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          }
          borderClass={
            overdueTasks.length > 0
              ? "border-l-destructive/60"
              : "border-l-border"
          }
          delay={0.2}
        />
      </div>

      {/* ── Event Status Breakdown ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Event Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {totalEventsTracked === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No events yet — create your first event to see the breakdown.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Segmented bar */}
                <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                  {STATUS_ORDER.map((status) => {
                    const count = statusCounts.get(status) ?? 0;
                    const pct =
                      totalEventsTracked > 0
                        ? (count / totalEventsTracked) * 100
                        : 0;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={status}
                        className={`h-full rounded-full transition-all ${getStatusBarColor(status)}`}
                        style={{ width: `${pct}%` }}
                        title={`${getStatusLabel(status)}: ${count}`}
                      />
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-4">
                  {STATUS_ORDER.map((status) => {
                    const count = statusCounts.get(status) ?? 0;
                    return (
                      <div key={status} className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusBarColor(status)}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {getStatusLabel(status)}
                        </span>
                        <span className="text-xs font-bold tabular-nums">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Two-column grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Today's Schedule
              </CardTitle>
              <button
                type="button"
                onClick={() => navigate({ to: "/calendar" })}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                Calendar <ArrowRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {todaysEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <CalendarDays className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nothing scheduled today
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    Enjoy the free time.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {[...todaysEvents]
                    .sort((a, b) => Number(a.startTime - b.startTime))
                    .map((event) => (
                      <button
                        type="button"
                        key={event.id.toString()}
                        className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 active:bg-muted/80 transition-colors text-left group"
                        onClick={() => navigate({ to: "/events" })}
                      >
                        <div
                          className="w-1 self-stretch rounded-full shrink-0"
                          style={{
                            backgroundColor: event.colorTag || "#6366f1",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-foreground">
                            {event.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatTime(event.startTime)} –{" "}
                              {formatTime(event.endTime)}
                            </span>
                            {event.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />
                                <span className="truncate max-w-20">
                                  {event.location}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusBadge status={event.status} />
                      </button>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-2 pt-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Upcoming Events
              </CardTitle>
              <button
                type="button"
                onClick={() => navigate({ to: "/events" })}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                All Events <ArrowRight className="w-3 h-3" />
              </button>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Clear week ahead
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    No events in the next 7 days.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {upcomingEvents.slice(0, 6).map((event) => {
                    const d = nsToDate(event.startTime);
                    return (
                      <button
                        type="button"
                        key={event.id.toString()}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 active:bg-muted/80 transition-colors text-left group"
                        onClick={() => navigate({ to: "/events" })}
                      >
                        {/* Date badge */}
                        <div
                          className="w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 text-white leading-none"
                          style={{
                            backgroundColor: event.colorTag || "#6366f1",
                          }}
                        >
                          <span className="text-[10px] font-bold uppercase opacity-80">
                            {d.toLocaleString("en-US", { month: "short" })}
                          </span>
                          <span className="text-sm font-bold leading-tight">
                            {d.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate group-hover:text-foreground">
                            {event.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {getClientName(event.clientId)}
                          </p>
                        </div>
                        <StatusBadge status={event.status} />
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-card border-l-4 border-l-destructive/50">
              <CardHeader className="pb-2 pt-4 px-5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-widest text-destructive">
                    Overdue Tasks — {overdueTasks.length}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {overdueTasks.slice(0, 8).map((task) => (
                    <div
                      key={task.id.toString()}
                      className="flex items-center gap-3 p-2.5 bg-destructive/5 rounded-lg border border-destructive/10"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-destructive/70 tabular-nums">
                            Due {formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center pt-4 pb-2">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-accent-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}

function getStatusBarColor(status: EventStatus): string {
  switch (status) {
    case EventStatus.planned:
      return "bg-blue-400";
    case EventStatus.confirmed:
      return "bg-emerald-400";
    case EventStatus.inProgress:
      return "bg-amber-400";
    case EventStatus.completed:
      return "bg-green-600";
    case EventStatus.cancelled:
      return "bg-gray-400";
    default:
      return "bg-muted";
  }
}
