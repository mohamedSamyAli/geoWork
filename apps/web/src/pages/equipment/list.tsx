import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useEquipmentList, useEquipmentTypes, useMyCompanies } from "@repo/api-client";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import EquipmentCard from "@/components/equipment/equipment-card";
import type { EquipmentWithType } from "@repo/types";
import { cn } from "@/lib/utils";

export default function EquipmentListPage() {
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const { data: listResult, isLoading } = useEquipmentList(
    companyId,
    showInactive ? undefined : { status: "active" }
  );
  const { data: typesResult } = useEquipmentTypes(companyId);

  const equipment = listResult?.data ?? [];
  const equipmentTypes = typesResult?.data ?? [];
  const error = listResult?.error;

  const filtered = useMemo(() => {
    let items = equipment;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.serial_number.toLowerCase().includes(q)
      );
    }
    if (typeFilter) {
      items = items.filter((e) => e.equipment_type_id === typeFilter);
    }
    if (ownershipFilter) {
      items = items.filter((e) => e.ownership_type === ownershipFilter);
    }
    return items;
  }, [equipment, search, typeFilter, ownershipFilter]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Equipment</h1>
        <Link to="/equipment/new" className={cn(buttonVariants())}>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
        </Link>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-50 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Types</option>
          {equipmentTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Ownership</option>
          <option value="owned">Owned</option>
          <option value="rented">Rented</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
        <div className="ml-auto flex gap-1">
          <Button
            variant={viewMode === "card" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            className="h-9 w-9"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        viewMode === "card" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <EquipmentCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <EquipmentTableSkeleton />
        )
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="mb-2 text-lg font-medium text-muted-foreground">
            {equipment.length === 0 ? "No equipment yet" : "No matching equipment"}
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            {equipment.length === 0
              ? "Get started by adding your first piece of equipment."
              : "Try adjusting your search or filters."}
          </p>
          {equipment.length === 0 && (
            <Link to="/equipment/new" className={cn(buttonVariants())}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first equipment
            </Link>
          )}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <EquipmentCard key={item.id} equipment={item} />
          ))}
        </div>
      ) : (
        <EquipmentTable items={filtered} />
      )}
    </div>
  );
}

function EquipmentTable({ items }: { items: EquipmentWithType[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Serial</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Model</th>
            <th className="px-4 py-3 text-left font-medium">Ownership</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b transition-colors hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link
                  to={`/equipment/${item.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {item.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-muted-foreground">{item.serial_number}</td>
              <td className="px-4 py-3">{item.equipment_type?.name ?? "—"}</td>
              <td className="px-4 py-3">{item.model ?? "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    item.ownership_type === "owned"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {item.ownership_type}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    item.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {item.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EquipmentCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EquipmentTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Serial</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Model</th>
            <th className="px-4 py-3 text-left font-medium">Ownership</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20 font-mono" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-16" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-16 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-14 rounded-full" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
