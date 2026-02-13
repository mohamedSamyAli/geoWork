import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCustomerSchema,
  type CreateCustomerFormData,
} from "@repo/api-client";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Customer } from "@repo/types";

interface CustomerFormProps {
  defaultValues?: Customer;
  onSubmit: (data: CreateCustomerFormData) => void | Promise<void>;
  isPending?: boolean;
}

export function CustomerForm({
  defaultValues,
  onSubmit,
  isPending,
}: CustomerFormProps) {
  const isEdit = !!defaultValues;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateCustomerFormData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          customer_type: defaultValues.customer_type,
          status: defaultValues.status,
          phone: defaultValues.phone ?? "",
          email: defaultValues.email ?? "",
          address: defaultValues.address ?? "",
          notes: defaultValues.notes ?? "",
        }
      : {
          name: "",
          customer_type: "company",
          status: "active",
          phone: "",
          email: "",
          address: "",
          notes: "",
        },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-tight">
          Basic Information
        </h3>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} placeholder="Customer name" />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_type">Customer Type</Label>
          <select
            id="customer_type"
            {...register("customer_type")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="company">Company</option>
            <option value="individual">Individual</option>
            <option value="government">Government</option>
          </select>
          {errors.customer_type && (
            <p className="text-sm text-destructive">
              {errors.customer_type.message}
            </p>
          )}
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register("status")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              {...register("phone")}
              placeholder="+1 234 567 8900"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <textarea
            id="address"
            {...register("address")}
            placeholder="Full address"
            rows={2}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            {...register("notes")}
            placeholder="Optional notes"
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {errors.notes && (
            <p className="text-sm text-destructive">{errors.notes.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEdit ? "Update Customer" : "Create Customer"}
      </Button>
    </form>
  );
}
