import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export type CustomerCardProps = {
  customer: {
    id: string;
    name: string;
    customer_type: 'individual' | 'company' | 'government';
    status: 'active' | 'inactive' | 'prospect';
    phone: string | null;
    email: string | null;
  };
  onPress?: (id: string) => void;
};

const typeColors: Record<string, string> = {
  individual: '#3b82f6',
  company: '#a855f7',
  government: '#f59e0b',
};

const statusColors: Record<string, string> = {
  active: '#22c55e',
  inactive: '#6b7280',
  prospect: '#3b82f6',
};

export function CustomerCard({ customer, onPress }: CustomerCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress?.(customer.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View ${customer.name}`}
    >
      <View style={styles.cardHeader}>
        <ThemedText type="defaultSemiBold" style={styles.name}>
          {customer.name}
        </ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[customer.status] }]}>
          <ThemedText style={styles.statusText}>{customer.status}</ThemedText>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Type:</ThemedText>
          <View style={[styles.typeBadge, { backgroundColor: typeColors[customer.customer_type] }]}>
            <ThemedText style={styles.typeText}>{customer.customer_type}</ThemedText>
          </View>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Phone:</ThemedText>
          <ThemedText style={styles.value}>{customer.phone ?? '\u2014'}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Email:</ThemedText>
          <ThemedText style={styles.value}>{customer.email ?? '\u2014'}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  cardBody: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  value: {
    fontSize: 14,
    color: '#11181c',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
});
