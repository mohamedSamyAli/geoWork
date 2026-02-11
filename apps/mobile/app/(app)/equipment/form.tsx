import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createEquipmentSchema,
  useEquipmentDetail,
  useCreateEquipmentMutation,
  useUpdateEquipmentMutation,
  useEquipmentTypes,
  useSupplierList,
  useMyCompanies,
  type CreateEquipmentFormData,
} from '@repo/api-client';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function EquipmentFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const isEdit = !!id;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult } = useEquipmentDetail(isEdit ? id : undefined);
  const { data: typesResult } = useEquipmentTypes(companyId);
  const { data: suppliersResult } = useSupplierList(companyId);

  const types = typesResult?.data ?? [];
  const suppliers = suppliersResult?.data ?? [];
  const existing = detailResult?.data;

  const createMutation = useCreateEquipmentMutation();
  const updateMutation = useUpdateEquipmentMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');
  const inputBg = useThemeColor({ light: '#fff', dark: '#1e293b' }, 'background');

  const { control, handleSubmit, watch, formState: { errors } } = useForm<CreateEquipmentFormData>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: existing
      ? {
          name: existing.name,
          serial_number: existing.serial_number,
          equipment_type_id: existing.equipment_type_id,
          model: existing.model ?? undefined,
          ownership_type: existing.ownership_type,
          supplier_id: existing.supplier_id ?? undefined,
          monthly_rent: existing.monthly_rent ?? undefined,
          daily_rent: existing.daily_rent ?? undefined,
        }
      : { ownership_type: 'owned' },
  });

  const ownershipType = watch('ownership_type');
  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(data: CreateEquipmentFormData) {
    setApiError(null);

    if (isEdit && id) {
      const result = await updateMutation.mutateAsync({ equipmentId: id, payload: data });
      if (result.error) { setApiError(result.error.message); return; }
      router.back();
    } else if (companyId) {
      const result = await createMutation.mutateAsync({ companyId, payload: data });
      if (result.error) { setApiError(result.error.message); return; }
      router.back();
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      {apiError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{apiError}</Text>
        </View>
      )}

      <FormField label="Name" error={errors.name?.message}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBg }]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Equipment name"
              placeholderTextColor={mutedColor}
            />
          )}
        />
      </FormField>

      <FormField label="Serial Number" error={errors.serial_number?.message}>
        <Controller
          control={control}
          name="serial_number"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBg }]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="SN-001"
              placeholderTextColor={mutedColor}
            />
          )}
        />
      </FormField>

      <FormField label="Equipment Type" error={errors.equipment_type_id?.message}>
        <Controller
          control={control}
          name="equipment_type_id"
          render={({ field: { onChange, value } }) => (
            <View style={styles.segmented}>
              {types.map((t) => (
                <Pressable
                  key={t.id}
                  style={[
                    styles.segmentItem,
                    {
                      borderColor,
                      backgroundColor: value === t.id ? tintColor : inputBg,
                    },
                  ]}
                  onPress={() => onChange(t.id)}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: value === t.id ? '#fff' : textColor,
                      fontWeight: value === t.id ? '600' : '400',
                    }}
                    numberOfLines={1}
                  >
                    {t.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </FormField>

      <FormField label="Model (optional)">
        <Controller
          control={control}
          name="model"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBg }]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value ?? ''}
              placeholder="Model name"
              placeholderTextColor={mutedColor}
            />
          )}
        />
      </FormField>

      <FormField label="Ownership Type">
        <Controller
          control={control}
          name="ownership_type"
          render={({ field: { onChange, value } }) => (
            <View style={styles.ownershipRow}>
              {(['owned', 'rented'] as const).map((opt) => (
                <Pressable
                  key={opt}
                  style={[
                    styles.ownershipOption,
                    {
                      borderColor: value === opt ? tintColor : borderColor,
                      backgroundColor: value === opt ? tintColor : inputBg,
                    },
                  ]}
                  onPress={() => {
                    if (isEdit && value !== opt) {
                      const msg =
                        opt === 'rented'
                          ? 'Switching to rented will remove partner ownership data. Continue?'
                          : 'Switching to owned will remove supplier and rental cost data. Continue?';
                      Alert.alert('Change Ownership Type', msg, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Continue', onPress: () => onChange(opt) },
                      ]);
                    } else {
                      onChange(opt);
                    }
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: value === opt ? '#fff' : textColor,
                    }}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />
      </FormField>

      {ownershipType === 'rented' && (
        <View style={[styles.rentalSection, { borderColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Rental Details</Text>

          <FormField label="Supplier" error={errors.supplier_id?.message}>
            <Controller
              control={control}
              name="supplier_id"
              render={({ field: { onChange, value } }) => (
                <View style={styles.segmented}>
                  {suppliers.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[
                        styles.segmentItem,
                        {
                          borderColor,
                          backgroundColor: value === s.id ? tintColor : inputBg,
                        },
                      ]}
                      onPress={() => onChange(s.id)}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: value === s.id ? '#fff' : textColor,
                          fontWeight: value === s.id ? '600' : '400',
                        }}
                        numberOfLines={1}
                      >
                        {s.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            />
          </FormField>

          <FormField label="Monthly Rent" error={errors.monthly_rent?.message}>
            <Controller
              control={control}
              name="monthly_rent"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBg }]}
                  onBlur={onBlur}
                  onChangeText={(t) => onChange(t ? Number(t) : undefined)}
                  value={value != null ? String(value) : ''}
                  placeholder="0.00"
                  placeholderTextColor={mutedColor}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </FormField>

          <FormField label="Daily Rent" error={errors.daily_rent?.message}>
            <Controller
              control={control}
              name="daily_rent"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBg }]}
                  onBlur={onBlur}
                  onChangeText={(t) => onChange(t ? Number(t) : undefined)}
                  value={value != null ? String(value) : ''}
                  placeholder="0.00"
                  placeholderTextColor={mutedColor}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </FormField>
        </View>
      )}

      <Pressable
        style={[styles.submitButton, { backgroundColor: tintColor, opacity: isPending ? 0.7 : 1 }]}
        onPress={handleSubmit(onSubmit)}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitText}>{isEdit ? 'Update Equipment' : 'Create Equipment'}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: mutedColor }]}>{label}</Text>
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
  },
  errorText: { color: '#ef4444', fontSize: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  fieldError: { color: '#ef4444', fontSize: 12 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  ownershipRow: { flexDirection: 'row', gap: 12 },
  ownershipOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  segmentItem: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rentalSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600' },
  submitButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
