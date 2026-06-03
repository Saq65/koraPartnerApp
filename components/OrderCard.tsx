import { StyleSheet, Text, View } from 'react-native';

interface OrderCardProps {
  title: string;
  subtitle?: string;
}

export default function OrderCard({ title, subtitle }: OrderCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#0F172A' },
  subtitle: { color: '#475569', marginTop: 4 },
});
