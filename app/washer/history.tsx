import { StyleSheet, Text, View } from 'react-native';

export default function WasherHistory() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Past Orders</Text>
      <Text style={styles.text}>Processed orders history will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  text: { color: '#475569', fontSize: 15 },
});
