import { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useWorkerDetail,
  useArchiveWorkerMutation,
  useReactivateWorkerMutation,
  useWorkerEquipmentSkills,
  useWorkerSoftwareSkills,
  useAddWorkerEquipmentSkillMutation,
  useUpdateWorkerEquipmentSkillMutation,
  useRemoveWorkerEquipmentSkillMutation,
  useAddWorkerSoftwareSkillMutation,
  useRemoveWorkerSoftwareSkillMutation,
  useSoftwareList,
  useEquipmentTypesList,
  useEquipmentBrands,
  useMyCompanies,
} from '@repo/api-client';
import type { WorkerEquipmentSkill, WorkerSoftwareSkill, Software, ProficiencyRating } from '@repo/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/button';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type NewEquipmentSkill = {
  equipment_type: string;
  equipment_brand: string;
  proficiency_rating: ProficiencyRating;
};

export default function WorkerDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const workerId = params.id;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: result, isLoading, error, refetch } = useWorkerDetail(workerId);
  const { data: equipmentSkillsResult } = useWorkerEquipmentSkills(workerId);
  const { data: softwareSkillsResult } = useWorkerSoftwareSkills(workerId);

  const worker = result?.data;
  const equipmentSkills = equipmentSkillsResult?.data ?? [];
  const softwareSkills = softwareSkillsResult?.data ?? [];

  // Master data for quick-add
  const { data: typesResult } = useEquipmentTypesList(companyId);
  const { data: brandsResult } = useEquipmentBrands(companyId);
  const { data: softwareResult } = useSoftwareList(companyId);

  const equipmentTypes = typesResult?.data ?? [];
  const equipmentBrands = brandsResult?.data ?? [];
  const softwareList = softwareResult?.data ?? [];

  // Mutations
  const archiveMutation = useArchiveWorkerMutation();
  const reactivateMutation = useReactivateWorkerMutation();
  const addEquipmentSkillMutation = useAddWorkerEquipmentSkillMutation();
  const updateEquipmentSkillMutation = useUpdateWorkerEquipmentSkillMutation();
  const removeEquipmentSkillMutation = useRemoveWorkerEquipmentSkillMutation();
  const addSoftwareSkillMutation = useAddWorkerSoftwareSkillMutation();
  const removeSoftwareSkillMutation = useRemoveWorkerSoftwareSkillMutation();

  // State for new equipment skill
  const [newEquipmentSkill, setNewEquipmentSkill] = useState<NewEquipmentSkill>({
    equipment_type: '',
    equipment_brand: '',
    proficiency_rating: 3,
  });
  const [showAddEquipment, setShowAddEquipment] = useState(false);

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <MaterialIcons name="access-time" size={48} color="#9ca3af" />
        <ThemedText>Loading worker details...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !worker) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>
          {error?.message ?? 'Worker not found'}
        </ThemedText>
      </ThemedView>
    );
  }

  const isArchiving = archiveMutation.isPending || reactivateMutation.isPending;

  const handleStatusToggle = async () => {
    if (!workerId) return;
    if (worker.status === 'active') {
      await archiveMutation.mutateAsync(workerId);
    } else {
      await reactivateMutation.mutateAsync(workerId);
    }
    refetch();
  };

  const handleAddEquipmentSkill = async () => {
    if (!workerId || !newEquipmentSkill.equipment_type || !newEquipmentSkill.equipment_brand) return;
    await addEquipmentSkillMutation.mutateAsync({
      workerId,
      payload: newEquipmentSkill,
    });
    setNewEquipmentSkill({ equipment_type: '', equipment_brand: '', proficiency_rating: 3 });
    setShowAddEquipment(false);
  };

  const handleAddSoftwareSkill = async (softwareId: string) => {
    if (!workerId) return;
    await addSoftwareSkillMutation.mutateAsync({ workerId, softwareId });
  };

  const categoryColors = {
    engineer: '#a855f7',
    surveyor: '#06b6d4',
    assistant: '#64748b',
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={28} color="#0a7ea4" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          {worker.name}
        </ThemedText>
        <TouchableOpacity
          onPress={() => router.push(`/workers/form?id=${workerId}` as any)}
          style={styles.editButton}
        >
          <MaterialIcons name="create" size={20} color="#0a7ea4" />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <ThemedButton
          variant={worker.status === 'active' ? 'destructive' : 'primary'}
          size="sm"
          onPress={handleStatusToggle}
          disabled={isArchiving}
        >
          {worker.status === 'active' ? 'Archive' : 'Reactivate'}
        </ThemedButton>
      </View>

      {/* Details Card */}
      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Details
        </ThemedText>
        <DetailRow label="Phone" value={worker.phone} />
        <DetailRow
          label="Category"
          value={
            <View
              style={[styles.categoryBadge, { backgroundColor: categoryColors[worker.category] }]}
            >
              <ThemedText style={styles.categoryText}>{worker.category}</ThemedText>
            </View>
          }
        />
        <DetailRow label="Monthly Salary" value={`$${worker.salary_month}`} />
        <DetailRow label="Daily Salary" value={`$${worker.salary_day}`} />
        <DetailRow
          label="Status"
          value={
            <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: worker.status === 'active' ? '#22c55e' : '#6b7280' },
                ]}
              >
              <ThemedText style={styles.statusText}>{worker.status}</ThemedText>
            </View>
          }
        />
      </View>

      {/* Equipment Skills Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            Equipment Skills ({equipmentSkills.length})
          </ThemedText>
          <TouchableOpacity onPress={() => setShowAddEquipment(!showAddEquipment)}>
            <MaterialIcons name="add-circle" size={24} color="#0a7ea4" />
          </TouchableOpacity>
        </View>

        {showAddEquipment && (
          <View style={styles.addSkillForm}>
            <Picker
              label="Type"
              selected={newEquipmentSkill.equipment_type}
              options={equipmentTypes.map((t) => t.name)}
              onSelect={(val) => setNewEquipmentSkill({ ...newEquipmentSkill, equipment_type: val })}
            />
            <Picker
              label="Brand"
              selected={newEquipmentSkill.equipment_brand}
              options={equipmentBrands.map((b) => b.name)}
              onSelect={(val) => setNewEquipmentSkill({ ...newEquipmentSkill, equipment_brand: val })}
            />
            <RatingPicker
              label="Rating"
              value={newEquipmentSkill.proficiency_rating}
              onSelect={(val) => setNewEquipmentSkill({ ...newEquipmentSkill, proficiency_rating: val })}
            />
            <ThemedButton size="sm" onPress={handleAddEquipmentSkill}>
              Add
            </ThemedButton>
          </View>
        )}

        {equipmentSkills.length === 0 ? (
          <ThemedText style={styles.emptyText}>No equipment skills added</ThemedText>
        ) : (
          equipmentSkills.map((skill) => (
            <View key={skill.id} style={styles.skillItem}>
              <View style={styles.skillInfo}>
                <ThemedText type="defaultSemiBold">{skill.equipment_type}</ThemedText>
                <ThemedText style={styles.skillBrand}>{skill.equipment_brand}</ThemedText>
                <RatingStars rating={skill.proficiency_rating} />
              </View>
              <View style={styles.skillActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeEquipmentSkillMutation.mutateAsync({ skillId: skill.id, workerId })}
                >
                  <MaterialIcons name="delete" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Software Skills Card */}
      <View style={styles.card}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          Software Skills ({softwareSkills.length})
        </ThemedText>

        {softwareSkills.length === 0 ? (
          <ThemedText style={styles.emptyText}>No software skills added</ThemedText>
        ) : (
          <View style={styles.softwareGrid}>
            {softwareSkills.map((ws) => (
              <View key={ws.id} style={styles.softwareItem}>
                <ThemedText>{ws.software.name}</ThemedText>
                <TouchableOpacity
                  style={styles.softwareRemove}
                  onPress={() => removeSoftwareSkillMutation.mutateAsync({ skillId: ws.id, workerId })}
                >
                  <MaterialIcons name="cancel" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.addSoftwareSection}>
          <ThemedText style={styles.addSoftwareLabel}>Add Software:</ThemedText>
          <View style={styles.softwarePicker}>
            {softwareList
              .filter((s) => !softwareSkills.some((ws) => ws.software_id === s.id))
              .map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.softwareOption}
                  onPress={() => handleAddSoftwareSkill(s.id)}
                >
                  <MaterialIcons name="add-circle" size={16} color="#0a7ea4" />
                  <ThemedText>{s.name}</ThemedText>
                </TouchableOpacity>
              ))}
            {softwareList.filter(
              (s) => !softwareSkills.some((ws) => ws.software_id === s.id)
            ).length === 0 && (
              <ThemedText style={styles.emptyText}>All software added</ThemedText>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText style={styles.detailLabel}>{label}</ThemedText>
      <View style={styles.detailValue}>{typeof value === 'string' ? <ThemedText>{value}</ThemedText> : value}</View>
    </View>
  );
}

function Picker({
  label,
  selected,
  options,
  onSelect,
}: {
  label: string;
  selected: string;
  options: string[];
  onSelect: (val: string) => void;
}) {
  return (
    <View style={styles.pickerContainer}>
      <ThemedText style={styles.pickerLabel}>{label}</ThemedText>
      <View style={styles.pickerOptions}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.pickerOption, selected === opt && styles.pickerOptionActive]}
            onPress={() => onSelect(opt)}
          >
            <ThemedText style={selected === opt ? styles.pickerTextActive : styles.pickerText}>
              {opt}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function RatingPicker({ label, value, onSelect }: { label: string; value: ProficiencyRating; onSelect: (val: ProficiencyRating) => void }) {
  return (
    <View style={styles.pickerContainer}>
      <ThemedText style={styles.pickerLabel}>{label}</ThemedText>
      <View style={styles.ratingOptions}>
        {([1, 2, 3, 4, 5] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.ratingOption, value === r && styles.ratingOptionActive]}
            onPress={() => onSelect(r)}
          >
            <ThemedText style={value === r ? styles.ratingTextActive : styles.pickerText}>
              {r} ★
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function RatingStars({ rating }: { rating: ProficiencyRating }) {
  return (
    <View style={styles.stars}>
      {([1, 2, 3, 4, 5] as const).map((i) => (
        <ThemedText
          key={i}
          style={[styles.star, i <= rating && styles.starActive]}
        >
          ★
        </ThemedText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    padding: 4,
  },
  actions: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  detailValue: {
    alignItems: 'flex-end' as const,
    color: '#11181c',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  addSkillForm: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  pickerContainer: {
    gap: 4,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  pickerOptions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pickerOptionActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  pickerText: {
    fontSize: 14,
  },
  pickerTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  ratingOptions: {
    flexDirection: 'row' as const,
    gap: 4,
  },
  ratingOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ratingOptionActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  ratingTextActive: {
    color: '#92400e',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  skillItem: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  skillInfo: {
    flex: 1,
    gap: 4,
  },
  skillBrand: {
    fontSize: 12,
    color: '#6b7280',
  },
  skillActions: {
    marginLeft: 12,
  },
  deleteButton: {
    padding: 4,
  },
  stars: {
    flexDirection: 'row' as const,
    gap: 2,
  },
  star: {
    color: '#d1d5db',
  },
  starActive: {
    color: '#fbbf24',
  },
  softwareGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  softwareItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  softwareRemove: {
    padding: 2,
  },
  addSoftwareSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  addSoftwareLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  softwarePicker: {
    gap: 8,
  },
  softwareOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
});
