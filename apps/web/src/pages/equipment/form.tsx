import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useEquipmentDetail,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useMyCompanies,
  type CreateEquipmentFormData,
} from "@repo/api-client";
import { Loader2, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EquipmentForm from "@/components/equipment/equipment-form";

export default function EquipmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: companiesResult } = useMyCompanies();
  console.log(companiesResult)
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult, isLoading: detailLoading } = useEquipmentDetail(
    isEdit ? id : undefined
  );

  const createMutation = useCreateEquipmentMutation();
  const updateMutation = useUpdateEquipmentMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(data: CreateEquipmentFormData) {
    setApiError(null);

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({
        equipmentId: id,
        payload: data,
      });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/equipment/${id}`);
    } else if (companyId) {
      const result = await createMutation.mutateAsync({
        companyId,
        payload: data,
      });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/equipment/${result.data!.id}`);
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
        <Link to={isEdit ? `/equipment/${id}` : "/equipment"} className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit Equipment" : "New Equipment"}
        </h1>
      </div>

      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">
            {isEdit ? "Update equipment details" : "Add a new equipment record"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
          {companyId && (
            <EquipmentForm
              companyId={companyId}
              defaultValues={isEdit ? (detailResult?.data ?? undefined) : undefined}
              onSubmit={handleSubmit}
              isPending={isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
