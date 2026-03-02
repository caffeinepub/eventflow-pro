import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CalendarEvent {
    id: bigint;
    startTime: bigint;
    status: EventStatus;
    title: string;
    clientId: bigint;
    endTime: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    colorTag: string;
    assignedTeamMemberIds: Array<bigint>;
    notes: string;
    requirements: Array<string>;
    budget?: number;
    location: string;
    eventType: EventType;
}
export interface Reminder {
    id: bigint;
    eventId: bigint;
    offsetMinutes: bigint;
    reminderLabel: string;
    isTriggered: boolean;
}
export interface TeamMember {
    id: bigint;
    name: string;
    role: TeamMemberRole;
    isActive: boolean;
    email: string;
}
export interface Client {
    id: bigint;
    name: string;
    createdAt: bigint;
    email: string;
    company: string;
    notes: string;
    phone: string;
}
export interface CalendarTask {
    id: bigint;
    eventId: bigint;
    title: string;
    assignedTo?: string;
    isCompleted: boolean;
    createdAt: bigint;
    dueDate?: bigint;
    description: string;
}
export interface UserProfile {
    name: string;
    role: TeamMemberRole;
    isActive: boolean;
    email: string;
}
export enum EventStatus {
    cancelled = "cancelled",
    completed = "completed",
    planned = "planned",
    confirmed = "confirmed",
    inProgress = "inProgress"
}
export enum EventType {
    other = "other",
    conference = "conference",
    wedding = "wedding",
    birthday = "birthday",
    corporate = "corporate"
}
export enum TeamMemberRole {
    member = "member",
    manager = "manager",
    admin = "admin"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignTeamMemberToEvent(eventId: bigint, teamMemberId: bigint): Promise<void>;
    createClient(name: string, email: string, phone: string, company: string, notes: string): Promise<bigint>;
    createEvent(clientId: bigint, title: string, eventType: EventType, status: EventStatus, startTime: bigint, endTime: bigint, location: string, requirements: Array<string>, budget: number | null, notes: string, assignedTeamMemberIds: Array<bigint>, colorTag: string): Promise<bigint>;
    createReminder(eventId: bigint, offsetMinutes: bigint, reminderLabel: string): Promise<bigint>;
    createTask(eventId: bigint, title: string, description: string, assignedTo: string | null, dueDate: bigint | null): Promise<bigint>;
    createTeamMember(name: string, email: string, role: TeamMemberRole): Promise<bigint>;
    deleteClient(id: bigint): Promise<void>;
    deleteEvent(id: bigint): Promise<void>;
    deleteReminder(id: bigint): Promise<void>;
    deleteTask(id: bigint): Promise<void>;
    deleteTeamMember(id: bigint): Promise<void>;
    getAllClients(): Promise<Array<Client>>;
    getAllEvents(): Promise<Array<CalendarEvent>>;
    getAllTeamMembers(): Promise<Array<TeamMember>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getClient(id: bigint): Promise<Client | null>;
    getDashboardData(): Promise<{
        overdueTasks: Array<CalendarTask>;
        todaysEvents: Array<CalendarEvent>;
        upcomingEvents: Array<CalendarEvent>;
        eventCountsByStatus: Array<[EventStatus, bigint]>;
    }>;
    getEvent(id: bigint): Promise<CalendarEvent | null>;
    getEventsByClient(clientId: bigint): Promise<Array<CalendarEvent>>;
    getEventsByDateRange(startTime: bigint, endTime: bigint): Promise<Array<CalendarEvent>>;
    getEventsByStatus(status: EventStatus): Promise<Array<CalendarEvent>>;
    getEventsByType(eventType: EventType): Promise<Array<CalendarEvent>>;
    getOverdueTasks(): Promise<Array<CalendarTask>>;
    getReminder(id: bigint): Promise<Reminder | null>;
    getRemindersByEvent(eventId: bigint): Promise<Array<Reminder>>;
    getRemindersDueSoon(): Promise<Array<Reminder>>;
    getTask(id: bigint): Promise<CalendarTask | null>;
    getTasksByEvent(eventId: bigint): Promise<Array<CalendarTask>>;
    getTeamMember(id: bigint): Promise<TeamMember | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchEvents(keyword: string): Promise<Array<CalendarEvent>>;
    toggleTaskCompletion(id: bigint): Promise<void>;
    unassignTeamMemberFromEvent(eventId: bigint, teamMemberId: bigint): Promise<void>;
    updateClient(id: bigint, name: string, email: string, phone: string, company: string, notes: string): Promise<void>;
    updateEvent(id: bigint, clientId: bigint, title: string, eventType: EventType, status: EventStatus, startTime: bigint, endTime: bigint, location: string, requirements: Array<string>, budget: number | null, notes: string, assignedTeamMemberIds: Array<bigint>, colorTag: string): Promise<void>;
    updateReminder(id: bigint, offsetMinutes: bigint, reminderLabel: string, isTriggered: boolean): Promise<void>;
    updateTask(id: bigint, title: string, description: string, assignedTo: string | null, dueDate: bigint | null, isCompleted: boolean): Promise<void>;
    updateTeamMember(id: bigint, name: string, email: string, role: TeamMemberRole, isActive: boolean): Promise<void>;
}
