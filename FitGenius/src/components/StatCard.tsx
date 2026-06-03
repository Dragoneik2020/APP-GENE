import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  value: number;
  label: string;
  color: string;
  icon?: string;
}

export default function StatCard({ value, label, color, icon }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  label: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
    textAlign: 'center',
  },
});
