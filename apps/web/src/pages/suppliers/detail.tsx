import { useParams, Link } from "react-router-dom";
import { useSupplierDetail, useDeleteSupplierMutation } from "@repo/api-client";
import { Loader2, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading } = useSupplierDetail(id);
  const deleteMutation = useDeleteSupplierMutation();

  const supplier = result?.data ?? null;
  const error = result?.error;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error?.message ?? "Supplier not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  async function handleDelete() {
    if (!id || !window.confirm("Delete this supplier? This cannot be undone.")) return;
    const result = await deleteMutation.mutateAsync(id);
    if (result.error) {
      alert(result.error.message);
      return;
    }
    navigate("/suppliers");
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/suppliers" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold tracking-tight">{supplier.name}</h1>
        <Link to={`/suppliers/${id}/edit`} className={cn(buttonVariants({ variant: "outline" }))}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Link>
        <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete
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
                <dt className="text-muted-foreground">Name</dt>
                <dd>{supplier.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{supplier.phone ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rented Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {supplier.equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">No equipment linked to this supplier</p>
            ) : (
              <div className="space-y-3">
                {supplier.equipment.map((eq) => (
                  <Link
                    key={eq.id}
                    to={`/equipment/${eq.id}`}
                    className="block rounded-md border p-3 text-sm transition-colors hover:border-primary/50"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{eq.name}</span>
                      <span className="font-mono text-muted-foreground">{eq.serial_number}</span>
                    </div>
                    {(eq.monthly_rent != null || eq.daily_rent != null) && (
                      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                        {eq.monthly_rent != null && <span>Monthly: ${Number(eq.monthly_rent).toFixed(2)}</span>}
                        {eq.daily_rent != null && <span>Daily: ${Number(eq.daily_rent).toFixed(2)}</span>}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
