import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RoleSelect() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>«KORA»</Text>
          </View>
          <Text style={styles.title}>KORA Partner</Text>
          <Text style={styles.sub}>Select your role</Text>
        </View>

        {/* Cards */}
        <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={() => router.push('/driver/login')}>
          <View style={styles.iconBox}>
            <Ionicons name="bicycle-outline" size={24} color="#0F9B72" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Delivery Rider</Text>
            <Text style={styles.cardSub}>Pickup & deliver orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.75} onPress={() => router.push('/washer/login')}>
          <View style={styles.iconBox}>
            <Ionicons name="shirt-outline" size={24} color="#0F9B72" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Service Provider</Text>
            <Text style={styles.cardSub}>Wash, iron & manage orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CCC" />
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F0' },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 14 },

  logoWrap: { alignItems: 'center', marginBottom: 12, gap: 8 },
  logoBox: {
    width: 72, height: 72, borderRadius: 18,
    backgroundColor: '#1A4A4A',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  logoText: { color: '#5DCAA5', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#1A4A4A' },
  sub: { fontSize: 14, color: '#888' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#E8F7F3',
    justifyContent: 'center', alignItems: 'center',
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  cardSub: { fontSize: 13, color: '#888', marginTop: 2 },
});