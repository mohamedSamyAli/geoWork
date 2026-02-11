import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  usePartnerDetail,
  useCreatePartnerMutation,
  useUpdatePartnerMutation,
  useMyCompanies,
  type CreatePartnerFormData,
} from "@repo/api-client";
import { Loader2, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PartnerForm from "@/components/partner/partner-form";

export default function PartnerFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult, isLoading } = usePartnerDetail(isEdit ? id : undefined);
  const createMutation = useCreatePartnerMutation();
  const updateMutation = useUpdatePartnerMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const partner = detailResult?.data ?? undefined;
  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handleSubmit(data: CreatePartnerFormData) {
    setApiError(null);

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({ partnerId: id, payload: data });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/partners/${id}`);
    } else if (companyId) {
      const result = await createMutation.mutateAsync({ companyId, payload: data });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/partners/${result.data!.id}`);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link to={isEdit ? `/partners/${id}` : "/partners"} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit Partner" : "New Partner"}
        </h1>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Update partner details" : "Add a new partner"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          <PartnerForm
            defaultValues={partner}
            onSubmit={handleSubmit}
            isPending={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
