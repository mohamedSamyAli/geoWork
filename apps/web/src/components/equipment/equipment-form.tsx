import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createEquipmentSchema,
  useEquipmentTypes,
  useSupplierList,
  type CreateEquipmentFormData,
} from "@repo/api-client";
import type { EquipmentWithDetails } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface EquipmentFormProps {
  companyId: string;
  defaultValues?: EquipmentWithDetails;
  onSubmit: (data: CreateEquipmentFormData) => Promise<void>;
  isPending: boolean;
}

export default function EquipmentForm({
  companyId,
  defaultValues,
  onSubmit,
  isPending,
}: EquipmentFormProps) {
  const { data: typesResult } = useEquipmentTypes(companyId);
  const { data: suppliersResult } = useSupplierList(companyId);

  const types = typesResult?.data ?? [];
  const suppliers = suppliersResult?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateEquipmentFormData>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          serial_number: defaultValues.serial_number,
          equipment_type_id: defaultValues.equipment_type_id,
          model: defaultValues.model ?? undefined,
          ownership_type: defaultValues.ownership_type,
          supplier_id: defaultValues.supplier_id ?? undefined,
          monthly_rent: defaultValues.monthly_rent ?? undefined,
          daily_rent: defaultValues.daily_rent ?? undefined,
        }
      : { ownership_type: "owned" },
  });

  const ownershipType = watch("ownership_type");
  const prevOwnership = useRef(defaultValues?.ownership_type ?? "owned");

  // Ownership transition confirmation + clear fields
  useEffect(() => {
    const prev = prevOwnership.current;
    if (ownershipType === prev) return;

    if (defaultValues) {
      const msg =
        ownershipType === "rented"
          ? "Switching to rented will remove partner ownership data. Continue?"
          : "Switching to owned will remove supplier and rental cost data. Continue?";

      if (!window.confirm(msg)) {
        setValue("ownership_type", prev);
        return;
      }
    }

    prevOwnership.current = ownershipType;

    if (ownershipType === "owned") {
      setValue("supplier_id", undefined);
      setValue("monthly_rent", undefined);
      setValue("daily_rent", undefined);
    }
  }, [ownershipType, setValue, defaultValues]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} placeholder="Equipment name" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="serial_number">Serial Number</Label>
        <Input id="serial_number" {...register("serial_number")} placeholder="SN-001" />
        {errors.serial_number && (
          <p className="text-sm text-destructive">{errors.serial_number.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipment_type_id">Equipment Type</Label>
        <select
          id="equipment_type_id"
          {...register("equipment_type_id")}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select type...</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {errors.equipment_type_id && (
          <p className="text-sm text-destructive">{errors.equipment_type_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model (optional)</Label>
        <Input id="model" {...register("model")} placeholder="Model name" />
      </div>

      <div className="space-y-2">
        <Label>Ownership Type</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" value="owned" {...register("ownership_type")} />
            <span className="text-sm">Owned</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="rented" {...register("ownership_type")} />
            <span className="text-sm">Rented</span>
          </label>
        </div>
      </div>

      {ownershipType === "rented" && (
        <div className="space-y-4 rounded-md border p-4">
          <h3 className="text-sm font-medium">Rental Details</h3>

          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <select
              id="supplier_id"
              {...register("supplier_id")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supplier_id && (
              <p className="text-sm text-destructive">{errors.supplier_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_rent">Monthly Rent</Label>
              <Input
                id="monthly_rent"
                type="number"
                step="0.01"
                {...register("monthly_rent")}
                placeholder="0.00"
              />
              {errors.monthly_rent && (
                <p className="text-sm text-destructive">{errors.monthly_rent.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="daily_rent">Daily Rent</Label>
              <Input
                id="daily_rent"
                type="number"
                step="0.01"
                {...register("daily_rent")}
                placeholder="0.00"
              />
              {errors.daily_rent && (
                <p className="text-sm text-destructive">{errors.daily_rent.message}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues ? "Update Equipment" : "Create Equipment"}
      </Button>
    </form>
  );
}
