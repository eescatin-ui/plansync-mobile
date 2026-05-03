import { Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { DataProvider } from '../contexts/DataContext';
import { ThemeProvider } from '../contexts/ThemeContext';

function LayoutContent() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/' || pathname === '/login' || pathname === '/register';
  const showNav = !isAuthPage;

  return (
    <View style={styles.container}>
      {showNav && <AppHeader />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="tasks" />
        <Stack.Screen name="notes" />
        <Stack.Screen name="reminders" />
        <Stack.Screen name="settings" />
      </Stack>
      {showNav && <BottomNav />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DataProvider>
        <LayoutContent />
      </DataProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});