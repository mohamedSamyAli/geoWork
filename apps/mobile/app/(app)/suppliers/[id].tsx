import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSupplierDetail, useDeleteSupplierMutation } from '@repo/api-client';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: result, isLoading } = useSupplierDetail(id);
  const deleteMutation = useDeleteSupplierMutation();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1e293b' }, 'background');

  const supplier = result?.data ?? null;

  function handleDelete() {
    if (!id) return;
    Alert.alert('Delete Supplier', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const res = await deleteMutation.mutateAsync(id);
          if (res.error) { Alert.alert('Error', res.error.message); return; }
          router.back();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (!supplier) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Text style={{ color: mutedColor }}>Supplier not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: textColor }]}>{supplier.name}</Text>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Details</Text>
        <View style={styles.row}>
          <Text style={{ color: mutedColor, fontSize: 14 }}>Phone</Text>
          <Text style={{ color: textColor, fontSize: 14, fontWeight: '500' }}>{supplier.phone ?? '—'}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Rented Equipment</Text>
        {supplier.equipment.length === 0 ? (
          <Text style={{ color: mutedColor, fontSize: 13 }}>No equipment linked</Text>
        ) : (
          supplier.equipment.map((eq) => (
            <Pressable
              key={eq.id}
              style={[styles.eqItem, { borderColor }]}
              onPress={() => router.push(`/(app)/equipment/${eq.id}` as never)}
            >
              <Text style={{ color: textColor, fontWeight: '500' }}>{eq.name}</Text>
              <Text style={{ color: mutedColor, fontSize: 12 }}>{eq.serial_number}</Text>
              {eq.monthly_rent != null && (
                <Text style={{ color: mutedColor, fontSize: 12, marginTop: 2 }}>
                  Monthly: ${Number(eq.monthly_rent).toFixed(2)} | Daily: ${Number(eq.daily_rent ?? 0).toFixed(2)}
                </Text>
              )}
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.outlineBtn, { borderColor }]}
          onPress={() => router.push({ pathname: '/(app)/suppliers/form' as never, params: { id } })}
        >
          <Text style={{ color: tintColor, fontWeight: '600', fontSize: 14 }}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.outlineBtn, { borderColor: '#ef4444' }]}
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
        >
          {deleteMutation.isPending ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Text style={{ color: '#ef4444', fontWeight: '600', fontSize: 14 }}>Delete</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  eqItem: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  outlineBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
});
