import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  useWorkerDetail,
  useCreateWorkerMutation,
  useUpdateWorkerMutation,
  useMyCompanies,
  type CreateWorkerFormData,
} from "@repo/api-client";
import { Loader2, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerForm } from "@/components/workers/worker-form";

export default function WorkersFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult, isLoading: detailLoading } = useWorkerDetail(
    isEdit ? id : undefined
  );

  const createMutation = useCreateWorkerMutation();
  const updateMutation = useUpdateWorkerMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function handleSubmit(data: CreateWorkerFormData) {
    setApiError(null);

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({
        workerId: id,
        payload: data,
      });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/workers/${id}`);
    } else if (companyId) {
      const result = await createMutation.mutateAsync({
        companyId,
        payload: data,
      });
      if (result.error) {
        setApiError(result.error.message);
        return;
      }
      navigate(`/workers/${result.data!.id}`);
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
          to={isEdit ? `/workers/${id}` : "/workers"}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? "Edit Worker" : "New Worker"}
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
                  ? "Update worker details"
                  : "Add a new worker to your company"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WorkerForm
                companyId={companyId}
                defaultValues={isEdit ? detailResult?.data ?? undefined : undefined}
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
