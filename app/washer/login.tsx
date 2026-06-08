import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function WasherLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>«KORA»</Text>
          </View>

          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Login to your washer account</Text>

          {/* Card */}
          <View style={styles.card}>

            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputRow}>
              <Text style={styles.flag}>🇮🇳 +91</Text>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#AAAAAA"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter password"
                placeholderTextColor="#AAAAAA"
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Text style={styles.toggle}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotRow}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, (!phone || !password) && styles.btnDisabled]}
              activeOpacity={0.8}
              disabled={!phone || !password}
              onPress={() => router.replace('/washer/dashboard')}
            >
              <Text style={styles.btnText}>Login</Text>
            </TouchableOpacity>

          </View>

          {/* Divider */}
          <View style={styles.orRow}>
            <View style={styles.line} />
            <Text style={styles.orText}>or continue with</Text>
            <View style={styles.line} />
          </View>

          {/* Google */}
          <TouchableOpacity style={styles.googleBtn} activeOpacity={0.7}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleText}>Sign in with Google</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Not a partner yet? </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Register here</Text>
            </TouchableOpacity>
          </View>

          {/* Switch role */}
          <TouchableOpacity style={styles.switchRow} onPress={() => router.replace('/')}>
            <Text style={styles.switchText}>← Switch Role</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F0' },
  scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, alignItems: 'center' },

  logoBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#1A4A4A',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  logoText: { color: '#5DCAA5', fontSize: 14, fontWeight: '700', letterSpacing: 1 },

  heading: { fontSize: 24, fontWeight: '700', color: '#1A1A1A', marginBottom: 4 },
  sub: { fontSize: 14, color: '#888', marginBottom: 28 },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },

  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#FAFAFA',
  },
  flag: { fontSize: 14, color: '#333', marginRight: 8 },
  divider: { width: 1, height: 20, backgroundColor: '#E0E0E0', marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A' },
  toggle: { fontSize: 18, paddingLeft: 8 },

  forgotRow: { alignItems: 'flex-end', marginTop: 10, marginBottom: 20 },
  forgot: { fontSize: 13, color: '#0F9B72', fontWeight: '600' },

  btn: {
    backgroundColor: '#1A4A4A',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnDisabled: { backgroundColor: '#B0C4C4' },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  orRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E5E0' },
  orText: { fontSize: 12, color: '#AAA', marginHorizontal: 12 },

  googleBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E5E0',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 28,
  },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#EA4335' },
  googleText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },

  footer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  footerText: { fontSize: 13, color: '#888' },
  footerLink: { fontSize: 13, color: '#0F9B72', fontWeight: '600' },

  switchRow: { marginTop: 4 },
  switchText: { fontSize: 13, color: '#888' },
});