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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Crown,
  Edit2,
  Loader2,
  Mail,
  Plus,
  Search,
  Shield,
  Trash2,
  UsersRound,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type TeamMember,
  TeamMemberRole,
  useAllTeamMembers,
  useCreateTeamMember,
  useDeleteTeamMember,
  useIsAdmin,
  useUpdateTeamMember,
} from "../hooks/useQueries";

function getRoleBadgeClass(role: TeamMemberRole): string {
  switch (role) {
    case TeamMemberRole.admin:
      return "bg-amber-100 text-amber-700 border-amber-200";
    case TeamMemberRole.manager:
      return "bg-blue-100 text-blue-700 border-blue-200";
    case TeamMemberRole.member:
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getRoleLabel(role: TeamMemberRole): string {
  switch (role) {
    case TeamMemberRole.admin:
      return "Admin";
    case TeamMemberRole.manager:
      return "Manager";
    case TeamMemberRole.member:
      return "Member";
    default:
      return String(role);
  }
}

function TeamMemberForm({
  open,
  onClose,
  member,
}: {
  open: boolean;
  onClose: () => void;
  member?: TeamMember | null;
}) {
  const isEdit = !!member;
  const create = useCreateTeamMember();
  const update = useUpdateTeamMember();

  const [form, setForm] = useState({
    name: member?.name ?? "",
    email: member?.email ?? "",
    role: member?.role ?? TeamMemberRole.member,
    isActive: member?.isActive ?? true,
  });

  const handleOpen = (open: boolean) => {
    if (open && member) {
      setForm({
        name: member.name,
        email: member.email,
        role: member.role,
        isActive: member.isActive,
      });
    } else if (open) {
      setForm({
        name: "",
        email: "",
        role: TeamMemberRole.member,
        isActive: true,
      });
    }
    if (!open) onClose();
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    try {
      if (isEdit && member) {
        await update.mutateAsync({ id: member.id, ...form });
        toast.success("Team member updated");
      } else {
        await create.mutateAsync({
          name: form.name,
          email: form.email,
          role: form.role,
        });
        toast.success("Team member added");
      }
      onClose();
    } catch {
      toast.error("Failed to save team member");
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Team Member" : "Add Team Member"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Alex Johnson"
            />
          </div>
          <div className="space-y-1.5">
            <Label>
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="alex@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) =>
                setForm((p) => ({ ...p, role: v as TeamMemberRole }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TeamMemberRole.member}>Member</SelectItem>
                <SelectItem value={TeamMemberRole.manager}>Manager</SelectItem>
                <SelectItem value={TeamMemberRole.admin}>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isEdit && (
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEdit ? "Save Changes" : "Add Member"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TeamPage() {
  const { data: members = [], isLoading } = useAllTeamMembers();
  const { data: isAdmin } = useIsAdmin();
  const deleteTeamMember = useDeleteTeamMember();
  const updateTeamMember = useUpdateTeamMember();

  const [formOpen, setFormOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<TeamMemberRole | "all">("all");

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !search.trim() ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTeamMember.mutateAsync(deleteId);
      toast.success("Team member removed");
    } catch {
      toast.error("Failed to remove team member");
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (member: TeamMember) => {
    try {
      await updateTeamMember.mutateAsync({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        isActive: !member.isActive,
      });
      toast.success(
        member.isActive ? "Member deactivated" : "Member activated",
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-border">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Team
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-accent font-semibold tabular-nums">
              {activeCount}
            </span>{" "}
            active
            <span className="text-muted-foreground/50 mx-1.5">·</span>
            {members.length} total
          </p>
        </div>
        <Button
          onClick={() => {
            setEditMember(null);
            setFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as TeamMemberRole | "all")}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value={TeamMemberRole.admin}>Admin</SelectItem>
            <SelectItem value={TeamMemberRole.manager}>Manager</SelectItem>
            <SelectItem value={TeamMemberRole.member}>Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {(["a", "b", "c", "d", "e"] as const).map((k) => (
            <Skeleton key={k} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <UsersRound className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">
            {search || roleFilter !== "all"
              ? "No members match your filters"
              : "No team members yet"}
          </p>
          {!(search || roleFilter !== "all") && (
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                setEditMember(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First Member
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredMembers.map((member, idx) => (
            <motion.div
              key={member.id.toString()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className={cn(
                "flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:shadow-card transition-shadow group",
                !member.isActive && "opacity-60",
              )}
            >
              {/* Avatar */}
              <Avatar className="w-10 h-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold font-display text-sm">
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{member.name}</p>
                  {member.role === TeamMemberRole.admin && (
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" />
                  {member.email}
                </p>
              </div>

              {/* Role Badge */}
              <span
                className={cn(
                  "hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                  getRoleBadgeClass(member.role),
                )}
              >
                {getRoleLabel(member.role)}
              </span>

              {/* Active toggle */}
              <div className="flex items-center gap-1.5">
                <Switch
                  checked={member.isActive}
                  onCheckedChange={() => handleToggleActive(member)}
                  className="scale-90"
                />
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {member.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setEditMember(member);
                    setFormOpen(true);
                  }}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                {isAdmin && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(member.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form */}
      <TeamMemberForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditMember(null);
        }}
        member={editMember}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this team member. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
