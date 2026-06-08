import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TEAL = '#1A6B5A';

export default function RoleSelect() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>KORA Partner</Text>
        <Text style={styles.sub}>Select your role</Text>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/driver/login')}>
          <Text style={styles.cardIcon}>🚴</Text>
          <View>
            <Text style={styles.cardTitle}>Delivery Rider</Text>
            <Text style={styles.cardSub}>Pickup & deliver orders</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/washer/login')}>
          <Text style={styles.cardIcon}>👕</Text>
          <View>
            <Text style={styles.cardTitle}>Service Provider</Text>
            <Text style={styles.cardSub}>Wash, iron & manage orders</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEA' },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#1A1A1A' },
  sub: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16, elevation: 2,
  },
  cardIcon: { fontSize: 32 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  cardSub: { fontSize: 13, color: '#888', marginTop: 2 },
});