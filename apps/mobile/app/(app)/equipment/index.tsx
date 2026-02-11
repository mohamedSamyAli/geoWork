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
import { useEquipmentList, useMyCompanies } from '@repo/api-client';
import type { EquipmentWithType } from '@repo/types';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function EquipmentListScreen() {
  const router = useRouter();
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;

  const [search, setSearch] = useState('');
  const [compact, setCompact] = useState(false);

  const { data: listResult, isLoading, refetch, isRefetching } = useEquipmentList(companyId, {
    status: 'active',
  });

  const equipment = listResult?.data ?? [];

  const filtered = useMemo(() => {
    if (!search) return equipment;
    const q = search.toLowerCase();
    return equipment.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.serial_number.toLowerCase().includes(q)
    );
  }, [equipment, search]);

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1e293b' }, 'background');
  const inputBg = useThemeColor({ light: '#f8fafc', dark: '#0f172a' }, 'background');

  function renderItem({ item }: { item: EquipmentWithType }) {
    if (compact) {
      return (
        <Pressable
          style={({ pressed }) => [styles.compactRow, { borderColor, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push(`/(app)/equipment/${item.id}` as never)}
        >
          <Text style={[styles.compactName, { color: textColor }]} numberOfLines={1}>{item.name}</Text>
          <Text style={{ color: mutedColor, fontSize: 12 }}>{item.serial_number}</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: item.ownership_type === 'owned' ? '#dbeafe' : '#fef3c7' },
            ]}
          >
            <Text style={{ fontSize: 10, fontWeight: '600', color: item.ownership_type === 'owned' ? '#1d4ed8' : '#b45309' }}>
              {item.ownership_type}
            </Text>
          </View>
        </Pressable>
      );
    }

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: cardBg, borderColor, opacity: pressed ? 0.85 : 1 },
        ]}
        onPress={() => router.push(`/(app)/equipment/${item.id}` as never)}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: item.status === 'active' ? '#dcfce7' : '#f3f4f6' },
            ]}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: item.status === 'active' ? '#15803d' : '#6b7280',
              }}
            >
              {item.status}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardSub, { color: mutedColor }]}>
          SN: {item.serial_number}
        </Text>
        <Text style={[styles.cardSub, { color: mutedColor }]}>
          {item.equipment_type?.name ?? '—'} {item.model ? `· ${item.model}` : ''}
        </Text>
        <View
          style={[
            styles.badge,
            {
              alignSelf: 'flex-start',
              marginTop: 8,
              backgroundColor: item.ownership_type === 'owned' ? '#dbeafe' : '#fef3c7',
            },
          ]}
        >
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: item.ownership_type === 'owned' ? '#1d4ed8' : '#b45309',
            }}
          >
            {item.ownership_type}
          </Text>
        </View>
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
      {/* Search + toggle */}
      <View style={styles.filterRow}>
        <TextInput
          style={[styles.searchInput, { borderColor, color: textColor, backgroundColor: inputBg }]}
          placeholder="Search name or serial..."
          placeholderTextColor={mutedColor}
          value={search}
          onChangeText={setSearch}
        />
        <Pressable
          style={[styles.toggleBtn, { borderColor, backgroundColor: compact ? tintColor : 'transparent' }]}
          onPress={() => setCompact(!compact)}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: compact ? '#fff' : tintColor }}>
            {compact ? 'Compact' : 'Cards'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: textColor }]}>
              {equipment.length === 0 ? 'No equipment yet' : 'No matches'}
            </Text>
            <Text style={[styles.emptyText, { color: mutedColor }]}>
              {equipment.length === 0
                ? 'Get started by adding your first piece of equipment.'
                : 'Try adjusting your search.'}
            </Text>
            {equipment.length === 0 && (
              <Pressable
                style={[styles.primaryButton, { backgroundColor: tintColor }]}
                onPress={() => router.push('/(app)/equipment/form' as never)}
              >
                <Text style={styles.primaryButtonText}>Add your first equipment</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {equipment.length > 0 && (
        <Pressable
          style={[styles.fab, { backgroundColor: tintColor }]}
          onPress={() => router.push('/(app)/equipment/form' as never)}
          accessibilityRole="button"
          accessibilityLabel="Add equipment"
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
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  searchInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  toggleBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  cardSub: { fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, paddingVertical: 10, paddingHorizontal: 4 },
  compactName: { flex: 1, fontSize: 14, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  emptyText: { fontSize: 14, marginBottom: 16, textAlign: 'center', paddingHorizontal: 32 },
  primaryButton: { borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fab: {
    position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '400', lineHeight: 30 },
});
