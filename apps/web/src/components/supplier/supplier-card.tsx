import { Link } from "react-router-dom";
import type { SupplierWithEquipmentCount } from "@repo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SupplierCardProps {
  supplier: SupplierWithEquipmentCount;
}

export default function SupplierCard({ supplier }: SupplierCardProps) {
  return (
    <Link to={`/suppliers/${supplier.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{supplier.name}</CardTitle>
            {supplier.equipment_count > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {supplier.equipment_count} rented
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {supplier.phone ?? "No phone"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
