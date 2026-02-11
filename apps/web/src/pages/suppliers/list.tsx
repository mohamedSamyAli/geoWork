import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSupplierList, useMyCompanies } from "@repo/api-client";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import SupplierCard from "@/components/supplier/supplier-card";
import type { SupplierWithEquipmentCount } from "@repo/types";

export default function SupplierListPage() {
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const { data: listResult, isLoading } = useSupplierList(companyId);

  const suppliers = listResult?.data ?? [];
  const error = listResult?.error;

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.toLowerCase().includes(q))
    );
  }, [suppliers, search]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
        <Link to="/suppliers/new" className={cn(buttonVariants())}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
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
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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
              <SupplierCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <SupplierTableSkeleton />
        )
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="mb-2 text-lg font-medium text-muted-foreground">
            {suppliers.length === 0 ? "No suppliers yet" : "No matching suppliers"}
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            {suppliers.length === 0
              ? "Get started by adding your first supplier."
              : "Try adjusting your search."}
          </p>
          {suppliers.length === 0 && (
            <Link to="/suppliers/new" className={cn(buttonVariants())}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first supplier
            </Link>
          )}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <SupplierCard key={item.id} supplier={item} />
          ))}
        </div>
      ) : (
        <SupplierTable items={filtered} />
      )}
    </div>
  );
}

function SupplierTable({ items }: { items: SupplierWithEquipmentCount[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Phone</th>
            <th className="px-4 py-3 text-left font-medium">Rented Equipment</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b transition-colors hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link
                  to={`/suppliers/${item.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {item.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{item.phone ?? "—"}</td>
              <td className="px-4 py-3">
                {item.equipment_count > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    {item.equipment_count} rented
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SupplierCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6 pb-2">
        <Skeleton className="h-6 w-3/4" />
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
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

function SupplierTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Phone</th>
            <th className="px-4 py-3 text-left font-medium">Rented Equipment</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-20 rounded-full" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
