import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePartnerList, useMyCompanies } from "@repo/api-client";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PartnerCard from "@/components/partner/partner-card";
import type { PartnerWithEquipmentCount } from "@repo/types";

export default function PartnerListPage() {
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const { data: listResult, isLoading } = usePartnerList(companyId);

  const partners = listResult?.data ?? [];
  const error = listResult?.error;

  const filtered = useMemo(() => {
    if (!search) return partners;
    const q = search.toLowerCase();
    return partners.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q))
    );
  }, [partners, search]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Partners</h1>
        <Link to="/partners/new" className={cn(buttonVariants())}>
            <Plus className="mr-2 h-4 w-4" />
            Add Partner
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
              <PartnerCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <PartnerTableSkeleton />
        )
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <p className="mb-2 text-lg font-medium text-muted-foreground">
            {partners.length === 0 ? "No partners yet" : "No matching partners"}
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            {partners.length === 0
              ? "Get started by adding your first partner."
              : "Try adjusting your search."}
          </p>
          {partners.length === 0 && (
            <Link to="/partners/new" className={cn(buttonVariants())}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first partner
            </Link>
          )}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <PartnerCard key={item.id} partner={item} />
          ))}
        </div>
      ) : (
        <PartnerTable items={filtered} />
      )}
    </div>
  );
}

function PartnerTable({ items }: { items: PartnerWithEquipmentCount[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Phone</th>
            <th className="px-4 py-3 text-left font-medium">Co-Owned Equipment</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b transition-colors hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link
                  to={`/partners/${item.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {item.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{item.phone ?? "—"}</td>
              <td className="px-4 py-3">
                {item.equipment_count > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {item.equipment_count} co-owned
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

function PartnerCardSkeleton() {
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

function PartnerTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Phone</th>
            <th className="px-4 py-3 text-left font-medium">Co-Owned Equipment</th>
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
