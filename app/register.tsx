import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { apiFetch } from '../services/api';

type FormData = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  terms: boolean;
};

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    terms: false,
  });

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleRegister = async () => {
    setLoading(true);
    setErrorMessage('');

    if (!form.name.trim()) {
      setErrorMessage('Please enter your full name');
      setLoading(false);
      return;
    }

    if (!form.email.trim()) {
      setErrorMessage('Please enter your email address');
      setLoading(false);
      return;
    }

    if (form.password !== form.password_confirmation) {
      setErrorMessage('Passwords do not match!');
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long!');
      setLoading(false);
      return;
    }

    if (!form.terms) {
      setErrorMessage('You must agree to the Terms of Service');
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch('/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          password_confirmation: form.password_confirmation,
        }),
      });

      await AsyncStorage.setItem('@plansync:auth_token', data.token);
      await AsyncStorage.setItem('@plansync:current_user', JSON.stringify(data.user));

      Alert.alert(
        'Success',
        'Account created successfully!',
        [{ text: 'OK', onPress: () => router.replace('/dashboard') }]
      );
    } catch (error: any) {
      setErrorMessage(error.message || 'Registration failed. Please try again.');
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
              <Text style={styles.tagline}>Start your academic journey</Text>
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
                  <Text style={styles.label}>Full Name</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <FontAwesome5 name="user" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John Smith"
                    placeholderTextColor="#94a3b8"
                    value={form.name}
                    onChangeText={(text) => updateForm('name', text)}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>
              </View>

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
                    value={form.email}
                    onChangeText={(text) => updateForm('email', text)}
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
                    placeholder="Create a password"
                    placeholderTextColor="#94a3b8"
                    value={form.password}
                    onChangeText={(text) => updateForm('password', text)}
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
                <Text style={styles.helpText}>Password must be at least 8 characters</Text>
              </View>

              <View style={styles.formGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Confirm Password</Text>
                </View>
                <View style={styles.inputWrapper}>
                  <FontAwesome5 name="check-circle" size={16} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#94a3b8"
                    value={form.password_confirmation}
                    onChangeText={(text) => updateForm('password_confirmation', text)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                    disabled={loading}
                  >
                    <FontAwesome5 
                      name={showConfirmPassword ? "eye-slash" : "eye"} 
                      size={16} 
                      color="#94a3b8" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => updateForm('terms', !form.terms)}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, form.terms && styles.checkboxChecked]}>
                    {form.terms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.termsLink}>Terms of Service</Text>
                    {' '}and{' '}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <FontAwesome5 name="user-plus" size={18} color="#FFFFFF" />
                )}
                <Text style={styles.buttonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <Link href="/" asChild>
                  <Text style={styles.footerLink}>Log In</Text>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

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
  helpText: { fontSize: 12, color: '#64748b', marginTop: 6, marginLeft: 4 },
  termsContainer: { marginBottom: 24 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#cbd5e1', justifyContent: 'center', alignItems: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  checkmark: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  termsText: { flex: 1, fontSize: 13, color: '#475569', lineHeight: 18 },
  termsLink: { color: '#4361ee', fontWeight: '600' },
  submitButton: { backgroundColor: '#4361ee', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 24, shadowColor: '#4361ee', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 24, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  footerText: { fontSize: 14, color: '#64748b' },
  footerLink: { fontSize: 14, color: '#4361ee', fontWeight: '600' },
});