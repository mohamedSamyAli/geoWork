import { Link } from "react-router-dom";
import type { Customer, CustomerType, CustomerStatus } from "@repo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CustomerCardProps {
  customer: Customer;
}

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

export function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <Link to={`/customers/${customer.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{customer.name}</CardTitle>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                statusColors[customer.status]
              )}
            >
              {customer.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <dt>Type</dt>
              <dd>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    typeColors[customer.customer_type]
                  )}
                >
                  {typeLabels[customer.customer_type]}
                </span>
              </dd>
            </div>
            {customer.phone && (
              <div className="flex justify-between">
                <dt>Phone</dt>
                <dd className="font-mono text-foreground">{customer.phone}</dd>
              </div>
            )}
            {customer.email && (
              <div className="flex justify-between">
                <dt>Email</dt>
                <dd className="text-foreground truncate max-w-[180px]">{customer.email}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}
