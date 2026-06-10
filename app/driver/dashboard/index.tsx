import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';

const API_BASE  = 'http://192.168.1.48:5000/api';
const SOCKET_URL = 'http://192.168.1.48:5000';

type RiderOrderStatus = 'pending' | 'accepted' | 'rejected' | 'picked_up' | 'delivered';
type ActiveTab = 'orders' | 'history';

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
  pending:   { bg: '#FFF4E5', text: '#B45309' },
  accepted:  { bg: '#E8F7F3', text: '#0F6E56' },
  rejected:  { bg: '#FEE2E2', text: '#DC2626' },
  picked_up: { bg: '#EEF2FF', text: '#4338CA' },
  delivered: { bg: '#F0FDF4', text: '#166534' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function RiderDashboard() {
  const router = useRouter();
  const [orders, setOrders]             = useState<RiderOrder[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<ActiveTab>('orders');
  const [search, setSearch]             = useState('');
  const socketRef      = useRef<Socket | null>(null);
  const appStateRef    = useRef(AppState.currentState);
  const isFirstConnect = useRef(true);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const token = await AsyncStorage.getItem('rider_token');
      const res   = await axios.get(`${API_BASE}/riders/orders/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fresh = res.data.data || [];
      setOrders(prev => {
        const merged = fresh.map((o: RiderOrder) => {
          const existing = prev.find(p => p._id === o._id);
          return existing ? { ...o, riderStatus: existing.riderStatus } : o;
        });
        const deliveredOnly = prev.filter(
          p => p.riderStatus === 'delivered' && !fresh.find((f: RiderOrder) => f._id === p._id)
        );
        return [...merged, ...deliveredOnly].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    } catch (err) {
      console.log('Fetch rider orders error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const setupSocket = useCallback(async () => {
    const token     = await AsyncStorage.getItem('rider_token');
    const riderInfo = await AsyncStorage.getItem('rider_info');
    const rider     = riderInfo ? JSON.parse(riderInfo) : null;
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('[Socket] Rider connected:', socket.id);
      socket.emit('join_rider_room', { riderId: rider?._id ?? rider?.id });
      if (isFirstConnect.current) {
        isFirstConnect.current = false;
        fetchOrders(true);
      }
    });

    socket.on('new_rider_order', (order: RiderOrder) => {
      console.log('[Socket] New rider order:', order.orderNumber);
      setOrders(prev => {
        if (prev.find(o => o._id === order._id)) return prev;
        return [{ ...order, riderStatus: 'pending' }, ...prev];
      });
    });

    socket.on('pickup_rider_needed', (order: RiderOrder) => {
      console.log('[Socket] Pickup needed for order:', order.orderNumber);
      setOrders(prev => {
        if (prev.find(o => o._id === order._id)) return prev;
        return [{ ...order, riderStatus: 'pending' }, ...prev];
      });
    });

    socket.on('connect_error', err => console.log('[Socket] Rider connection error:', err.message));
    socket.on('disconnect', reason => console.log('[Socket] Rider disconnected:', reason));
    socketRef.current = socket;
  }, [fetchOrders]);

  const onRefresh = useCallback(() => fetchOrders(true), [fetchOrders]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        fetchOrders(true);
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [fetchOrders]);

  useEffect(() => {
    fetchOrders();
    setupSocket();
    return () => { socketRef.current?.disconnect(); socketRef.current = null; };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleAccept = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await AsyncStorage.getItem('rider_token');
      await axios.post(`${API_BASE}/riders/orders/${orderId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, riderStatus: 'accepted' } : o));
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
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, riderStatus: 'rejected' } : o));
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
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, riderStatus: 'picked_up' } : o));
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
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, riderStatus: 'delivered' } : o));
      setActiveTab('history');
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

  // ── Derived data ──────────────────────────────────────────────────────────
  const filteredOrders = search.trim()
    ? orders.filter(o =>
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.pickupAddress?.address?.toLowerCase().includes(search.toLowerCase()) ||
        o.deliveryAddress?.address?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  const activeOrders    = filteredOrders.filter(o => o.riderStatus !== 'delivered');
  const deliveredOrders = filteredOrders.filter(o => o.riderStatus === 'delivered');

  const pendingCount   = orders.filter(o => !o.riderStatus || o.riderStatus === 'pending').length;
  const acceptedCount  = orders.filter(o => o.riderStatus === 'accepted' || o.riderStatus === 'picked_up').length;
  const deliveredCount = orders.filter(o => o.riderStatus === 'delivered').length;
  const totalRevenue   = orders.filter(o => o.riderStatus === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0);

  const todayStr     = new Date().toDateString();
  const todayRevenue = orders
    .filter(o => o.riderStatus === 'delivered' && new Date(o.createdAt).toDateString() === todayStr)
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const todayCount = orders.filter(
    o => o.riderStatus === 'delivered' && new Date(o.createdAt).toDateString() === todayStr
  ).length;

  const STATS = [
    { value: String(pendingCount),  label: 'Pending'   },
    { value: String(acceptedCount), label: 'Active'    },
    { value: `₹${totalRevenue}`,    label: 'Earned'    },
    { value: String(deliveredCount),label: 'Delivered' },
  ];

  // ── Search bar component (reused in both tabs) ────────────────────────────
  const SearchBar = ({ placeholder }: { placeholder: string }) => (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={16} color="#888" />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#AAA"
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />
      {search.length > 0 && (
        <TouchableOpacity onPress={() => setSearch('')}>
          <Ionicons name="close-circle" size={16} color="#AAA" />
        </TouchableOpacity>
      )}
    </View>
  );

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
        {STATS.map(s => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => { setActiveTab('orders'); setSearch(''); }}
        >
          <Ionicons name="bicycle-outline" size={15} color={activeTab === 'orders' ? '#1A4A4A' : '#999'} style={{ marginRight: 5 }} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Orders {activeOrders.length > 0 ? `(${activeOrders.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => { setActiveTab('history'); setSearch(''); }}
        >
          <Ionicons name="receipt-outline" size={15} color={activeTab === 'history' ? '#1A4A4A' : '#999'} style={{ marginRight: 5 }} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            History {deliveredCount > 0 ? `(${deliveredCount})` : ''}
          </Text>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F9B72']} tintColor="#0F9B72" />
          }
        >

          {/* ── ORDERS TAB ── */}
          {activeTab === 'orders' && (
            <>
              <SearchBar placeholder="Search by order # or address..." />

              <Text style={styles.sectionTitle}>
                Assigned Orders {activeOrders.length > 0 && `(${activeOrders.length})`}
              </Text>

              {activeOrders.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="bicycle-outline" size={40} color="#CCC" />
                  <Text style={styles.emptyText}>
                    {search.trim() ? 'No results found' : 'No orders assigned yet'}
                  </Text>
                </View>
              ) : (
                activeOrders.map(order => {
                  const riderStatus = order.riderStatus || 'pending';
                  const badge       = STATUS_COLORS[riderStatus] ?? STATUS_COLORS.pending;
                  const isActioning = actionLoading === order._id;
                  const address     = order.type === 'Pickup'
                    ? order.pickupAddress?.address
                    : order.deliveryAddress?.address;

                  return (
                    <View key={order._id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <View style={[styles.iconBox, { backgroundColor: order.type === 'Delivery' ? '#E8F7F3' : '#EEF2FF' }]}>
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

                      <Text style={styles.orderAddr}>📍 {address ?? '—'}</Text>
                      <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>

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

                      {riderStatus === 'rejected' && (
                        <View style={styles.deliveredRow}>
                          <Ionicons name="close-circle" size={16} color="#DC2626" />
                          <Text style={[styles.deliveredText, { color: '#DC2626' }]}>Order Rejected</Text>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <>
              {/* Earnings Summary */}
              <View style={styles.earningsCard}>
                <Text style={styles.earningsTitle}>💰 Earnings Summary</Text>
                <View style={styles.earningsRow}>
                  <View style={styles.earningsStat}>
                    <Text style={styles.earningsAmount}>₹{totalRevenue}</Text>
                    <Text style={styles.earningsLabel}>Total Earned</Text>
                  </View>
                  <View style={styles.earningsDivider} />
                  <View style={styles.earningsStat}>
                    <Text style={styles.earningsAmount}>₹{todayRevenue}</Text>
                    <Text style={styles.earningsLabel}>Today</Text>
                  </View>
                  <View style={styles.earningsDivider} />
                  <View style={styles.earningsStat}>
                    <Text style={styles.earningsAmount}>{todayCount}</Text>
                    <Text style={styles.earningsLabel}>Today's Drops</Text>
                  </View>
                </View>
              </View>

              <SearchBar placeholder="Search delivered orders..." />

              <Text style={styles.sectionTitle}>
                Delivered Orders {deliveredOrders.length > 0 && `(${deliveredOrders.length})`}
              </Text>

              {deliveredOrders.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Ionicons name="receipt-outline" size={40} color="#CCC" />
                  <Text style={styles.emptyText}>
                    {search.trim() ? 'No results found' : 'No deliveries yet'}
                  </Text>
                  {!search.trim() && <Text style={styles.emptySubText}>Completed orders will appear here</Text>}
                </View>
              ) : (
                deliveredOrders.map(order => {
                  const address = order.type === 'Pickup'
                    ? order.pickupAddress?.address
                    : order.deliveryAddress?.address;

                  return (
                    <View key={order._id} style={styles.historyCard}>
                      <View style={styles.historyCardTop}>
                        <View style={styles.historyLeft}>
                          <View style={styles.historyIconBox}>
                            <Ionicons
                              name={order.type === 'Delivery' ? 'car-outline' : 'cube-outline'}
                              size={18}
                              color="#0F6E56"
                            />
                          </View>
                          <View>
                            <Text style={styles.historyOrderId}>#{order.orderNumber}</Text>
                            <Text style={styles.historyType}>{order.type}</Text>
                          </View>
                        </View>
                        <View style={styles.historyRight}>
                          <Text style={styles.historyAmount}>+₹{order.totalAmount}</Text>
                          <View style={[styles.badge, { backgroundColor: '#F0FDF4' }]}>
                            <Text style={[styles.badgeText, { color: '#166534' }]}>Delivered</Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.historyMeta}>
                        <Text style={styles.historyAddr} numberOfLines={1}>📍 {address ?? '—'}</Text>
                        <View style={styles.historyDateTime}>
                          <Ionicons name="calendar-outline" size={11} color="#AAA" />
                          <Text style={styles.historyDate}>{formatDate(order.createdAt)}</Text>
                          <Ionicons name="time-outline" size={11} color="#AAA" style={{ marginLeft: 6 }} />
                          <Text style={styles.historyDate}>{formatTime(order.createdAt)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}

        </ScrollView>
      )}

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomBtn, styles.bottomBtnFilled]}>
          <Ionicons name="navigate-outline" size={18} color="#fff" />
          <Text style={styles.bottomBtnLabelFilled}>Start Route</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomBtn, activeTab === 'history' && { backgroundColor: '#F0FDF4', borderColor: '#0F6E56' }]}
          onPress={() => { setActiveTab(activeTab === 'history' ? 'orders' : 'history'); setSearch(''); }}
        >
          <Ionicons name="receipt-outline" size={18} color={activeTab === 'history' ? '#0F6E56' : '#1A4A4A'} />
          <Text style={[styles.bottomBtnLabel, activeTab === 'history' && { color: '#0F6E56' }]}>History</Text>
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
  headerSub:   { fontSize: 12, color: '#888', marginBottom: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  logout:      { fontSize: 13, color: '#DC2626', fontWeight: '600' },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },

  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 14,
    backgroundColor: '#E8E8E4', borderRadius: 12, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 10,
  },
  tabActive:     { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  tabText:       { fontSize: 13, fontWeight: '600', color: '#999' },
  tabTextActive: { color: '#1A4A4A' },

  scrollFlex: { flex: 1 },
  scroll:     { paddingHorizontal: 20, paddingBottom: 16 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A', paddingVertical: 0 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  emptyBox:     { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText:    { fontSize: 14, color: '#AAA', fontWeight: '600' },
  emptySubText: { fontSize: 12, color: '#CCC' },

  orderCard:   { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  iconBox:     { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  orderId:     { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  orderType:   { fontSize: 12, color: '#888' },
  badge:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:   { fontSize: 12, fontWeight: '600' },
  urgentBadge: { backgroundColor: '#FEF2F2', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  urgentText:  { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  orderAddr:   { fontSize: 12, color: '#888', marginBottom: 4 },
  orderAmount: { fontSize: 15, fontWeight: '700', color: '#1A4A4A', marginBottom: 12 },

  actionRow:     { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#DC2626', alignItems: 'center',
  },
  acceptBtn:     { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1A4A4A', alignItems: 'center' },
  actionFullBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 10, marginTop: 4,
  },
  btnDisabled:   { opacity: 0.5 },
  rejectText:    { color: '#DC2626', fontWeight: '600' },
  acceptText:    { color: '#FFF', fontWeight: '600' },
  deliveredRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 8 },
  deliveredText: { color: '#166534', fontWeight: '600', fontSize: 13 },

  earningsCard:    { backgroundColor: '#1A4A4A', borderRadius: 16, padding: 18, marginBottom: 16 },
  earningsTitle:   { fontSize: 13, fontWeight: '700', color: '#A8D5C8', marginBottom: 14 },
  earningsRow:     { flexDirection: 'row', alignItems: 'center' },
  earningsStat:    { flex: 1, alignItems: 'center' },
  earningsAmount:  { fontSize: 20, fontWeight: '800', color: '#FFFFFF', marginBottom: 3 },
  earningsLabel:   { fontSize: 11, color: '#A8D5C8', fontWeight: '500' },
  earningsDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' },

  historyCard:     { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10 },
  historyCardTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyIconBox:  { width: 38, height: 38, borderRadius: 10, backgroundColor: '#E8F7F3', justifyContent: 'center', alignItems: 'center' },
  historyOrderId:  { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  historyType:     { fontSize: 11, color: '#888', marginTop: 1 },
  historyRight:    { alignItems: 'flex-end', gap: 4 },
  historyAmount:   { fontSize: 16, fontWeight: '800', color: '#0F6E56' },
  historyMeta:     { borderTopWidth: 1, borderTopColor: '#F0F0EC', paddingTop: 10, gap: 5 },
  historyAddr:     { fontSize: 12, color: '#888', flex: 1 },
  historyDateTime: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  historyDate:     { fontSize: 11, color: '#AAA' },

  bottomBar: {
    flexDirection: 'row', gap: 12, padding: 16,
    borderTopWidth: 1, borderTopColor: '#E5E5E0', backgroundColor: '#F2F2F0',
  },
  bottomBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: '#1A4A4A',
  },
  bottomBtnFilled:      { backgroundColor: '#1A4A4A' },
  bottomBtnLabel:       { fontSize: 14, fontWeight: '600', color: '#1A4A4A' },
  bottomBtnLabelFilled: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});