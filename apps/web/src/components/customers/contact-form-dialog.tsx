import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCustomerContactSchema,
  useCreateCustomerContactMutation,
  useUpdateCustomerContactMutation,
  type CreateCustomerContactFormData,
} from "@repo/api-client";
import type { CustomerContact } from "@repo/types";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactFormDialogProps {
  customerId: string;
  contact?: CustomerContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactFormDialog({
  customerId,
  contact,
  open,
  onOpenChange,
}: ContactFormDialogProps) {
  const isEdit = !!contact;
  const createMutation = useCreateCustomerContactMutation();
  const updateMutation = useUpdateCustomerContactMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerContactFormData>({
    resolver: zodResolver(createCustomerContactSchema),
    defaultValues: contact
      ? {
          name: contact.name,
          phone: contact.phone,
          role: contact.role ?? "",
          department: contact.department ?? "",
          email: contact.email ?? "",
          is_primary: contact.is_primary,
          notes: contact.notes ?? "",
        }
      : {
          name: "",
          phone: "",
          role: "",
          department: "",
          email: "",
          is_primary: false,
          notes: "",
        },
  });

  useEffect(() => {
    if (open) {
      reset(
        contact
          ? {
              name: contact.name,
              phone: contact.phone,
              role: contact.role ?? "",
              department: contact.department ?? "",
              email: contact.email ?? "",
              is_primary: contact.is_primary,
              notes: contact.notes ?? "",
            }
          : {
              name: "",
              phone: "",
              role: "",
              department: "",
              email: "",
              is_primary: false,
              notes: "",
            }
      );
    }
  }, [open, contact, reset]);

  async function onSubmit(data: CreateCustomerContactFormData) {
    if (isEdit && contact) {
      const result = await updateMutation.mutateAsync({
        contactId: contact.id,
        customerId,
        payload: data,
      });
      if (result.data) onOpenChange(false);
    } else {
      const result = await createMutation.mutateAsync({
        customerId,
        payload: data,
      });
      if (result.data) onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                {...register("name")}
                placeholder="Contact name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                {...register("phone")}
                placeholder="+1 234 567 8900"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-role">Role</Label>
              <Input
                id="contact-role"
                {...register("role")}
                placeholder="e.g. Manager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-department">Department</Label>
              <Input
                id="contact-department"
                {...register("department")}
                placeholder="e.g. Operations"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              {...register("email")}
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="contact-is-primary"
              {...register("is_primary")}
              className="rounded"
            />
            <Label htmlFor="contact-is-primary" className="text-sm font-normal">
              Primary contact
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-notes">Notes</Label>
            <textarea
              id="contact-notes"
              {...register("notes")}
              placeholder="Optional notes"
              rows={2}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update Contact" : "Add Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
