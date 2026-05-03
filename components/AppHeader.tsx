// components/AppHeader.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { apiFetch } from '../services/api';

// Global cache for profile image
let cachedProfileImage: string | null = null;
let imageLoaded = false;

// Page config
const pageConfig: Record<string, { title: string; icon: string }> = {
  '/dashboard': { title: 'Dashboard', icon: 'calendar-alt' },
  '/schedule': { title: 'Schedule', icon: 'calendar-week' },
  '/tasks': { title: 'Tasks', icon: 'tasks' },
  '/notes': { title: 'Notes', icon: 'sticky-note' },
  '/reminders': { title: 'Reminders', icon: 'bell' },
  '/settings': { title: 'Settings', icon: 'cog' },
};

const defaultConfig = { title: 'PlanSync', icon: 'calendar-alt' };

export default function AppHeader() {
  const router = useRouter();

const handleNotifications = () => {
    router.push('/reminders');
  };

  const pathname = usePathname();
  const isRemindersPage = pathname === '/reminders';
  const [userName, setUserName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#4361ee');
  const [initial, setInitial] = useState('U');
  const [profileImage, setProfileImage] = useState<string | null>(cachedProfileImage);
  const { colors } = useTheme();
  const [notificationCount, setNotificationCount] = useState(0);
  const [bellActive, setBellActive] = useState(false);

  const config = pageConfig[pathname] || defaultConfig;

  useEffect(() => {
    loadUserInfo();
    if (!imageLoaded) {
      loadProfileImage();
    }
  }, []);

const loadNotificationCount = async () => {
    try {
      const [classes, tasks] = await Promise.all([
        apiFetch('/courses'),
        apiFetch('/tasks'),
      ]);
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayClasses = (classes || []).filter((c: any) => c.day === today).length;
      const todayTasks = (tasks || []).filter((t: any) => {
        if (t.status === 'done') return false;
        const due = new Date(t.dueDate);
        const now = new Date();
        return due.toDateString() === now.toDateString() || due < now;
      }).length;
      setNotificationCount(todayClasses + todayTasks);
    } catch (error) {}
  };

const loadUserInfo = async () => {
    try {
      const userStr = await AsyncStorage.getItem('@plansync:current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name || '');
        setAvatarColor(user.avatar_color || '#4361ee');
        setInitial((user.name?.charAt(0) || 'U').toUpperCase());
      }
      // Load notification count
      await loadNotificationCount();
    } catch (error) {}
  };

  const loadProfileImage = async () => {
    try {
      const data = await apiFetch('/profile/image');
      if (data && data.url) {
        const imageUrl = data.url + '?t=' + Date.now();
        setProfileImage(imageUrl);
        cachedProfileImage = imageUrl;
        imageLoaded = true;
      }
    } catch (error) {}
  };

  useEffect(() => {
    (global as any).refreshHeaderProfile = () => {
      imageLoaded = false;
      loadProfileImage();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch (error) {}
    await AsyncStorage.clear();
    router.replace('/');
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.headerBg, 
      borderBottomColor: colors.headerBorder 
    }]}>
      <View style={styles.leftSection}>
        <FontAwesome5 name={config.icon} size={20} color="#4361ee" />
        <Text style={[styles.title, { color: colors.text }]}>{config.title}</Text>
      </View>
      <View style={styles.rightSection}>

<TouchableOpacity 
  style={styles.iconBtn} 
  onPress={() => router.push('/reminders')}
>
  <FontAwesome5 
    name="bell" 
    size={18} 
    solid={isRemindersPage}
    color={isRemindersPage ? '#4361ee' : '#5b6b7c'} 
  />
  {notificationCount > 0 && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>
        {notificationCount > 99 ? '99+' : notificationCount}
      </Text>
    </View>
  )}
</TouchableOpacity>

        <TouchableOpacity 
          style={[styles.avatar, { backgroundColor: profileImage ? 'transparent' : avatarColor }]} 
          onPress={() => router.push('/settings')}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage, cache: 'reload' }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
          <FontAwesome5 name="sign-out-alt" size={18} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
iconBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
},
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  badge: {
  position: 'absolute',
  top: 0,
  right: -2,
  backgroundColor: '#e63946',
  width: 18,
  height: 18,
  borderRadius: 9,
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1.5,
  borderColor: '#fbfdff',
},
badgeText: {
  color: '#FFFFFF',
  fontSize: 10,
  fontWeight: '700',
},
});