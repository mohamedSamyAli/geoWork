import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWorkerDetail, useCreateWorkerMutation, useUpdateWorkerMutation, useMyCompanies, useSoftwareList, useEquipmentTypesList, useEquipmentBrands } from '@repo/api-client';
import type { WorkerWithSkills, CreateWorkerPayload, ProficiencyRating } from '@repo/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/button';
import { ThemedInput } from '@/components/ui/input';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type FormData = {
  name: string;
  phone: string;
  category: 'engineer' | 'surveyor' | 'assistant';
  salary_month: string;
  salary_day: string;
  equipment_skills: Array<{
    equipment_type: string;
    equipment_brand: string;
    proficiency_rating: ProficiencyRating;
  }>;
  software_skill_ids: string[];
};

const defaultFormData: FormData = {
  name: '',
  phone: '',
  category: 'assistant',
  salary_month: '0',
  salary_day: '0',
  equipment_skills: [],
  software_skill_ids: [],
};

export default function WorkerFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const workerId = params.id;
  const isEdit = !!workerId;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult, isLoading: detailLoading } = useWorkerDetail(workerId);
  const worker = detailResult?.data;

  const { data: softwareResult } = useSoftwareList(companyId);
  const { data: typesResult } = useEquipmentTypesList(companyId);
  const { data: brandsResult } = useEquipmentBrands(companyId);

  const software = softwareResult?.data ?? [];
  const equipmentTypes = typesResult?.data ?? [];
  const equipmentBrands = brandsResult?.data ?? [];

  const createMutation = useCreateWorkerMutation();
  const updateMutation = useUpdateWorkerMutation();

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (worker && isEdit) {
      setFormData({
        name: worker.name,
        phone: worker.phone,
        category: worker.category,
        salary_month: worker.salary_month.toString(),
        salary_day: worker.salary_day.toString(),
        equipment_skills: worker.equipment_skills?.map((s) => ({
          equipment_type: s.equipment_type,
          equipment_brand: s.equipment_brand,
          proficiency_rating: s.proficiency_rating,
        })) || [],
        software_skill_ids: worker.software_skills?.map((s) => s.software_id) || [],
      });
    }
  }, [worker, isEdit]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (Number(formData.salary_month) <= 0 && Number(formData.salary_day) <= 0) {
      newErrors.salary_month = 'At least one salary must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !companyId) return;

    setIsSubmitting(true);
    try {
      const payload: CreateWorkerPayload = {
        name: formData.name,
        phone: formData.phone,
        category: formData.category,
        salary_month: Number(formData.salary_month),
        salary_day: Number(formData.salary_day),
        equipment_skills: formData.equipment_skills,
        software_skill_ids: formData.software_skill_ids,
      };

      let result;
      if (isEdit && workerId) {
        result = await updateMutation.mutateAsync({ workerId, payload });
      } else {
        result = await createMutation.mutateAsync({ companyId, payload });
      }

      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else if (result.data) {
        if (isEdit) {
          router.back();
        } else {
          router.push(`/workers/${result.data.id}` as any);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEquipmentSkill = () => {
    setFormData({
      ...formData,
      equipment_skills: [
        ...formData.equipment_skills,
        { equipment_type: '', equipment_brand: '', proficiency_rating: 3 },
      ],
    });
  };

  const updateEquipmentSkill = (index: number, field: string, value: string | ProficiencyRating) => {
    const updated = [...formData.equipment_skills];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, equipment_skills: updated });
  };

  const removeEquipmentSkill = (index: number) => {
    setFormData({
      ...formData,
      equipment_skills: formData.equipment_skills.filter((_, i) => i !== index),
    });
  };

  const toggleSoftwareSkill = (softwareId: string) => {
    const exists = formData.software_skill_ids.includes(softwareId);
    setFormData({
      ...formData,
      software_skill_ids: exists
        ? formData.software_skill_ids.filter((id) => id !== softwareId)
        : [...formData.software_skill_ids, softwareId],
    });
  };

  if (detailLoading && isEdit) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">{isEdit ? 'Edit Worker' : 'New Worker'}</ThemedText>
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Basic Information
        </ThemedText>

        <ThemedInput
          label="Name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          error={errors.name}
          placeholder="Worker name"
        />

        <ThemedInput
          label="Phone"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          error={errors.phone}
          placeholder="+1 234 567 8900"
          keyboardType="phone-pad"
        />

        <View style={styles.pickerContainer}>
          <ThemedText style={styles.pickerLabel}>Category</ThemedText>
          <View style={styles.categoryButtons}>
            {(['engineer', 'surveyor', 'assistant'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  formData.category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, category: cat })}
              >
                <ThemedText
                  style={[
                    styles.categoryButtonText,
                    formData.category === cat && styles.categoryButtonTextActive,
                  ]}
                >
                  {cat}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.half}>
            <ThemedInput
              label="Monthly Salary"
              value={formData.salary_month}
              onChangeText={(text) => setFormData({ ...formData, salary_month: text })}
              error={errors.salary_month}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.half}>
            <ThemedInput
              label="Daily Salary"
              value={formData.salary_day}
              onChangeText={(text) => setFormData({ ...formData, salary_day: text })}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
      </View>

      {/* Equipment Skills */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Equipment Skills
          </ThemedText>
          <TouchableOpacity onPress={addEquipmentSkill} style={styles.addButtonSmall}>
            <MaterialIcons name="add-circle" size={24} color="#0a7ea4" />
          </TouchableOpacity>
        </View>

        {formData.equipment_skills.length === 0 ? (
          <ThemedText style={styles.emptyText}>No equipment skills added</ThemedText>
        ) : (
          formData.equipment_skills.map((skill, index) => (
            <View key={index} style={styles.skillCard}>
              <ThemedText style={styles.skillLabel}>Skill {index + 1}</ThemedText>

              <View style={styles.row}>
                <View style={styles.half}>
                  <ThemedText style={styles.fieldLabel}>Type</ThemedText>
                  <View style={styles.picker}>
                    {equipmentTypes.map((t) => (
                      <TouchableOpacity
                        key={t.id}
                        style={[
                          styles.option,
                          skill.equipment_type === t.name && styles.optionActive,
                        ]}
                        onPress={() => updateEquipmentSkill(index, 'equipment_type', t.name)}
                      >
                        <ThemedText
                          style={skill.equipment_type === t.name ? styles.optionTextActive : styles.optionText}
                        >
                          {t.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeEquipmentSkill(index)}
                >
                  <MaterialIcons name="cancel" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <View style={styles.row}>
                <View style={styles.half}>
                  <ThemedText style={styles.fieldLabel}>Brand</ThemedText>
                  <View style={styles.picker}>
                    {equipmentBrands.map((b) => (
                      <TouchableOpacity
                        key={b.id}
                        style={[
                          styles.option,
                          skill.equipment_brand === b.name && styles.optionActive,
                        ]}
                        onPress={() => updateEquipmentSkill(index, 'equipment_brand', b.name)}
                      >
                        <ThemedText
                          style={skill.equipment_brand === b.name ? styles.optionTextActive : styles.optionText}
                        >
                          {b.name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.half}>
                  <ThemedText style={styles.fieldLabel}>Rating</ThemedText>
                  <View style={styles.ratingPicker}>
                    {([1, 2, 3, 4, 5] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.ratingOption,
                          skill.proficiency_rating === r && styles.ratingOptionActive,
                        ]}
                        onPress={() => updateEquipmentSkill(index, 'proficiency_rating', r)}
                      >
                        <ThemedText
                          style={skill.proficiency_rating === r ? styles.optionTextActive : styles.optionText}
                        >
                          {r} ★
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Software Skills */}
      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Software Skills
        </ThemedText>

        <View style={styles.softwareGrid}>
          {software.map((s) => {
            const isSelected = formData.software_skill_ids.includes(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.softwareChip,
                  isSelected && styles.softwareChipActive,
                ]}
                onPress={() => toggleSoftwareSkill(s.id)}
              >
                <ThemedText
                  style={isSelected ? styles.optionTextActive : styles.optionText}
                >
                  {s.name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Submit */}
      <View style={styles.footer}>
        <ThemedButton
          onPress={handleSubmit}
          disabled={isSubmitting}
          variant="primary"
          fullWidth
          size="lg"
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Worker' : 'Create Worker'}
        </ThemedButton>
      </View>
    </ScrollView>
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
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  addButtonSmall: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  categoryButtonText: {
    textTransform: 'capitalize',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  optionActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  optionText: {
    fontSize: 14,
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  skillCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  skillLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: '#6b7280',
  },
  removeButton: {
    padding: 4,
  },
  ratingPicker: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingOption: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ratingOptionActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
  },
  emptyText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  softwareGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  softwareChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  softwareChipActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
});
