import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetail() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #KR-2847</Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapBox}>
        <Ionicons name="navigate-outline" size={32} color="#0F9B72" />
        <Text style={styles.mapLabel}>Optimized Route</Text>
        <Text style={styles.mapMeta}>2.3 km • 8 min</Text>
      </View>

      {/* Pickup / Delivery */}
      <View style={styles.card}>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={18} color="#0F9B72" />
          <View>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText}>123 Main St, Mumbai</Text>
          </View>
        </View>

        <View style={styles.locationDivider} />

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={18} color="#DC2626" />
          <View>
            <Text style={styles.locationLabel}>Delivery</Text>
            <Text style={styles.locationText}>456 Park Ave, Mumbai</Text>
          </View>
        </View>
      </View>

      {/* Customer */}
      <View style={styles.card}>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>John Doe</Text>
            <Text style={styles.customerMeta}>8 items • Wash + Iron</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Ionicons name="call-outline" size={18} color="#0F9B72" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnFilled]}>
          <Ionicons name="bag-handle-outline" size={18} color="#fff" />
          <Text style={styles.actionBtnLabelFilled}>Picked Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#1A4A4A" />
          <Text style={styles.actionBtnLabel}>Delivered</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F0' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },

  mapBox: {
    marginHorizontal: 16,
    backgroundColor: '#E8F7F3',
    borderRadius: 16,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  mapLabel: { fontSize: 15, fontWeight: '600', color: '#0F9B72', marginTop: 4 },
  mapMeta: { fontSize: 13, color: '#555' },

  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  locationText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  locationDivider: {
    height: 1, backgroundColor: '#F0F0EE',
    marginVertical: 12, marginLeft: 28,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#E8F7F3',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#0F6E56' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  customerMeta: { fontSize: 13, color: '#888', marginTop: 2 },
  callBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#E8F7F3',
    justifyContent: 'center', alignItems: 'center',
  },

  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E0',
    backgroundColor: '#F2F2F0',
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#1A4A4A',
  },
  actionBtnFilled: { backgroundColor: '#1A4A4A' },
  actionBtnLabel: { fontSize: 14, fontWeight: '600', color: '#1A4A4A' },
  actionBtnLabelFilled: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});