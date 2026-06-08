import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const TEAL = '#1A6B5A';
const TEAL_LIGHT = '#E8F4F1';
const GRAY_LIGHT = '#EFEFEA';
const GRAY_TEXT = '#ABABAB';
const TEXT_DARK = '#1A1A1A';

const API_URL = 'http://192.168.1.126:5000';

export default function DriverSignup() {
  const [form, setForm] = useState({
    username: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    dob: '2000-01-01',
    gender: 'Male',
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSignup = async () => {
    if (!form.username || !form.mobile || !form.password || !form.fullName) {
      Alert.alert('Error', 'Sab fields fill karo');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords match nahi kar rahe');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          mobile: form.mobile,
          password: form.password,
          role: 'rider',
          fullName: form.fullName,
          dob: form.dob,
          gender: form.gender,
        }),
      });
      const data = await res.json();
      console.log('[DriverSignup]', data);

      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('role', data.role);
        router.replace('/driver/home');
      } else {
        Alert.alert('Error', data.error ?? 'Signup failed');
      }
    } catch (err) {
      Alert.alert('Error', 'Server se connect nahi ho paya');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>🚴</Text>
        </View>
        <Text style={styles.title}>Driver Signup</Text>
        <Text style={styles.subtitle}>KORA Partner App</Text>

        {[
          { label: 'Full Name', key: 'fullName', placeholder: 'Enter full name' },
          { label: 'Username', key: 'username', placeholder: 'Choose username' },
          { label: 'Mobile Number', key: 'mobile', placeholder: '10 digit mobile', keyboard: 'phone-pad' },
          { label: 'Password', key: 'password', placeholder: 'Min 6 characters', secure: true },
          { label: 'Confirm Password', key: 'confirmPassword', placeholder: 'Re-enter password', secure: true },
        ].map(field => (
          <View key={field.key} style={styles.inputWrap}>
            <Text style={styles.inputLabel}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor={GRAY_TEXT}
              secureTextEntry={field.secure}
              keyboardType={field.keyboard as any ?? 'default'}
              value={form[field.key as keyof typeof form]}
              onChangeText={v => update(field.key, v)}
            />
          </View>
        ))}

        <TouchableOpacity
          style={styles.btn}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Create Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/driver/login')}>
          <Text style={styles.loginLink}>Already have an account? <Text style={{ color: TEAL, fontWeight: '700' }}>Login</Text></Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: GRAY_LIGHT },
  container: { padding: 24, gap: 14, paddingBottom: 40 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: TEAL_LIGHT, alignItems: 'center',
    justifyContent: 'center', alignSelf: 'center', marginTop: 16,
  },
  iconText: { fontSize: 32 },
  title: { fontSize: 24, fontWeight: '800', color: TEXT_DARK, textAlign: 'center' },
  subtitle: { fontSize: 13, color: GRAY_TEXT, textAlign: 'center', marginTop: -8 },
  inputWrap: { gap: 5 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 15, color: TEXT_DARK, borderWidth: 1, borderColor: '#E0E0DA',
  },
  btn: {
    backgroundColor: TEAL, borderRadius: 30,
    paddingVertical: 16, alignItems: 'center', marginTop: 4, elevation: 3,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { textAlign: 'center', color: GRAY_TEXT, fontSize: 14, marginTop: 4 },
});