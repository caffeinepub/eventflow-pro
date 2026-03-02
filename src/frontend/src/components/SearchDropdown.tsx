import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, Loader2 } from "lucide-react";
import { useSearchEvents } from "../hooks/useQueries";
import { formatDate, formatTime } from "../utils/dateTime";
import { getStatusColor } from "./EventBadges";

export default function SearchDropdown({
  keyword,
  onClose,
}: {
  keyword: string;
  onClose: () => void;
}) {
  const { data: results, isLoading } = useSearchEvents(keyword);
  const navigate = useNavigate();

  return (
    <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Searching…
        </div>
      ) : !results || results.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-muted-foreground text-sm gap-2">
          <CalendarDays className="w-8 h-8 opacity-30" />
          No events found for "{keyword}"
        </div>
      ) : (
        <ul>
          {results.map((event) => (
            <li key={event.id.toString()}>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                onClick={() => {
                  navigate({ to: "/events" });
                  onClose();
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: event.colorTag || "#6366f1" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(event.startTime)} ·{" "}
                    {formatTime(event.startTime)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(event.status)}`}
                >
                  {event.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
