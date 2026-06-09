import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE = 'http://192.168.1.48:5000/api';
const SOCKET_URL = 'http://192.168.1.48:5000';

type RiderOrderStatus = 'pending' | 'accepted' | 'rejected' | 'picked_up' | 'delivered';

interface RiderOrder {
  _id: string;
  orderNumber: string;
  type: 'Pickup' | 'Delivery';
  pickupAddress: { address: string };
  deliveryAddress: { address: string };
  totalAmount: number;
  status: string;
  riderStatus?: RiderOrderStatus;
  createdAt: string;
  urgent?: boolean;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF4E5', text: '#B45309' },
  accepted: { bg: '#E8F7F3', text: '#0F6E56' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
  picked_up: { bg: '#EEF2FF', text: '#4338CA' },
  delivered: { bg: '#F0FDF4', text: '#166534' },
};

export default function RiderDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<RiderOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('rider_token');
      const res = await axios.get(`${API_BASE}/riders/orders/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data || []);
    } catch (err) {
      console.log('Fetch rider orders error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setupSocket = useCallback(async () => {
    const token = await AsyncStorage.getItem('rider_token');
    const riderInfo = await AsyncStorage.getItem('rider_info');
    const rider = riderInfo ? JSON.parse(riderInfo) : null;

    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Rider connected:', socket.id);
      socket.emit('join_rider_room', { riderId: rider?.id });
    });

    // ── Existing event ──
    socket.on('new_rider_order', (order: RiderOrder) => {
      console.log('[Socket] New rider order:', order.orderNumber);
      setOrders(prev => {
        const exists = prev.find(o => o._id === order._id);
        if (exists) return prev;
        return [{ ...order, riderStatus: 'pending' }, ...prev];
      });
    });

    // ── ADD KARO: Washer ne pickup rider request kiya ──
    socket.on('pickup_rider_needed', (order: RiderOrder) => {
      console.log('[Socket] Pickup needed for order:', order.orderNumber);
      setOrders(prev => {
        const exists = prev.find(o => o._id === order._id);
        if (exists) return prev;
        return [{ ...order, riderStatus: 'pending' }, ...prev];
      });
    });

    socket.on('connect_error', (err) => {
      console.log('[Socket] Rider connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Rider disconnected:', reason);
    });

    socketRef.current = socket;
  }, []);


  useEffect(() => {
    fetchOrders();
    setupSocket();
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await AsyncStorage.getItem('rider_token');
      await axios.post(`${API_BASE}/riders/orders/${orderId}/accept`, {}, {
        //                              ↑ riders (plural)
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, riderStatus: 'accepted' } : o
      ));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to accept');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await AsyncStorage.getItem('rider_token');
      await axios.post(`${API_BASE}/riders/orders/${orderId}/reject`, {}, {
        //                              ↑ riders (plural)
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.filter(o => o._id !== orderId));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePickedUp = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await AsyncStorage.getItem('rider_token');
      await axios.post(`${API_BASE}/riders/orders/${orderId}/picked-up`, {}, {
        //                              ↑ riders (plural)
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, riderStatus: 'picked_up' } : o
      ));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelivered = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await AsyncStorage.getItem('rider_token');
      await axios.post(`${API_BASE}/riders/orders/${orderId}/delivered`, {}, {
        //                              ↑ riders (plural)
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, riderStatus: 'delivered' } : o
      ));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update');
    } finally {
      setActionLoading(null);
    }
  };



  const handleLogout = async () => {
    await AsyncStorage.removeItem('rider_token');
    await AsyncStorage.removeItem('rider_info');
    router.replace('/');
  };

  const pendingCount = orders.filter(o => !o.riderStatus || o.riderStatus === 'pending').length;
  const acceptedCount = orders.filter(o => o.riderStatus === 'accepted' || o.riderStatus === 'picked_up').length;
  const deliveredCount = orders.filter(o => o.riderStatus === 'delivered').length;
  const totalRevenue = orders
    .filter(o => o.riderStatus === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const STATS = [
    { value: String(pendingCount), label: 'Pending' },
    { value: String(acceptedCount), label: 'Active' },
    { value: `₹${totalRevenue}`, label: 'Earned' },
    { value: String(deliveredCount), label: 'Delivered' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Rider Dashboard</Text>
          <Text style={styles.headerTitle}>KORA Partner</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
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

      {loading ? (
        <ActivityIndicator size="large" color="#0F9B72" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={styles.scrollFlex}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>
            Assigned Orders {orders.length > 0 && `(${orders.length})`}
          </Text>

          {orders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="bicycle-outline" size={40} color="#CCC" />
              <Text style={styles.emptyText}>No orders assigned yet</Text>
            </View>
          ) : (
            orders.map((order) => {
              const riderStatus = order.riderStatus || 'pending';
              const badge = STATUS_COLORS[riderStatus] ?? STATUS_COLORS.pending;
              const isActioning = actionLoading === order._id;
              const address = order.type === 'Pickup'
                ? order.pickupAddress?.address
                : order.deliveryAddress?.address;

              return (
                <View key={order._id} style={styles.orderCard}>

                  {/* Card Header */}
                  <View style={styles.orderHeader}>
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

                    <View style={{ flex: 1 }}>
                      <View style={styles.orderTopRow}>
                        <Text style={styles.orderId}>#{order.orderNumber}</Text>
                        {order.urgent && (
                          <View style={styles.urgentBadge}>
                            <Text style={styles.urgentText}>Urgent</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.orderType}>{order.type}</Text>
                    </View>

                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>
                        {riderStatus.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
                      </Text>
                    </View>
                  </View>

                  {/* Address */}
                  <Text style={styles.orderAddr}>📍 {address ?? '—'}</Text>
                  <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>

                  {/* Action Buttons */}
                  {riderStatus === 'pending' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.rejectBtn, isActioning && styles.btnDisabled]}
                        disabled={isActioning}
                        onPress={() => handleReject(order._id)}
                      >
                        {isActioning
                          ? <ActivityIndicator size="small" color="#DC2626" />
                          : <Text style={styles.rejectText}>Reject</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.acceptBtn, isActioning && styles.btnDisabled]}
                        disabled={isActioning}
                        onPress={() => handleAccept(order._id)}
                      >
                        {isActioning
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={styles.acceptText}>Accept</Text>}
                      </TouchableOpacity>
                    </View>
                  )}

                  {riderStatus === 'accepted' && (
                    <TouchableOpacity
                      style={[styles.actionFullBtn, { backgroundColor: '#4338CA' }, isActioning && styles.btnDisabled]}
                      disabled={isActioning}
                      onPress={() => handlePickedUp(order._id)}
                    >
                      {isActioning
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                          <Ionicons name="cube-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.acceptText}>Mark as Picked Up</Text>
                        </>}
                    </TouchableOpacity>
                  )}

                  {riderStatus === 'picked_up' && (
                    <TouchableOpacity
                      style={[styles.actionFullBtn, { backgroundColor: '#0F6E56' }, isActioning && styles.btnDisabled]}
                      disabled={isActioning}
                      onPress={() => handleDelivered(order._id)}
                    >
                      {isActioning
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.acceptText}>Mark as Delivered</Text>
                        </>}
                    </TouchableOpacity>
                  )}

                  {riderStatus === 'delivered' && (
                    <View style={styles.deliveredRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#166534" />
                      <Text style={styles.deliveredText}>Order Delivered</Text>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
  },
  headerSub: { fontSize: 12, color: '#888', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  logout: { fontSize: 13, color: '#DC2626', fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: '#AAA' },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  orderType: { fontSize: 12, color: '#888' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  urgentBadge: { backgroundColor: '#FEF2F2', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  urgentText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  orderAddr: { fontSize: 12, color: '#888', marginBottom: 4 },
  orderAmount: { fontSize: 15, fontWeight: '700', color: '#1A4A4A', marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#DC2626', alignItems: 'center',
  },
  acceptBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1A4A4A', alignItems: 'center' },
  actionFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 10, marginTop: 4,
  },
  btnDisabled: { opacity: 0.5 },
  rejectText: { color: '#DC2626', fontWeight: '600' },
  acceptText: { color: '#FFF', fontWeight: '600' },
  deliveredRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 8 },
  deliveredText: { color: '#166534', fontWeight: '600', fontSize: 13 },
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