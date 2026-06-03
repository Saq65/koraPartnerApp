import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>KoraRider</Text>
      <Text style={styles.subtitle}>Choose your role to continue.</Text>

      <Link href="/driver/login" style={styles.card}>Driver</Link>
      <Link href="/washer/login" style={styles.card}>Washer</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0F172A' },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#CBD5E1', fontSize: 16, marginBottom: 24 },
  card: {
    backgroundColor: '#1E293B',
    color: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
