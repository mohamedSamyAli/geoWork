import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useCustomerDetail,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useMyCompanies,
  type CreateCustomerFormData,
} from "@repo/api-client";
import { Loader2, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerForm } from "@/components/customers/customer-form";

export default function CustomerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult, isLoading: detailLoading } = useCustomerDetail(
    isEdit ? id : undefined
  );

  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(data: CreateCustomerFormData) {
    setApiError(null);

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({
        customerId: id,
        payload: data,
      });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/customers/${id}`);
    } else if (companyId) {
      const result = await createMutation.mutateAsync({
        companyId,
        payload: data,
      });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/customers/${result.data!.id}`);
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
        <Link
          to={isEdit ? `/customers/${id}` : "/customers"}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit Customer" : "New Customer"}
        </h1>
      </div>

      <div className="mx-auto max-w-2xl">
        {apiError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}
        {companyId && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isEdit
                  ? "Update customer details"
                  : "Add a new customer to your company"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CustomerForm
                defaultValues={
                  isEdit ? detailResult?.data ?? undefined : undefined
                }
                onSubmit={handleSubmit}
                isPending={isPending}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
