import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../src/styles';
import api from '../../src/services/api';

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [exRes, availRes] = await Promise.all([api.getExercises(), api.getAvailableExercises()]);
      setExercises(exRes.data?.exercises || []);
      setAvailable(availRes.data?.exercises || []);
    } catch (e) { console.error(e); }
  };

  const moveItem = async (index: number, direction: -1 | 1) => {
    const newList = [...exercises];
    const target = index + direction;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    const reorder = newList.map((ex, i) => ({ id: ex.routine_id, index: i }));
    setExercises(newList);
    await api.reorderExercises(reorder);
  };

  const toggleLike = async (ex: any) => {
    if (ex.is_like) {
      await api.unlikeExercise(ex.id);
    } else {
      await api.likeExercise(ex.id);
    }
    load();
  };

  const addExercise = async (exerciseId: number) => {
    await api.addToRoutine(exerciseId);
    setShowAdd(false);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ejercicios</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {exercises.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Sin ejercicios aún</Text>
          <Text style={styles.emptySubtext}>Agrega desde el catálogo</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {exercises.map((ex, i) => (
            <TouchableOpacity key={ex.routine_id} style={styles.exCard} onPress={() => router.push(`/workout?id=${ex.id}&name=${encodeURIComponent(ex.name)}&weight=${ex.weight}&count=${ex.count}`)}>
              <View style={styles.exInfo}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Text style={styles.exMeta}>{ex.weight}kg × {ex.count} reps</Text>
                {ex.muscle_group && <Text style={styles.exMuscle}>{ex.muscle_group}</Text>}
              </View>
              <View style={styles.exActions}>
                <TouchableOpacity style={styles.moveBtn} onPress={() => moveItem(i, -1)} disabled={i === 0}>
                  <Text style={[styles.moveBtnText, i === 0 && { opacity: 0.3 }]}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moveBtn} onPress={() => moveItem(i, 1)} disabled={i === exercises.length - 1}>
                  <Text style={[styles.moveBtnText, i === exercises.length - 1 && { opacity: 0.3 }]}>▼</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleLike(ex)}>
                  <Text style={[styles.likeBtn, ex.is_like && { color: '#FF6B35' }]}>{ex.is_like ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <Modal visible={showAdd} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Agregar ejercicio</Text>
            <FlatList
              data={available}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.availItem} onPress={() => addExercise(item.id)}>
                  <Text style={styles.availName}>{item.name}</Text>
                  <Text style={styles.availMeta}>{item.muscle_group}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Todos agregados</Text>}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { fontSize: 24, color: '#FFF', fontWeight: 'bold' },
  list: { padding: 20, paddingTop: 0 },
  exCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' },
  exInfo: { flex: 1 },
  exName: { fontSize: 16, fontWeight: '600', color: colors.text },
  exMeta: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  exMuscle: { fontSize: 12, color: colors.primary, marginTop: 2 },
  exActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moveBtn: { padding: 4 },
  moveBtnText: { fontSize: 14, color: colors.textSecondary },
  likeBtn: { fontSize: 20 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: '#666', fontSize: 16 },
  emptySubtext: { color: '#555', fontSize: 13, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  availItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.surfaceLight },
  availName: { fontSize: 16, color: colors.text },
  availMeta: { fontSize: 14, color: colors.textSecondary },
  closeBtn: { backgroundColor: colors.surfaceLight, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  closeBtnText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
