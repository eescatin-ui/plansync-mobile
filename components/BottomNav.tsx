// components/BottomNav.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type NavItem = {
  label: string;
  icon: string;
  route: string;
  activeRoutes: string[];
};

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, theme } = useTheme();

  const navItems: NavItem[] = [
    { label: 'Home', icon: 'th-large', route: '/dashboard', activeRoutes: ['/dashboard'] },
    { label: 'Schedule', icon: 'calendar-week', route: '/schedule', activeRoutes: ['/schedule'] },
    { label: 'Tasks', icon: 'tasks', route: '/tasks', activeRoutes: ['/tasks'] },
    { label: 'Notes', icon: 'sticky-note', route: '/notes', activeRoutes: ['/notes'] },
    { label: 'Settings', icon: 'cog', route: '/settings', activeRoutes: ['/settings'] },
  ];

  const isActive = (activeRoutes: string[]) => activeRoutes.includes(pathname);

  const handleNavigation = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: theme === 'dark' ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)', 
      borderTopColor: theme === 'dark' ? '#1e293b' : '#edf2f7',
    }]}>
      {navItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.navItem}
          onPress={() => handleNavigation(item.route)}
        >
          <FontAwesome5
            name={item.icon}
            size={22}
            color={isActive(item.activeRoutes) ? '#4361ee' : theme === 'dark' ? '#94a3b8' : '#8c97a9'}
          />
          <Text
            style={[
              styles.navText,
              { color: theme === 'dark' ? '#94a3b8' : '#8c97a9' },
              isActive(item.activeRoutes) && styles.navTextActive,
            ]}
          >
            {item.label}
          </Text>
          {isActive(item.activeRoutes) && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.02,
    shadowRadius: 12,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navText: {
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#4361ee',
    fontWeight: '600',
  },
  activeIndicator: {
    width: 20,
    height: 3,
    backgroundColor: '#4361ee',
    borderRadius: 20,
    marginTop: 4,
  },
});