import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/styles';
import api from '../../src/services/api';

const CONDITIONS = [
  { value: 'Best', label: 'Óptimo', emoji: '⚡', color: '#00B894' },
  { value: 'Good', label: 'Bueno', emoji: '👍', color: '#4A90FF' },
  { value: 'Heavy', label: 'Pesado', emoji: '🏋️', color: '#FDCB6E' },
  { value: 'Tired', label: 'Cansado', emoji: '😮‍💨', color: '#E17055' },
  { value: 'Bad', label: 'Mal', emoji: '😫', color: '#D63031' },
];

export default function HomeScreen() {
  const [settings, setSettings] = useState({ round: 1, minute: 30, condition: 'Good' });
  const router = useRouter();

  useEffect(() => { loadMain(); }, []);

  const loadMain = async () => {
    try {
      const res = await api.getMain();
      if (res.data) setSettings(res.data);
    } catch (e) { console.error(e); }
  };

  const updateSetting = async (minute?: number, condition?: string) => {
    try {
      const res = await api.updateMain(minute ?? settings.minute, condition ?? settings.condition);
      if (res.data) setSettings(res.data);
    } catch (e) { console.error(e); }
  };

  const adjustMinute = (delta: number) => {
    const newMin = Math.max(5, Math.min(59, settings.minute + delta));
    setSettings(s => ({ ...s, minute: newMin }));
    updateSetting(newMin, undefined);
  };

  const selectCondition = (c: string) => {
    setSettings(s => ({ ...s, condition: c }));
    updateSetting(undefined, c);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>PlanFit</Text>
      <Text style={styles.subtitle}>Tu entrenador personal</Text>

      <View style={styles.roundCard}>
        <Text style={styles.roundLabel}>RONDA</Text>
        <Text style={styles.roundNumber}>{settings.round}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Duración (minutos)</Text>
        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => adjustMinute(-5)}>
            <Text style={styles.pickerBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.pickerValue}>{settings.minute}</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => adjustMinute(5)}>
            <Text style={styles.pickerBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Condición física</Text>
        <View style={styles.conditionRow}>
          {CONDITIONS.map(c => (
            <TouchableOpacity
              key={c.value}
              style={[styles.conditionBtn, settings.condition === c.value && { backgroundColor: c.color, borderColor: c.color }]}
              onPress={() => selectCondition(c.value)}
            >
              <Text style={styles.conditionEmoji}>{c.emoji}</Text>
              <Text style={[styles.conditionLabel, settings.condition === c.value && { color: '#FFF', fontWeight: 'bold' }]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={() => router.push('/(tabs)/exercises')}>
        <Text style={styles.startButtonText}>Comenzar Entrenamiento</Text>
      </TouchableOpacity>

      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/warmup')}>
          <Text style={styles.quickIcon}>🧘</Text>
          <Text style={styles.quickLabel}>Calentar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(tabs)/more')}>
          <Text style={styles.quickIcon}>⏱️</Text>
          <Text style={styles.quickLabel}>Cronómetro</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  greeting: { fontSize: 32, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 24 },
  roundCard: { backgroundColor: colors.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20 },
  roundLabel: { fontSize: 14, color: '#FFF', opacity: 0.8, letterSpacing: 2 },
  roundNumber: { fontSize: 56, fontWeight: 'bold', color: '#FFF', marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 16 },
  cardLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, fontWeight: '600' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  pickerBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' },
  pickerBtnText: { fontSize: 24, color: colors.text, fontWeight: 'bold' },
  pickerValue: { fontSize: 40, fontWeight: 'bold', color: colors.text, minWidth: 60, textAlign: 'center' },
  conditionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  conditionBtn: { flex: 1, backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  conditionEmoji: { fontSize: 20, marginBottom: 4 },
  conditionLabel: { fontSize: 10, color: colors.textSecondary, textAlign: 'center' },
  startButton: { backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  startButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  quickRow: { flexDirection: 'row', gap: 12 },
  quickBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: 20, alignItems: 'center' },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontSize: 14, color: colors.text, fontWeight: '600' },
});
