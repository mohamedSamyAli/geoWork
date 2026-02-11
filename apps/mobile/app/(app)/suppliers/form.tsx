import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSupplierSchema,
  useSupplierDetail,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useMyCompanies,
  type CreateSupplierFormData,
} from '@repo/api-client';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SupplierFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const isEdit = !!id;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;
  const { data: detailResult } = useSupplierDetail(isEdit ? id : undefined);
  const existing = detailResult?.data;

  const createMutation = useCreateSupplierMutation();
  const updateMutation = useUpdateSupplierMutation();
  const [apiError, setApiError] = useState<string | null>(null);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');
  const inputBg = useThemeColor({ light: '#fff', dark: '#1e293b' }, 'background');

  const { control, handleSubmit, formState: { errors } } = useForm<CreateSupplierFormData>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: existing ? { name: existing.name, phone: existing.phone ?? undefined } : undefined,
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  async function onSubmit(data: CreateSupplierFormData) {
    setApiError(null);
    if (isEdit && id) {
      const res = await updateMutation.mutateAsync({ supplierId: id, payload: data });
      if (res.error) { setApiError(res.error.message); return; }
    } else if (companyId) {
      const res = await createMutation.mutateAsync({ companyId, payload: data });
      if (res.error) { setApiError(res.error.message); return; }
    }
    router.back();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      {apiError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{apiError}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Name</Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBg }]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="Supplier name"
              placeholderTextColor={mutedColor}
            />
          )}
        />
        {errors.name && <Text style={styles.fieldError}>{errors.name.message}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: mutedColor }]}>Phone (optional)</Text>
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: inputBg }]}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value ?? ''}
              placeholder="+1 234 567 890"
              placeholderTextColor={mutedColor}
              keyboardType="phone-pad"
            />
          )}
        />
      </View>

      <Pressable
        style={[styles.submitButton, { backgroundColor: tintColor, opacity: isPending ? 0.7 : 1 }]}
        onPress={handleSubmit(onSubmit)}
        disabled={isPending}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.submitText}>{isEdit ? 'Update Supplier' : 'Create Supplier'}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 8, padding: 12 },
  errorText: { color: '#ef4444', fontSize: 14 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  fieldError: { color: '#ef4444', fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  submitButton: { borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
