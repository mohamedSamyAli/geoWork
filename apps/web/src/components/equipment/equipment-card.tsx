import { Link } from "react-router-dom";
import type { EquipmentWithType } from "@repo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EquipmentCardProps {
  equipment: EquipmentWithType;
}

export default function EquipmentCard({ equipment }: EquipmentCardProps) {
  return (
    <Link to={`/equipment/${equipment.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{equipment.name}</CardTitle>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                equipment.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {equipment.status}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <dt>Serial</dt>
              <dd className="font-mono text-foreground">{equipment.serial_number}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Type</dt>
              <dd className="text-foreground">{equipment.equipment_type?.name ?? "—"}</dd>
            </div>
            {equipment.model && (
              <div className="flex justify-between">
                <dt>Model</dt>
                <dd className="text-foreground">{equipment.model}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Ownership</dt>
              <dd>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    equipment.ownership_type === "owned"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700"
                  )}
                >
                  {equipment.ownership_type}
                </span>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}
