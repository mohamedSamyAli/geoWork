import { Link } from "react-router-dom";
import type { PartnerWithEquipmentCount } from "@repo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PartnerCardProps {
  partner: PartnerWithEquipmentCount;
}

export default function PartnerCard({ partner }: PartnerCardProps) {
  return (
    <Link to={`/partners/${partner.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{partner.name}</CardTitle>
            {partner.equipment_count > 0 && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {partner.equipment_count} co-owned
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {partner.phone ?? "No phone"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
