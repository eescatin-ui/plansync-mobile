// app/settings.tsx
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  GestureResponderEvent,
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
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import { apiFetch } from '../services/api';
import { userStorage } from '../services/userStorage';

export default function SettingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'account'>('profile');
  const [user, setUser] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [uploadMenuVisible, setUploadMenuVisible] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    avatarColor: '#4361ee',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
      const savedImage = await userStorage.getProfileImage();
      if (savedImage) {
        setProfileImage(savedImage);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  // ========== IMAGE PICKER ==========
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to upload a profile picture.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    setUploadMenuVisible(false);
    const hasPermission = await requestPermission();
    if (!hasPermission) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        await userStorage.saveProfileImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const takePhoto = async () => {
    setUploadMenuVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take a photo.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        await userStorage.saveProfileImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to take photo.');
    }
  };

  const removeProfileImage = () => {
    setUploadMenuVisible(false);
    Alert.alert('Remove Photo', 'Are you sure you want to remove your profile picture?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setProfileImage(null);
          await userStorage.saveProfileImage('');
        },
      },
    ]);
  };

  const saveProfileImage = async () => {
    if (tempImage) {
      setProfileImage(tempImage);
      await userStorage.saveProfileImage(tempImage);
      setTempImage(null);
    }
  };

  // ========== PROFILE ==========
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
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // ========== PASSWORD ==========
const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters.');
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
      Alert.alert('Success', 'Password changed successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  // ========== ACCOUNT ACTIONS ==========
const handleLogout = async () => {
    try {
      await apiFetch('/logout', { method: 'POST' });
    } catch (error) {
      // Ignore logout errors
    }
    await AsyncStorage.clear();
    router.replace('/');
  };
  const getInitial = () => {
    return (user?.name?.charAt(0) || 'U').toUpperCase();
  };

  function handleDeleteAccount(event: GestureResponderEvent): void {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiFetch('/delete-account', { method: 'DELETE' });
              await AsyncStorage.clear();
              router.replace('/');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account.');
            }
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbfdff" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader title="Settings" icon="cog" />

        {/* Subtitle */}
        <Text style={styles.subtitle}>Manage your account and preferences</Text>

        {/* User Info Card */}
        <TouchableOpacity style={styles.userInfoCard} onPress={() => setUploadMenuVisible(true)}>
          <View style={[styles.userAvatar, { backgroundColor: profileImage ? 'transparent' : profileForm.avatarColor }]}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Text style={styles.userAvatarText}>{getInitial()}</Text>
            )}
            <View style={styles.cameraBadge}>
              <FontAwesome5 name="camera" size={10} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
          </View>
          <FontAwesome5 name="chevron-right" size={14} color="#cbd5e1" />
        </TouchableOpacity>

        {/* Settings Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.settingsTabs}>
          {[
            { key: 'profile', icon: 'user', label: 'Profile' },
            { key: 'preferences', icon: 'palette', label: 'Preferences' },
            { key: 'account', icon: 'shield-alt', label: 'Account' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <FontAwesome5 name={tab.icon} size={14} color={activeTab === tab.key ? '#FFFFFF' : '#64748b'} />
              <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ========== PROFILE TAB ========== */}
        {activeTab === 'profile' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <FontAwesome5 name="user-circle" size={16} color="#4361ee" />
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>

{/* Profile Picture */}
<View style={styles.formGroup}>
  <Text style={styles.formLabel}><FontAwesome5 name="image" size={12} color="#64748b" /> Profile Picture</Text>
  
  {/* Show image preview */}
  <View style={styles.uploadArea}>
    {tempImage ? (
      <Image source={{ uri: tempImage }} style={styles.uploadPreview} />
    ) : profileImage ? (
      <Image source={{ uri: profileImage }} style={styles.uploadPreview} />
    ) : (
      <TouchableOpacity style={styles.uploadPlaceholderFull} onPress={() => setUploadMenuVisible(true)}>
        <FontAwesome5 name="cloud-upload-alt" size={32} color="#94a3b8" />
        <Text style={styles.uploadText}>Tap to upload photo</Text>
      </TouchableOpacity>
    )}
  </View>
  
  {/* Show SAVE button when tempImage exists (after picking) */}
  {tempImage && (
    <TouchableOpacity style={styles.savePhotoBtn} onPress={saveProfileImage}>
      <FontAwesome5 name="check-circle" size={16} color="#FFFFFF" />
      <Text style={styles.savePhotoText}>Save Photo</Text>
    </TouchableOpacity>
  )}
  
  {/* Show Change/Remove buttons when image is saved */}
  {profileImage && !tempImage && (
    <View style={styles.photoActions}>
      <TouchableOpacity style={styles.changePhotoBtn} onPress={() => setUploadMenuVisible(true)}>
        <FontAwesome5 name="exchange-alt" size={12} color="#4361ee" />
        <Text style={styles.changePhotoText}>Change Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.removePhotoBtn} onPress={removeProfileImage}>
        <FontAwesome5 name="trash" size={12} color="#ef4444" />
        <Text style={styles.removePhotoText}>Remove Photo</Text>
      </TouchableOpacity>
    </View>
  )}
  
  {/* Cancel button when temp image is being previewed */}
  {tempImage && (
    <TouchableOpacity style={styles.cancelPhotoBtn} onPress={() => setTempImage(null)}>
      <Text style={styles.cancelPhotoText}>Cancel</Text>
    </TouchableOpacity>
  )}
  
  {/* Upload button when no image at all */}
  {!tempImage && !profileImage && (
    <TouchableOpacity style={styles.selectPhotoBtn} onPress={() => setUploadMenuVisible(true)}>
      <FontAwesome5 name="camera" size={14} color="#FFFFFF" />
      <Text style={styles.selectPhotoText}>Select Photo</Text>
    </TouchableOpacity>
  )}
</View> 

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}><FontAwesome5 name="user" size={12} color="#64748b" /> Full Name</Text>
              <TextInput style={styles.formInput} placeholder="Your name" placeholderTextColor="#94a3b8" value={profileForm.name} onChangeText={(text) => setProfileForm(prev => ({ ...prev, name: text }))} />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}><FontAwesome5 name="envelope" size={12} color="#64748b" /> Email Address</Text>
              <TextInput style={styles.formInput} placeholder="Your email" placeholderTextColor="#94a3b8" value={profileForm.email} onChangeText={(text) => setProfileForm(prev => ({ ...prev, email: text }))} keyboardType="email-address" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}><FontAwesome5 name="palette" size={12} color="#64748b" /> Avatar Color</Text>
              <View style={styles.colorPicker}>
                {avatarColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorCircle, { backgroundColor: color }, profileForm.avatarColor === color && styles.colorCircleActive]}
                    onPress={() => setProfileForm(prev => ({ ...prev, avatarColor: color }))}
                  />
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
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <FontAwesome5 name="sliders-h" size={16} color="#4361ee" />
                <Text style={styles.sectionTitle}>Appearance</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}><FontAwesome5 name="moon" size={12} color="#64748b" /> Theme</Text>
                <View style={styles.themeOptions}>
                  <TouchableOpacity
                    style={[styles.themeOption, theme === 'light' && styles.themeOptionActive]}
                    onPress={() => setTheme('light')}
                  >
                    <View style={[styles.themePreview, styles.lightPreview]}>
                      <View style={styles.previewHeader} />
                      <View style={styles.previewCardLight} />
                      <View style={styles.previewCardLight} />
                    </View>
                    <Text style={styles.themeLabel}><FontAwesome5 name="sun" size={12} color="#64748b" /> Light</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.themeOption, theme === 'dark' && styles.themeOptionActive]}
                    onPress={() => setTheme('dark')}
                  >
                    <View style={[styles.themePreview, styles.darkPreview]}>
                      <View style={styles.previewHeaderDark} />
                      <View style={styles.previewCardDark} />
                      <View style={styles.previewCardDark} />
                    </View>
                    <Text style={styles.themeLabel}><FontAwesome5 name="moon" size={12} color="#64748b" /> Dark</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.btnPrimary}>
                <FontAwesome5 name="save" size={14} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>Save Preferences</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <FontAwesome5 name="bell" size={16} color="#4361ee" />
                <Text style={styles.sectionTitle}>Notifications</Text>
              </View>

              <View style={styles.checkboxGroup}>
                <TouchableOpacity style={styles.checkboxRow} onPress={() => setEmailNotifications(!emailNotifications)}>
                  <View style={[styles.checkbox, emailNotifications && styles.checkboxChecked]}>
                    {emailNotifications && <FontAwesome5 name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <FontAwesome5 name="envelope" size={14} color="#64748b" />
                  <Text style={styles.checkboxLabel}>Email notifications</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkboxRow} onPress={() => setTaskReminders(!taskReminders)}>
                  <View style={[styles.checkbox, taskReminders && styles.checkboxChecked]}>
                    {taskReminders && <FontAwesome5 name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <FontAwesome5 name="tasks" size={14} color="#64748b" />
                  <Text style={styles.checkboxLabel}>Task reminders</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkboxRow} onPress={() => setClassNotifications(!classNotifications)}>
                  <View style={[styles.checkbox, classNotifications && styles.checkboxChecked]}>
                    {classNotifications && <FontAwesome5 name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <FontAwesome5 name="calendar-week" size={14} color="#64748b" />
                  <Text style={styles.checkboxLabel}>Class notifications</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ========== ACCOUNT TAB ========== */}
        {activeTab === 'account' && (
          <>
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <FontAwesome5 name="lock" size={16} color="#4361ee" />
                <Text style={styles.sectionTitle}>Change Password</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Current Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput style={[styles.formInput, styles.passwordInput]} placeholder="Enter current password" placeholderTextColor="#94a3b8" secureTextEntry={!showPassword} value={passwordForm.currentPassword} onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))} />
                  <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                    <FontAwesome5 name={showPassword ? 'eye-slash' : 'eye'} size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput style={[styles.formInput, styles.passwordInput]} placeholder="Enter new password" placeholderTextColor="#94a3b8" secureTextEntry={!showNewPassword} value={passwordForm.newPassword} onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))} />
                  <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowNewPassword(!showNewPassword)}>
                    <FontAwesome5 name={showNewPassword ? 'eye-slash' : 'eye'} size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.formHint}>Must be at least 8 characters</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Confirm New Password</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput style={[styles.formInput, styles.passwordInput]} placeholder="Confirm new password" placeholderTextColor="#94a3b8" secureTextEntry={!showConfirmPassword} value={passwordForm.confirmPassword} onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))} />
                  <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <FontAwesome5 name={showConfirmPassword ? 'eye-slash' : 'eye'} size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={[styles.btnPrimary, saving && styles.btnDisabled]} onPress={handleChangePassword} disabled={saving}>
                <FontAwesome5 name="key" size={14} color="#FFFFFF" />
                <Text style={styles.btnPrimaryText}>{saving ? 'Changing...' : 'Change Password'}</Text>
              </TouchableOpacity>
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerZone}>
              <View style={styles.dangerTitleRow}>
                <FontAwesome5 name="exclamation-triangle" size={16} color="#dc2626" />
                <Text style={styles.dangerTitle}>Danger Zone</Text>
              </View>
              <Text style={styles.dangerText}>Once you delete your account, there is no going back. Please be certain.</Text>
              <TouchableOpacity style={styles.btnDanger} onPress={handleDeleteAccount}>
                <FontAwesome5 name="trash-alt" size={14} color="#FFFFFF" />
                <Text style={styles.btnDangerText}>Delete Account</Text>
              </TouchableOpacity>
            </View>

            {/* Logout */}
            <View style={styles.logoutSection}>
              <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
                <FontAwesome5 name="sign-out-alt" size={14} color="#dc2626" />
                <Text style={styles.btnLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload Menu Modal */}
      <Modal visible={uploadMenuVisible} animationType="fade" transparent>
        <TouchableOpacity style={styles.uploadModalOverlay} onPress={() => setUploadMenuVisible(false)} activeOpacity={1}>
          <View style={styles.uploadMenuContainer}>
            <Text style={styles.uploadMenuTitle}>Profile Photo</Text>
            
            <TouchableOpacity style={styles.uploadMenuItem} onPress={pickImage}>
              <FontAwesome5 name="images" size={18} color="#4361ee" />
              <Text style={styles.uploadMenuItemText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.uploadMenuItem} onPress={takePhoto}>
              <FontAwesome5 name="camera" size={18} color="#4361ee" />
              <Text style={styles.uploadMenuItemText}>Take a Photo</Text>
            </TouchableOpacity>
            
            {profileImage && (
              <TouchableOpacity style={styles.uploadMenuItem} onPress={removeProfileImage}>
                <FontAwesome5 name="trash" size={18} color="#ef4444" />
                <Text style={[styles.uploadMenuItemText, { color: '#ef4444' }]}>Remove Photo</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.uploadMenuCancel} onPress={() => setUploadMenuVisible(false)}>
              <Text style={styles.uploadMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fbfdff' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  subtitle: { color: '#64748b', fontSize: 13, marginBottom: 16, marginTop: 8 },
  
  // User info card
  userInfoCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#f0f4fc', marginBottom: 20 },
  userAvatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { color: '#FFFFFF', fontSize: 24, fontWeight: '600' },
  userDetails: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  userEmail: { fontSize: 13, color: '#64748b' },
  
  // Profile image
  profileImage: { width: 56, height: 56, borderRadius: 28 },
  cameraBadge: { 
    position: 'absolute', bottom: -2, right: -2, 
    backgroundColor: '#4361ee', width: 22, height: 22, 
    borderRadius: 11, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  
  // Tabs
  settingsTabs: { flexDirection: 'row', gap: 6, marginBottom: 20, paddingBottom: 4 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 30 },
  tabBtnActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  tabBtnText: { fontSize: 14, fontWeight: '500', color: '#64748b' },
  tabBtnTextActive: { color: '#FFFFFF' },
  
  // Section card
  sectionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: '#f0f4fc' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  
  // Form
  formGroup: { marginBottom: 18 },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  formInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1e293b', backgroundColor: '#FFFFFF' },
  formHint: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  
  // Upload
  uploadArea: { borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', borderRadius: 16, height: 120, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: '#f8fafc' },
  uploadPreview: { width: '100%', height: '100%', borderRadius: 14 },
  uploadPlaceholder: { alignItems: 'center' },
  uploadText: { fontSize: 13, color: '#94a3b8', marginTop: 8, fontWeight: '500' },
  
  // Color picker
  colorPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  colorCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: 'transparent' },
  colorCircleActive: { borderColor: '#1e293b', transform: [{ scale: 1.1 }] },
  
  // Theme
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
  
  // Checkboxes
  checkboxGroup: { flexDirection: 'column', gap: 12 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  checkboxLabel: { fontSize: 14, color: '#1e293b' },
  
  // Password
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 44 },
  passwordToggle: { position: 'absolute', right: 14, top: 14 },
  
  // Buttons
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#4361ee', paddingVertical: 12, borderRadius: 30, marginTop: 8 },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  
  // Danger zone
  dangerZone: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca', borderRadius: 20, padding: 18, marginTop: 8 },
  dangerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dangerTitle: { fontSize: 16, fontWeight: '700', color: '#dc2626' },
  dangerText: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  btnDanger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#dc2626', paddingVertical: 12, borderRadius: 30 },
  btnDangerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  
  // Logout
  logoutSection: { marginTop: 16 },
  btnLogout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#fee2e2', paddingVertical: 12, borderRadius: 30 },
  btnLogoutText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  
  // Upload menu modal
  uploadModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  uploadMenuContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  uploadMenuTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 20 },
  uploadMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  uploadMenuItemText: { fontSize: 16, color: '#1e293b', fontWeight: '500' },
  uploadMenuCancel: { marginTop: 12, paddingVertical: 14, backgroundColor: '#f1f5f9', borderRadius: 14, alignItems: 'center' },
  uploadMenuCancelText: { fontSize: 16, fontWeight: '600', color: '#64748b' },
  uploadPlaceholderFull: { flex: 1, justifyContent: 'center', alignItems: 'center' },
savePhotoBtn: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  backgroundColor: '#28a745', paddingVertical: 14, borderRadius: 14, marginTop: 12,
},
savePhotoText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
photoActions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 12 },
changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#eef2ff', borderRadius: 10 },
changePhotoText: { fontSize: 13, color: '#4361ee', fontWeight: '600' },
removePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fee2e2', borderRadius: 10 },
removePhotoText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
cancelPhotoBtn: { alignSelf: 'center', marginTop: 8, paddingVertical: 8 },
cancelPhotoText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
selectPhotoBtn: {
  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  backgroundColor: '#4361ee', paddingVertical: 12, borderRadius: 14, marginTop: 8,
},
selectPhotoText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

});