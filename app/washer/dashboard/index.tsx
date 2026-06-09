import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import Rentals from '../rentals/rental';

const API_BASE = 'http://192.168.1.48:5000/api';
const SOCKET_URL = 'http://192.168.1.48:5000';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_sp: { bg: '#FFF4E5', text: '#B45309' },
  accepted: { bg: '#E8F7F3', text: '#0F6E56' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
};

type ActiveTab = 'earnings' | 'rentals';

interface OrderItem {
  subCategoryName: string;
  serviceName: string;
  quantity: number;
}

interface PickupAddress {
  _id: string;
  address: string;
  coordinates: { lat: number; lng: number }; // adjust to your actual shape
}

interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  pickupAddress: PickupAddress;  // ← was string, now object
  status: string;
  createdAt: string;
  washerStatus?: 'pending' | 'accepted' | 'rejected';
}
interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  pickupAddress: PickupAddress;
  status: string;
  createdAt: string;
  washerStatus?: 'pending' | 'accepted' | 'rejected';
}

export default function WasherDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('earnings');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('washer_token');
      const res = await axios.get(`${API_BASE}/washer/orders/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data || []);
    } catch (err) {
      console.log('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    setupSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const setupSocket = useCallback(async () => {
    const token = await AsyncStorage.getItem('washer_token');
    const washerInfo = await AsyncStorage.getItem('washer_info');
    const washer = washerInfo ? JSON.parse(washerInfo) : null;

    if (!token) {
      console.log('[Socket] No token, skipping socket setup');
      return;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Washer connected:', socket.id);
      socket.emit('join_washer_room', { washerId: washer?.id });
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Connection error:', err.message);
    });

    socket.on('new_washer_order', (order: Order) => {
      console.log('[Socket] New order received:', order.orderNumber);
      setOrders(prev => {
        const exists = prev.find(o => o._id === order._id);
        if (exists) return prev;
        return [{ ...order, washerStatus: 'pending' }, ...prev];
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socketRef.current = socket;
  }, []);

  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await AsyncStorage.getItem('washer_token');
      await axios.post(`${API_BASE}/washer/orders/${orderId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, washerStatus: 'accepted' } : o));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await AsyncStorage.getItem('washer_token');
      await axios.post(`${API_BASE}/washer/orders/${orderId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('washer_token');
    await AsyncStorage.removeItem('washer_info');
    router.replace('/washer/login');
  };

  const pendingCount = orders.filter(o => !o.washerStatus || o.washerStatus === 'pending').length;
  const acceptedCount = orders.filter(o => o.washerStatus === 'accepted').length;

  const STATS = [
    { icon: 'time-outline', value: String(pendingCount), label: 'Pending' },
    { icon: 'checkmark-circle-outline', value: String(acceptedCount), label: 'Accepted' },
    { icon: 'cash-outline', value: '₹0', label: 'Revenue' },
    { icon: 'flame-outline', value: '0', label: 'Completed' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {activeTab === 'earnings' ? (
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.headerSub}>Washer Dashboard</Text>
                <Text style={styles.headerTitle}>KORA Partner</Text>
              </View>
              <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logout}>Logout</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#0F9B72" style={{ marginTop: 40 }} />
            ) : (
              <ScrollView style={styles.scrollFlex} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Stats */}
                <View style={styles.statsGrid}>
                  {STATS.map((s) => (
                    <View key={s.label} style={styles.statCard}>
                      <Ionicons name={s.icon as any} size={22} color="#0F9B72" />
                      <Text style={styles.statValue}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>
                  Incoming Orders {orders.length > 0 && `(${orders.length})`}
                </Text>

                {orders.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="shirt-outline" size={40} color="#CCC" />
                    <Text style={styles.emptyText}>No orders yet</Text>
                  </View>
                ) : (
                  orders.map((order) => {
                    const washerStatus = order.washerStatus || 'pending';
                    const badge = STATUS_COLORS[washerStatus] ?? STATUS_COLORS.pending_sp;
                    const isActioning = actionLoading === order._id;
                    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
                    const services = [...new Set(order.items.map(i => i.serviceName))].join(' + ');

                    return (
                      <View key={order._id} style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                          <Text style={styles.orderId}>#{order.orderNumber}</Text>
                          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                            <Text style={[styles.badgeText, { color: badge.text }]}>
                              {washerStatus === 'pending' ? 'New' : washerStatus === 'accepted' ? 'Accepted' : 'Rejected'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.orderMeta}>{totalQty} items • {services}</Text>
                        <Text style={styles.orderAddr}>
                          📍 {typeof order.pickupAddress === 'object'
                            ? (order.pickupAddress as any).address
                            : order.pickupAddress}
                        </Text>
                        <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>

                        {washerStatus === 'pending' && (
                          <View style={styles.actionRow}>
                            <TouchableOpacity
                              style={[styles.rejectBtn, isActioning && styles.btnDisabled]}
                              disabled={isActioning}
                              onPress={() => handleReject(order._id)}
                            >
                              {isActioning ? <ActivityIndicator size="small" color="#DC2626" /> : <Text style={styles.rejectText}>Reject</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.acceptBtn, isActioning && styles.btnDisabled]}
                              disabled={isActioning}
                              onPress={() => handleAccept(order._id)}
                            >
                              {isActioning ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.acceptText}>Accept</Text>}
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            )}
          </>
        ) : (
          <Rentals />
        )}
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, activeTab === 'earnings' && styles.bottomBtnFilled]}
          onPress={() => setActiveTab('earnings')}
        >
          <Ionicons name="bar-chart-outline" size={18} color={activeTab === 'earnings' ? '#FFFFFF' : '#1A4A4A'} />
          <Text style={activeTab === 'earnings' ? styles.bottomBtnLabelFilled : styles.bottomBtnLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomBtn, activeTab === 'rentals' && styles.bottomBtnFilled]}
          onPress={() => setActiveTab('rentals')}
        >
          <Ionicons name="shirt-outline" size={18} color={activeTab === 'rentals' ? '#FFFFFF' : '#1A4A4A'} />
          <Text style={activeTab === 'rentals' ? styles.bottomBtnLabelFilled : styles.bottomBtnLabel}>Rentals</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F0' },
  content: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  headerSub: { fontSize: 12, color: '#888', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  logout: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  statLabel: { fontSize: 13, color: '#888' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: '#AAA' },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  orderMeta: { fontSize: 13, color: '#888', marginBottom: 4 },
  orderAddr: { fontSize: 12, color: '#888', marginBottom: 4 },
  orderAmount: { fontSize: 15, fontWeight: '700', color: '#1A4A4A', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#DC2626', alignItems: 'center',
  },
  acceptBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1A4A4A', alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  rejectText: { color: '#DC2626', fontWeight: '600' },
  acceptText: { color: '#FFF', fontWeight: '600' },
  bottomBar: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderTopWidth: 1, borderTopColor: '#E5E5E0', backgroundColor: '#F2F2F0',
  },
  bottomBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#1A4A4A',
  },
  bottomBtnFilled: { backgroundColor: '#1A4A4A' },
  bottomBtnLabel: { fontSize: 14, fontWeight: '600', color: '#1A4A4A' },
  bottomBtnLabelFilled: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});