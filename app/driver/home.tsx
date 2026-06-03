import { StyleSheet, Text, View } from 'react-native';

export default function DriverHome() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assigned Pickups</Text>
      <Text style={styles.text}>Driver pickup and delivery tasks will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  text: { color: '#475569', fontSize: 15 },
});
