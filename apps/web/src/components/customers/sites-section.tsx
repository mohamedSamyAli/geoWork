import { useState } from "react";
import {
  useCustomerSites,
  useSoftDeleteCustomerSiteMutation,
} from "@repo/api-client";
import type { CustomerSite } from "@repo/types";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteFormDialog } from "./site-form-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SitesSectionProps {
  customerId: string;
}

export function SitesSection({ customerId }: SitesSectionProps) {
  const { data: sitesResult, isLoading } = useCustomerSites(customerId);
  const deleteMutation = useSoftDeleteCustomerSiteMutation();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSite, setEditingSite] = useState<CustomerSite | null>(null);
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);

  const sites = sitesResult?.data ?? [];

  function handleDelete(siteId: string) {
    deleteMutation.mutate(
      { siteId, customerId },
      { onSuccess: () => setDeletingSiteId(null) }
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sites</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Site
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sites.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No sites added yet.
            </p>
          ) : (
            <div className="space-y-2">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{site.name}</p>
                    <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      {site.address && <span>{site.address}</span>}
                      {site.city && <span>{site.city}</span>}
                      {site.gps_coordinates && (
                        <span className="font-mono">{site.gps_coordinates}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingSite(site)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setDeletingSiteId(site.id)}
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
      <SiteFormDialog
        customerId={customerId}
        open={showAddDialog || !!editingSite}
        site={editingSite ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingSite(null);
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingSiteId}
        onOpenChange={(open) => {
          if (!open) setDeletingSiteId(null);
        }}
      >
        <DialogContent onClose={() => setDeletingSiteId(null)}>
          <DialogHeader>
            <DialogTitle>Delete Site</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete this site? This action cannot be
            undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingSiteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingSiteId && handleDelete(deletingSiteId)}
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
