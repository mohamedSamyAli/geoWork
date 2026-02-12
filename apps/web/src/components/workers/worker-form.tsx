import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createWorkerSchema,
  useSoftwareList,
  useEquipmentTypesList,
  useEquipmentBrands,
  useCreateSoftwareMutation,
  useCreateEquipmentBrandMutation,
  type CreateWorkerFormData,
} from "@repo/api-client";
import { Loader2, Plus, Trash2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QuickAddSelect } from "@/components/ui/quick-add-select";
import type { WorkerWithSkills } from "@repo/types";

interface WorkerFormProps {
  companyId: string;
  defaultValues?: WorkerWithSkills;
  onSubmit: (data: CreateWorkerFormData) => void | Promise<void>;
  isPending?: boolean;
}

export function WorkerForm({
  companyId,
  defaultValues,
  onSubmit,
  isPending,
}: WorkerFormProps) {
  const { data: softwareResult } = useSoftwareList(companyId);
  const { data: typesResult } = useEquipmentTypesList(companyId);
  const { data: brandsResult } = useEquipmentBrands(companyId);

  const software = softwareResult?.data ?? [];
  const equipmentTypes = typesResult?.data ?? [];
  const equipmentBrands = brandsResult?.data ?? [];

  const createSoftwareMutation = useCreateSoftwareMutation();
  const createBrandMutation = useCreateEquipmentBrandMutation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWorkerFormData>({
    resolver: zodResolver(createWorkerSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          phone: defaultValues.phone,
          category: defaultValues.category,
          salary_month: defaultValues.salary_month,
          salary_day: defaultValues.salary_day,
          equipment_skills: defaultValues.equipment_skills ?? [],
          software_skill_ids: defaultValues.software_skills.map((s) => s.software_id),
        }
      : {
          name: "",
          phone: "",
          category: "assistant",
          salary_month: 0,
          salary_day: 0,
          equipment_skills: [],
          software_skill_ids: [],
        },
  });

  const equipmentSkills = watch("equipment_skills") || [];
  const softwareSkillIds = watch("software_skill_ids") || [];

  // Sync software skills from defaultValues when editing
  useEffect(() => {
    if (defaultValues?.software_skills) {
      setValue(
        "software_skill_ids",
        defaultValues.software_skills.map((s) => s.software_id)
      );
    }
  }, [defaultValues, setValue]);

  function addEquipmentSkill() {
    setValue("equipment_skills", [
      ...equipmentSkills,
      { equipment_type: "", equipment_brand: "", proficiency_rating: 3 },
    ]);
  }

  function removeEquipmentSkill(index: number) {
    setValue(
      "equipment_skills",
      equipmentSkills.filter((_, i) => i !== index)
    );
  }

  function updateEquipmentSkill(
    index: number,
    field: keyof typeof equipmentSkills[0],
    value: string | number
  ) {
    const updated = [...equipmentSkills];
    updated[index] = { ...updated[index], [field]: value };
    setValue("equipment_skills", updated);
  }

  async function handleCreateSoftware(name: string) {
    return await createSoftwareMutation.mutateAsync({ companyId, payload: { name } });
  }

  async function handleCreateBrand(name: string) {
    return await createBrandMutation.mutateAsync({ companyId, payload: { name } });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-tight">
          Basic Information
        </h3>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} placeholder="Worker name" />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+1 234 567 8900" />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            {...register("category")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="engineer">Engineer</option>
            <option value="surveyor">Surveyor</option>
            <option value="assistant">Assistant</option>
          </select>
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salary_month">Monthly Salary</Label>
            <Input
              id="salary_month"
              type="number"
              step="0.01"
              min="0"
              {...register("salary_month", { valueAsNumber: true })}
            />
            {errors.salary_month && (
              <p className="text-sm text-destructive">{errors.salary_month.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary_day">Daily Salary</Label>
            <Input
              id="salary_day"
              type="number"
              step="0.01"
              min="0"
              {...register("salary_day", { valueAsNumber: true })}
            />
            {errors.salary_day && (
              <p className="text-sm text-destructive">{errors.salary_day.message}</p>
            )}
          </div>
        </div>
        {(errors.salary_month || errors.salary_day) && (
          <p className="text-sm text-destructive">
            At least one salary must be greater than 0
          </p>
        )}
      </div>

      {/* Equipment Skills Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">
            Equipment Skills
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEquipmentSkill}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Skill
          </Button>
        </div>

        {equipmentSkills.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No equipment skills added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {equipmentSkills.map((skill, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-start"
              >
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Equipment Type
                  </Label>
                  <select
                    value={skill.equipment_type}
                    onChange={(e) =>
                      updateEquipmentSkill(index, "equipment_type", e.target.value)
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
                    value={skill.equipment_brand}
                    onChange={(val) => updateEquipmentSkill(index, "equipment_brand", val)}
                    placeholder="Select or add brand..."
                    options={equipmentBrands}
                    onCreate={handleCreateBrand}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Rating</Label>
                  <select
                    value={skill.proficiency_rating}
                    onChange={(e) =>
                      updateEquipmentSkill(index, "proficiency_rating", parseInt(e.target.value))
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
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-4"
                  onClick={() => removeEquipmentSkill(index)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Software Skills Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold tracking-tight">Software Skills</h3>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Select Software (multi-select)
          </Label>
          <div className="flex flex-wrap gap-2">
            {software.map((s) => {
              const isSelected = softwareSkillIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setValue(
                        "software_skill_ids",
                        softwareSkillIds.filter((id) => id !== s.id)
                      );
                    } else {
                      setValue("software_skill_ids", [...softwareSkillIds, s.id]);
                    }
                  }}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          {software.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No software available. Add software via Equipment Types management.
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {defaultValues ? "Update Worker" : "Create Worker"}
      </Button>
    </form>
  );
}
