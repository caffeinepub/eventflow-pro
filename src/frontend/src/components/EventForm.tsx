import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCircle2,
  Circle,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type CalendarEvent,
  EventStatus,
  EventType,
  useAllClients,
  useAllTeamMembers,
  useCreateEvent,
  useCreateReminder,
  useCreateTask,
  useDeleteReminder,
  useDeleteTask,
  useRemindersByEvent,
  useTasksByEvent,
  useToggleTask,
  useUpdateEvent,
} from "../hooks/useQueries";
import {
  formatDate,
  formatReminderOffset,
  formatTime,
  localInputToNs,
  nsToLocalInput,
} from "../utils/dateTime";
import { getEventTypeColor } from "./EventBadges";

const REQUIREMENT_OPTIONS = [
  "Catering",
  "AV Equipment",
  "Décor",
  "Staffing",
  "Photography",
  "Videography",
  "Security",
  "Transportation",
  "Accommodation",
  "Entertainment",
];

const REMINDER_PRESETS = [
  { label: "15 minutes before", value: 15n },
  { label: "1 hour before", value: 60n },
  { label: "3 hours before", value: 180n },
  { label: "1 day before", value: 1440n },
  { label: "2 days before", value: 2880n },
  { label: "1 week before", value: 10080n },
];

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  event?: CalendarEvent | null;
  defaultDate?: Date | null;
}

export default function EventForm({
  open,
  onClose,
  event,
  defaultDate,
}: EventFormProps) {
  const isEdit = !!event;
  const { data: clients = [] } = useAllClients();
  const { data: teamMembers = [] } = useAllTeamMembers();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  // Tasks
  const { data: tasks = [] } = useTasksByEvent(event?.id ?? null);
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  // Reminders
  const { data: reminders = [] } = useRemindersByEvent(event?.id ?? null);
  const createReminder = useCreateReminder();
  const deleteReminder = useDeleteReminder();

  // Form state
  const [form, setForm] = useState({
    clientId: "",
    title: "",
    eventType: EventType.corporate,
    status: EventStatus.planned,
    startTime: "",
    endTime: "",
    location: "",
    requirements: [] as string[],
    customReq: "",
    budget: "",
    notes: "",
    assignedTeamMemberIds: [] as string[],
    colorTag: "#3b82f6",
  });

  // New task form
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
  });

  // New reminder form
  const [newReminder, setNewReminder] = useState({
    offsetMinutes: 60n,
    customMinutes: "",
    isCustom: false,
    label: "",
  });

  // Populate form when editing
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional form reset on open
  useEffect(() => {
    if (event) {
      setForm({
        clientId: event.clientId.toString(),
        title: event.title,
        eventType: event.eventType,
        status: event.status,
        startTime: nsToLocalInput(event.startTime),
        endTime: nsToLocalInput(event.endTime),
        location: event.location,
        requirements: [...event.requirements],
        customReq: "",
        budget: event.budget != null ? String(event.budget) : "",
        notes: event.notes,
        assignedTeamMemberIds: event.assignedTeamMemberIds.map((id) =>
          id.toString(),
        ),
        colorTag: event.colorTag || "#3b82f6",
      });
    } else {
      const defaultStart = defaultDate ? defaultDate : new Date();
      const defaultEnd = new Date(defaultStart);
      defaultEnd.setHours(defaultEnd.getHours() + 2);
      const pad = (n: number) => String(n).padStart(2, "0");
      const toInput = (d: Date) =>
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setForm({
        clientId: "",
        title: "",
        eventType: EventType.corporate,
        status: EventStatus.planned,
        startTime: toInput(defaultStart),
        endTime: toInput(defaultEnd),
        location: "",
        requirements: [],
        customReq: "",
        budget: "",
        notes: "",
        assignedTeamMemberIds: [],
        colorTag: "#3b82f6",
      });
    }
  }, [event, defaultDate, open]);

  const toggleRequirement = (req: string) => {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.includes(req)
        ? prev.requirements.filter((r) => r !== req)
        : [...prev.requirements, req],
    }));
  };

  const addCustomReq = () => {
    const r = form.customReq.trim();
    if (!r || form.requirements.includes(r)) return;
    setForm((prev) => ({
      ...prev,
      requirements: [...prev.requirements, r],
      customReq: "",
    }));
  };

  const toggleMember = (id: string) => {
    setForm((prev) => ({
      ...prev,
      assignedTeamMemberIds: prev.assignedTeamMemberIds.includes(id)
        ? prev.assignedTeamMemberIds.filter((m) => m !== id)
        : [...prev.assignedTeamMemberIds, id],
    }));
  };

  const handleSubmit = async () => {
    if (
      !form.clientId ||
      !form.title.trim() ||
      !form.startTime ||
      !form.endTime
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    const payload = {
      clientId: BigInt(form.clientId),
      title: form.title.trim(),
      eventType: form.eventType,
      status: form.status,
      startTime: localInputToNs(form.startTime),
      endTime: localInputToNs(form.endTime),
      location: form.location.trim(),
      requirements: form.requirements,
      budget: form.budget ? Number.parseFloat(form.budget) : null,
      notes: form.notes.trim(),
      assignedTeamMemberIds: form.assignedTeamMemberIds.map((id) => BigInt(id)),
      colorTag: form.colorTag,
    };

    try {
      if (isEdit && event) {
        await updateEvent.mutateAsync({ id: event.id, ...payload });
        toast.success("Event updated successfully");
      } else {
        await createEvent.mutateAsync(payload);
        toast.success("Event created successfully");
      }
      onClose();
    } catch {
      toast.error("Failed to save event. Please try again.");
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !event) return;
    try {
      await createTask.mutateAsync({
        eventId: event.id,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assignedTo: newTask.assignedTo.trim() || null,
        dueDate: newTask.dueDate ? localInputToNs(newTask.dueDate) : null,
      });
      setNewTask({ title: "", description: "", assignedTo: "", dueDate: "" });
      toast.success("Task added");
    } catch {
      toast.error("Failed to add task");
    }
  };

  const handleAddReminder = async () => {
    if (!event) return;
    const offset = newReminder.isCustom
      ? BigInt(newReminder.customMinutes || "60")
      : newReminder.offsetMinutes;
    const label = newReminder.label.trim() || formatReminderOffset(offset);
    try {
      await createReminder.mutateAsync({
        eventId: event.id,
        offsetMinutes: offset,
        reminderLabel: label,
      });
      setNewReminder({
        offsetMinutes: 60n,
        customMinutes: "",
        isCustom: false,
        label: "",
      });
      toast.success("Reminder added");
    } catch {
      toast.error("Failed to add reminder");
    }
  };

  const taskProgress =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.isCompleted).length / tasks.length) * 100,
        )
      : 0;

  const isPending = createEvent.isPending || updateEvent.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEdit ? "Edit Event" : "New Event"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">
              Event Details
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1" disabled={!isEdit}>
              Tasks {tasks.length > 0 && `(${tasks.length})`}
            </TabsTrigger>
            <TabsTrigger
              value="reminders"
              className="flex-1"
              disabled={!isEdit}
            >
              Reminders {reminders.length > 0 && `(${reminders.length})`}
            </TabsTrigger>
          </TabsList>

          {/* ── Details Tab ── */}
          <TabsContent value="details" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              {/* Client */}
              <div className="col-span-2 space-y-1.5">
                <Label>
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => setForm((p) => ({ ...p, clientId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id.toString()} value={c.id.toString()}>
                        {c.name} {c.company && `— ${c.company}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="col-span-2 space-y-1.5">
                <Label>
                  Event Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="Annual Company Gala"
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <Label>Event Type</Label>
                <Select
                  value={form.eventType}
                  onValueChange={(v) => {
                    const type = v as EventType;
                    setForm((p) => ({
                      ...p,
                      eventType: type,
                      colorTag: getEventTypeColor(type),
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EventType.corporate}>
                      Corporate
                    </SelectItem>
                    <SelectItem value={EventType.wedding}>Wedding</SelectItem>
                    <SelectItem value={EventType.conference}>
                      Conference
                    </SelectItem>
                    <SelectItem value={EventType.birthday}>Birthday</SelectItem>
                    <SelectItem value={EventType.other}>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, status: v as EventStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EventStatus.planned}>Planned</SelectItem>
                    <SelectItem value={EventStatus.confirmed}>
                      Confirmed
                    </SelectItem>
                    <SelectItem value={EventStatus.inProgress}>
                      In Progress
                    </SelectItem>
                    <SelectItem value={EventStatus.completed}>
                      Completed
                    </SelectItem>
                    <SelectItem value={EventStatus.cancelled}>
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Time */}
              <div className="space-y-1.5">
                <Label>
                  Start Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, startTime: e.target.value }))
                  }
                />
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <Label>
                  End Date & Time <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, endTime: e.target.value }))
                  }
                />
              </div>

              {/* Location */}
              <div className="col-span-2 space-y-1.5">
                <Label>Location / Venue</Label>
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, location: e.target.value }))
                  }
                  placeholder="Grand Ballroom, Hilton Hotel"
                />
              </div>

              {/* Color Tag */}
              <div className="space-y-1.5">
                <Label>Color Tag</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colorTag}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, colorTag: e.target.value }))
                    }
                    className="w-10 h-10 rounded-md border border-input cursor-pointer bg-transparent"
                  />
                  <span className="text-sm text-muted-foreground font-mono">
                    {form.colorTag}
                  </span>
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-1.5">
                <Label>Budget (optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    className="pl-7"
                    value={form.budget}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, budget: e.target.value }))
                    }
                    placeholder="5000"
                    min="0"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="col-span-2 space-y-2">
                <Label>Requirements</Label>
                <div className="flex flex-wrap gap-2">
                  {REQUIREMENT_OPTIONS.map((req) => (
                    <button
                      key={req}
                      type="button"
                      onClick={() => toggleRequirement(req)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        form.requirements.includes(req)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary/50",
                      )}
                    >
                      {req}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom requirement…"
                    value={form.customReq}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, customReq: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomReq();
                      }
                    }}
                    className="flex-1 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomReq}
                  >
                    Add
                  </Button>
                </div>
                {form.requirements.filter(
                  (r) => !REQUIREMENT_OPTIONS.includes(r),
                ).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.requirements
                      .filter((r) => !REQUIREMENT_OPTIONS.includes(r))
                      .map((r) => (
                        <Badge
                          key={r}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => toggleRequirement(r)}
                        >
                          {r} ×
                        </Badge>
                      ))}
                  </div>
                )}
              </div>

              {/* Team Members */}
              <div className="col-span-2 space-y-2">
                <Label>Assigned Team Members</Label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {teamMembers
                    .filter((m) => m.isActive)
                    .map((member) => (
                      <div
                        key={member.id.toString()}
                        className="flex items-center gap-2"
                      >
                        <Checkbox
                          id={`member-${member.id}`}
                          checked={form.assignedTeamMemberIds.includes(
                            member.id.toString(),
                          )}
                          onCheckedChange={() =>
                            toggleMember(member.id.toString())
                          }
                        />
                        <label
                          htmlFor={`member-${member.id}`}
                          className="text-sm cursor-pointer leading-none"
                        >
                          {member.name}
                          <span className="text-muted-foreground ml-1 text-xs capitalize">
                            ({member.role})
                          </span>
                        </label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Notes */}
              <div className="col-span-2 space-y-1.5">
                <Label>Notes / Special Instructions</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  placeholder="Any special instructions or notes for this event…"
                  rows={3}
                />
              </div>
            </div>
          </TabsContent>

          {/* ── Tasks Tab ── */}
          <TabsContent value="tasks" className="space-y-4 pt-2">
            {tasks.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{taskProgress}%</span>
                </div>
                <Progress value={taskProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {tasks.filter((t) => t.isCompleted).length} of {tasks.length}{" "}
                  tasks completed
                </p>
              </div>
            )}

            {/* Add task */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                New Task
              </p>
              <Input
                placeholder="Task title *"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, title: e.target.value }))
                }
              />
              <Input
                placeholder="Description (optional)"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask((p) => ({ ...p, description: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Assigned to"
                  value={newTask.assignedTo}
                  onChange={(e) =>
                    setNewTask((p) => ({ ...p, assignedTo: e.target.value }))
                  }
                />
                <Input
                  type="datetime-local"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask((p) => ({ ...p, dueDate: e.target.value }))
                  }
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddTask}
                disabled={!newTask.title.trim() || createTask.isPending}
              >
                {createTask.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Plus className="w-3.5 h-3.5 mr-1" />
                )}
                Add Task
              </Button>
            </div>

            {/* Task list */}
            <div className="space-y-2">
              {tasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks yet. Add your first task above.
                </p>
              )}
              {tasks.map((task) => (
                <div
                  key={task.id.toString()}
                  className="flex items-start gap-3 p-3 bg-card rounded-lg border border-border"
                >
                  <button
                    type="button"
                    onClick={() =>
                      event &&
                      toggleTask.mutate({ id: task.id, eventId: event.id })
                    }
                    className="mt-0.5 shrink-0"
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.isCompleted &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.description}
                      </p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {task.assignedTo && <span>👤 {task.assignedTo}</span>}
                      {task.dueDate && (
                        <span>📅 {formatDate(task.dueDate)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      event &&
                      deleteTask.mutate({ id: task.id, eventId: event.id })
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ── Reminders Tab ── */}
          <TabsContent value="reminders" className="space-y-4 pt-2">
            {/* Add reminder */}
            <div className="bg-muted/30 rounded-lg p-3 space-y-2 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                New Reminder
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={
                    newReminder.isCustom
                      ? "custom"
                      : newReminder.offsetMinutes.toString()
                  }
                  onValueChange={(v) => {
                    if (v === "custom") {
                      setNewReminder((p) => ({ ...p, isCustom: true }));
                    } else {
                      setNewReminder((p) => ({
                        ...p,
                        isCustom: false,
                        offsetMinutes: BigInt(v),
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timing" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_PRESETS.map((p) => (
                      <SelectItem
                        key={p.value.toString()}
                        value={p.value.toString()}
                      >
                        {p.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom…</SelectItem>
                  </SelectContent>
                </Select>
                {newReminder.isCustom && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      placeholder="Minutes"
                      value={newReminder.customMinutes}
                      onChange={(e) =>
                        setNewReminder((p) => ({
                          ...p,
                          customMinutes: e.target.value,
                        }))
                      }
                      min="1"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      min
                    </span>
                  </div>
                )}
              </div>
              <Input
                placeholder="Reminder label (optional)"
                value={newReminder.label}
                onChange={(e) =>
                  setNewReminder((p) => ({ ...p, label: e.target.value }))
                }
              />
              <Button
                size="sm"
                onClick={handleAddReminder}
                disabled={createReminder.isPending}
              >
                {createReminder.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <Bell className="w-3.5 h-3.5 mr-1" />
                )}
                Add Reminder
              </Button>
            </div>

            {/* Reminder list */}
            <div className="space-y-2">
              {reminders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No reminders set. Add one above.
                </p>
              )}
              {reminders.map((reminder) => (
                <div
                  key={reminder.id.toString()}
                  className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
                >
                  <Bell
                    className={cn(
                      "w-4 h-4 shrink-0",
                      reminder.isTriggered
                        ? "text-muted-foreground"
                        : "text-accent",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {reminder.reminderLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatReminderOffset(reminder.offsetMinutes)}
                      {reminder.isTriggered && " · Triggered"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      event &&
                      deleteReminder.mutate({
                        id: reminder.id,
                        eventId: event.id,
                      })
                    }
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEdit ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
