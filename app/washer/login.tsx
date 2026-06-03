import { StyleSheet, Text, View } from 'react-native';

export default function WasherLogin() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Washer Login</Text>
      <Text style={styles.text}>This screen will handle washer authentication.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F8FAFC' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  text: { color: '#475569', fontSize: 15 },
});
