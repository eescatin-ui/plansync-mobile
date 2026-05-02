// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="notes" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}