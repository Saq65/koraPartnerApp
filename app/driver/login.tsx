import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, StatusBar
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

export default function DriverLogin() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!mobile || !password) {
      Alert.alert('Error', 'Mobile aur password dono required hain');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/riders/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      });
      const data = await res.json();
      console.log('[RiderLogin]', data);

      if (data.success) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('rider', JSON.stringify(data.rider));
        router.replace('/driver/home');
      } else {
        Alert.alert('Error', data.message ?? 'Login failed');
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
      <View style={styles.container}>

        {/* Icon */}
        <View style={styles.iconWrap}>
          <Text style={styles.iconText}>🚴</Text>
        </View>

        <Text style={styles.title}>Driver Login</Text>
        <Text style={styles.subtitle}>KORA Partner App</Text>

        {/* Mobile */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter mobile number"
            placeholderTextColor={GRAY_TEXT}
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrap}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor={GRAY_TEXT}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.loginBtnText}>Login</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/driver/signup')}>
          <Text style={styles.signupLink}>
            New driver? <Text style={{ color: TEAL, fontWeight: '700' }}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: GRAY_LIGHT },
  container: {
    flex: 1, padding: 24, justifyContent: 'center', gap: 16,
  },
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
  loginBtn: {
    backgroundColor: TEAL, borderRadius: 30,
    paddingVertical: 16, alignItems: 'center',
    marginTop: 8, elevation: 3,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signupLink: { textAlign: 'center', color: GRAY_TEXT, fontSize: 14, marginTop: 8 },

});