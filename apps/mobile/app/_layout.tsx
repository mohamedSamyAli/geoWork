import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initApi, createQueryClient, useSession } from '@repo/api-client';

// ---------------------------------------------------------------------------
// Initialise shared packages with Expo env vars (EXPO_PUBLIC_* are inlined
// at build time by Metro — no Node.js process access at runtime).
// ---------------------------------------------------------------------------
initApi({
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
});

const queryClient = createQueryClient();

/**
 * Redirect based on auth state:
 * - Unauthenticated users outside (auth) group → /login
 * - Authenticated users outside (app) group → /home
 */
function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAppGroup = segments[0] === '(app)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && !inAppGroup) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, segments]);
}

function RootNavigator() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
