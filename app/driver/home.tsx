import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function RoleSelect() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>«KORA»</Text>
          </View>
          <Text style={styles.title}>KORA Partner</Text>
          <Text style={styles.subtitle}>Select your role</Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push('/driver/home')}
          >
            <View style={styles.iconBox}>
              <Text style={styles.icon}>🚚</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Delivery Rider</Text>
              <Text style={styles.cardSub}>Pickup & deliver orders</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => router.push('/provider/home')}
          >
            <View style={styles.iconBox}>
              <Text style={styles.icon}>👕</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>Service Provider</Text>
              <Text style={styles.cardSub}>Wash, iron & manage orders</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F0',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 48,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#1A4A4A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#5DCAA5',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A4A4A',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  cards: {
    width: '100%',
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});