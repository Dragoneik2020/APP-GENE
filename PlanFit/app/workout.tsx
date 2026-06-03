import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '../src/styles';
import api from '../src/services/api';

export default function WorkoutScreen() {
  const { id, name, weight, count } = useLocalSearchParams();
  const router = useRouter();
  const exerciseId = parseInt(id as string);
  const [sets, setSets] = useState<any[]>([]);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (exerciseId) {
      loadSets();
      checkLike();
    }
  }, [exerciseId]);

  const loadSets = async () => {
    try {
      const res = await api.getSets(exerciseId);
      setSets(res.data?.sets || []);
    } catch (e) { console.error(e); }
  };

  const checkLike = async () => {
    try {
      const res = await api.getExercises();
      const ex = res.data?.exercises?.find((e: any) => e.id === exerciseId);
      setIsLiked(ex?.is_like === 1);
    } catch (e) {}
  };

  const toggleLike = async () => {
    if (isLiked) await api.unlikeExercise(exerciseId);
    else await api.likeExercise(exerciseId);
    setIsLiked(!isLiked);
  };

  const completeSet = async () => {
    await api.completeSet(exerciseId);
    loadSets();
  };

  const addSet = async () => {
    await api.addSet(exerciseId);
    loadSets();
  };

  const doneCount = sets.filter((s: any) => s.is_done).length;
  const totalCount = sets.length;
  const allDone = sets.length > 0 && doneCount === totalCount;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleLike}>
          <Text style={styles.likeBtn}>{isLiked ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseHeader}>
        <Text style={styles.exName}>{decodeURIComponent((name as string) || '')}</Text>
        <Text style={styles.exStats}>{weight} kg × {count} reps</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>Progreso</Text>
        <Text style={styles.progressCount}>{doneCount} / {totalCount} series</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: totalCount > 0 ? `${(doneCount / totalCount) * 100}%` : '0%' }]} />
        </View>
      </View>

      <View style={styles.setsGrid}>
        {sets.map((set: any, i: number) => (
          <View key={set.id} style={[styles.setCircle, set.is_done && styles.setDone]}>
            <Text style={[styles.setNumber, set.is_done && styles.setNumberDone]}>
              {set.is_done ? '✓' : i + 1}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.actionBtn, allDone ? styles.completedBtn : styles.primaryBtn]}
        onPress={allDone ? () => router.back() : completeSet}
      >
        <Text style={styles.actionBtnText}>
          {allDone ? 'Completado - Volver' : 'Marcar Serie'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
        <Text style={styles.addSetText}>+ Agregar serie extra</Text>
      </TouchableOpacity>

      {allDone && (
        <View style={styles.celebration}>
          <Text style={styles.celebrationText}>¡Ejercicio completado! 🔥</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backBtn: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  likeBtn: { fontSize: 28 },
  exerciseHeader: { marginBottom: 24 },
  exName: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  exStats: { fontSize: 16, color: colors.textSecondary, marginTop: 8 },
  progressCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginBottom: 24 },
  progressLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  progressCount: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: colors.surfaceLight, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: 4 },
  setsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, justifyContent: 'center' },
  setCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#3D3D3D' },
  setDone: { backgroundColor: colors.success, borderColor: colors.success },
  setNumber: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  setNumberDone: { color: '#FFF' },
  actionBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  primaryBtn: { backgroundColor: colors.primary },
  completedBtn: { backgroundColor: colors.success },
  actionBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  addSetBtn: { backgroundColor: colors.surfaceLight, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  addSetText: { color: colors.textSecondary, fontSize: 16 },
  celebration: { backgroundColor: colors.success, borderRadius: 16, padding: 16, alignItems: 'center' },
  celebrationText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
