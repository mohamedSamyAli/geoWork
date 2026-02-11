import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="home" options={{ title: 'Home' }} />
      <Stack.Screen name="equipment/index" options={{ title: 'Equipment' }} />
      <Stack.Screen name="equipment/[id]" options={{ title: 'Equipment Detail' }} />
      <Stack.Screen name="equipment/form" options={{ title: 'Equipment Form' }} />
      <Stack.Screen name="suppliers/index" options={{ title: 'Suppliers' }} />
      <Stack.Screen name="suppliers/[id]" options={{ title: 'Supplier Detail' }} />
      <Stack.Screen name="suppliers/form" options={{ title: 'Supplier Form' }} />
      <Stack.Screen name="partners/index" options={{ title: 'Partners' }} />
      <Stack.Screen name="partners/[id]" options={{ title: 'Partner Detail' }} />
      <Stack.Screen name="partners/form" options={{ title: 'Partner Form' }} />
    </Stack>
  );
}
