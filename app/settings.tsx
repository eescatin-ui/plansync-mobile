// app/settings.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { apiFetch } from '../services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'account'>('profile');
  const [user, setUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [uploadMenuVisible, setUploadMenuVisible] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    avatarColor: '#4361ee',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [classNotifications, setClassNotifications] = useState(true);

  const avatarColors = [
    '#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#e63946',
    '#ffb300', '#28a745', '#0ea5e9',
  ];

  useEffect(() => {
    loadUser();
    loadProfileImage();
  }, []);

  const loadUser = async () => {
    try {
      const data = await apiFetch('/user');
      if (data) {
        setUser(data);
        setProfileForm({
          name: data.name || '',
          email: data.email || '',
          avatarColor: data.avatar_color || '#4361ee',
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadProfileImage = async () => {
    try {
      const data = await apiFetch('/profile/image');
      if (data && data.url) {
        setProfileImage(data.url);
      }
    } catch (error) {}
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to photos.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    setUploadMenuVisible(false);
    if (!(await requestPermission())) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setTempImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const takePhoto = async () => {
    setUploadMenuVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setTempImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const saveProfileImage = async () => {
    if (tempImage) {
      setSaving(true);
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: tempImage,
          type: 'image/jpeg',
          name: 'profile.jpg',
        } as any);
        
        const token = await AsyncStorage.getItem('@plansync:auth_token');
        const response = await fetch('http://192.168.1.85:8000/api/profile/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });
        
        const data = await response.json();
        if (data.success || data.url) {
          setProfileImage(data.url || tempImage);
          setTempImage(null);
          (global as any).refreshHeaderProfile?.();
          Alert.alert('Success', 'Profile picture saved!');
        } else {
          Alert.alert('Error', data.message || 'Failed to upload');
        }
      } catch (error: any) {
        Alert.alert('Error', 'Failed to upload image. Check server connection.');
      } finally {
        setSaving(false);
      }
    }
  };

  const removeProfileImage = () => {
    setUploadMenuVisible(false);
    Alert.alert('Remove Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch('/profile/image', { method: 'DELETE' });
            setProfileImage(null);
            (global as any).refreshHeaderProfile?.();
          } catch (error) {
            setProfileImage(null);
            (global as any).refreshHeaderProfile?.();
          }
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }
    setSaving(true);
    try {
      const updatedUser = await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email,
          avatar_color: profileForm.avatarColor,
        }),
      });
      setUser(updatedUser.user || updatedUser);
      Alert.alert('Success', 'Profile updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
          new_password_confirmation: passwordForm.confirmPassword,
        }),
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch {}
    await AsyncStorage.multiRemove([
      '@plansync:auth_token',
      '@plansync:current_user',
      '@plansync:remembered',
    ]);
    router.replace('/');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and ALL data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch('/account', { method: 'DELETE' });
              await AsyncStorage.clear();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };

  const getInitial = () => (user?.name?.charAt(0) || 'U').toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#0f172a' : '#fbfdff' }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme === 'dark' ? '#0f172a' : '#fbfdff'} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.subtitle, { color: theme === 'dark' ? '#94a3b8' : '#64748b' }]}>Manage your account and preferences</Text>

        {/* User Info Card */}
        <TouchableOpacity style={[styles.userInfoCard, { backgroundColor: theme === 'dark' ? '#1e293b' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#f0f4fc' }]} onPress={() => setUploadMenuVisible(true)}>
          <View style={[styles.userAvatar, { backgroundColor: profileImage ? 'transparent' : profileForm.avatarColor }]}>
            {profileImage ? <Image source={{ uri: profileImage }} style={styles.profileImage} /> : <Text style={styles.userAvatarText}>{getInitial()}</Text>}
            <View style={styles.cameraBadge}><FontAwesome5 name="camera" size={10} color="#FFFFFF" /></View>
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.userEmail, { color: theme === 'dark' ? '#94a3b8' : '#64748b' }]}>{user?.email || 'No email'}</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
        </TouchableOpacity>

        {/* Settings Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.settingsTabs}>
          {[{ key: 'profile', icon: 'user', label: 'Profile' }, { key: 'preferences', icon: 'palette', label: 'Preferences' }, { key: 'account', icon: 'shield-alt', label: 'Account' }].map((tab) => (
            <TouchableOpacity key={tab.key} style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]} onPress={() => setActiveTab(tab.key as any)}>
              <FontAwesome5 name={tab.icon} size={14} color={activeTab === tab.key ? '#FFFFFF' : '#64748b'} />
              <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ========== PROFILE TAB ========== */}
        {activeTab === 'profile' && (
          <View style={[styles.sectionCard, { backgroundColor: theme === 'dark' ? '#1e293b' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#f0f4fc' }]}>
            <View style={[styles.sectionTitleRow, { borderBottomColor: theme === 'dark' ? '#334155' : '#f1f5f9' }]}>
              <FontAwesome5 name="user-circle" size={16} color="#4361ee" />
              <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }]}>Profile Information</Text>
            </View>

            {/* Profile Picture */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme === 'dark' ? '#94a3b8' : '#475569' }]}><FontAwesome5 name="image" size={12} color="#64748b" /> Profile Picture</Text>
              <View style={styles.uploadArea}>
                {tempImage ? <Image source={{ uri: tempImage }} style={styles.uploadPreview} /> : profileImage ? <Image source={{ uri: profileImage }} style={styles.uploadPreview} /> : (
                  <TouchableOpacity style={styles.uploadPlaceholderFull} onPress={() => setUploadMenuVisible(true)}>
                    <FontAwesome5 name="cloud-upload-alt" size={32} color="#94a3b8" />
                    <Text style={styles.uploadText}>Tap to upload photo</Text>
                  </TouchableOpacity>
                )}
              </View>
              {tempImage && <TouchableOpacity style={styles.savePhotoBtn} onPress={saveProfileImage}><FontAwesome5 name="check-circle" size={16} color="#FFFFFF" /><Text style={styles.savePhotoText}>Save Photo</Text></TouchableOpacity>}
              {profileImage && !tempImage && (
                <View style={styles.photoActions}>
                  <TouchableOpacity style={styles.changePhotoBtn} onPress={() => setUploadMenuVisible(true)}><FontAwesome5 name="exchange-alt" size={12} color="#4361ee" /><Text style={styles.changePhotoText}>Change</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={removeProfileImage}><FontAwesome5 name="trash" size={12} color="#ef4444" /><Text style={styles.removePhotoText}>Remove</Text></TouchableOpacity>
                </View>
              )}
              {tempImage && <TouchableOpacity style={styles.cancelPhotoBtn} onPress={() => setTempImage(null)}><Text style={styles.cancelPhotoText}>Cancel</Text></TouchableOpacity>}
              {!tempImage && !profileImage && <TouchableOpacity style={styles.selectPhotoBtn} onPress={() => setUploadMenuVisible(true)}><FontAwesome5 name="camera" size={14} color="#FFFFFF" /><Text style={styles.selectPhotoText}>Select Photo</Text></TouchableOpacity>}
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme === 'dark' ? '#94a3b8' : '#475569' }]}><FontAwesome5 name="user" size={12} color="#64748b" /> Full Name</Text>
              <TextInput style={[styles.formInput, { backgroundColor: theme === 'dark' ? '#1e293b' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }]} placeholder="Your name" placeholderTextColor="#94a3b8" value={profileForm.name} onChangeText={(text) => setProfileForm(prev => ({ ...prev, name: text }))} />
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme === 'dark' ? '#94a3b8' : '#475569' }]}><FontAwesome5 name="envelope" size={12} color="#64748b" /> Email</Text>
              <TextInput style={[styles.formInput, { backgroundColor: theme === 'dark' ? '#1e293b' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }]} placeholder="Your email" placeholderTextColor="#94a3b8" value={profileForm.email} onChangeText={(text) => setProfileForm(prev => ({ ...prev, email: text }))} keyboardType="email-address" />
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: theme === 'dark' ? '#94a3b8' : '#475569' }]}><FontAwesome5 name="palette" size={12} color="#64748b" /> Avatar Color</Text>
              <View style={styles.colorPicker}>
                {avatarColors.map((color) => (
                  <TouchableOpacity key={color} style={[styles.colorCircle, { backgroundColor: color }, profileForm.avatarColor === color && styles.colorCircleActive]} onPress={() => setProfileForm(prev => ({ ...prev, avatarColor: color }))} />
                ))}
              </View>
            </View>
            <TouchableOpacity style={[styles.btnPrimary, saving && styles.btnDisabled]} onPress={handleSaveProfile} disabled={saving}>
              <FontAwesome5 name="save" size={14} color="#FFFFFF" />
              <Text style={styles.btnPrimaryText}>{saving ? 'Saving...' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========== PREFERENCES TAB ========== */}
        {activeTab === 'preferences' && (
          <>
            <View style={[styles.sectionCard, { backgroundColor: theme === 'dark' ? '#1e293b' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#f0f4fc' }]}>
              <View style={[styles.sectionTitleRow, { borderBottomColor: theme === 'dark' ? '#334155' : '#f1f5f9' }]}>
                <FontAwesome5 name="sliders-h" size={16} color="#4361ee" />
                <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }]}>Appearance</Text>
              </View>
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme === 'dark' ? '#94a3b8' : '#475569' }]}><FontAwesome5 name="moon" size={12} color="#64748b" /> Theme</Text>
                <View style={styles.themeOptions}>
                  <TouchableOpacity style={[styles.themeOption, theme === 'light' && styles.themeOptionActive]} onPress={() => { if (theme === 'dark') toggleTheme(); }}>
                    <View style={[styles.themePreview, styles.lightPreview]}><View style={styles.previewHeader} /><View style={styles.previewCardLight} /><View style={styles.previewCardLight} /></View>
                    <Text style={styles.themeLabel}><FontAwesome5 name="sun" size={12} color="#64748b" /> Light</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.themeOption, theme === 'dark' && styles.themeOptionActive]} onPress={() => { if (theme === 'light') toggleTheme(); }}>
                    <View style={[styles.themePreview, styles.darkPreview]}><View style={styles.previewHeaderDark} /><View style={styles.previewCardDark} /><View style={styles.previewCardDark} /></View>
                    <Text style={styles.themeLabel}><FontAwesome5 name="moon" size={12} color="#64748b" /> Dark</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={() => Alert.alert('Saved', 'Preferences saved!')}>
                <FontAwesome5 name="save" size={14} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Save Preferences</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.sectionCard, { backgroundColor: theme === 'dark' ? '#1e293b' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#f0f4fc' }]}>
              <View style={[styles.sectionTitleRow, { borderBottomColor: theme === 'dark' ? '#334155' : '#f1f5f9' }]}>
                <FontAwesome5 name="bell" size={16} color="#4361ee" />
                <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }]}>Notifications</Text>
              </View>
              <View style={styles.checkboxGroup}>
                {[{ icon: 'envelope', label: 'Email notifications', state: emailNotifications, setter: setEmailNotifications }, { icon: 'tasks', label: 'Task reminders', state: taskReminders, setter: setTaskReminders }, { icon: 'calendar-week', label: 'Class notifications', state: classNotifications, setter: setClassNotifications }].map((item, i) => (
                  <TouchableOpacity key={i} style={styles.checkboxRow} onPress={() => item.setter(!item.state)}>
                    <View style={[styles.checkbox, item.state && styles.checkboxChecked]}>{item.state && <FontAwesome5 name="check" size={12} color="#FFFFFF" />}</View>
                    <FontAwesome5 name={item.icon} size={14} color="#64748b" />
                    <Text style={[styles.checkboxLabel, { color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ========== ACCOUNT TAB ========== */}
        {activeTab === 'account' && (
          <>
            <View style={[styles.sectionCard, { backgroundColor: theme === 'dark' ? '#1e293b' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#f0f4fc' }]}>
              <View style={[styles.sectionTitleRow, { borderBottomColor: theme === 'dark' ? '#334155' : '#f1f5f9' }]}>
                <FontAwesome5 name="lock" size={16} color="#4361ee" />
                <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }]}>Change Password</Text>
              </View>
              {[{ label: 'Current Password', value: passwordForm.currentPassword, setter: (v: string) => setPasswordForm(p => ({ ...p, currentPassword: v })), show: showPassword, setShow: setShowPassword }, { label: 'New Password', value: passwordForm.newPassword, setter: (v: string) => setPasswordForm(p => ({ ...p, newPassword: v })), show: showNewPassword, setShow: setShowNewPassword }, { label: 'Confirm New Password', value: passwordForm.confirmPassword, setter: (v: string) => setPasswordForm(p => ({ ...p, confirmPassword: v })), show: showConfirmPassword, setShow: setShowConfirmPassword }].map((field, i) => (
                <View key={i} style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme === 'dark' ? '#94a3b8' : '#475569' }]}>{field.label}</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput style={[styles.formInput, styles.passwordInput, { backgroundColor: theme === 'dark' ? '#1e293b' : '#FFFFFF', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }]} placeholder="••••••" placeholderTextColor="#94a3b8" secureTextEntry={!field.show} value={field.value} onChangeText={field.setter} />
                    <TouchableOpacity style={styles.passwordToggle} onPress={() => field.setShow(!field.show)}>
                      <FontAwesome5 name={field.show ? 'eye-slash' : 'eye'} size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {passwordForm.newPassword ? <Text style={styles.formHint}>Must be at least 8 characters</Text> : null}
              <TouchableOpacity style={[styles.btnPrimary, saving && styles.btnDisabled]} onPress={handleChangePassword} disabled={saving}>
                <FontAwesome5 name="key" size={14} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>{saving ? 'Changing...' : 'Change Password'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dangerZone}>
              <View style={styles.dangerTitleRow}><FontAwesome5 name="exclamation-triangle" size={16} color="#dc2626" /><Text style={styles.dangerTitle}>Danger Zone</Text></View>
              <Text style={styles.dangerText}>Once you delete your account, there is no going back.</Text>
              <TouchableOpacity style={styles.btnDanger} onPress={handleDeleteAccount}><FontAwesome5 name="trash-alt" size={14} color="#FFFFFF" /><Text style={styles.btnDangerText}>Delete Account</Text></TouchableOpacity>
            </View>
            <View style={styles.logoutSection}>
              <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}><FontAwesome5 name="sign-out-alt" size={14} color="#dc2626" /><Text style={styles.btnLogoutText}>Logout</Text></TouchableOpacity>
            </View>
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={uploadMenuVisible} animationType="fade" transparent>
        <TouchableOpacity style={styles.uploadModalOverlay} onPress={() => setUploadMenuVisible(false)} activeOpacity={1}>
          <View style={styles.uploadMenuContainer}>
            <Text style={styles.uploadMenuTitle}>Profile Photo</Text>
            <TouchableOpacity style={styles.uploadMenuItem} onPress={pickImage}><FontAwesome5 name="images" size={18} color="#4361ee" /><Text style={styles.uploadMenuItemText}>Choose from Gallery</Text></TouchableOpacity>
            <TouchableOpacity style={styles.uploadMenuItem} onPress={takePhoto}><FontAwesome5 name="camera" size={18} color="#4361ee" /><Text style={styles.uploadMenuItemText}>Take a Photo</Text></TouchableOpacity>
            {profileImage && <TouchableOpacity style={styles.uploadMenuItem} onPress={removeProfileImage}><FontAwesome5 name="trash" size={18} color="#ef4444" /><Text style={[styles.uploadMenuItemText, { color: '#ef4444' }]}>Remove Photo</Text></TouchableOpacity>}
            <TouchableOpacity style={styles.uploadMenuCancel} onPress={() => setUploadMenuVisible(false)}><Text style={styles.uploadMenuCancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  subtitle: { fontSize: 13, marginBottom: 16, marginTop: 8 },
  userInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 20 },
  userAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '600' },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 13 },
  profileImage: { width: 56, height: 56, borderRadius: 28 },
  cameraBadge: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#4361ee', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  settingsTabs: { flexDirection: 'row', gap: 6, marginBottom: 20, paddingBottom: 4 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 30 },
  tabBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  tabBtnText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  tabBtnTextActive: { color: '#FFFFFF' },
  sectionCard: { borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  formGroup: { marginBottom: 18 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  formInput: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  formHint: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  uploadArea: { borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, height: 120, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#f8fafc' },
  uploadPreview: { width: '100%', height: '100%', borderRadius: 14 },
  uploadPlaceholderFull: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  uploadText: { fontSize: 13, color: '#94a3b8', marginTop: 8, fontWeight: '500' },
  savePhotoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#28a745', paddingVertical: 14, borderRadius: 14, marginTop: 12 },
  savePhotoText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  photoActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#eef2ff', borderRadius: 10 },
  changePhotoText: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
  removePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fee2e2', borderRadius: 10 },
  removePhotoText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  cancelPhotoBtn: { alignSelf: 'center', marginTop: 8, paddingVertical: 8 },
  cancelPhotoText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  selectPhotoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4361ee', paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  selectPhotoText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: 'transparent' },
  colorCircleActive: { borderColor: '#1e293b', transform: [{ scale: 1.1 }] },
  themeOptions: { flexDirection: 'row', gap: 12 },
  themeOption: { flex: 1, alignItems: 'center' },
  themeOptionActive: {},
  themePreview: { width: '100%', height: 90, borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', marginBottom: 8 },
  lightPreview: { backgroundColor: '#f8fafc' },
  darkPreview: { backgroundColor: '#1e1e2e' },
  previewHeader: { height: 22, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  previewHeaderDark: { height: 22, backgroundColor: '#2d2d44', borderBottomWidth: 1, borderBottomColor: '#3d3d5c' },
  previewCardLight: { height: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginHorizontal: 10, marginTop: 8 },
  previewCardDark: { height: 16, backgroundColor: '#2d2d44', borderWidth: 1, borderColor: '#3d3d5c', borderRadius: 8, marginHorizontal: 10, marginTop: 8 },
  themeLabel: { fontSize: 13, fontWeight: '500', color: '#475569' },
  checkboxGroup: { flexDirection: 'column', gap: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  checkboxLabel: { fontSize: 14 },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  passwordToggle: { position: 'absolute', right: 14, top: 14 },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4361ee', paddingVertical: 12, borderRadius: 30, marginTop: 8 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  dangerZone: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca', borderRadius: 20, padding: 18, marginTop: 8 },
  dangerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dangerTitle: { fontSize: 16, fontWeight: '700', color: '#dc2626' },
  dangerText: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  btnDanger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dc2626', paddingVertical: 12, borderRadius: 30 },
  btnDangerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  logoutSection: { marginTop: 16 },
  btnLogout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#fee2e2', paddingVertical: 12, borderRadius: 30 },
  btnLogoutText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  uploadModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  uploadMenuContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  uploadMenuTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 20 },
  uploadMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  uploadMenuItemText: { fontSize: 16, color: '#1e293b', fontWeight: '500' },
  uploadMenuCancel: { marginTop: 12, paddingVertical: 14, backgroundColor: '#f1f5f9', borderRadius: 14, alignItems: 'center' },
  uploadMenuCancelText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
});