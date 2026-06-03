import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../../src/styles';
import api from '../../src/services/api';

export default function WarmupScreen() {
  const [warmups, setWarmups] = useState<any[]>([]);

  useEffect(() => {
    api.getWarmups().then(res => setWarmups(res.data?.warmups || [])).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Calentamiento</Text>
      <Text style={styles.subtitle}>Prepara tu cuerpo para el entrenamiento</Text>

      {warmups.map((w, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardNum}>{(i + 1).toString().padStart(2, '0')}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{w.name}</Text>
              <Text style={styles.cardDuration}>{w.duration}</Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <Text style={styles.timerIcon}>⏱️</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 24 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardNum: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
  cardInfo: {},
  cardName: { fontSize: 16, fontWeight: '600', color: colors.text },
  cardDuration: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardRight: {},
  timerIcon: { fontSize: 24 },
});
