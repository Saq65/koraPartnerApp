import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import Rentals from '../rentals/rental';

const STATS = [
  { icon: 'time-outline', value: '6', label: 'Pending' },
  { icon: 'flame-outline', value: '4', label: 'In Process' },
  { icon: 'checkmark-circle-outline', value: '12', label: 'Completed' },
  { icon: 'cash-outline', value: '₹8.5K', label: 'Revenue' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Washing:   { bg: '#E8F7F3', text: '#0F6E56' },
  Pending:   { bg: '#FFF4E5', text: '#B45309' },
  Ironing:   { bg: '#EEF2FF', text: '#4338CA' },
  Completed: { bg: '#F1F5F9', text: '#475569' },
};

const ORDERS = [
  { id: '#KR-2847', items: '8 items • Wash + Iron', status: 'Washing', activeTab: 'Washing' },
  { id: '#KR-2848', items: '5 items • Dry Clean',   status: 'Pending', activeTab: 'Washing' },
  { id: '#KR-2849', items: '12 items • Iron',        status: 'Ironing', activeTab: 'Ironing' },
];

const TABS = ['Washing', 'Ironing', 'Completed'];

type ActiveTab = 'earnings' | 'rentals';

export default function ProviderDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('earnings');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Content area — flex: 1 so it fills space above bottom bar */}
      <View style={styles.content}>
        {activeTab === 'earnings' ? (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerSub}>Provider Dashboard</Text>
                <Text style={styles.headerTitle}>KORA Laundry Hub</Text>
              </View>
              <TouchableOpacity onPress={() => router.replace('/')}>
                <Text style={styles.switchRole}>Switch Role</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollFlex}
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.statsGrid}>
                {STATS.map((s) => (
                  <View key={s.label} style={styles.statCard}>
                    <Ionicons name={s.icon as any} size={22} color="#0F9B72" />
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Incoming Orders</Text>

              {ORDERS.map((order) => {
                const badge = STATUS_COLORS[order.status] ?? STATUS_COLORS.Completed;
                return (
                  <View key={order.id} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>{order.id}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>{order.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.orderMeta}>{order.items}</Text>
                    <View style={styles.tabs}>
                      {TABS.map((tab) => {
                        const active = tab === order.activeTab;
                        return (
                          <TouchableOpacity
                            key={tab}
                            activeOpacity={0.7}
                            style={[styles.tab, active && styles.tabActive]}
                          >
                            <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </>
        ) : (
          <Rentals />
        )}
      </View>

      {/* Bottom Bar — always at bottom */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, activeTab === 'earnings' && styles.bottomBtnFilled]}
          onPress={() => setActiveTab('earnings')}
        >
          <Ionicons
            name="bar-chart-outline"
            size={18}
            color={activeTab === 'earnings' ? '#FFFFFF' : '#1A4A4A'}
          />
          <Text style={activeTab === 'earnings' ? styles.bottomBtnLabelFilled : styles.bottomBtnLabel}>
            Earnings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBtn, activeTab === 'rentals' && styles.bottomBtnFilled]}
          onPress={() => setActiveTab('rentals')}
        >
          <Ionicons
            name="shirt-outline"
            size={18}
            color={activeTab === 'rentals' ? '#FFFFFF' : '#1A4A4A'}
          />
          <Text style={activeTab === 'rentals' ? styles.bottomBtnLabelFilled : styles.bottomBtnLabel}>
            Rentals
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F0' },

  // This is the key fix — flex:1 pushes bottom bar down
  content: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerSub: { fontSize: 12, color: '#888', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  switchRole: { fontSize: 13, color: '#0F9B72', fontWeight: '600' },

  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 16, gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  statLabel: { fontSize: 13, color: '#888' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },

  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12 },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  orderMeta: { fontSize: 13, color: '#888', marginBottom: 12 },

  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center',
  },
  tabActive: { backgroundColor: '#1A4A4A', borderColor: '#1A4A4A' },
  tabText: { fontSize: 12, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },

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