import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import api from '../../src/services/api';

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [duration, setDuration] = useState('30');
  const [difficulty, setDifficulty] = useState('medium');
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [workoutsData, exercisesData] = await Promise.all([
        api.getCustomWorkouts(),
        api.getExercises(),
      ]);
      setWorkouts(workoutsData);
      setExercises(exercisesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addExercise = (exercise: any) => {
    const exists = selectedExercises.find((e) => e.id === exercise.id);
    if (!exists) {
      setSelectedExercises([
        ...selectedExercises,
        { ...exercise, sets: 3, reps: '10' },
      ]);
    }
  };

  const removeExercise = (id: number) => {
    setSelectedExercises(selectedExercises.filter((e) => e.id !== id));
  };

  const updateExercise = (id: number, field: string, value: string) => {
    setSelectedExercises(
      selectedExercises.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      )
    );
  };

  const saveWorkout = async () => {
    if (!workoutName) {
      Alert.alert('Error', 'Ingresa un nombre para el entrenamiento');
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un ejercicio');
      return;
    }

    setLoading(true);
    try {
      await api.createCustomWorkout({
        name: workoutName,
        exercises: selectedExercises.map((e) => ({
          name: e.name,
          sets: parseInt(e.sets.toString()),
          reps: e.reps,
          muscle_group: e.muscle_group,
        })),
        duration_minutes: parseInt(duration),
        difficulty,
      });
      Alert.alert('¡Éxito!', 'Entrenamiento guardado');
      setShowForm(false);
      setWorkoutName('');
      setSelectedExercises([]);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkout = async (id: number) => {
    Alert.alert(
      'Eliminar entrenamiento',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCustomWorkout(id);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Entrenamientos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.addButtonText}>{showForm ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Crear Entrenamiento</Text>

          <Text style={styles.label}>Nombre del entrenamiento</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Push Day, Full Body..."
            placeholderTextColor="#666"
            value={workoutName}
            onChangeText={setWorkoutName}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Duración (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="30"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Dificultad</Text>
              <View style={styles.difficultyRow}>
                {['easy', 'medium', 'hard'].map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.difficultyButton,
                      difficulty === d && styles.difficultyActive,
                      { backgroundColor: difficulty === d ? getDifficultyColor(d) : '#2D2D2D' },
                    ]}
                    onPress={() => setDifficulty(d)}
                  >
                    <Text style={[styles.difficultyText, difficulty === d && styles.difficultyTextActive]}>
                      {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Medio' : 'Difícil'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.label}>Selecciona ejercicios</Text>
          <View style={styles.exercisesList}>
            {exercises.map((exercise: any) => (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseItem,
                  selectedExercises.find((e) => e.id === exercise.id) && styles.exerciseItemSelected,
                ]}
                onPress={() => addExercise(exercise)}
              >
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMuscle}>{exercise.muscle_group}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedExercises.length > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={styles.label}>Ejercicios seleccionados:</Text>
              {selectedExercises.map((ex) => (
                <View key={ex.id} style={styles.selectedExercise}>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>{ex.name}</Text>
                    <View style={styles.setsRepsRow}>
                      <TextInput
                        style={styles.smallInput}
                        value={ex.sets.toString()}
                        onChangeText={(v) => updateExercise(ex.id, 'sets', v)}
                        keyboardType="numeric"
                      />
                      <Text style={styles.xText}>x</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={ex.reps}
                        onChangeText={(v) => updateExercise(ex.id, 'reps', v)}
                      />
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => removeExercise(ex.id)}>
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.buttonDisabled]}
            onPress={saveWorkout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Guardar Entrenamiento</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Mis Entrenamientos</Text>
      {workouts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No tienes entrenamientos creados</Text>
          <Text style={styles.emptySubtext}>Crea uno personalizado con tus ejercicios favoritos</Text>
        </View>
      ) : (
        workouts.map((workout: any) => (
          <TouchableOpacity
            key={workout.id}
            style={styles.workoutCard}
            onLongPress={() => deleteWorkout(workout.id)}
          >
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutName}>{workout.name}</Text>
              <View style={styles.workoutMeta}>
                <Text style={styles.workoutDuration}>{workout.duration_minutes} min</Text>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(workout.difficulty) }]}>
                  <Text style={styles.difficultyBadgeText}>{workout.difficulty}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.workoutExercises}>
              {workout.exercises.length} ejercicios: {workout.exercises.map((e: any) => e.name).join(', ')}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return '#00B894';
    case 'medium':
      return '#FDCB6E';
    case 'hard':
      return '#E17055';
    default:
      return '#666';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#B2BEC3',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  difficultyActive: {
    backgroundColor: '#FF6B35',
  },
  difficultyText: {
    color: '#666',
    fontSize: 12,
  },
  difficultyTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  exercisesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  exerciseItem: {
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  exerciseItemSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#3D2D2D',
  },
  exerciseName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  exerciseMuscle: {
    color: '#B2BEC3',
    fontSize: 11,
    marginTop: 2,
  },
  selectedContainer: {
    marginTop: 16,
  },
  selectedExercise: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  setsRepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  smallInput: {
    backgroundColor: '#3D3D3D',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    color: '#FFF',
    fontSize: 13,
    width: 50,
    textAlign: 'center',
  },
  xText: {
    color: '#B2BEC3',
    marginHorizontal: 6,
  },
  removeText: {
    color: '#E17055',
    fontSize: 18,
    fontWeight: 'bold',
    paddingLeft: 10,
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  workoutCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workoutDuration: {
    fontSize: 13,
    color: '#B2BEC3',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  workoutExercises: {
    fontSize: 13,
    color: '#B2BEC3',
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#444',
    textAlign: 'center',
  },
});
