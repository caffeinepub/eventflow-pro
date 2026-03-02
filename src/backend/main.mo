import Map "mo:core/Map";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  type EventType = {
    #corporate;
    #wedding;
    #conference;
    #birthday;
    #other;
  };

  type EventStatus = {
    #planned;
    #confirmed;
    #inProgress;
    #completed;
    #cancelled;
  };

  type TeamMemberRole = {
    #admin;
    #manager;
    #member;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    role : TeamMemberRole;
    isActive : Bool;
  };

  public type Client = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    company : Text;
    notes : Text;
    createdAt : Int;
  };

  public type CalendarEvent = {
    id : Nat;
    clientId : Nat;
    title : Text;
    eventType : EventType;
    status : EventStatus;
    startTime : Int;
    endTime : Int;
    location : Text;
    requirements : [Text];
    budget : ?Float;
    notes : Text;
    assignedTeamMemberIds : [Nat];
    colorTag : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type CalendarTask = {
    id : Nat;
    eventId : Nat;
    title : Text;
    description : Text;
    assignedTo : ?Text;
    isCompleted : Bool;
    dueDate : ?Int;
    createdAt : Int;
  };

  public type Reminder = {
    id : Nat;
    eventId : Nat;
    offsetMinutes : Nat;
    reminderLabel : Text;
    isTriggered : Bool;
  };

  public type TeamMember = {
    id : Nat;
    name : Text;
    email : Text;
    role : TeamMemberRole;
    isActive : Bool;
  };

  // Storage
  let userProfiles = Map.empty<Principal, UserProfile>();
  let clients = Map.empty<Nat, Client>();
  let events = Map.empty<Nat, CalendarEvent>();
  let tasks = Map.empty<Nat, CalendarTask>();
  let reminders = Map.empty<Nat, Reminder>();
  let teamMembers = Map.empty<Nat, TeamMember>();

  let nextClientId = Map.empty<Text, Nat>();
  let nextEventId = Map.empty<Text, Nat>();
  let nextTaskId = Map.empty<Text, Nat>();
  let nextReminderId = Map.empty<Text, Nat>();
  let nextTeamMemberId = Map.empty<Text, Nat>();

  // Initialize counters
  nextClientId.add("value", 1);
  nextEventId.add("value", 1);
  nextTaskId.add("value", 1);
  nextReminderId.add("value", 1);
  nextTeamMemberId.add("value", 1);

  // Helper function to check if caller is admin or manager
  func isAdminOrManager(caller : Principal) : Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };
    switch (userProfiles.get(caller)) {
      case (?profile) {
        profile.role == #admin or profile.role == #manager;
      };
      case (null) { false };
    };
  };

  // Helper function to check if caller is any team member
  func isTeamMember(caller : Principal) : Bool {
    if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      switch (userProfiles.get(caller)) {
        case (?profile) { profile.isActive };
        case (null) { false };
      };
    } else {
      false;
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Client Management
  public shared ({ caller }) func createClient(name : Text, email : Text, phone : Text, company : Text, notes : Text) : async Nat {
    if (not isAdminOrManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can create clients");
    };

    let currentId = switch (nextClientId.get("value")) {
      case (?id) { id };
      case (null) { Runtime.trap("ClientId counter not found") };
    };

    let newClient : Client = {
      id = currentId;
      name;
      email;
      phone;
      company;
      notes;
      createdAt = Time.now();
    };

    clients.add(currentId, newClient);
    nextClientId.add("value", currentId + 1);
    currentId;
  };

  public query ({ caller }) func getClient(id : Nat) : async ?Client {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view clients");
    };
    clients.get(id);
  };

  public query ({ caller }) func getAllClients() : async [Client] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view clients");
    };
    clients.values().toArray();
  };

  public shared ({ caller }) func updateClient(id : Nat, name : Text, email : Text, phone : Text, company : Text, notes : Text) : async () {
    if (not isAdminOrManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can update clients");
    };

    switch (clients.get(id)) {
      case (null) {
        Runtime.trap("Client not found");
      };
      case (?existingClient) {
        let updatedClient : Client = {
          existingClient with
          name;
          email;
          phone;
          company;
          notes;
        };
        clients.add(id, updatedClient);
      };
    };
  };

  public shared ({ caller }) func deleteClient(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete clients");
    };
    if (not clients.containsKey(id)) {
      Runtime.trap("Client not found");
    };
    clients.remove(id);
  };

  // Event Management
  public shared ({ caller }) func createEvent(
    clientId : Nat,
    title : Text,
    eventType : EventType,
    status : EventStatus,
    startTime : Int,
    endTime : Int,
    location : Text,
    requirements : [Text],
    budget : ?Float,
    notes : Text,
    assignedTeamMemberIds : [Nat],
    colorTag : Text
  ) : async Nat {
    if (not isAdminOrManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can create events");
    };

    let currentId = switch (nextEventId.get("value")) {
      case (?id) { id };
      case (null) { Runtime.trap("EventId counter not found") };
    };

    let newEvent : CalendarEvent = {
      id = currentId;
      clientId;
      title;
      eventType;
      status;
      startTime;
      endTime;
      location;
      requirements;
      budget;
      notes;
      assignedTeamMemberIds;
      colorTag;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    events.add(currentId, newEvent);
    nextEventId.add("value", currentId + 1);
    currentId;
  };

  public query ({ caller }) func getEvent(id : Nat) : async ?CalendarEvent {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view events");
    };
    events.get(id);
  };

  public query ({ caller }) func getAllEvents() : async [CalendarEvent] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view events");
    };
    events.values().toArray();
  };

  public shared ({ caller }) func updateEvent(
    id : Nat,
    clientId : Nat,
    title : Text,
    eventType : EventType,
    status : EventStatus,
    startTime : Int,
    endTime : Int,
    location : Text,
    requirements : [Text],
    budget : ?Float,
    notes : Text,
    assignedTeamMemberIds : [Nat],
    colorTag : Text
  ) : async () {
    if (not isAdminOrManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can update events");
    };

    switch (events.get(id)) {
      case (null) {
        Runtime.trap("Event not found");
      };
      case (?existingEvent) {
        let updatedEvent : CalendarEvent = {
          existingEvent with
          clientId;
          title;
          eventType;
          status;
          startTime;
          endTime;
          location;
          requirements;
          budget;
          notes;
          assignedTeamMemberIds;
          colorTag;
          updatedAt = Time.now();
        };
        events.add(id, updatedEvent);
      };
    };
  };

  public shared ({ caller }) func deleteEvent(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete events");
    };
    if (not events.containsKey(id)) {
      Runtime.trap("Event not found");
    };
    events.remove(id);
  };

  public query ({ caller }) func getEventsByClient(clientId : Nat) : async [CalendarEvent] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view events");
    };
    let filtered = events.values().toList<CalendarEvent>().filter(
      func(e) { e.clientId == clientId }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getEventsByStatus(status : EventStatus) : async [CalendarEvent] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view events");
    };
    let filtered = events.values().toList<CalendarEvent>().filter(
      func(e) { e.status == status }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getEventsByType(eventType : EventType) : async [CalendarEvent] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view events");
    };
    let filtered = events.values().toList<CalendarEvent>().filter(
      func(e) { e.eventType == eventType }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getEventsByDateRange(startTime : Int, endTime : Int) : async [CalendarEvent] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view events");
    };
    let filtered = events.values().toList<CalendarEvent>().filter(
      func(e) { e.startTime >= startTime and e.endTime <= endTime }
    );
    filtered.toArray();
  };

  public query ({ caller }) func searchEvents(keyword : Text) : async [CalendarEvent] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can search events");
    };
    let lowerKeyword = keyword.toLower();
    let filtered = events.values().toList<CalendarEvent>().filter(
      func(e) {
        e.title.toLower().contains(#text lowerKeyword) or
        e.location.toLower().contains(#text lowerKeyword)
      }
    );
    filtered.toArray();
  };

  // Task Management
  public shared ({ caller }) func createTask(
    eventId : Nat,
    title : Text,
    description : Text,
    assignedTo : ?Text,
    dueDate : ?Int
  ) : async Nat {
    if (not isAdminOrManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can create tasks");
    };

    let currentId = switch (nextTaskId.get("value")) {
      case (?id) { id };
      case (null) { Runtime.trap("TaskId counter not found") };
    };

    let newTask : CalendarTask = {
      id = currentId;
      eventId;
      title;
      description;
      assignedTo;
      isCompleted = false;
      dueDate;
      createdAt = Time.now();
    };

    tasks.add(currentId, newTask);
    nextTaskId.add("value", currentId + 1);
    currentId;
  };

  public query ({ caller }) func getTask(id : Nat) : async ?CalendarTask {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view tasks");
    };
    tasks.get(id);
  };

  public query ({ caller }) func getTasksByEvent(eventId : Nat) : async [CalendarTask] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view tasks");
    };
    let filtered = tasks.values().toList<CalendarTask>().filter(
      func(t) { t.eventId == eventId }
    );
    filtered.toArray();
  };

  public shared ({ caller }) func updateTask(
    id : Nat,
    title : Text,
    description : Text,
    assignedTo : ?Text,
    dueDate : ?Int,
    isCompleted : Bool
  ) : async () {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can update tasks");
    };

    switch (tasks.get(id)) {
      case (null) {
        Runtime.trap("Task not found");
      };
      case (?existingTask) {
        let updatedTask : CalendarTask = {
          existingTask with
          title;
          description;
          assignedTo;
          dueDate;
          isCompleted;
        };
        tasks.add(id, updatedTask);
      };
    };
  };

  public shared ({ caller }) func toggleTaskCompletion(id : Nat) : async () {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can toggle task completion");
    };

    switch (tasks.get(id)) {
      case (null) {
        Runtime.trap("Task not found");
      };
      case (?existingTask) {
        let updatedTask : CalendarTask = {
          existingTask with
          isCompleted = not existingTask.isCompleted;
        };
        tasks.add(id, updatedTask);
      };
    };
  };

  public shared ({ caller }) func deleteTask(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete tasks");
    };
    if (not tasks.containsKey(id)) {
      Runtime.trap("Task not found");
    };
    tasks.remove(id);
  };

  public query ({ caller }) func getOverdueTasks() : async [CalendarTask] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view tasks");
    };
    let now = Time.now();
    let filtered = tasks.values().toList<CalendarTask>().filter(
      func(t) {
        not t.isCompleted and (switch (t.dueDate) {
          case (?due) { due < now };
          case (null) { false };
        })
      }
    );
    filtered.toArray();
  };

  // Reminder Management
  public shared ({ caller }) func createReminder(
    eventId : Nat,
    offsetMinutes : Nat,
    reminderLabel : Text
  ) : async Nat {
    if (not isAdminOrManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can create reminders");
    };

    let currentId = switch (nextReminderId.get("value")) {
      case (?id) { id };
      case (null) { Runtime.trap("ReminderId counter not found") };
    };

    let newReminder : Reminder = {
      id = currentId;
      eventId;
      offsetMinutes;
      reminderLabel;
      isTriggered = false;
    };

    reminders.add(currentId, newReminder);
    nextReminderId.add("value", currentId + 1);
    currentId;
  };

  public query ({ caller }) func getReminder(id : Nat) : async ?Reminder {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view reminders");
    };
    reminders.get(id);
  };

  public query ({ caller }) func getRemindersByEvent(eventId : Nat) : async [Reminder] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view reminders");
    };
    let filtered = reminders.values().toList<Reminder>().filter(
      func(r) { r.eventId == eventId }
    );
    filtered.toArray();
  };

  public query ({ caller }) func getRemindersDueSoon() : async [Reminder] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view reminders");
    };
    let now = Time.now();
    let twentyFourHoursInNanos = 24 * 60 * 60 * 1_000_000_000;

    let filtered = reminders.values().toList<Reminder>().filter(
      func(r) {
        if (r.isTriggered) {
          return false;
        };
        switch (events.get(r.eventId)) {
          case (?event) {
            let reminderTime = event.startTime - (r.offsetMinutes * 60 * 1_000_000_000);
            reminderTime <= (now + twentyFourHoursInNanos) and reminderTime >= now;
          };
          case (null) { false };
        };
      }
    );
    filtered.toArray();
  };

  public shared ({ caller }) func updateReminder(
    id : Nat,
    offsetMinutes : Nat,
    reminderLabel : Text,
    isTriggered : Bool
  ) : async () {
    if (not isAdminOrManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can update reminders");
    };

    switch (reminders.get(id)) {
      case (null) {
        Runtime.trap("Reminder not found");
      };
      case (?existingReminder) {
        let updatedReminder : Reminder = {
          existingReminder with
          offsetMinutes;
          reminderLabel;
          isTriggered;
        };
        reminders.add(id, updatedReminder);
      };
    };
  };

  public shared ({ caller }) func deleteReminder(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete reminders");
    };
    if (not reminders.containsKey(id)) {
      Runtime.trap("Reminder not found");
    };
    reminders.remove(id);
  };

  // Team Member Management
  public shared ({ caller }) func createTeamMember(
    name : Text,
    email : Text,
    role : TeamMemberRole
  ) : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can create team members");
    };

    let currentId = switch (nextTeamMemberId.get("value")) {
      case (?id) { id };
      case (null) { Runtime.trap("TeamMemberId counter not found") };
    };

    let newTeamMember : TeamMember = {
      id = currentId;
      name;
      email;
      role;
      isActive = true;
    };

    teamMembers.add(currentId, newTeamMember);
    nextTeamMemberId.add("value", currentId + 1);
    currentId;
  };

  public query ({ caller }) func getTeamMember(id : Nat) : async ?TeamMember {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view team members");
    };
    teamMembers.get(id);
  };

  public query ({ caller }) func getAllTeamMembers() : async [TeamMember] {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view team members");
    };
    teamMembers.values().toArray();
  };

  public shared ({ caller }) func updateTeamMember(
    id : Nat,
    name : Text,
    email : Text,
    role : TeamMemberRole,
    isActive : Bool
  ) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update team members");
    };

    switch (teamMembers.get(id)) {
      case (null) {
        Runtime.trap("Team member not found");
      };
      case (?existingMember) {
        let updatedMember : TeamMember = {
          existingMember with
          name;
          email;
          role;
          isActive;
        };
        teamMembers.add(id, updatedMember);
      };
    };
  };

  public shared ({ caller }) func deleteTeamMember(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete team members");
    };
    if (not teamMembers.containsKey(id)) {
      Runtime.trap("Team member not found");
    };
    teamMembers.remove(id);
  };

  // Dashboard Data
  public query ({ caller }) func getDashboardData() : async {
    upcomingEvents : [CalendarEvent];
    todaysEvents : [CalendarEvent];
    overdueTasks : [CalendarTask];
    eventCountsByStatus : [(EventStatus, Nat)];
  } {
    if (not isTeamMember(caller)) {
      Runtime.trap("Unauthorized: Only team members can view dashboard data");
    };

    let now = Time.now();
    let sevenDaysInNanos = 7 * 24 * 60 * 60 * 1_000_000_000;
    let oneDayInNanos = 24 * 60 * 60 * 1_000_000_000;

    let upcomingEvents = events.values().toList<CalendarEvent>().filter(
      func(e) {
        e.startTime >= now and e.startTime <= (now + sevenDaysInNanos)
      }
    ).toArray();

    let todaysEvents = events.values().toList<CalendarEvent>().filter(
      func(e) {
        e.startTime >= now and e.startTime < (now + oneDayInNanos)
      }
    ).toArray();

    let overdueTasks = tasks.values().toList<CalendarTask>().filter(
      func(t) {
        not t.isCompleted and (switch (t.dueDate) {
          case (?due) { due < now };
          case (null) { false };
        })
      }
    ).toArray();

    let plannedCount = events.values().toList<CalendarEvent>().filter(func(e) { e.status == #planned }).size();
    let confirmedCount = events.values().toList<CalendarEvent>().filter(func(e) { e.status == #confirmed }).size();
    let inProgressCount = events.values().toList<CalendarEvent>().filter(func(e) { e.status == #inProgress }).size();
    let completedCount = events.values().toList<CalendarEvent>().filter(func(e) { e.status == #completed }).size();
    let cancelledCount = events.values().toList<CalendarEvent>().filter(func(e) { e.status == #cancelled }).size();

    {
      upcomingEvents;
      todaysEvents;
      overdueTasks;
      eventCountsByStatus = [
        (#planned, plannedCount),
        (#confirmed, confirmedCount),
        (#inProgress, inProgressCount),
        (#completed, completedCount),
        (#cancelled, cancelledCount)
      ];
    };
  };

  // Assign/Unassign Team Members to Events
  public shared ({ caller }) func assignTeamMemberToEvent(eventId : Nat, teamMemberId : Nat) : async () {
    if (not isAdminOrManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can assign team members");
    };

    switch (events.get(eventId)) {
      case (null) {
        Runtime.trap("Event not found");
      };
      case (?event) {
        let alreadyAssigned = event.assignedTeamMemberIds.filter(
          func(id) { id == teamMemberId }
        ).size() > 0;

        if (alreadyAssigned) {
          Runtime.trap("Team member already assigned to this event");
        };

        let updatedIds = event.assignedTeamMemberIds.concat([teamMemberId]);
        let updatedEvent = {
          event with
          assignedTeamMemberIds = updatedIds;
          updatedAt = Time.now();
        };
        events.add(eventId, updatedEvent);
      };
    };
  };

  public shared ({ caller }) func unassignTeamMemberFromEvent(eventId : Nat, teamMemberId : Nat) : async () {
    if (not isAdminOrManager(caller)) {
      Runtime.trap("Unauthorized: Only admins and managers can unassign team members");
    };

    switch (events.get(eventId)) {
      case (null) {
        Runtime.trap("Event not found");
      };
      case (?event) {
        let updatedIds = event.assignedTeamMemberIds.filter(
          func(id) { id != teamMemberId }
        );
        let updatedEvent = {
          event with
          assignedTeamMemberIds = updatedIds;
          updatedAt = Time.now();
        };
        events.add(eventId, updatedEvent);
      };
    };
  };
};
