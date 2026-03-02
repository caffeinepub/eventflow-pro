import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Edit2,
  Filter,
  Loader2,
  MapPin,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  StatusBadge,
  TypeBadge,
  getEventTypeLabel,
} from "../components/EventBadges";
import EventForm from "../components/EventForm";
import {
  type CalendarEvent,
  EventStatus,
  EventType,
  useAllClients,
  useAllEvents,
  useDeleteEvent,
} from "../hooks/useQueries";
import { useSearchEvents } from "../hooks/useQueries";
import { formatDate, formatTime } from "../utils/dateTime";

export default function EventsPage() {
  const { data: events = [], isLoading } = useAllEvents();
  const { data: clients = [] } = useAllClients();
  const deleteEvent = useDeleteEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);

  // Filters
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const { data: searchResults } = useSearchEvents(keyword);

  const getClientName = (clientId: bigint) =>
    clients.find((c) => c.id === clientId)?.name ?? "—";

  // Apply filters
  const filteredEvents = useMemo(() => {
    let base = keyword.trim() ? (searchResults ?? []) : events;

    if (statusFilter !== "all") {
      base = base.filter((e) => e.status === statusFilter);
    }
    if (typeFilter !== "all") {
      base = base.filter((e) => e.eventType === typeFilter);
    }
    if (startDateFilter) {
      const start = new Date(startDateFilter).getTime() * 1_000_000;
      base = base.filter((e) => Number(e.startTime) >= start);
    }
    if (endDateFilter) {
      const end = new Date(`${endDateFilter}T23:59:59`).getTime() * 1_000_000;
      base = base.filter((e) => Number(e.startTime) <= end);
    }

    return [...base].sort((a, b) => Number(a.startTime - b.startTime));
  }, [
    events,
    searchResults,
    keyword,
    statusFilter,
    typeFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEvent.mutateAsync(deleteId);
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    } finally {
      setDeleteId(null);
    }
  };

  const clearFilters = () => {
    setKeyword("");
    setStatusFilter("all");
    setTypeFilter("all");
    setStartDateFilter("");
    setEndDateFilter("");
  };

  const hasFilters =
    keyword ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    startDateFilter ||
    endDateFilter;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-border">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Events
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-accent font-semibold tabular-nums">
              {filteredEvents.length}
            </span>{" "}
            event{filteredEvents.length !== 1 ? "s" : ""}
            {hasFilters && " — filtered"}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditEvent(null);
            setFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3 space-y-3 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search events…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as EventStatus | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={EventStatus.planned}>Planned</SelectItem>
              <SelectItem value={EventStatus.confirmed}>Confirmed</SelectItem>
              <SelectItem value={EventStatus.inProgress}>
                In Progress
              </SelectItem>
              <SelectItem value={EventStatus.completed}>Completed</SelectItem>
              <SelectItem value={EventStatus.cancelled}>Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as EventType | "all")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value={EventType.corporate}>Corporate</SelectItem>
              <SelectItem value={EventType.wedding}>Wedding</SelectItem>
              <SelectItem value={EventType.conference}>Conference</SelectItem>
              <SelectItem value={EventType.birthday}>Birthday</SelectItem>
              <SelectItem value={EventType.other}>Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            Date range:
          </div>
          <Input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="w-36 text-sm"
          />
          <span className="text-muted-foreground text-xs">to</span>
          <Input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="w-36 text-sm"
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-2">
          {(["a", "b", "c", "d", "e"] as const).map((k) => (
            <Skeleton key={k} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">
            {hasFilters ? "No events match your filters" : "No events yet"}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {hasFilters
              ? "Try adjusting your filters"
              : "Create your first event to get started"}
          </p>
          {!hasFilters && (
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                setEditEvent(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Event
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event, idx) => (
            <motion.div
              key={event.id.toString()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
            >
              <EventRow
                event={event}
                clientName={getClientName(event.clientId)}
                onEdit={() => {
                  setEditEvent(event);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleteId(event.id)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Event Form */}
      <EventForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditEvent(null);
        }}
        event={editEvent}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The event and all its tasks and
              reminders will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteEvent.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EventRow({
  event,
  clientName,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  clientName: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:shadow-card transition-shadow group">
      {/* Color dot */}
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: event.colorTag || "#6366f1" }}
      />

      {/* Main info */}
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{event.title}</p>
          <p className="text-xs text-muted-foreground truncate">{clientName}</p>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>{formatDate(event.startTime)}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{formatTime(event.startTime)}</span>
          {event.location && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-24">{event.location}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge status={event.status} />
          <TypeBadge type={event.eventType} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          onClick={onEdit}
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
          title="Edit"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onDelete}
          className="w-8 h-8 text-muted-foreground hover:text-destructive"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
