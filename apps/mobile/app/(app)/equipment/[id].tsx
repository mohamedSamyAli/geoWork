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
import {
  useEquipmentDetail,
  useArchiveEquipmentMutation,
  useReactivateEquipmentMutation,
  useEquipmentPartners,
  useAddEquipmentPartnerMutation,
  useRemoveEquipmentPartnerMutation,
  usePartnerList,
  useMyCompanies,
} from '@repo/api-client';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: result, isLoading } = useEquipmentDetail(id);
  const archiveMutation = useArchiveEquipmentMutation();
  const reactivateMutation = useReactivateEquipmentMutation();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');
  const cardBg = useThemeColor({ light: '#ffffff', dark: '#1e293b' }, 'background');

  const equipment = result?.data ?? null;
  const isToggling = archiveMutation.isPending || reactivateMutation.isPending;

  function handleStatusToggle() {
    if (!id || !equipment) return;
    const action = equipment.status === 'active' ? 'archive' : 'reactivate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Equipment`,
      `Are you sure you want to ${action} this equipment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: action === 'archive' ? 'destructive' : 'default',
          onPress: () => {
            if (action === 'archive') archiveMutation.mutate(id);
            else reactivateMutation.mutate(id);
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (!equipment) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Text style={{ color: mutedColor }}>Equipment not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: textColor }]}>{equipment.name}</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: equipment.status === 'active' ? '#dcfce7' : '#f3f4f6' },
          ]}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: equipment.status === 'active' ? '#15803d' : '#6b7280',
            }}
          >
            {equipment.status}
          </Text>
        </View>
      </View>

      {/* Details Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Details</Text>
        <DetailRow label="Serial Number" value={equipment.serial_number} textColor={textColor} mutedColor={mutedColor} />
        <DetailRow label="Type" value={equipment.equipment_type?.name ?? '—'} textColor={textColor} mutedColor={mutedColor} />
        {equipment.model && <DetailRow label="Model" value={equipment.model} textColor={textColor} mutedColor={mutedColor} />}
        <DetailRow label="Ownership" value={equipment.ownership_type} textColor={textColor} mutedColor={mutedColor} />
      </View>

      {/* Rental Info */}
      {equipment.ownership_type === 'rented' && equipment.supplier && (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Rental Information</Text>
          <DetailRow label="Supplier" value={equipment.supplier.name} textColor={textColor} mutedColor={mutedColor} />
          <DetailRow
            label="Monthly Rent"
            value={equipment.monthly_rent != null ? `$${Number(equipment.monthly_rent).toFixed(2)}` : '—'}
            textColor={textColor}
            mutedColor={mutedColor}
          />
          <DetailRow
            label="Daily Rent"
            value={equipment.daily_rent != null ? `$${Number(equipment.daily_rent).toFixed(2)}` : '—'}
            textColor={textColor}
            mutedColor={mutedColor}
          />
        </View>
      )}

      {/* Partner Ownership — only for owned equipment */}
      {equipment.ownership_type === 'owned' && id && (
        <PartnerOwnershipSection equipmentId={id} cardBg={cardBg} borderColor={borderColor} textColor={textColor} mutedColor={mutedColor} tintColor={tintColor} />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.outlineButton, { borderColor }]}
          onPress={() => router.push({ pathname: '/(app)/equipment/form' as never, params: { id } })}
        >
          <Text style={[styles.outlineButtonText, { color: tintColor }]}>Edit</Text>
        </Pressable>
        <Pressable
          style={[
            styles.outlineButton,
            {
              borderColor: equipment.status === 'active' ? '#ef4444' : tintColor,
            },
          ]}
          onPress={handleStatusToggle}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={mutedColor} />
          ) : (
            <Text
              style={[
                styles.outlineButtonText,
                { color: equipment.status === 'active' ? '#ef4444' : tintColor },
              ]}
            >
              {equipment.status === 'active' ? 'Archive' : 'Reactivate'}
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
  textColor,
  mutedColor,
}: {
  label: string;
  value: string;
  textColor: string;
  mutedColor: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

function PartnerOwnershipSection({
  equipmentId,
  cardBg,
  borderColor,
  textColor,
  mutedColor,
  tintColor,
}: {
  equipmentId: string;
  cardBg: string;
  borderColor: string;
  textColor: string;
  mutedColor: string;
  tintColor: string;
}) {
  const { data: companiesResult } = useMyCompanies();
  const companyId = companiesResult?.data?.[0]?.company_id;
  const { data: partnersResult, isLoading } = useEquipmentPartners(equipmentId);
  const { data: allPartnersResult } = usePartnerList(companyId);
  const addMutation = useAddEquipmentPartnerMutation();
  const removeMutation = useRemoveEquipmentPartnerMutation();

  const partners = partnersResult?.data ?? [];
  const allPartners = allPartnersResult?.data ?? [];
  const totalPct = partners.reduce((sum, p) => sum + Number(p.percentage), 0);
  const companyShare = (100 - totalPct).toFixed(2);
  const available = allPartners.filter((p) => !partners.some((ep) => ep.partner_id === p.id));

  function handleAdd() {
    if (available.length === 0) {
      Alert.alert('No Partners', 'Create a partner first from the Partners section.');
      return;
    }
    // Simple prompt - pick first available, ask for percentage
    Alert.prompt(
      'Add Partner',
      `Add "${available[0].name}" with what ownership %? (1-99, max ${(100 - totalPct).toFixed(2)}%)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: (pctStr) => {
            const pct = parseFloat(pctStr ?? '');
            if (isNaN(pct) || pct < 1 || pct > 99 || totalPct + pct > 100) {
              Alert.alert('Invalid', 'Percentage must be 1-99 and total must not exceed 100%');
              return;
            }
            addMutation.mutate({
              equipmentId,
              payload: { partner_id: available[0].id, percentage: pct },
            });
          },
        },
      ],
      'plain-text',
      '',
      'decimal-pad'
    );
  }

  function handleRemove(epId: string, name: string) {
    Alert.alert('Remove Partner', `Remove ${name} from ownership?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeMutation.mutate({ equipmentPartnerId: epId, equipmentId }),
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ActivityIndicator size="small" color={tintColor} />
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={[styles.cardTitle, { color: textColor, marginBottom: 0 }]}>Partner Ownership</Text>
        <Pressable
          style={{ borderWidth: 1, borderColor, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}
          onPress={handleAdd}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: tintColor }}>+ Add</Text>
        </Pressable>
      </View>

      {/* Company share */}
      <View style={[styles.detailRow, { backgroundColor: '#f1f5f9', borderRadius: 6, paddingHorizontal: 12 }]}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>Company</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>{companyShare}%</Text>
      </View>

      {partners.map((ep) => (
        <View key={ep.id} style={[styles.detailRow, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 14, color: textColor }}>{ep.partner.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: textColor }}>
              {Number(ep.percentage).toFixed(2)}%
            </Text>
            <Pressable onPress={() => handleRemove(ep.id, ep.partner.name)}>
              <Text style={{ fontSize: 12, color: '#ef4444' }}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}

      {partners.length === 0 && (
        <Text style={{ fontSize: 13, color: mutedColor, textAlign: 'center', paddingVertical: 8 }}>
          Company owns 100%. Add partners to share ownership.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 12 },
  outlineButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineButtonText: { fontSize: 14, fontWeight: '600' },
});
