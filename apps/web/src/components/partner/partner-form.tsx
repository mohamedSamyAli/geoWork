import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPartnerSchema, type CreatePartnerFormData } from "@repo/api-client";
import type { Partner } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface PartnerFormProps {
  defaultValues?: Partner;
  onSubmit: (data: CreatePartnerFormData) => Promise<void>;
  isPending: boolean;
}

export default function PartnerForm({ defaultValues, onSubmit, isPending }: PartnerFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePartnerFormData>({
    resolver: zodResolver(createPartnerSchema),
    defaultValues: defaultValues
      ? { name: defaultValues.name, phone: defaultValues.phone ?? undefined }
      : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} placeholder="Partner name" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" {...register("phone")} placeholder="+1 234 567 890" />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues ? "Update Partner" : "Create Partner"}
      </Button>
    </form>
  );
}
