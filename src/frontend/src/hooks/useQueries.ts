import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type CalendarEvent,
  type CalendarTask,
  type Client,
  EventStatus,
  EventType,
  type Reminder,
  type TeamMember,
  TeamMemberRole,
  type UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Clients ─────────────────────────────────────────────────────

export function useAllClients() {
  const { actor, isFetching } = useActor();
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllClients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateClient() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone: string;
      company: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createClient(
        data.name,
        data.email,
        data.phone,
        data.company,
        data.notes,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      email: string;
      phone: string;
      company: string;
      notes: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateClient(
        data.id,
        data.name,
        data.email,
        data.phone,
        data.company,
        data.notes,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteClient() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteClient(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useEventsByClient(clientId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<CalendarEvent[]>({
    queryKey: ["events", "client", clientId?.toString()],
    queryFn: async () => {
      if (!actor || !clientId) return [];
      return actor.getEventsByClient(clientId);
    },
    enabled: !!actor && !isFetching && !!clientId,
  });
}

// ─── Events ──────────────────────────────────────────────────────

export function useAllEvents() {
  const { actor, isFetching } = useActor();
  return useQuery<CalendarEvent[]>({
    queryKey: ["events"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEvents();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useEventsByDateRange(
  startTime: bigint,
  endTime: bigint,
  enabled = true,
) {
  const { actor, isFetching } = useActor();
  return useQuery<CalendarEvent[]>({
    queryKey: ["events", "range", startTime.toString(), endTime.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEventsByDateRange(startTime, endTime);
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useSearchEvents(keyword: string) {
  const { actor, isFetching } = useActor();
  return useQuery<CalendarEvent[]>({
    queryKey: ["events", "search", keyword],
    queryFn: async () => {
      if (!actor || !keyword.trim()) return [];
      return actor.searchEvents(keyword);
    },
    enabled: !!actor && !isFetching && keyword.trim().length > 0,
  });
}

export function useCreateEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      clientId: bigint;
      title: string;
      eventType: EventType;
      status: EventStatus;
      startTime: bigint;
      endTime: bigint;
      location: string;
      requirements: string[];
      budget: number | null;
      notes: string;
      assignedTeamMemberIds: bigint[];
      colorTag: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createEvent(
        data.clientId,
        data.title,
        data.eventType,
        data.status,
        data.startTime,
        data.endTime,
        data.location,
        data.requirements,
        data.budget,
        data.notes,
        data.assignedTeamMemberIds,
        data.colorTag,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      clientId: bigint;
      title: string;
      eventType: EventType;
      status: EventStatus;
      startTime: bigint;
      endTime: bigint;
      location: string;
      requirements: string[];
      budget: number | null;
      notes: string;
      assignedTeamMemberIds: bigint[];
      colorTag: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateEvent(
        data.id,
        data.clientId,
        data.title,
        data.eventType,
        data.status,
        data.startTime,
        data.endTime,
        data.location,
        data.requirements,
        data.budget,
        data.notes,
        data.assignedTeamMemberIds,
        data.colorTag,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteEvent() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteEvent(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Tasks ───────────────────────────────────────────────────────

export function useTasksByEvent(eventId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<CalendarTask[]>({
    queryKey: ["tasks", eventId?.toString()],
    queryFn: async () => {
      if (!actor || !eventId) return [];
      return actor.getTasksByEvent(eventId);
    },
    enabled: !!actor && !isFetching && !!eventId,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      eventId: bigint;
      title: string;
      description: string;
      assignedTo: string | null;
      dueDate: bigint | null;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createTask(
        data.eventId,
        data.title,
        data.description,
        data.assignedTo,
        data.dueDate,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.eventId.toString()] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useToggleTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; eventId: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.toggleTaskCompletion(data.id);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.eventId.toString()] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; eventId: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteTask(data.id);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.eventId.toString()] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// ─── Reminders ───────────────────────────────────────────────────

export function useRemindersByEvent(eventId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Reminder[]>({
    queryKey: ["reminders", eventId?.toString()],
    queryFn: async () => {
      if (!actor || !eventId) return [];
      return actor.getRemindersByEvent(eventId);
    },
    enabled: !!actor && !isFetching && !!eventId,
  });
}

export function useCreateReminder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      eventId: bigint;
      offsetMinutes: bigint;
      reminderLabel: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createReminder(
        data.eventId,
        data.offsetMinutes,
        data.reminderLabel,
      );
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["reminders", vars.eventId.toString()],
      });
    },
  });
}

export function useDeleteReminder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { id: bigint; eventId: bigint }) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteReminder(data.id);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: ["reminders", vars.eventId.toString()],
      });
    },
  });
}

// ─── Team Members ────────────────────────────────────────────────

export function useAllTeamMembers() {
  const { actor, isFetching } = useActor();
  return useQuery<TeamMember[]>({
    queryKey: ["team"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTeamMembers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTeamMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      role: TeamMemberRole;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createTeamMember(data.name, data.email, data.role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

export function useUpdateTeamMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      name: string;
      email: string;
      role: TeamMemberRole;
      isActive: boolean;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateTeamMember(
        data.id,
        data.name,
        data.email,
        data.role,
        data.isActive,
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

export function useDeleteTeamMember() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteTeamMember(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
}

// ─── Dashboard ───────────────────────────────────────────────────

export function useDashboard() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardData();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Auth ────────────────────────────────────────────────────────

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

// Re-export types for convenience
export type {
  CalendarEvent,
  Client,
  CalendarTask,
  Reminder,
  TeamMember,
  UserProfile,
};
export { EventStatus, EventType, TeamMemberRole };
