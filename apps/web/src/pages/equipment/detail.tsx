import { useParams, Link } from "react-router-dom";
import {
  useEquipmentDetail,
  useArchiveEquipmentMutation,
  useReactivateEquipmentMutation,
} from "@repo/api-client";
import { Loader2, ArrowLeft, Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import PartnerOwnership from "@/components/equipment/partner-ownership";

export default function EquipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading } = useEquipmentDetail(id);
  const archiveMutation = useArchiveEquipmentMutation();
  const reactivateMutation = useReactivateEquipmentMutation();

  const equipment = result?.data ?? null;
  const error = result?.error;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error?.message ?? "Equipment not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isArchiving = archiveMutation.isPending || reactivateMutation.isPending;

  function handleStatusToggle() {
    if (!id) return;
    if (equipment!.status === "active") {
      archiveMutation.mutate(id);
    } else {
      reactivateMutation.mutate(id);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/equipment" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold tracking-tight">{equipment.name}</h1>
        <Link to={`/equipment/${id}/edit`} className={cn(buttonVariants({ variant: "outline" }))}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Link>
        <Button
          variant={equipment.status === "active" ? "destructive" : "default"}
          onClick={handleStatusToggle}
          disabled={isArchiving}
        >
          {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {equipment.status === "active" ? "Archive" : "Reactivate"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Serial Number</dt>
                <dd className="font-mono">{equipment.serial_number}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd>{equipment.equipment_type?.name ?? "—"}</dd>
              </div>
              {equipment.model && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Model</dt>
                  <dd>{equipment.model}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Ownership</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      equipment.ownership_type === "owned"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {equipment.ownership_type}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      equipment.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {equipment.status}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {equipment.ownership_type === "rented" && equipment.supplier && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rental Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Supplier</dt>
                  <dd>
                    <Link
                      to={`/suppliers/${equipment.supplier.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {equipment.supplier.name}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Monthly Rent</dt>
                  <dd className="font-mono">
                    {equipment.monthly_rent != null
                      ? `$${Number(equipment.monthly_rent).toFixed(2)}`
                      : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Daily Rent</dt>
                  <dd className="font-mono">
                    {equipment.daily_rent != null
                      ? `$${Number(equipment.daily_rent).toFixed(2)}`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Partner ownership section — only for owned equipment */}
      {equipment.ownership_type === "owned" && id && (
        <div className="mt-6">
          <PartnerOwnership equipmentId={id} />
        </div>
      )}
    </div>
  );
}
