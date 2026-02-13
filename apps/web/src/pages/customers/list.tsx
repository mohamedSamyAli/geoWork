import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useCustomerList, useMyCompanies } from "@repo/api-client";
import { Plus, LayoutGrid, List, Search, Building2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomerCard } from "@/components/customers/customer-card";
import type { Customer, CustomerType, CustomerStatus } from "@repo/types";
import { cn } from "@/lib/utils";

export default function CustomerListPage() {
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");

  const { data: listResult, isLoading } = useCustomerList(
    companyId,
    showInactive ? undefined : { status: "active" }
  );

  const customers = listResult?.data ?? [];
  const error = listResult?.error;

  const filtered = useMemo(() => {
    let items = customers;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.toLowerCase().includes(q))
      );
    }
    if (typeFilter) {
      items = items.filter((c) => c.customer_type === typeFilter);
    }
    return items;
  }, [customers, search, typeFilter]);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <Link to="/customers/new" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
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
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Types</option>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
          <option value="government">Government</option>
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
              <CustomerCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <CustomerTableSkeleton />
        )
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium text-muted-foreground">
            {customers.length === 0
              ? "No customers yet"
              : "No matching customers"}
          </p>
          <p className="mb-4 text-sm text-muted-foreground">
            {customers.length === 0
              ? "Get started by adding your first customer."
              : "Try adjusting your search or filters."}
          </p>
          {customers.length === 0 && (
            <Link to="/customers/new" className={cn(buttonVariants())}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first customer
            </Link>
          )}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <CustomerCard key={item.id} customer={item} />
          ))}
        </div>
      ) : (
        <CustomerTable items={filtered} />
      )}
    </div>
  );
}

// ---- Table View ----------------------------------------------------------

const typeLabels: Record<CustomerType, string> = {
  individual: "Individual",
  company: "Company",
  government: "Government",
};

const typeColors: Record<CustomerType, string> = {
  individual: "bg-blue-100 text-blue-700",
  company: "bg-purple-100 text-purple-700",
  government: "bg-amber-100 text-amber-700",
};

const statusColors: Record<CustomerStatus, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  prospect: "bg-sky-100 text-sky-700",
};

function CustomerTable({ items }: { items: Customer[] }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Phone</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-b transition-colors hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <Link
                  to={`/customers/${item.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {item.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    typeColors[item.customer_type]
                  )}
                >
                  {typeLabels[item.customer_type]}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-muted-foreground">
                {item.phone ?? "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.email ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    statusColors[item.status]
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

// ---- Skeletons -----------------------------------------------------------

function CustomerCardSkeleton() {
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
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Phone</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b">
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-28" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-20 rounded-full" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-14 rounded-full" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
