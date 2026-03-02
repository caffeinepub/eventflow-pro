import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Clock, MapPin, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { StatusBadge, TypeBadge } from "../components/EventBadges";
import EventForm from "../components/EventForm";
import { useAllEvents } from "../hooks/useQueries";
import type { CalendarEvent } from "../hooks/useQueries";
import {
  dateToNs,
  eventOnDate,
  formatDate,
  formatTime,
  getCalendarDays,
  getWeekDays,
  isSameDay,
  monthEnd,
  monthStart,
  nsToDate,
} from "../utils/dateTime";

type CalendarView = "month" | "week" | "day";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function EventChip({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={event.title}
      className="w-full text-left px-1.5 py-0.5 rounded text-xs font-medium truncate transition-opacity hover:opacity-80"
      style={{
        backgroundColor: `${event.colorTag || "#6366f1"}22`,
        color: event.colorTag || "#6366f1",
        borderLeft: `2px solid ${event.colorTag || "#6366f1"}`,
      }}
    >
      {formatTime(event.startTime)} {event.title}
    </button>
  );
}

function EventDetailPanel({
  event,
  onClose,
  onEdit,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="w-72 shrink-0 bg-card border border-border rounded-xl p-4 space-y-3 shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: event.colorTag || "#6366f1" }}
          />
          <h3 className="font-display font-semibold text-sm leading-tight">
            {event.title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {formatDate(event.startTime)} {formatTime(event.startTime)} –{" "}
          {formatTime(event.endTime)}
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3" />
            {event.location}
          </div>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <StatusBadge status={event.status} />
        <TypeBadge type={event.eventType} />
      </div>

      {event.notes && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 line-clamp-3">
          {event.notes}
        </p>
      )}

      <Button size="sm" className="w-full" onClick={onEdit}>
        Edit Event
      </Button>
    </motion.div>
  );
}

export default function CalendarPage() {
  const today = new Date();
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

  const { data: events = [], isLoading } = useAllEvents();

  // Navigation
  const navigate = (dir: 1 | -1) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (view === "month") d.setMonth(d.getMonth() + dir);
      else if (view === "week") d.setDate(d.getDate() + dir * 7);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  };

  const headerLabel = useMemo(() => {
    if (view === "month") {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    if (view === "week") {
      const days = getWeekDays(currentDate);
      const start = days[0];
      const end = days[6];
      if (start.getMonth() === end.getMonth()) {
        return `${MONTHS[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${MONTHS[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
    }
    return formatDate(dateToNs(currentDate), {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [view, currentDate]);

  const eventsOnDay = (date: Date) =>
    events.filter((e) => eventOnDate(e.startTime, date));

  const handleDayClick = (date: Date) => {
    setDefaultDate(date);
    setEditEvent(null);
    setFormOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditEvent(event);
    setSelectedEvent(null);
    setFormOpen(true);
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    if (view === "week" || view === "day") {
      setCurrentDate(new Date(today));
    }
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-6 space-y-4">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 shrink-0 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Month/period label — PRIMARY visual anchor */}
          <h2 className="font-display font-bold text-2xl tracking-tight hidden sm:block">
            {headerLabel}
          </h2>
          <h2 className="font-display font-bold text-lg sm:hidden">
            {headerLabel}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Nav controls */}
          <div className="flex items-center gap-1 border border-border rounded-lg overflow-hidden">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-none h-8 w-8 border-r border-border"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <button
              type="button"
              onClick={goToToday}
              className="px-3 h-8 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Today
            </button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-none h-8 w-8 border-l border-border"
              onClick={() => navigate(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* View switcher */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["month", "week", "day"] as CalendarView[]).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  view === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => {
              setEditEvent(null);
              setDefaultDate(new Date());
              setFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Event
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Calendar Grid */}
        <div className="flex-1 min-w-0 flex flex-col">
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 42 }, (_, i) => i).map((i) => (
                <Skeleton key={`sk-${i}`} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : view === "month" ? (
            <MonthView
              currentDate={currentDate}
              today={today}
              eventsOnDay={eventsOnDay}
              onDayClick={handleDayClick}
              onEventClick={setSelectedEvent}
            />
          ) : view === "week" ? (
            <WeekView
              currentDate={currentDate}
              today={today}
              eventsOnDay={eventsOnDay}
              onDayClick={handleDayClick}
              onEventClick={setSelectedEvent}
            />
          ) : (
            <DayView
              currentDate={currentDate}
              events={eventsOnDay(currentDate)}
              today={today}
              onEventClick={setSelectedEvent}
            />
          )}
        </div>

        {/* Event Detail Panel */}
        <AnimatePresence>
          {selectedEvent && (
            <EventDetailPanel
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onEdit={() => handleEditEvent(selectedEvent)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Event Form */}
      <EventForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditEvent(null);
          setDefaultDate(null);
        }}
        event={editEvent}
        defaultDate={defaultDate}
      />
    </div>
  );
}

// ── Month View ───────────────────────────────────────────────────

function MonthView({
  currentDate,
  today,
  eventsOnDay,
  onDayClick,
  onEventClick,
}: {
  currentDate: Date;
  today: Date;
  eventsOnDay: (date: Date) => CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const days = getCalendarDays(
    currentDate.getFullYear(),
    currentDate.getMonth(),
  );
  const currentMonth = currentDate.getMonth();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Day-of-week header ─────────────────────────────────── */}
      <div className="grid grid-cols-7 mb-0 shrink-0 bg-muted/30 rounded-t-xl border border-b-0 border-border overflow-hidden">
        {DAYS_OF_WEEK.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-bold text-muted-foreground py-2.5 uppercase tracking-widest"
          >
            {d}
          </div>
        ))}
      </div>
      {/* ── Grid ──────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-7 grid-rows-6 flex-1 border border-border rounded-b-xl overflow-hidden"
        style={{ gap: "1px", background: "oklch(var(--border))" }}
      >
        {days.map((date) => {
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = isSameDay(date, today);
          const dayEvents = eventsOnDay(date);
          const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          return (
            // biome-ignore lint/a11y/useKeyWithClickEvents: calendar day cell
            <div
              key={dayKey}
              onClick={() => onDayClick(date)}
              className={cn(
                "bg-card p-2 flex flex-col gap-1 cursor-pointer hover:bg-muted/40 active:bg-muted/60 transition-colors min-h-0",
                !isCurrentMonth && "bg-muted/20",
                isToday && "bg-accent/5",
              )}
            >
              {/* Day number */}
              <div className="shrink-0">
                <span
                  className={cn(
                    "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                    isToday
                      ? "bg-accent text-accent-foreground font-bold shadow-sm"
                      : isCurrentMonth
                        ? "text-foreground hover:bg-muted"
                        : "text-muted-foreground/50",
                  )}
                >
                  {date.getDate()}
                </span>
              </div>
              {/* Events */}
              <div className="flex flex-col gap-0.5 overflow-hidden min-h-0">
                {dayEvents.slice(0, 3).map((e) => (
                  <EventChip
                    key={e.id.toString()}
                    event={e}
                    onClick={(ev) => {
                      ev.stopPropagation();
                      onEventClick(e);
                    }}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-[10px] text-muted-foreground px-1.5 font-medium">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week View ────────────────────────────────────────────────────

function WeekView({
  currentDate,
  today,
  eventsOnDay,
  onDayClick,
  onEventClick,
}: {
  currentDate: Date;
  today: Date;
  eventsOnDay: (date: Date) => CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const days = getWeekDays(currentDate);

  return (
    <div className="flex-1 grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
      {days.map((date) => {
        const isToday = isSameDay(date, today);
        const dayEvents = eventsOnDay(date);
        const dayKey = `week-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: calendar day cell
          <div
            key={dayKey}
            onClick={() => onDayClick(date)}
            className="bg-card flex flex-col cursor-pointer hover:bg-muted/30 transition-colors"
          >
            {/* Header */}
            <div
              className={cn(
                "p-2 text-center border-b border-border",
                isToday && "bg-accent/10",
              )}
            >
              <p className="text-xs text-muted-foreground">
                {DAYS_OF_WEEK[date.getDay()]}
              </p>
              <p
                className={cn(
                  "text-lg font-display font-bold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full mx-auto",
                  isToday && "bg-accent text-accent-foreground",
                )}
              >
                {date.getDate()}
              </p>
            </div>
            {/* Events */}
            <div className="flex-1 p-1 space-y-0.5 overflow-y-auto">
              {dayEvents.map((e) => (
                <EventChip
                  key={e.id.toString()}
                  event={e}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onEventClick(e);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Day View ─────────────────────────────────────────────────────

function DayView({
  currentDate,
  events,
  today,
  onEventClick,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  today: Date;
  onEventClick: (event: CalendarEvent) => void;
}) {
  const isToday = isSameDay(currentDate, today);
  const sorted = [...events].sort((a, b) => Number(a.startTime - b.startTime));

  return (
    <div className="flex-1 bg-card border border-border rounded-xl p-4 overflow-y-auto">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-lg",
            isToday
              ? "bg-accent text-accent-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {currentDate.getDate()}
        </div>
        <div>
          <p className="font-display font-semibold">
            {currentDate.toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <p className="text-sm text-muted-foreground">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No events scheduled</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Click to add an event
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((event) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: calendar event item
            <div
              key={event.id.toString()}
              onClick={() => onEventClick(event)}
              className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div
                className="w-1.5 self-stretch rounded-full shrink-0"
                style={{ backgroundColor: event.colorTag || "#6366f1" }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatTime(event.startTime)} – {formatTime(event.endTime)}
                </p>
                {event.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </p>
                )}
              </div>
              <StatusBadge status={event.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
