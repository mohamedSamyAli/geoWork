import { useState } from "react";
import {
  useCustomerContacts,
  useDeleteCustomerContactMutation,
} from "@repo/api-client";
import type { CustomerContact } from "@repo/types";
import { Plus, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactFormDialog } from "./contact-form-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactsSectionProps {
  customerId: string;
}

export function ContactsSection({ customerId }: ContactsSectionProps) {
  const { data: contactsResult, isLoading } = useCustomerContacts(customerId);
  const deleteMutation = useDeleteCustomerContactMutation();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  const contacts = contactsResult?.data ?? [];

  function handleDelete(contactId: string) {
    deleteMutation.mutate(
      { contactId, customerId },
      { onSuccess: () => setDeletingContactId(null) }
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Contacts</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No contacts added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{contact.name}</p>
                      {contact.is_primary && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <Star className="h-3 w-3 fill-amber-500" />
                          Primary
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      {contact.role && <span>{contact.role}</span>}
                      {contact.department && <span>{contact.department}</span>}
                      <span className="font-mono">{contact.phone}</span>
                      {contact.email && <span>{contact.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingContact(contact)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDeletingContactId(contact.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <ContactFormDialog
        customerId={customerId}
        open={showAddDialog || !!editingContact}
        contact={editingContact ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingContact(null);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingContactId}
        onOpenChange={(open) => {
          if (!open) setDeletingContactId(null);
        }}
      >
        <DialogContent onClose={() => setDeletingContactId(null)}>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete this contact? This action cannot be
            undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingContactId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingContactId && handleDelete(deletingContactId)}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
