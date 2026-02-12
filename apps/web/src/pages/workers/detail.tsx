import { useParams, Link } from "react-router-dom";
import {
  useWorkerDetail,
  useArchiveWorkerMutation,
  useReactivateWorkerMutation,
  useWorkerEquipmentSkills,
  useWorkerSoftwareSkills,
  useAddWorkerEquipmentSkillMutation,
  useUpdateWorkerEquipmentSkillMutation,
  useRemoveWorkerEquipmentSkillMutation,
  useAddWorkerSoftwareSkillMutation,
  useRemoveWorkerSoftwareSkillMutation,
  useSoftwareList,
  useEquipmentTypesList,
  useEquipmentBrands,
  useCreateEquipmentBrandMutation,
  useCreateSoftwareMutation,
  useUpdateWorkerMutation,
  useMyCompanies,
  type AddWorkerEquipmentSkillFormData,
} from "@repo/api-client";
import { Loader2, ArrowLeft, Pencil, Star, Trash2, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QuickAddSelect } from "@/components/ui/quick-add-select";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function WorkersDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: result, isLoading } = useWorkerDetail(id);
  const { data: equipmentSkillsResult } = useWorkerEquipmentSkills(id);
  const { data: softwareSkillsResult } = useWorkerSoftwareSkills(id);

  const archiveMutation = useArchiveWorkerMutation();
  const reactivateMutation = useReactivateWorkerMutation();
  const updateMutation = useUpdateWorkerMutation();

  const [newEquipmentSkill, setNewEquipmentSkill] = useState<
    Omit<AddWorkerEquipmentSkillFormData, "proficiency_rating"> & {
      proficiency_rating: number;
    }
  >({ equipment_type: "", equipment_brand: "", proficiency_rating: 3 });

  const [newSoftwareSkill, setNewSoftwareSkill] = useState<{
    software_id: string;
    proficiency_rating: number;
  }>({ software_id: "", proficiency_rating: 3 });

  const worker = result?.data ?? null;
  const error = result?.error;
  const equipmentSkills = equipmentSkillsResult?.data ?? [];
  const softwareSkills = softwareSkillsResult?.data ?? [];

  // Fetch master data for quick-add
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;
  const { data: typesResult } = useEquipmentTypesList(companyId);
  const { data: brandsResult } = useEquipmentBrands(companyId);
  const { data: softwareResult } = useSoftwareList(companyId);

  const equipmentTypes = typesResult?.data ?? [];
  const equipmentBrands = brandsResult?.data ?? [];
  const softwareList = softwareResult?.data ?? [];

  // Mutations
  const addEquipmentSkillMutation = useAddWorkerEquipmentSkillMutation();
  const updateEquipmentSkillMutation = useUpdateWorkerEquipmentSkillMutation();
  const removeEquipmentSkillMutation = useRemoveWorkerEquipmentSkillMutation();
  const addSoftwareSkillMutation = useAddWorkerSoftwareSkillMutation();
  const removeSoftwareSkillMutation = useRemoveWorkerSoftwareSkillMutation();
  const createBrandMutation = useCreateEquipmentBrandMutation();
  const createSoftwareMutation = useCreateSoftwareMutation();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error?.message ?? "Worker not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const isArchiving = archiveMutation.isPending || reactivateMutation.isPending;

  function handleStatusToggle() {
    if (!id) return;
    if (worker.status === "active") {
      archiveMutation.mutate(id);
    } else {
      reactivateMutation.mutate(id);
    }
  }

  const categoryLabels: Record<typeof worker.category, string> = {
    engineer: "Engineer",
    surveyor: "Surveyor",
    assistant: "Assistant",
  };

  const categoryColors: Record<typeof worker.category, string> = {
    engineer: "bg-purple-100 text-purple-700",
    surveyor: "bg-cyan-100 text-cyan-700",
    assistant: "bg-slate-100 text-slate-700",
  };

  async function handleAddEquipmentSkill() {
    if (!id) return;
    await addEquipmentSkillMutation.mutateAsync({
      workerId: id,
      payload: newEquipmentSkill,
    });
    setNewEquipmentSkill({
      equipment_type: "",
      equipment_brand: "",
      proficiency_rating: 3,
    });
  }

  async function handleAddSoftwareSkill(softwareId: string) {
    if (!id) return;
    await addSoftwareSkillMutation.mutateAsync({
      workerId: id,
      softwareId,
    });
  }

  async function handleCreateBrand(name: string) {
    if (!companyId) return { error: { message: "No company ID" } };
    return await createBrandMutation.mutateAsync({
      companyId,
      payload: { name },
    });
  }

  async function handleCreateSoftware(name: string) {
    if (!companyId) return { error: { message: "No company ID" } };
    return await createSoftwareMutation.mutateAsync({
      companyId,
      payload: { name },
    });
  }

  async function handleAddSoftwareSkill() {
    if (!id || !newSoftwareSkill.software_id) return;
    await addSoftwareSkillMutation.mutateAsync({
      workerId: id,
      softwareId: newSoftwareSkill.software_id,
    });
    setNewSoftwareSkill({ software_id: "", proficiency_rating: 3 });
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link
          to="/workers"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold tracking-tight">
          {worker.name}
        </h1>
        <Link
          to={`/workers/${id}/edit`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Link>
        <Button
          variant={worker.status === "active" ? "destructive" : "default"}
          onClick={handleStatusToggle}
          disabled={isArchiving}
        >
          {isArchiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {worker.status === "active" ? "Archive" : "Reactivate"}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-mono">{worker.phone}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Category</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      categoryColors[worker.category]
                    )}
                  >
                    {categoryLabels[worker.category]}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Monthly Salary</dt>
                <dd className="font-mono">
                  ${Number(worker.salary_month).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Daily Salary</dt>
                <dd className="font-mono">
                  ${Number(worker.salary_day).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      worker.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {worker.status}
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skills Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Equipment Skills</dt>
                <dd className="font-medium">{equipmentSkills.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Software Skills</dt>
                <dd className="font-medium">{softwareSkills.length}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Skills */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new skill form */}
            <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Equipment Type</Label>
                <select
                  value={newEquipmentSkill.equipment_type}
                  onChange={(e) =>
                    setNewEquipmentSkill({
                      ...newEquipmentSkill,
                      equipment_type: e.target.value,
                    })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select type...</option>
                  {equipmentTypes.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Brand</Label>
                <QuickAddSelect
                  value={newEquipmentSkill.equipment_brand}
                  onChange={(val) =>
                    setNewEquipmentSkill({
                      ...newEquipmentSkill,
                      equipment_brand: val,
                    })
                  }
                  placeholder="Select or add brand..."
                  options={equipmentBrands}
                  onCreate={handleCreateBrand}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rating</Label>
                <select
                  value={newEquipmentSkill.proficiency_rating}
                  onChange={(e) =>
                    setNewEquipmentSkill({
                      ...newEquipmentSkill,
                      proficiency_rating: parseInt(e.target.value),
                    })
                  }
                  className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r} ★
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                onClick={handleAddEquipmentSkill}
                disabled={
                  !newEquipmentSkill.equipment_type ||
                  !newEquipmentSkill.equipment_brand ||
                  addEquipmentSkillMutation.isPending
                }
              >
                {addEquipmentSkillMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Equipment skills list */}
            {equipmentSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No equipment skills added yet.
              </p>
            ) : (
              <div className="space-y-2">
                {equipmentSkills.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-medium">{skill.equipment_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {skill.equipment_brand}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < skill.proficiency_rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <select
                        value={skill.proficiency_rating}
                        onChange={(e) =>
                          updateEquipmentSkillMutation.mutateAsync({
                            skillId: skill.id,
                            workerId: id!,
                            rating: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5,
                          })
                        }
                        className="h-7 w-12 rounded border border-input bg-background px-1 text-xs"
                      >
                        {[1, 2, 3, 4, 5].map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          removeEquipmentSkillMutation.mutateAsync({
                            skillId: skill.id,
                            workerId: id!,
                          })
                        }
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
      </div>

      {/* Software Skills */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Software Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new software skill form */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Software</Label>
                <QuickAddSelect
                  value={softwareList.find((s) => s.id === newSoftwareSkill.software_id)?.name}
                  onChange={(name) => {
                    const software = softwareList.find((s) => s.name === name);
                    setNewSoftwareSkill({
                      ...newSoftwareSkill,
                      software_id: software?.id ?? "",
                    });
                  }}
                  placeholder="Select or add software..."
                  options={softwareList}
                  onCreate={handleCreateSoftware}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Rating</Label>
                <select
                  value={newSoftwareSkill.proficiency_rating}
                  onChange={(e) =>
                    setNewSoftwareSkill({
                      ...newSoftwareSkill,
                      proficiency_rating: parseInt(e.target.value),
                    })
                  }
                  className="flex h-9 w-16 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r} ★
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                onClick={handleAddSoftwareSkill}
                disabled={
                  !newSoftwareSkill.software_id ||
                  addSoftwareSkillMutation.isPending
                }
              >
                {addSoftwareSkillMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Software skills list */}
            {softwareSkills.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No software skills added yet.
              </p>
            ) : (
              <div className="space-y-2">
                {softwareSkills.map((ws) => (
                  <div
                    key={ws.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{ws.software.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "h-3.5 w-3.5",
                              i < 3
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            )}
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          removeSoftwareSkillMutation.mutateAsync({
                            skillId: ws.id,
                            workerId: id!,
                          })
                        }
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
      </div>
    </div>
  );
}
