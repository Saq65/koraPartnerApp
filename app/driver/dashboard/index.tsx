import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { navigate } from 'expo-router/build/global-state/routing';

const STATS = [
  { value: '5',    label: 'orders'   },
  { value: '₹850', label: 'today'    },
  { value: '23km', label: 'covered'  },
];

type Order = {
  id: string;
  address: string;
  type: 'Pickup' | 'Delivery';
  time: string;
  urgent?: boolean;
};

const ORDERS: Order[] = [
  { id: '#KR-2847', address: '123 Main St', type: 'Pickup',   time: '10:30 AM', urgent: true },
  { id: '#KR-2848', address: '456 Park Ave', type: 'Delivery', time: '2:00 PM'  },
  { id: '#KR-2849', address: '789 Oak Rd',   type: 'Pickup',   time: '4:00 PM'  },
];

export default function RiderDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Good Morning 🤝</Text>
          <Text style={styles.headerTitle}>Rider Dashboard</Text>
        </View>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.switchRole}>Switch Role</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Assigned Orders</Text>

        {ORDERS.map((order) => (
          <TouchableOpacity key={order.id} style={styles.orderCard} onPress={()=>navigate('/driver/order')} activeOpacity={0.75}>
            {/* Icon */}
            <View style={[
              styles.iconBox,
              { backgroundColor: order.type === 'Delivery' ? '#E8F7F3' : '#EEF2FF' }
            ]}>
              <Ionicons
                name={order.type === 'Delivery' ? 'car-outline' : 'cube-outline'}
                size={20}
                color={order.type === 'Delivery' ? '#0F6E56' : '#4338CA'}
              />
            </View>

            {/* Info */}
            <View style={styles.orderInfo}>
              <View style={styles.orderTopRow}>
                <Text style={styles.orderId}>{order.id}</Text>
                {order.urgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>Urgent</Text>
                  </View>
                )}
              </View>
              <Text style={styles.orderMeta}>
                {order.address} • {order.type}
              </Text>
            </View>

            {/* Time */}
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={13} color="#888" />
              <Text style={styles.timeText}>{order.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomBtn, styles.bottomBtnFilled]}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.bottomBtnLabelFilled}>Start Route</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtn}>
          <Ionicons name="receipt-outline" size={18} color="#1A4A4A" />
          <Text style={styles.bottomBtnLabel}>History</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F0' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerSub: { fontSize: 13, color: '#888', marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A' },
  switchRole: { fontSize: 13, color: '#0F9B72', fontWeight: '600' },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },

  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },

  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  orderInfo: { flex: 1 },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  urgentBadge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  urgentText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  orderMeta: { fontSize: 13, color: '#888' },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, color: '#888', fontWeight: '500' },

  bottomBar: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderTopWidth: 1, borderTopColor: '#E5E5E0',
    backgroundColor: '#F2F2F0',
  },
  bottomBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1, borderColor: '#1A4A4A',
  },
  bottomBtnFilled: { backgroundColor: '#1A4A4A' },
  bottomBtnLabel: { fontSize: 14, fontWeight: '600', color: '#1A4A4A' },
  bottomBtnLabelFilled: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});