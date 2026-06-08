import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { navigate } from 'expo-router/build/global-state/routing';

const STATS = [
  { value: '3', label: 'Total' },
  { value: '2', label: 'Active' },
  { value: '1', label: 'Rented' },
];

const FILTER_TABS = ['All', 'Active', 'Rented', 'Inactive'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#E8F7F3', text: '#0F6E56' },
  rented: { bg: '#EEF2FF', text: '#4338CA' },
  inactive: { bg: '#F1F5F9', text: '#475569' },
};

const ITEMS = [
  {
    id: '1', emoji: '👘', name: 'Designer Sherwani', category: 'Ethnic',
    price: '₹1200/day', deposit: '₹2000', sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.8, status: 'active', canDeactivate: true,
  },
  {
    id: '2', emoji: '👗', name: 'Silk Saree', category: 'Ethnic',
    price: '₹800/day', deposit: '₹1500', sizes: ['Free'],
    rating: 4.9, status: 'rented', canDeactivate: false,
  },
  {
    id: '3', emoji: '🤵', name: 'Tuxedo Suit', category: 'Formal',
    price: '₹1500/day', deposit: '₹3000', sizes: ['M', 'L', 'XL'],
    rating: 4.7, status: 'active', canDeactivate: true,
  },
];

export default function Rentals() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage clothes for rent</Text>
        <View style={styles.notifDot}>
          <Ionicons name="notifications-outline" size={20} color="#fff" />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statBox}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTER_TABS.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, i === 0 && styles.filterTabActive]}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, i === 0 && styles.filterTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {ITEMS.map((item) => {
          const badge = STATUS_COLORS[item.status];
          return (
            <View key={item.id} style={styles.card}>
              {/* Top Row */}
              <View style={styles.cardTop}>
                <View style={styles.itemEmoji}>
                  <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <View style={styles.itemNameRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>{item.price}</Text>
                    <Text style={styles.itemDeposit}>  Deposit: {item.deposit}</Text>
                  </View>
                  <View style={styles.sizesRow}>
                    {item.sizes.map((sz) => (
                      <View key={sz} style={styles.sizeBox}>
                        <Text style={styles.sizeText}>{sz}</Text>
                      </View>
                    ))}
                    <View style={styles.ratingBox}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="create-outline" size={15} color="#555" />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons
                    name={item.canDeactivate ? 'eye-off-outline' : 'eye-outline'}
                    size={15}
                    color="#555"
                  />
                  <Text style={styles.actionText}>
                    {item.canDeactivate ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={15} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add Button */}
      <View style={styles.addWrap}>
        <TouchableOpacity onPress={()=>navigate('/washer/rentals/rentalItem')} style={styles.addBtn} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addText}>Add New Rental Item</Text>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  notifDot: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1A4A4A',
    justifyContent: 'center', alignItems: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },

  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E0',
  },
  filterTabActive: { backgroundColor: '#1A4A4A', borderColor: '#1A4A4A' },
  filterText: { fontSize: 13, color: '#888', fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '600' },

  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  itemEmoji: {
    width: 60, height: 60, borderRadius: 12,
    backgroundColor: '#F5F5F3',
    justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: { flex: 1 },
  itemNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', flex: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  itemCategory: { fontSize: 12, color: '#888', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  itemDeposit: { fontSize: 12, color: '#888' },
  sizesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  sizeBox: {
    borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2,
  },
  sizeText: { fontSize: 11, color: '#555', fontWeight: '500' },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 'auto' },
  ratingText: { fontSize: 12, fontWeight: '600', color: '#1A1A1A' },

  divider: { height: 1, backgroundColor: '#F0F0EE', marginVertical: 12 },

  actions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionText: { fontSize: 13, color: '#555', fontWeight: '500' },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },

  addWrap: { padding: 16, borderTopWidth: 1, borderTopColor: '#E5E5E0' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1A4A4A',
    borderRadius: 14,
    paddingVertical: 15,
  },
  addText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});