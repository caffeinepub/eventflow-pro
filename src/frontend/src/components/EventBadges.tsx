import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EventStatus, EventType } from "../backend.d";

export function getStatusColor(status: EventStatus): string {
  switch (status) {
    case EventStatus.planned:
      return "status-planned";
    case EventStatus.confirmed:
      return "status-confirmed";
    case EventStatus.inProgress:
      return "status-inprogress";
    case EventStatus.completed:
      return "status-completed";
    case EventStatus.cancelled:
      return "status-cancelled";
    default:
      return "status-planned";
  }
}

export function getStatusLabel(status: EventStatus): string {
  switch (status) {
    case EventStatus.planned:
      return "Planned";
    case EventStatus.confirmed:
      return "Confirmed";
    case EventStatus.inProgress:
      return "In Progress";
    case EventStatus.completed:
      return "Completed";
    case EventStatus.cancelled:
      return "Cancelled";
    default:
      return String(status);
  }
}

export function getEventTypeLabel(type: EventType): string {
  switch (type) {
    case EventType.corporate:
      return "Corporate";
    case EventType.wedding:
      return "Wedding";
    case EventType.conference:
      return "Conference";
    case EventType.birthday:
      return "Birthday";
    case EventType.other:
      return "Other";
    default:
      return String(type);
  }
}

export function getEventTypeColor(type: EventType): string {
  switch (type) {
    case EventType.corporate:
      return "#3b82f6";
    case EventType.wedding:
      return "#ec4899";
    case EventType.conference:
      return "#8b5cf6";
    case EventType.birthday:
      return "#f59e0b";
    case EventType.other:
      return "#6b7280";
    default:
      return "#6b7280";
  }
}

export function StatusBadge({
  status,
  className,
}: { status: EventStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
        getStatusColor(status),
        className,
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}

export function TypeBadge({
  type,
  className,
}: { type: EventType; className?: string }) {
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", className)}>
      {getEventTypeLabel(type)}
    </Badge>
  );
}
