import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, StatusBar, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import axios from 'axios';

const TEAL = '#1A6B5A';
const TEAL_LIGHT = '#E8F4F1';
const GRAY_LIGHT = '#EFEFEA';
const GRAY_TEXT = '#ABABAB';
const TEXT_DARK = '#1A1A1A';

const API_URL = 'http://192.168.1.48:5000/api';

export default function DriverSignup() {
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    email: '',
    dob: '',
    gender: 'Male',
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSignup = async () => {
    if (!form.fullName || !form.mobile || !form.email || !form.password || !form.dob) {
      Alert.alert('Error', 'Sab fields bharein');
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords match nahi kar rahe');
      return;
    }
    if (form.mobile.length !== 10) {
      Alert.alert('Error', '10 digit mobile number bharein');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/riders/auth/register`, {
        fullName: form.fullName,
        mobile: form.mobile,
        email: form.email,
        password: form.password,
        dob: form.dob,
        gender: form.gender,
      });

      console.log('Signup response:', res.data);
      Alert.alert('Success', 'Account bana! Ab login karo', [
        { text: 'OK', onPress: () => router.replace('/driver/login') }
      ]);
    } catch (err: any) {
      console.log('Signup error:', err?.response?.data);
      Alert.alert('Error', err?.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>🚴</Text>
        </View>
        <Text style={styles.title}>Driver Signup</Text>
        <Text style={styles.subtitle}>KORA Partner App</Text>

     
        {/* Full Name */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor={GRAY_TEXT}
            value={form.fullName}
            onChangeText={v => update('fullName', v)}
          />
        </View>
        {/* Email */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email address"
            placeholderTextColor={GRAY_TEXT}
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={v => update('email', v)}
          />
        </View>

        {/* Mobile */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="10 digit mobile"
            placeholderTextColor={GRAY_TEXT}
            keyboardType="phone-pad"
            maxLength={10}
            value={form.mobile}
            onChangeText={v => update('mobile', v)}
          />
        </View>

        {/* DOB */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Date of Birth (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1998-05-20"
            placeholderTextColor={GRAY_TEXT}
            value={form.dob}
            onChangeText={v => update('dob', v)}
          />
        </View>

        {/* Gender */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, form.gender === g && styles.genderBtnActive]}
                onPress={() => update('gender', g)}
              >
                <Text style={[styles.genderText, form.gender === g && styles.genderTextActive]}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Password */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min 6 characters"
            placeholderTextColor={GRAY_TEXT}
            secureTextEntry
            value={form.password}
            onChangeText={v => update('password', v)}
          />
        </View>

        {/* Confirm Password */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={GRAY_TEXT}
            secureTextEntry
            value={form.confirmPassword}
            onChangeText={v => update('confirmPassword', v)}
          />
        </View>

        {/* Signup Button */}
        <TouchableOpacity
          style={styles.signupBtn}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.signupBtnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/driver/login')}>
          <Text style={styles.loginLink}>
            Already have account? <Text style={{ color: TEAL, fontWeight: '700' }}>Login</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: GRAY_LIGHT },
  container: { padding: 24, gap: 16, paddingBottom: 40 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: TEAL_LIGHT, alignItems: 'center',
    justifyContent: 'center', alignSelf: 'center', marginBottom: 8,
  },
  iconText: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: '800', color: TEXT_DARK, textAlign: 'center' },
  subtitle: { fontSize: 14, color: GRAY_TEXT, textAlign: 'center', marginTop: -8 },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    fontSize: 15, color: TEXT_DARK,
    borderWidth: 1, borderColor: '#E0E0DA',
  },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0DA',
    backgroundColor: '#fff', alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: TEAL, borderColor: TEAL },
  genderText: { fontSize: 14, fontWeight: '600', color: TEXT_DARK },
  genderTextActive: { color: '#fff' },
  signupBtn: {
    backgroundColor: TEAL, borderRadius: 30,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 8, elevation: 3,
  },
  signupBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loginLink: { textAlign: 'center', color: GRAY_TEXT, fontSize: 14, marginTop: 8 },
});