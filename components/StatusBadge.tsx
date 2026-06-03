import { StyleSheet, Text, View } from 'react-native';

interface StatusBadgeProps {
  label: string;
}

export default function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  text: { color: '#1D4ED8', fontSize: 12, fontWeight: '600' },
});
