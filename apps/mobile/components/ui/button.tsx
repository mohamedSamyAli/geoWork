import { StyleSheet, TouchableOpacity, Text, View, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemedButtonProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  fullWidth?: boolean;
};

export function ThemedButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onPress,
  style,
  fullWidth = false,
}: ThemedButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 12 },
    md: { paddingVertical: 10, paddingHorizontal: 16 },
    lg: { paddingVertical: 14, paddingHorizontal: 20 },
  };

  const getTextVariant = () => {
    if (variant === 'primary' || variant === 'destructive') return 'defaultSemiBold';
    return 'default';
  };

  const getBgColor = () => {
    if (disabled) return '#9ca3af';
    if (variant === 'primary') return theme.tint;
    if (variant === 'destructive') return '#ef4444';
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return '#fff';
    if (variant === 'ghost' || variant === 'secondary') return theme.text;
    return '#fff';
  };

  const getBorderColor = () => {
    if (variant === 'ghost' || variant === 'secondary') return theme.tabIconDefault;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        sizeStyles[size],
        {
          backgroundColor: getBgColor(),
          borderColor: getBorderColor(),
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <Text style={[styles.text, { color: getTextColor() }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  fullWidth: {
    width: '100%',
  },
});
