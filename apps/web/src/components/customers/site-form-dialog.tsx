import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCustomerSiteSchema,
  useCreateCustomerSiteMutation,
  useUpdateCustomerSiteMutation,
  type CreateCustomerSiteFormData,
} from "@repo/api-client";
import type { CustomerSite } from "@repo/types";
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

interface SiteFormDialogProps {
  customerId: string;
  site?: CustomerSite;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SiteFormDialog({
  customerId,
  site,
  open,
  onOpenChange,
}: SiteFormDialogProps) {
  const isEdit = !!site;
  const createMutation = useCreateCustomerSiteMutation();
  const updateMutation = useUpdateCustomerSiteMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerSiteFormData>({
    resolver: zodResolver(createCustomerSiteSchema),
    defaultValues: site
      ? {
          name: site.name,
          address: site.address ?? "",
          city: site.city ?? "",
          gps_coordinates: site.gps_coordinates ?? "",
          landmarks: site.landmarks ?? "",
          notes: site.notes ?? "",
        }
      : {
          name: "",
          address: "",
          city: "",
          gps_coordinates: "",
          landmarks: "",
          notes: "",
        },
  });

  useEffect(() => {
    if (open) {
      reset(
        site
          ? {
              name: site.name,
              address: site.address ?? "",
              city: site.city ?? "",
              gps_coordinates: site.gps_coordinates ?? "",
              landmarks: site.landmarks ?? "",
              notes: site.notes ?? "",
            }
          : {
              name: "",
              address: "",
              city: "",
              gps_coordinates: "",
              landmarks: "",
              notes: "",
            }
      );
    }
  }, [open, site, reset]);

  async function onSubmit(data: CreateCustomerSiteFormData) {
    if (isEdit && site) {
      const result = await updateMutation.mutateAsync({
        siteId: site.id,
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
          <DialogTitle>{isEdit ? "Edit Site" : "Add Site"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">Name</Label>
            <Input
              id="site-name"
              {...register("name")}
              placeholder="Site name"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-address">Address</Label>
              <Input
                id="site-address"
                {...register("address")}
                placeholder="Street address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-city">City</Label>
              <Input
                id="site-city"
                {...register("city")}
                placeholder="City"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-gps">GPS Coordinates</Label>
              <Input
                id="site-gps"
                {...register("gps_coordinates")}
                placeholder="e.g. 24.7136, 46.6753"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site-landmarks">Landmarks</Label>
              <Input
                id="site-landmarks"
                {...register("landmarks")}
                placeholder="Nearby landmarks"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-notes">Notes</Label>
            <textarea
              id="site-notes"
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
              {isEdit ? "Update Site" : "Add Site"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
