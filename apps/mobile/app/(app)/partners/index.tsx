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
import { usePartnerList, useMyCompanies } from '@repo/api-client';
import type { PartnerWithEquipmentCount } from '@repo/types';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PartnerListScreen() {
  const router = useRouter();
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [search, setSearch] = useState('');
  const { data: listResult, isLoading, refetch, isRefetching } = usePartnerList(companyId);

  const partners = listResult?.data ?? [];

  const filtered = useMemo(() => {
    if (!search) return partners;
    const q = search.toLowerCase();
    return partners.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q))
    );
  }, [partners, search]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1e293b' }, 'background');
  const inputBg = useThemeColor({ light: '#f8fafc', dark: '#0f172a' }, 'background');

  function renderItem({ item }: { item: PartnerWithEquipmentCount }) {
    return (
      <Pressable
        style={({ pressed }) => [styles.card, { backgroundColor: cardBg, borderColor, opacity: pressed ? 0.85 : 1 }]}
        onPress={() => router.push(`/(app)/partners/${item.id}` as never)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
          {item.equipment_count > 0 && (
            <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#1d4ed8' }}>{item.equipment_count} co-owned</Text>
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
              {partners.length === 0 ? 'No partners yet' : 'No matches'}
            </Text>
            <Text style={[styles.emptyText, { color: mutedColor }]}>
              {partners.length === 0
                ? 'Get started by adding your first partner.'
                : 'Try adjusting your search.'}
            </Text>
            {partners.length === 0 && (
              <Pressable
                style={[styles.primaryButton, { backgroundColor: tintColor }]}
                onPress={() => router.push('/(app)/partners/form' as never)}
              >
                <Text style={styles.primaryButtonText}>Add your first partner</Text>
              </Pressable>
            )}
          </View>
        }
      />
      {partners.length > 0 && (
        <Pressable
          style={[styles.fab, { backgroundColor: tintColor }]}
          onPress={() => router.push('/(app)/partners/form' as never)}
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
