import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useSupplierDetail,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useMyCompanies,
  type CreateSupplierFormData,
} from "@repo/api-client";
import { Loader2, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SupplierForm from "@/components/supplier/supplier-form";

export default function SupplierFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult, isLoading: detailLoading } = useSupplierDetail(
    isEdit ? id : undefined
  );

  const createMutation = useCreateSupplierMutation();
  const updateMutation = useUpdateSupplierMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const supplier = detailResult?.data;

  async function handleSubmit(data: CreateSupplierFormData) {
    setApiError(null);

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({ supplierId: id, payload: data });
      if (result.error) { setApiError(result.error.message); return; }
      navigate(`/suppliers/${id}`);
    } else if (companyId) {
      const result = await createMutation.mutateAsync({ companyId, payload: data });
      if (result.error) { setApiError(result.error.message); return; }
      navigate(`/suppliers/${result.data!.id}`);
    }
  }

  if (isEdit && detailLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link to={isEdit ? `/suppliers/${id}` : "/suppliers"} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit Supplier" : "New Supplier"}
        </h1>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Update supplier details" : "Add a new supplier"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <SupplierForm
            defaultValues={isEdit ? (supplier ?? undefined) : undefined}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
