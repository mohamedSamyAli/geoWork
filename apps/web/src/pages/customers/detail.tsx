import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useCustomerDetail,
  useSoftDeleteCustomerMutation,
  useMyCompanies,
} from "@repo/api-client";
import type { CustomerType, CustomerStatus } from "@repo/types";
import { Loader2, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { ContactsSection } from "@/components/customers/contacts-section";
import { SitesSection } from "@/components/customers/sites-section";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const typeLabels: Record<CustomerType, string> = {
  individual: "Individual",
  company: "Company",
  government: "Government",
};

const typeColors: Record<CustomerType, string> = {
  individual: "bg-blue-100 text-blue-700",
  company: "bg-purple-100 text-purple-700",
  government: "bg-amber-100 text-amber-700",
};

const statusColors: Record<CustomerStatus, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  prospect: "bg-sky-100 text-sky-700",
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: result, isLoading } = useCustomerDetail(id);
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const deleteMutation = useSoftDeleteCustomerMutation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const customer = result?.data ?? null;
  const error = result?.error;

  function handleDelete() {
    if (!id || !companyId) return;
    deleteMutation.mutate(
      { customerId: id, companyId },
      {
        onSuccess: () => navigate("/customers"),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message ?? "Customer not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          to="/customers"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold tracking-tight">
          {customer.name}
        </h1>
        <Link
          to={`/customers/${id}/edit`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Link>
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Two-column grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      typeColors[customer.customer_type]
                    )}
                  >
                    {typeLabels[customer.customer_type]}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      statusColors[customer.status]
                    )}
                  >
                    {customer.status}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-mono">{customer.phone ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{customer.email ?? "—"}</dd>
              </div>
              {customer.address && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="max-w-[250px] text-right">
                    {customer.address}
                  </dd>
                </div>
              )}
              {customer.notes && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="max-w-[250px] text-right">
                    {customer.notes}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Contacts</dt>
                <dd className="font-medium">
                  {"contacts" in customer
                    ? (customer as { contacts: unknown[] }).contacts.length
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Sites</dt>
                <dd className="font-medium">
                  {"sites" in customer
                    ? (customer as { sites: unknown[] }).sites.length
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Section */}
      <div className="mt-6">
        <ContactsSection customerId={id!} />
      </div>

      {/* Sites Section */}
      <div className="mt-6">
        <SitesSection customerId={id!} />
      </div>

      {/* Delete Confirmation */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <DialogContent onClose={() => setShowDeleteDialog(false)}>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you sure you want to delete <strong>{customer.name}</strong>?
            This will hide the customer from all lists.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
