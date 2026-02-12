import { StyleSheet, View, ViewStyle, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';

export type ThemedCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
};

export function ThemedCard({ children, style, onPress, disabled = false }: ThemedCardProps) {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component
      style={[styles.card, style]}
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {children}
    </Component>
  );
}

export type WorkerCardProps = {
  worker: {
    id: string;
    name: string;
    phone: string;
    category: 'engineer' | 'surveyor' | 'assistant';
    salary_month: number;
    salary_day: number;
    status: 'active' | 'inactive';
  };
  onPress?: (id: string) => void;
};

export function WorkerCard({ worker, onPress }: WorkerCardProps) {
  const categoryColors: Record<string, string> = {
    engineer: '#a855f7',
    surveyor: '#06b6d4',
    assistant: '#64748b',
  };
  const statusColor = worker.status === 'active' ? '#22c55e' : '#6b7280';

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(worker.id)} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <ThemedText type="defaultSemiBold" style={styles.name}>
          {worker.name}
        </ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <ThemedText style={styles.statusText}>{worker.status}</ThemedText>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Phone:</ThemedText>
          <ThemedText style={styles.value}>{worker.phone}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Category:</ThemedText>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColors[worker.category] }]}>
            <ThemedText style={styles.categoryText}>{worker.category}</ThemedText>
          </View>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Monthly:</ThemedText>
          <ThemedText style={styles.value}>${worker.salary_month}</ThemedText>
        </View>
        <View style={styles.row}>
          <ThemedText style={styles.label}>Daily:</ThemedText>
          <ThemedText style={styles.value}>${worker.salary_day}</ThemedText>
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
    textTransform: 'capitalize',
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
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  value: {
    fontSize: 14,
    color: '#11181c',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
});
