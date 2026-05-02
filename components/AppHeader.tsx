// components/AppHeader.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { userStorage } from '../services/userStorage';

type AppHeaderProps = {
  title: string;
  icon: string;
};

export default function AppHeader({ title, icon }: AppHeaderProps) {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#4361ee');
  const [initial, setInitial] = useState('U');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    loadUserInfo();
    loadProfileImage();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await userStorage.getCurrentUser();
      if (user) {
        setUserName(user.name || '');
        setAvatarColor(user.avatar_color || '#4361ee');
        setInitial((user.name?.charAt(0) || 'U').toUpperCase());
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadProfileImage = async () => {
    try {
      const savedImage = await userStorage.getProfileImage();
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const handleLogout = async () => {
    await userStorage.clearAll();
    router.replace('/');
  };

  const handleNotifications = () => {
    router.push('/reminders');
  };

  const handleProfile = () => {
    router.push('/settings');
  };

  return (
    <View style={styles.container}>
      {/* Left side - Logo and Title */}
      <View style={styles.leftSection}>
        <FontAwesome5 name={icon} size={20} color="#4361ee" />
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* Right side - Actions */}
      <View style={styles.rightSection}>
        {/* Notification Bell */}
        <TouchableOpacity style={styles.iconBtn} onPress={handleNotifications}>
          <FontAwesome5 name="bell" size={18} color="#5b6b7c" />
        </TouchableOpacity>
        
        {/* Profile Avatar with Picture */}
        <TouchableOpacity 
          style={[styles.avatar, { backgroundColor: profileImage ? 'transparent' : avatarColor }]} 
          onPress={handleProfile}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </TouchableOpacity>
        
        {/* Logout - Icon Only */}
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
    backgroundColor: '#fbfdff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
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
});