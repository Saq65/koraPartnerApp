import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const ITEM_EMOJIS = ['👗', '👘', '🤵', '🧥', '👔', '🎽', '👖', '🩳'];
const CATEGORIES = ['Ethnic', 'Western', 'Party', 'Formal', 'Casual'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'];

export default function AddRentalItem() {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('Ethnic');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [deposit, setDeposit] = useState('');

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Rental Item</Text>
      </View>

      <ScrollView
        style={styles.scrollFlex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* Item Image */}
        <Text style={styles.label}>Item Image</Text>
        <View style={styles.emojiGrid}>
          {ITEM_EMOJIS.map((emoji, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.emojiBox, selectedEmoji === i && styles.emojiBoxActive]}
              onPress={() => setSelectedEmoji(i)}
              activeOpacity={0.7}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Item Name */}
        <Text style={styles.label}>Item Name <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Designer Lehenga"
          placeholderTextColor="#BBBBBB"
          value={itemName}
          onChangeText={setItemName}
        />

        {/* Category */}
        <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, selectedCategory === cat && styles.chipActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Price & Deposit */}
        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Price/Day (₹) <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="1200"
              placeholderTextColor="#BBBBBB"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Deposit (₹) <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="2000"
              placeholderTextColor="#BBBBBB"
              keyboardType="numeric"
              value={deposit}
              onChangeText={setDeposit}
            />
          </View>
        </View>

        {/* Available Sizes */}
        <Text style={styles.label}>Available Sizes <Text style={styles.required}>*</Text></Text>
        <View style={styles.chipRow}>
          {SIZES.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.chip, selectedSizes.includes(size) && styles.chipActive]}
              onPress={() => toggleSize(size)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, selectedSizes.includes(size) && styles.chipTextActive]}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Add Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.addBtn,
            !(itemName && price && deposit && selectedSizes.length) && styles.addBtnDisabled,
          ]}
          activeOpacity={0.85}
          disabled={!(itemName && price && deposit && selectedSizes.length)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Item</Text>
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

  scrollFlex: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 16 },

  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 8 },
  required: { color: '#DC2626' },

  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  emojiBox: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: '#E5E5E0',
    justifyContent: 'center', alignItems: 'center',
  },
  emojiBoxActive: { borderColor: '#1A4A4A', borderWidth: 2, backgroundColor: '#E8F7F3' },
  emoji: { fontSize: 26 },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1, borderColor: '#E5E5E0',
    paddingHorizontal: 14, height: 48,
    fontSize: 15, color: '#1A1A1A',
    marginBottom: 18,
  },

  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1, borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: '#1A4A4A', borderColor: '#1A4A4A' },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '600' },

  footer: {
    padding: 16,
    borderTopWidth: 1, borderTopColor: '#E5E5E0',
    backgroundColor: '#F2F2F0',
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    backgroundColor: '#1A4A4A',
    borderRadius: 14, paddingVertical: 15,
  },
  addBtnDisabled: { backgroundColor: '#A0BFBF' },
  addBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});