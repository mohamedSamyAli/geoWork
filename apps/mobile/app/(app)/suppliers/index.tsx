import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSupplierList, useMyCompanies } from '@repo/api-client';
import type { SupplierWithEquipmentCount } from '@repo/types';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SupplierListScreen() {
  const router = useRouter();
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [search, setSearch] = useState('');
  const { data: listResult, isLoading, refetch, isRefetching } = useSupplierList(companyId);

  const suppliers = listResult?.data ?? [];

  const filtered = useMemo(() => {
    if (!search) return suppliers;
    const q = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.toLowerCase().includes(q))
    );
  }, [suppliers, search]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1e293b' }, 'background');
  const inputBg = useThemeColor({ light: '#f8fafc', dark: '#0f172a' }, 'background');

  function renderItem({ item }: { item: SupplierWithEquipmentCount }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, { backgroundColor: cardBg, borderColor, opacity: pressed ? 0.85 : 1 }]}
        onPress={() => router.push(`/(app)/suppliers/${item.id}` as never)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
          {item.equipment_count > 0 && (
            <View style={[styles.badge, { backgroundColor: '#fef3c7' }]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#b45309' }}>{item.equipment_count} rented</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardSub, { color: mutedColor }]}>{item.phone ?? 'No phone'}</Text>
      </Pressable>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Search */}
      <View style={styles.filterRow}>
        <TextInput
          style={[styles.searchInput, { borderColor, color: textColor, backgroundColor: inputBg }]}
          placeholder="Search by name or phone..."
          placeholderTextColor={mutedColor}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {suppliers.length === 0 ? 'No suppliers yet' : 'No matches'}
            </Text>
            <Text style={[styles.emptyText, { color: mutedColor }]}>
              {suppliers.length === 0
                ? 'Get started by adding your first supplier.'
                : 'Try adjusting your search.'}
            </Text>
            {suppliers.length === 0 && (
              <Pressable
                style={[styles.primaryButton, { backgroundColor: tintColor }]}
                onPress={() => router.push('/(app)/suppliers/form' as never)}
              >
                <Text style={styles.primaryButtonText}>Add your first supplier</Text>
              </Pressable>
            )}
          </View>
        }
      />
      {suppliers.length > 0 && (
        <Pressable
          style={[styles.fab, { backgroundColor: tintColor }]}
          onPress={() => router.push('/(app)/suppliers/form' as never)}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { paddingHorizontal: 16, paddingTop: 12 },
  searchInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  cardSub: { fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptyText: { fontSize: 14, marginBottom: 16, textAlign: 'center', paddingHorizontal: 32 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '400', lineHeight: 30 },
});
