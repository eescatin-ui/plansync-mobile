import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { apiFetch } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadRememberedCredentials();
  }, []);

  const loadRememberedCredentials = async () => {
    try {
      const saved = await AsyncStorage.getItem('@plansync:remembered');
      if (saved) {
        const credentials = JSON.parse(saved);
        setEmail(credentials.email);
        setPassword(credentials.password);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading remembered credentials:', error);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');
    
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);
    
    try {
      // Call Laravel API directly
      const data = await apiFetch('/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      // Save token
      await AsyncStorage.setItem('@plansync:auth_token', data.token);
      
      // Save user data
      await AsyncStorage.setItem('@plansync:current_user', JSON.stringify(data.user));

      // Handle remember me
      if (rememberMe) {
        await AsyncStorage.setItem('@plansync:remembered', JSON.stringify({
          email: email.trim(),
          password: password,
        }));
      } else {
        await AsyncStorage.removeItem('@plansync:remembered');
      }

      // Navigate to dashboard
      router.replace('/dashboard');
    } catch (error: any) {
      setErrorMessage(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.logoRow}>
                <FontAwesome5 name="calendar-alt" size={32} color="#4361ee" />
                <Text style={styles.appName}>PlanSync</Text>
              </View>
              <Text style={styles.tagline}>Your Academic Companion</Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorAlert}>
                <FontAwesome5 name="exclamation-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Email Address</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <FontAwesome5 name="envelope" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <FontAwesome5 name="lock" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    disabled={loading}
                  >
                    <FontAwesome5 
                      name={showPassword ? "eye-slash" : "eye"} 
                      size={16} 
                      color="#94a3b8" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  disabled={loading}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberText}>Remember me</Text>
                </TouchableOpacity>
                
                <TouchableOpacity disabled={loading}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <FontAwesome5 name="sign-in-alt" size={18} color="#FFFFFF" />
                )}
                <Text style={styles.buttonText}>
                  {loading ? 'Logging in...' : 'Log In'}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don&apos;t have an account? </Text>
                <Link href="/register" asChild>
                  <Text style={styles.footerLink}>Create Account</Text>
                </Link>
              </View>
            </View>

            <TouchableOpacity style={styles.adminButton} activeOpacity={0.7}>
              <FontAwesome5 name="shield-alt" size={16} color="#475569" />
              <Text style={styles.adminText}>Administrator Access</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ... keep all your existing styles the same ...
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.1, shadowRadius: 40, elevation: 10 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  appName: { fontSize: 28, fontWeight: '700', color: '#1e293b', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  errorAlert: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 12, padding: 16, marginBottom: 24, gap: 8 },
  errorText: { flex: 1, color: '#dc2626', fontSize: 14, fontWeight: '500' },
  form: { gap: 0 },
  formGroup: { marginBottom: 24 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 1 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 14, paddingLeft: 44, paddingRight: 50, fontSize: 15, color: '#1e293b' },
  eyeButton: { position: 'absolute', right: 16, padding: 4 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  rememberContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  rememberText: { fontSize: 14, color: '#475569' },
  forgotText: { fontSize: 14, color: '#4361ee', fontWeight: '600' },
  submitButton: { backgroundColor: '#4361ee', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 24, shadowColor: '#4361ee', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 24, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  footerText: { fontSize: 14, color: '#64748b' },
  footerLink: { fontSize: 14, color: '#4361ee', fontWeight: '600' },
  adminButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#f1f5f9', borderRadius: 30, alignSelf: 'center' },
  adminText: { fontSize: 13, color: '#475569', fontWeight: '500' },
});