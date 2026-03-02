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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Edit2,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "../components/EventBadges";
import {
  type Client,
  useAllClients,
  useCreateClient,
  useDeleteClient,
  useEventsByClient,
  useUpdateClient,
} from "../hooks/useQueries";
import { formatDate } from "../utils/dateTime";

function ClientForm({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
}) {
  const isEdit = !!client;
  const create = useCreateClient();
  const update = useUpdateClient();

  const [form, setForm] = useState({
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    company: client?.company ?? "",
    notes: client?.notes ?? "",
  });

  // Sync form state whenever the dialog opens or the client changes
  useEffect(() => {
    if (open) {
      setForm({
        name: client?.name ?? "",
        email: client?.email ?? "",
        phone: client?.phone ?? "",
        company: client?.company ?? "",
        notes: client?.notes ?? "",
      });
    }
  }, [open, client]);

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      if (isEdit && client) {
        await update.mutateAsync({ id: client.id, ...form });
        toast.success("Client updated");
      } else {
        await create.mutateAsync(form);
        toast.success("Client created");
      }
      onClose();
    } catch {
      toast.error("Failed to save client");
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Edit Client" : "New Client"}
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
              placeholder="Jane Smith"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              placeholder="jane@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) =>
                setForm((p) => ({ ...p, phone: e.target.value }))
              }
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Input
              value={form.company}
              onChange={(e) =>
                setForm((p) => ({ ...p, company: e.target.value }))
              }
              placeholder="Acme Corporation"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              placeholder="Any notes about this client…"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {isEdit ? "Save Changes" : "Create Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClientDetailSheet({
  client,
  onClose,
  onEdit,
}: {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { data: events = [], isLoading } = useEventsByClient(client.id);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-lg">{client.name}</h2>
          {client.company && (
            <p className="text-sm text-muted-foreground">{client.company}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contact info */}
      <div className="p-4 space-y-2 border-b border-border">
        {client.email && (
          <a
            href={`mailto:${client.email}`}
            className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
          >
            <Mail className="w-4 h-4 text-muted-foreground" />
            {client.email}
          </a>
        )}
        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
          >
            <Phone className="w-4 h-4 text-muted-foreground" />
            {client.phone}
          </a>
        )}
        {client.company && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            {client.company}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarDays className="w-3.5 h-3.5" />
          Client since {formatDate(client.createdAt)}
        </div>
      </div>

      {client.notes && (
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Notes
          </p>
          <p className="text-sm text-muted-foreground">{client.notes}</p>
        </div>
      )}

      {/* Event history */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Event History</p>
          <Badge variant="secondary">{events.length}</Badge>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {(["a", "b", "c"] as const).map((k) => (
              <Skeleton key={k} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No events yet
          </p>
        ) : (
          <div className="space-y-2">
            {[...events]
              .sort((a, b) => Number(b.startTime - a.startTime))
              .map((event) => (
                <div
                  key={event.id.toString()}
                  className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-lg"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: event.colorTag || "#6366f1" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.startTime)}
                    </p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useAllClients();
  const deleteClient = useDeleteClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [search, setSearch] = useState("");

  const filteredClients = clients.filter(
    (c) =>
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteClient.mutateAsync(deleteId);
      toast.success("Client deleted");
    } catch {
      toast.error("Failed to delete client");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-border">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Clients
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-accent font-semibold tabular-nums">
              {clients.length}
            </span>{" "}
            client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditClient(null);
            setFormOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search clients…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(["a", "b", "c", "d", "e", "f", "g", "h"] as const).map((k) => (
            <Skeleton key={k} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">
            {search ? "No clients match your search" : "No clients yet"}
          </p>
          {!search && (
            <Button
              className="mt-4"
              size="sm"
              onClick={() => {
                setEditClient(null);
                setFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First Client
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClients.map((client, idx) => (
            <motion.div
              key={client.id.toString()}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
            >
              <ClientCard
                client={client}
                onClick={() => setSelectedClient(client)}
                onEdit={(e) => {
                  e.stopPropagation();
                  setEditClient(client);
                  setFormOpen(true);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  setDeleteId(client.id);
                }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Forms */}
      <ClientForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditClient(null);
        }}
        client={editClient}
      />

      {/* Detail panel */}
      {selectedClient && (
        <>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: dismiss on backdrop click */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedClient(null)}
          />
          <ClientDetailSheet
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onEdit={() => {
              setEditClient(selectedClient);
              setSelectedClient(null);
              setFormOpen(true);
            }}
          />
        </>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this client. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClientCard({
  client,
  onClick,
  onEdit,
  onDelete,
}: {
  client: Client;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card
      className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold font-display text-sm shrink-0">
            {initials}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-0.5">
          <h3 className="font-semibold text-sm">{client.name}</h3>
          {client.company && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {client.company}
            </p>
          )}
        </div>

        <div className="mt-3 space-y-1">
          {client.email && (
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <Mail className="w-3 h-3 shrink-0" />
              {client.email}
            </p>
          )}
          {client.phone && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3 shrink-0" />
              {client.phone}
            </p>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-muted-foreground/60">
            Since{" "}
            {formatDate(client.createdAt, { year: "numeric", month: "short" })}
          </p>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}
