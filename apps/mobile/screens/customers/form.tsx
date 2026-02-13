import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useCustomerDetail,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useMyCompanies,
} from '@repo/api-client';
import type { CreateCustomerPayload } from '@repo/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/button';
import { ThemedInput } from '@/components/ui/input';

type FormData = {
  name: string;
  customer_type: 'individual' | 'company' | 'government';
  status: 'active' | 'inactive' | 'prospect';
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const defaultFormData: FormData = {
  name: '',
  customer_type: 'company',
  status: 'active',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export default function CustomerFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const customerId = params.id;
  const isEdit = !!customerId;

  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const { data: detailResult, isLoading: detailLoading } = useCustomerDetail(customerId);
  const customer = detailResult?.data;

  const createMutation = useCreateCustomerMutation();
  const updateMutation = useUpdateCustomerMutation();

  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer && isEdit) {
      setFormData({
        name: customer.name,
        customer_type: customer.customer_type,
        status: customer.status,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        address: customer.address ?? '',
        notes: customer.notes ?? '',
      });
    }
  }, [customer, isEdit]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (formData.email && !formData.email.includes('@')) newErrors.email = 'Invalid email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !companyId) return;

    setIsSubmitting(true);
    try {
      const payload: CreateCustomerPayload = {
        name: formData.name.trim(),
        customer_type: formData.customer_type,
        ...(isEdit && { status: formData.status }),
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.email && { email: formData.email }),
        ...(formData.address && { address: formData.address }),
        ...(formData.notes && { notes: formData.notes }),
      };

      let result;
      if (isEdit && customerId) {
        result = await updateMutation.mutateAsync({ customerId, payload });
      } else {
        result = await createMutation.mutateAsync({ companyId, payload });
      }

      if (result.error) {
        Alert.alert('Error', result.error.message);
      } else if (result.data) {
        if (isEdit) {
          router.back();
        } else {
          router.push(`/(app)/customers/${result.data.id}` as any);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
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
        <ThemedText type="title">{isEdit ? 'Edit Customer' : 'New Customer'}</ThemedText>
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
          placeholder="Customer name"
        />

        <View style={styles.pickerContainer}>
          <ThemedText style={styles.pickerLabel}>Customer Type</ThemedText>
          <View style={styles.segmentButtons}>
            {(['individual', 'company', 'government'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.segmentButton,
                  formData.customer_type === type && styles.segmentButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, customer_type: type })}
                accessibilityRole="radio"
                accessibilityState={{ selected: formData.customer_type === type }}
              >
                <ThemedText
                  style={[
                    styles.segmentButtonText,
                    formData.customer_type === type && styles.segmentButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isEdit && (
          <View style={styles.pickerContainer}>
            <ThemedText style={styles.pickerLabel}>Status</ThemedText>
            <View style={styles.segmentButtons}>
              {(['active', 'inactive', 'prospect'] as const).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.segmentButton,
                    formData.status === status && styles.segmentButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, status })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: formData.status === status }}
                >
                  <ThemedText
                    style={[
                      styles.segmentButtonText,
                      formData.status === status && styles.segmentButtonTextActive,
                    ]}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <ThemedInput
          label="Phone"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder="+1 234 567 8900"
          keyboardType="phone-pad"
        />

        <ThemedInput
          label="Email"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          error={errors.email}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <ThemedInput
          label="Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          placeholder="Full address"
          multiline
          numberOfLines={3}
          style={styles.multilineInput}
        />

        <ThemedInput
          label="Notes"
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={3}
          style={styles.multilineInput}
        />
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
          {isSubmitting ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
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
  sectionTitle: {
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    marginBottom: 8,
    fontWeight: '600',
  },
  segmentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  segmentButtonText: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  segmentButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
});
