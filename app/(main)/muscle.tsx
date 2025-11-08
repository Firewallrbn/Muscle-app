import { StyleSheet, Text, View } from 'react-native';

export default function MuscleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Muscle</Text>
      <Text style={styles.subtitle}>Explora grupos musculares y ejercicios.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
});
