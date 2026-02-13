import { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useCustomerList, useMyCompanies } from '@repo/api-client';
import type { Customer } from '@repo/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/button';
import { CustomerCard } from '@/components/ui/customer-card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type StatusFilter = 'all' | 'active' | 'inactive' | 'prospect';
type TypeFilter = 'all' | 'individual' | 'company' | 'government';

export default function CustomerListScreen() {
  const router = useRouter();
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(typeFilter !== 'all' && { customer_type: typeFilter }),
    ...(searchQuery && { search: searchQuery }),
  };

  const { data, isLoading, error, refetch } = useCustomerList(companyId, filters);
  const customers = data?.data ?? [];

  const filteredCustomers = searchQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.phone && c.phone.includes(searchQuery))
      )
    : customers;

  const handleAddCustomer = () => {
    router.push('/(app)/customers/form' as any);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <MaterialIcons name="access-time" size={48} color="#9ca3af" />
        <ThemedText>Loading customers...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{error.message}</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">Customers</ThemedText>
        <TouchableOpacity
          onPress={handleAddCustomer}
          style={styles.addButton}
          accessibilityRole="button"
          accessibilityLabel="Add customer"
        >
          <MaterialIcons name="add-circle" size={28} color="#0a7ea4" />
        </TouchableOpacity>
      </View>

      {/* Status Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        <FilterChip
          label="All"
          active={statusFilter === 'all' && typeFilter === 'all'}
          onPress={() => {
            setStatusFilter('all');
            setTypeFilter('all');
          }}
        />
        <FilterChip
          label="Active"
          active={statusFilter === 'active'}
          onPress={() => setStatusFilter('active')}
        />
        <FilterChip
          label="Inactive"
          active={statusFilter === 'inactive'}
          onPress={() => setStatusFilter('inactive')}
        />
        <FilterChip
          label="Prospect"
          active={statusFilter === 'prospect'}
          onPress={() => setStatusFilter('prospect')}
        />
        <FilterChip
          label="Individual"
          active={typeFilter === 'individual'}
          onPress={() => setTypeFilter('individual')}
        />
        <FilterChip
          label="Company"
          active={typeFilter === 'company'}
          onPress={() => setTypeFilter('company')}
        />
        <FilterChip
          label="Government"
          active={typeFilter === 'government'}
          onPress={() => setTypeFilter('government')}
        />
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search customers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
          accessibilityLabel="Search customers"
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {filteredCustomers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="business" size={64} color="#9ca3af" />
            <ThemedText type="subtitle" style={styles.emptyText}>
              {customers.length === 0 ? 'No customers yet' : 'No matching customers'}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {customers.length === 0
                ? 'Add your first customer to get started.'
                : 'Try adjusting your filters.'}
            </ThemedText>
            {customers.length === 0 && (
              <ThemedButton onPress={handleAddCustomer} style={styles.emptyButton}>
                Add Customer
              </ThemedButton>
            )}
          </View>
        ) : (
          filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onPress={(id) => router.push(`/(app)/customers/${id}` as any)}
            />
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <ThemedText style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  addButton: {
    padding: 4,
  },
  filtersScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    color: '#11181c',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 64,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 16,
  },
});
