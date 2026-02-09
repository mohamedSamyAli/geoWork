import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyProfile, useSignOutMutation } from '@repo/api-client';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function HomeScreen() {
  const { data: profileResult, isLoading, error: queryError } = useMyProfile();
  const signOut = useSignOutMutation();
  const insets = useSafeAreaInsets();

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const mutedColor = useThemeColor({ light: '#6b7280', dark: '#9ca3af' }, 'icon');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#334155' }, 'icon');

  const profile = profileResult?.data;

  function handleSignOut() {
    signOut.mutate(undefined);
    // Auth gate will redirect to /login
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <ActivityIndicator size="large" color={tintColor} />
      </View>
    );
  }

  if (queryError || profileResult?.error) {
    return (
      <View style={[styles.centered, { backgroundColor }]}>
        <Text style={[styles.errorText, { marginBottom: 16 }]}>
          {profileResult?.error?.message ?? 'Failed to load profile'}
        </Text>
        <Pressable
          style={[styles.outlineButton, { borderColor }]}
          onPress={handleSignOut}
          accessibilityRole="button"
        >
          <Text style={[styles.outlineButtonText, { color: mutedColor }]}>Sign out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: textColor }]}>
          Hello, {profile?.full_name || 'User'}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.outlineButton,
            { borderColor, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={handleSignOut}
          disabled={signOut.isPending}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          {signOut.isPending ? (
            <ActivityIndicator size="small" color={mutedColor} />
          ) : (
            <Text style={[styles.outlineButtonText, { color: mutedColor }]}>Sign out</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    flexShrink: 1,
  },
  outlineButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 15,
    textAlign: 'center',
  },
});
