import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, AppState,
  AppStateStatus, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import Rentals from '../rentals/rental';

const API_BASE  = 'http://192.168.1.48:5000/api';
const SOCKET_URL = 'http://192.168.1.48:5000';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF4E5', text: '#B45309' },
  accepted: { bg: '#E8F7F3', text: '#0F6E56' },
  rejected: { bg: '#FEE2E2', text: '#DC2626' },
  pickup_rider_requested: { bg: '#EEF2FF', text: '#4338CA' },
  completed: { bg: '#F0FDF4', text: '#166534' },
};

type ActiveTab = 'earnings' | 'rentals';
type WasherStatus = 'pending' | 'accepted' | 'rejected' | 'pickup_rider_requested' | 'completed';
type RiderAssignStatus = 'accepted' | 'rejected';

interface OrderItem { subCategoryName: string; serviceName: string; quantity: number; }
interface PickupAddress { _id: string; address: string; coordinates: { lat: number; lng: number }; }
interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  pickupAddress: PickupAddress;
  status: string;
  createdAt: string;
  washerStatus?: WasherStatus;
  riderStatus?: RiderAssignStatus;
  riderName?: string;
}

export default function WasherDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('earnings');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const socketRef = useRef<Socket | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const ORDERS_KEY = 'washer_orders_cache';

  const saveOrdersToCache = async (updatedOrders: Order[]) => {
    try {
      await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    } catch (e) {
      console.log('Cache save error:', e);
    }
  };

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);

      if (!isRefresh) {
        const cached = await AsyncStorage.getItem(ORDERS_KEY);
        if (cached) setOrders(JSON.parse(cached));
      }

      const token = await AsyncStorage.getItem('washer_token');
      const res = await axios.get(`${API_BASE}/washer/orders/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fresh: Order[] = res.data.data || [];

      setOrders(prev => {
        const merged = fresh.map(o => {
          const existing = prev.find(p => p._id === o._id);
          return existing
            ? { ...o, washerStatus: existing.washerStatus, riderStatus: existing.riderStatus, riderName: existing.riderName }
            : o;
        });

        // Completed + pickup_rider_requested + rejected — jo fresh mein nahi aaye unhe preserve karo
        const preserved = prev.filter(
          p =>
            !fresh.some(f => f._id === p._id) &&
            ['completed', 'pickup_rider_requested', 'rejected'].includes(p.washerStatus ?? '')
        );

        const final = [...merged, ...preserved].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        saveOrdersToCache(final);
        return final;
      });
    } catch (err) {
      console.log('Fetch orders error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => fetchOrders(true), [fetchOrders]);

  // ── AppState ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        fetchOrders(true);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [fetchOrders]);

  // ── Socket ─────────────────────────────────────────────────────────────────
  const setupSocket = useCallback(async () => {
    if (socketRef.current?.connected) return;
    const token = await AsyncStorage.getItem('washer_token');
    const washerInfo = await AsyncStorage.getItem('washer_info');
    const washer = washerInfo ? JSON.parse(washerInfo) : null;
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Washer connected:', socket.id);
      socket.emit('join_washer_room', { washerId: washer?.id });
      fetchOrders(true);
    });

    socket.on('connect_error', err => console.log('[Socket] Error:', err.message));

    socket.on('new_washer_order', (order: Order) => {
      setOrders(prev => {
        if (prev.find(o => o._id === order._id)) return prev;
        const updated = [{ ...order, washerStatus: 'pending' as WasherStatus }, ...prev];
        saveOrdersToCache(updated);
        return updated;
      });
    });

    socket.on('rider_picked_up', (data: { orderId: string }) => {
      setOrders(prev => {
        const updated = prev.map(o =>
          o._id === data.orderId ? { ...o, washerStatus: 'completed' as WasherStatus } : o
        );
        saveOrdersToCache(updated);
        return updated;
      });
    });

    socket.on('rider_accepted', (data: { orderId: string; riderName?: string }) => {
      console.log('[Socket] Rider accepted:', data.orderId);
      setOrders(prev => {
        const updated = prev.map(o =>
          o._id === data.orderId
            ? { ...o, riderStatus: 'accepted' as RiderAssignStatus, riderName: data.riderName }
            : o
        );
        saveOrdersToCache(updated);
        return updated;
      });
    });

    socket.on('rider_rejected', (data: { orderId: string }) => {
      console.log('[Socket] Rider rejected:', data.orderId);
      setOrders(prev => {
        const updated = prev.map(o =>
          o._id === data.orderId ? { ...o, riderStatus: 'rejected' as RiderAssignStatus } : o
        );
        saveOrdersToCache(updated);
        return updated;
      });
    });

    socket.on('disconnect', reason => console.log('[Socket] Disconnected:', reason));
    socketRef.current = socket;
  }, [fetchOrders]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await fetchOrders();
      if (mounted) await setupSocket();
    };

    init();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await AsyncStorage.getItem('washer_token');
      await axios.post(`${API_BASE}/washer/orders/${orderId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => {
        const updated = prev.map(o => o._id === orderId ? { ...o, washerStatus: 'accepted' as WasherStatus } : o);
        saveOrdersToCache(updated);
        return updated;
      });
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
      setOrders(prev => {
        const updated = prev.filter(o => o._id !== orderId);
        saveOrdersToCache(updated);
        return updated;
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestPickupRider = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await AsyncStorage.getItem('washer_token');
      await axios.post(`${API_BASE}/washer/orders/${orderId}/request-pickup-rider`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'Pickup rider has been requested!');
      setOrders(prev => {
        const updated = prev.map(o =>
          o._id === orderId ? { ...o, washerStatus: 'pickup_rider_requested' as WasherStatus, riderStatus: undefined } : o
        );
        saveOrdersToCache(updated);
        return updated;
      });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to request pickup rider');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('washer_token');
    await AsyncStorage.removeItem('washer_info');
    router.replace('/washer/login');
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const pendingCount = orders.filter(o => !o.washerStatus || o.washerStatus === 'pending').length;
  const acceptedCount = orders.filter(o => o.washerStatus === 'accepted').length;
  const completedCount = orders.filter(o => o.washerStatus === 'completed').length;
  const totalRevenue = orders
    .filter(o => o.washerStatus === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const STATS = [
    { icon: 'time-outline', value: String(pendingCount), label: 'Pending' },
    { icon: 'checkmark-circle-outline', value: String(acceptedCount), label: 'Accepted' },
    { icon: 'cash-outline', value: `₹${totalRevenue}`, label: 'Revenue' },
    { icon: 'flame-outline', value: String(completedCount), label: 'Completed' },
  ];

  // Search filter
  const filteredOrders = search.trim()
    ? orders.filter(o =>
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.items?.some(i => i.serviceName?.toLowerCase().includes(search.toLowerCase()))
    )
    : orders;

  // Section 1a: Awaiting rider (no response yet)
  const awaitingOrders = filteredOrders.filter(
    o => o.washerStatus === 'pickup_rider_requested' && !o.riderStatus
  );
  // Section 1b: Rider accepted
  const riderAcceptedOrders = filteredOrders.filter(
    o => o.washerStatus === 'pickup_rider_requested' && o.riderStatus === 'accepted'
  );
  // Section 1c: Rider rejected
  const riderRejectedOrders = filteredOrders.filter(
    o => o.washerStatus === 'pickup_rider_requested' && o.riderStatus === 'rejected'
  );

  // Section 2: Active (pending / accepted)
  const activeOrders = filteredOrders.filter(
    o => o.washerStatus !== 'pickup_rider_requested' && o.washerStatus !== 'completed'
  );

  // Section 3: Completed
  const completedOrders = filteredOrders.filter(
    o => o.washerStatus === 'completed'
  );

  // ── Render helpers ─────────────────────────────────────────────────────────

  const renderOrderCard = (order: Order) => {
    const washerStatus = order.washerStatus || 'pending';
    const badge = STATUS_COLORS[washerStatus] ?? STATUS_COLORS.pending;
    const isActioning = actionLoading === order._id;
    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);
    const services = [...new Set(order.items.map(i => i.serviceName))].join(' + ');

    return (
      <View key={order._id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{order.orderNumber}</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.text }]}>
              {washerStatus === 'pending' ? 'New'
                : washerStatus === 'accepted' ? 'Accepted'
                  : washerStatus === 'completed' ? 'Completed'
                    : 'Rejected'}
            </Text>
          </View>
        </View>

        <Text style={styles.orderMeta}>{totalQty} items • {services}</Text>
        <Text style={styles.orderAddr}>📍 {order.pickupAddress?.address ?? '—'}</Text>
        <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>

        {washerStatus === 'pending' && (
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

        {washerStatus === 'accepted' && (
          <TouchableOpacity
            style={[styles.pickupBtn, isActioning && styles.btnDisabled]}
            disabled={isActioning}
            onPress={() => handleRequestPickupRider(order._id)}
          >
            {isActioning
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                <Ionicons name="bicycle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.pickupText}>Request Pickup Rider</Text>
              </>}
          </TouchableOpacity>
        )}

      </View>
    );
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
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
              <ScrollView
                style={styles.scrollFlex}
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#0F9B72']}
                    tintColor="#0F9B72"
                  />
                }
              >
                {/* Stats */}
                <View style={styles.statsGrid}>
                  {STATS.map(s => (
                    <View key={s.label} style={styles.statCard}>
                      <Ionicons name={s.icon as any} size={22} color="#0F9B72" />
                      <Text style={styles.statValue}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={16} color="#888" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by order # or service..."
                    placeholderTextColor="#AAA"
                    value={search}
                    onChangeText={setSearch}
                    clearButtonMode="while-editing"
                    returnKeyType="search"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                      <Ionicons name="close-circle" size={16} color="#AAA" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* ── Awaiting Rider ── */}
                {awaitingOrders.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>🕐 Awaiting Rider</Text>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>{awaitingOrders.length}</Text>
                      </View>
                    </View>
                    {awaitingOrders.map(order => {
                      const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                      return (
                        <View key={order._id} style={[styles.orderCard, styles.requestedCard]}>
                          <View style={styles.orderHeader}>
                            <Text style={styles.orderId}>#{order.orderNumber}</Text>
                            <View style={[styles.badge, { backgroundColor: '#EEF2FF' }]}>
                              <Text style={[styles.badgeText, { color: '#4338CA' }]}>Rider Requested</Text>
                            </View>
                          </View>
                          <Text style={styles.orderMeta}>{totalQty} items • ₹{order.totalAmount}</Text>
                          <Text style={styles.orderAddr}>📍 {order.pickupAddress?.address ?? '—'}</Text>
                          <View style={styles.waitingRow}>
                            <ActivityIndicator size="small" color="#4338CA" />
                            <Text style={styles.waitingText}>Waiting for rider to accept...</Text>
                          </View>
                        </View>
                      );
                    })}
                    <View style={styles.divider} />
                  </>
                )}

                {/* ── Rider Accepted ── */}
                {riderAcceptedOrders.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>✅ Rider Accepted</Text>
                      <View style={[styles.sectionBadge, { backgroundColor: '#0F6E56' }]}>
                        <Text style={styles.sectionBadgeText}>{riderAcceptedOrders.length}</Text>
                      </View>
                    </View>
                    {riderAcceptedOrders.map(order => {
                      const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                      return (
                        <View key={order._id} style={[styles.orderCard, { borderLeftWidth: 3, borderLeftColor: '#0F6E56' }]}>
                          <View style={styles.orderHeader}>
                            <Text style={styles.orderId}>#{order.orderNumber}</Text>
                            <View style={[styles.badge, { backgroundColor: '#E8F7F3' }]}>
                              <Text style={[styles.badgeText, { color: '#0F6E56' }]}>✅ Accepted</Text>
                            </View>
                          </View>
                          <Text style={styles.orderMeta}>{totalQty} items • ₹{order.totalAmount}</Text>
                          <Text style={styles.orderAddr}>📍 {order.pickupAddress?.address ?? '—'}</Text>
                          {order.riderName && (
                            <Text style={styles.riderInfo}>🏍️ Rider: {order.riderName}</Text>
                          )}
                          <View style={styles.waitingRow}>
                            <Ionicons name="checkmark-circle" size={15} color="#0F6E56" />
                            <Text style={[styles.waitingText, { color: '#0F6E56' }]}>Rider is on the way</Text>
                          </View>
                          <TouchableOpacity
                            style={[styles.pickupBtn, { backgroundColor: '#166534', marginTop: 8 }, actionLoading === order._id && styles.btnDisabled]}
                            disabled={actionLoading === order._id}
                            onPress={async () => {
                              setActionLoading(order._id);
                              try {
                                const token = await AsyncStorage.getItem('washer_token');
                                await axios.post(
                                  `${API_BASE}/washer/orders/${order._id}/complete`,
                                  {},
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );
                              } catch (e) {
                                console.log('Complete error:', e);
                              } finally {
                                setActionLoading(null);
                              }
                              setOrders(prev => {
                                const updated = prev.map(o =>
                                  o._id === order._id
                                    ? { ...o, washerStatus: 'completed' as WasherStatus }
                                    : o
                                );
                                saveOrdersToCache(updated);
                                return updated;
                              });
                            }}
                          >
                            <Ionicons name="checkmark-done-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.pickupText}>Mark as Done</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    <View style={styles.divider} />
                  </>
                )}

                {/* ── Rider Rejected ── */}
                {riderRejectedOrders.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>❌ Rider Rejected</Text>
                      <View style={[styles.sectionBadge, { backgroundColor: '#DC2626' }]}>
                        <Text style={styles.sectionBadgeText}>{riderRejectedOrders.length}</Text>
                      </View>
                    </View>
                    {riderRejectedOrders.map(order => {
                      const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                      const isActioning = actionLoading === order._id;
                      return (
                        <View key={order._id} style={[styles.orderCard, { borderLeftWidth: 3, borderLeftColor: '#DC2626' }]}>
                          <View style={styles.orderHeader}>
                            <Text style={styles.orderId}>#{order.orderNumber}</Text>
                            <View style={[styles.badge, { backgroundColor: '#FEE2E2' }]}>
                              <Text style={[styles.badgeText, { color: '#DC2626' }]}>❌ Rejected</Text>
                            </View>
                          </View>
                          <Text style={styles.orderMeta}>{totalQty} items • ₹{order.totalAmount}</Text>
                          <Text style={styles.orderAddr}>📍 {order.pickupAddress?.address ?? '—'}</Text>
                          <TouchableOpacity
                            style={[styles.pickupBtn, { backgroundColor: '#DC2626', marginTop: 8 }, isActioning && styles.btnDisabled]}
                            disabled={isActioning}
                            onPress={() => handleRequestPickupRider(order._id)}
                          >
                            {isActioning
                              ? <ActivityIndicator size="small" color="#fff" />
                              : <>
                                <Ionicons name="refresh-outline" size={15} color="#fff" style={{ marginRight: 6 }} />
                                <Text style={styles.pickupText}>Re-request Rider</Text>
                              </>}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                    <View style={styles.divider} />
                  </>
                )}

                {/* ── Active Orders Section ── */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Incoming Orders</Text>
                  {activeOrders.length > 0 && (
                    <View style={styles.sectionBadge}>
                      <Text style={styles.sectionBadgeText}>{activeOrders.length}</Text>
                    </View>
                  )}
                </View>

                {activeOrders.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="shirt-outline" size={40} color="#CCC" />
                    <Text style={styles.emptyText}>
                      {search.trim() ? 'No results found' : 'No orders yet'}
                    </Text>
                  </View>
                ) : (
                  activeOrders.map(renderOrderCard)
                )}

                {/* ── Completed Orders Section ── */}
                {completedOrders.length > 0 && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>✅ Completed</Text>
                      <View style={[styles.sectionBadge, { backgroundColor: '#166534' }]}>
                        <Text style={styles.sectionBadgeText}>{completedOrders.length}</Text>
                      </View>
                    </View>
                    {completedOrders.map(order => {
                      const totalQty = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
                      const services = [...new Set(order.items?.map(i => i.serviceName) ?? [])].join(' + ');
                      return (
                        <View key={order._id} style={[styles.orderCard, styles.completedCard]}>
                          <View style={styles.orderHeader}>
                            <Text style={styles.orderId}>#{order.orderNumber}</Text>
                            <View style={[styles.badge, { backgroundColor: '#F0FDF4' }]}>
                              <Text style={[styles.badgeText, { color: '#166534' }]}>Completed</Text>
                            </View>
                          </View>
                          <Text style={styles.orderMeta}>{totalQty} items • {services}</Text>
                          <Text style={styles.orderAddr}>📍 {order.pickupAddress?.address ?? '—'}</Text>
                          <View style={styles.completedFooter}>
                            <Ionicons name="checkmark-circle" size={15} color="#166534" />
                            <Text style={styles.completedEarned}>₹{order.totalAmount} earned</Text>
                          </View>
                        </View>
                      );
                    })}
                  </>
                )}
              </ScrollView>
            )}
          </>
        ) : (
          <Rentals />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bottomBtn, activeTab === 'earnings' && styles.bottomBtnFilled]}
          onPress={() => setActiveTab('earnings')}
        >
          <Ionicons name="bar-chart-outline" size={18} color={activeTab === 'earnings' ? '#FFF' : '#1A4A4A'} />
          <Text style={activeTab === 'earnings' ? styles.bottomBtnLabelFilled : styles.bottomBtnLabel}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomBtn, activeTab === 'rentals' && styles.bottomBtnFilled]}
          onPress={() => setActiveTab('rentals')}
        >
          <Ionicons name="shirt-outline" size={18} color={activeTab === 'rentals' ? '#FFF' : '#1A4A4A'} />
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

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: '#FFF', borderRadius: 14, padding: 16, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginTop: 4 },
  statLabel: { fontSize: 13, color: '#888' },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 20,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A', paddingVertical: 0 },

  // Section headers
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  sectionBadge: {
    backgroundColor: '#1A4A4A', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  sectionBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },

  divider: { height: 1, backgroundColor: '#E5E5E0', marginVertical: 16 },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: '#AAA' },

  // Order cards
  orderCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 16, marginBottom: 12,
  },
  requestedCard: {
    borderLeftWidth: 3, borderLeftColor: '#4338CA',
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  orderId: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  orderMeta: { fontSize: 13, color: '#888', marginBottom: 4 },
  orderAddr: { fontSize: 12, color: '#888', marginBottom: 4 },
  orderAmount: { fontSize: 15, fontWeight: '700', color: '#1A4A4A', marginBottom: 12 },
  riderInfo: { fontSize: 13, color: '#0F6E56', fontWeight: '500', marginTop: 4 },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#DC2626', alignItems: 'center',
  },
  acceptBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1A4A4A', alignItems: 'center',
  },
  pickupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 10, backgroundColor: '#4338CA', marginTop: 4,
  },
  pickupText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  btnDisabled: { opacity: 0.5 },
  rejectText: { color: '#DC2626', fontWeight: '600' },
  acceptText: { color: '#FFF', fontWeight: '600' },

  completedCard: {
    borderLeftWidth: 3, borderLeftColor: '#166534',
  },
  completedFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
  },
  completedEarned: {
    fontSize: 13, fontWeight: '600', color: '#166534',
  },
  waitingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', paddingVertical: 10,
  },
  waitingText: { color: '#4338CA', fontWeight: '500', fontSize: 13 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderTopWidth: 1, borderTopColor: '#E5E5E0', backgroundColor: '#F2F2F0',
  },
  bottomBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#1A4A4A',
  },
  bottomBtnFilled: { backgroundColor: '#1A4A4A' },
  bottomBtnLabel: { fontSize: 14, fontWeight: '600', color: '#1A4A4A' },
  bottomBtnLabelFilled: { fontSize: 14, fontWeight: '600', color: '#FFF' },
});

