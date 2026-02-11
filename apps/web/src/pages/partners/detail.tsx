import { useParams, Link } from "react-router-dom";
import { usePartnerDetail, useDeletePartnerMutation } from "@repo/api-client";
import { Loader2, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

export default function PartnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading } = usePartnerDetail(id);
  const deleteMutation = useDeletePartnerMutation();

  const partner = result?.data ?? null;
  const error = result?.error;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error?.message ?? "Partner not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  async function handleDelete() {
    if (!id || !window.confirm("Delete this partner? This cannot be undone.")) return;
    const result = await deleteMutation.mutateAsync(id);
    if (result.error) {
      alert(result.error.message);
      return;
    }
    navigate("/partners");
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/partners" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold tracking-tight">{partner.name}</h1>
        <Link to={`/partners/${id}/edit`} className={cn(buttonVariants({ variant: "outline" }))}>
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
                <dd>{partner.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{partner.phone ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Co-Owned Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {partner.equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">No equipment linked to this partner</p>
            ) : (
              <div className="space-y-3">
                {partner.equipment.map((eq) => (
                  <Link
                    key={eq.id}
                    to={`/equipment/${eq.id}`}
                    className="block rounded-md border p-3 text-sm transition-colors hover:border-primary/50"
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{eq.name}</span>
                      <span className="font-mono text-muted-foreground">{eq.serial_number}</span>
                    </div>
                    {eq.percentage != null && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        Ownership: {Number(eq.percentage).toFixed(1)}%
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
