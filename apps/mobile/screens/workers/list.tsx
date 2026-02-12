import { useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkerList, useMyCompanies } from '@repo/api-client';
import type { Worker } from '@repo/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemedButton } from '@/components/ui/button';
import { WorkerCard } from '@/components/ui/card';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type CategoryFilter = 'all' | 'engineer' | 'surveyor' | 'assistant';
type StatusFilter = 'all' | 'active' | 'inactive';

export default function WorkersListScreen() {
  const router = useRouter();
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(searchQuery && { search: searchQuery }),
  };

  const { data, isLoading, error, refetch } = useWorkerList(companyId, filters);
  const workers = data?.data ?? [];

  const filteredWorkers = searchQuery
    ? workers.filter(
        (w) =>
          w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          w.phone.includes(searchQuery)
      )
    : workers;

  const handleAddWorker = () => {
    router.push('/workers/form' as any);
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <MaterialIcons name="access-time" size={48} color="#9ca3af" />
        <ThemedText>Loading workers...</ThemedText>
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
        <ThemedText type="title">Workers</ThemedText>
        <TouchableOpacity onPress={handleAddWorker} style={styles.addButton}>
          <MaterialIcons name="add-circle" size={28} color="#0a7ea4" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
        <FilterChip
          label="All"
          active={statusFilter === 'all' && categoryFilter === 'all'}
          onPress={() => {
            setStatusFilter('all');
            setCategoryFilter('all');
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
          label="Engineers"
          active={categoryFilter === 'engineer'}
          onPress={() => setCategoryFilter('engineer')}
        />
        <FilterChip
          label="Surveyors"
          active={categoryFilter === 'surveyor'}
          onPress={() => setCategoryFilter('surveyor')}
        />
        <FilterChip
          label="Assistants"
          active={categoryFilter === 'assistant'}
          onPress={() => setCategoryFilter('assistant')}
        />
      </ScrollView>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search workers..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {filteredWorkers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="groups" size={64} color="#9ca3af" />
            <ThemedText type="subtitle" style={styles.emptyText}>
              {workers.length === 0 ? 'No workers yet' : 'No matching workers'}
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              {workers.length === 0 ? 'Add your first worker to get started.' : 'Try adjusting your filters.'}
            </ThemedText>
            {workers.length === 0 && (
              <ThemedButton onPress={handleAddWorker} style={styles.emptyButton}>
                Add Worker
              </ThemedButton>
            )}
          </View>
        ) : (
          filteredWorkers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              onPress={(id) => router.push(`/workers/${id}` as any)}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
    paddingHorizontal: 12,
    color: '#11181c',
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
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
