import { useState } from "react";
import {
  useEquipmentPartners,
  useAddEquipmentPartnerMutation,
  useUpdateEquipmentPartnerMutation,
  useRemoveEquipmentPartnerMutation,
  usePartnerList,
  useMyCompanies,
} from "@repo/api-client";
import type { EquipmentPartnerWithDetails } from "@repo/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface PartnerOwnershipProps {
  equipmentId: string;
}

export default function PartnerOwnership({ equipmentId }: PartnerOwnershipProps) {
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: partnersResult, isLoading } = useEquipmentPartners(equipmentId);
  const { data: allPartnersResult } = usePartnerList(companyId);
  const addMutation = useAddEquipmentPartnerMutation();
  const updateMutation = useUpdateEquipmentPartnerMutation();
  const removeMutation = useRemoveEquipmentPartnerMutation();

  const partners = partnersResult?.data ?? [];
  const allPartners = allPartnersResult?.data ?? [];
  const totalPartnerPct = partners.reduce((sum, p) => sum + Number(p.percentage), 0);
  const companyShare = (100 - totalPartnerPct).toFixed(2);

  const [adding, setAdding] = useState(false);
  const [newPartnerId, setNewPartnerId] = useState("");
  const [newPercentage, setNewPercentage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPercentage, setEditPercentage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Partners not yet assigned to this equipment
  const availablePartners = allPartners.filter(
    (p) => !partners.some((ep) => ep.partner_id === p.id)
  );

  async function handleAdd() {
    if (!newPartnerId || !newPercentage) return;
    setError(null);
    const pct = parseFloat(newPercentage);
    if (isNaN(pct) || pct < 1 || pct > 99) {
      setError("Percentage must be between 1 and 99");
      return;
    }
    if (totalPartnerPct + pct > 100) {
      setError(`Total would exceed 100% (current: ${totalPartnerPct}%)`);
      return;
    }

    const result = await addMutation.mutateAsync({
      equipmentId,
      payload: { partner_id: newPartnerId, percentage: pct },
    });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setAdding(false);
    setNewPartnerId("");
    setNewPercentage("");
  }

  async function handleUpdate(ep: EquipmentPartnerWithDetails) {
    setError(null);
    const pct = parseFloat(editPercentage);
    if (isNaN(pct) || pct < 1 || pct > 99) {
      setError("Percentage must be between 1 and 99");
      return;
    }
    const otherTotal = totalPartnerPct - Number(ep.percentage);
    if (otherTotal + pct > 100) {
      setError(`Total would exceed 100% (others: ${otherTotal}%)`);
      return;
    }

    const result = await updateMutation.mutateAsync({
      equipmentPartnerId: ep.id,
      equipmentId,
      payload: { percentage: pct },
    });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    setEditingId(null);
  }

  async function handleRemove(epId: string) {
    removeMutation.mutate({ equipmentPartnerId: epId, equipmentId });
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Partner Ownership</CardTitle>
          {!adding && (
            <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
              <Plus className="mr-1 h-3 w-3" />
              Add Partner
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Company share */}
        <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium">Company</span>
          <span className="font-mono font-semibold">{companyShare}%</span>
        </div>

        {/* Partners list */}
        {partners.map((ep) => (
          <div key={ep.id} className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm">{ep.partner.name}</span>
            <div className="flex items-center gap-2">
              {editingId === ep.id ? (
                <>
                  <Input
                    type="number"
                    className="h-8 w-20"
                    value={editPercentage}
                    onChange={(e) => setEditPercentage(e.target.value)}
                    min={1}
                    max={99}
                    step={0.01}
                  />
                  <span className="text-sm">%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUpdate(ep)}
                    disabled={updateMutation.isPending}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="font-mono text-sm font-medium">
                    {Number(ep.percentage).toFixed(2)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingId(ep.id);
                      setEditPercentage(String(ep.percentage));
                      setError(null);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemove(ep.id)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Add partner form */}
        {adding && (
          <div className="flex items-end gap-2 rounded-md border border-dashed p-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-muted-foreground">Partner</label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={newPartnerId}
                onChange={(e) => setNewPartnerId(e.target.value)}
              >
                <option value="">Select...</option>
                {availablePartners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs text-muted-foreground">%</label>
              <Input
                type="number"
                className="h-9"
                value={newPercentage}
                onChange={(e) => setNewPercentage(e.target.value)}
                min={1}
                max={99}
                step={0.01}
                placeholder="0.00"
              />
            </div>
            <Button size="sm" onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Add"
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {partners.length === 0 && !adding && (
          <p className="text-center text-sm text-muted-foreground">
            Company owns 100%. Add partners to share ownership.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
