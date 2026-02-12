import { Link } from "react-router-dom";
import type { Worker } from "@repo/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WorkerCardProps {
  worker: Worker;
}

const categoryLabels: Record<Worker["category"], string> = {
  engineer: "Engineer",
  surveyor: "Surveyor",
  assistant: "Assistant",
};

const categoryColors: Record<Worker["category"], string> = {
  engineer: "bg-purple-100 text-purple-700",
  surveyor: "bg-cyan-100 text-cyan-700",
  assistant: "bg-slate-100 text-slate-700",
};

export function WorkerCard({ worker }: WorkerCardProps) {
  return (
    <Link to={`/workers/${worker.id}`}>
      <Card className="transition-colors hover:border-primary/50">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{worker.name}</CardTitle>
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
          </div>
        </CardHeader>
        <CardContent>
          <dl className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <dt>Phone</dt>
              <dd className="font-mono text-foreground">{worker.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Category</dt>
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
              <dt>Monthly Salary</dt>
              <dd className="font-mono text-foreground">
                ${Number(worker.salary_month).toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Daily Salary</dt>
              <dd className="font-mono text-foreground">
                ${Number(worker.salary_day).toFixed(2)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}
