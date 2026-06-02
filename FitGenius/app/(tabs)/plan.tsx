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
import { useRouter } from 'expo-router';
import api from '../../src/services/api';

export default function PlanScreen() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [goals, setGoals] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('4');
  const [sessionDuration, setSessionDuration] = useState('60');
  const [equipment, setEquipment] = useState('Gimnasio completo');
  const [limitations, setLimitations] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadPlans();
    
    const planId = router.query.planId;
    if (planId) {
      loadPlanDetails(parseInt(planId as string));
    }
  }, []);

  const loadPlanDetails = async (id: number) => {
    try {
      const plan = await api.getPlan(id);
      setSelectedPlan(plan);
    } catch (error) {
      console.error('Error loading plan details:', error);
    }
  };

  const loadPlans = async () => {
    try {
      const data = await api.getPlans();
      setPlans(data);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  const generatePlan = async () => {
    if (!goals) {
      Alert.alert('Error', 'Por favor ingresa tus objetivos');
      return;
    }

    setLoading(true);
    try {
      const plan = await api.generatePlan({
        goals,
        days_per_week: parseInt(daysPerWeek),
        session_duration: parseInt(sessionDuration),
        equipment,
        limitations,
      });
      setSelectedPlan(plan);
      setShowForm(false);
      loadPlans();
      Alert.alert('¡Éxito!', 'Tu plan ha sido generado con IA');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo generar el plan');
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id: number) => {
    Alert.alert(
      'Eliminar plan',
      '¿Estás seguro de que quieres eliminar este plan?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deletePlan(id);
              loadPlans();
              if (selectedPlan?.id === id) setSelectedPlan(null);
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
        <Text style={styles.title}>Planes de Entrenamiento</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
        >
          <Text style={styles.addButtonText}>{showForm ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Generar Plan con IA</Text>
          
          <Text style={styles.label}>¿Cuáles son tus objetivos?</Text>
          <TextInput
            style={styles.input}
            placeholder="Ganar masa muscular, perder peso, mejorar resistencia..."
            placeholderTextColor="#666"
            value={goals}
            onChangeText={setGoals}
            multiline
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Días por semana</Text>
              <TextInput
                style={styles.input}
                placeholder="4"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={daysPerWeek}
                onChangeText={setDaysPerWeek}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Duración (min)</Text>
              <TextInput
                style={styles.input}
                placeholder="60"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={sessionDuration}
                onChangeText={setSessionDuration}
              />
            </View>
          </View>

          <Text style={styles.label}>Equipamiento disponible</Text>
          <TextInput
            style={styles.input}
            placeholder="Gimnasio completo, casa, etc."
            placeholderTextColor="#666"
            value={equipment}
            onChangeText={setEquipment}
          />

          <Text style={styles.label}>Limitaciones o lesiones</Text>
          <TextInput
            style={styles.input}
            placeholder="Ninguna, lesión en rodilla, etc."
            placeholderTextColor="#666"
            value={limitations}
            onChangeText={setLimitations}
          />

          <TouchableOpacity
            style={[styles.generateButton, loading && styles.buttonDisabled]}
            onPress={generatePlan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.generateButtonText}>🤖 Generar Plan con IA</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {selectedPlan && (
        <View style={styles.planDetailCard}>
          <Text style={styles.planDetailTitle}>{selectedPlan.plan_name}</Text>
          <Text style={styles.planDescription}>{selectedPlan.description}</Text>
          
          {selectedPlan.weeks && selectedPlan.weeks.length > 0 && (
            <View style={styles.weeksContainer}>
              {selectedPlan.weeks.map((week: any) => (
                <View key={week.week_number} style={styles.weekCard}>
                  <Text style={styles.weekTitle}>Semana {week.week_number}</Text>
                  {week.days.map((day: any, idx: number) => (
                    <View key={idx} style={styles.dayCard}>
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayName}>{day.day_name}</Text>
                        <View style={[
                          styles.dayTypeBadge,
                          { backgroundColor: day.day_type === 'cardio' ? '#E17055' : '#6C5CE7' }
                        ]}>
                          <Text style={styles.dayTypeText}>{day.day_type}</Text>
                        </View>
                      </View>
                      {day.exercises && day.exercises.map((ex: any, exIdx: number) => (
                        <View key={exIdx} style={styles.exerciseRow}>
                          <Text style={styles.exerciseName}>{ex.name}</Text>
                          <Text style={styles.exerciseDetail}>
                            {ex.sets}x{ex.reps} • {ex.rest_seconds}s descanso
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => {
              Alert.alert(
                'Programar desafío',
                'Selecciona la fecha y hora para tu entrenamiento',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Hoy', onPress: () => scheduleChallengeForToday(selectedPlan.id) },
                  { text: 'Otro día', onPress: () => router.push('/(tabs)/challenges') },
                ]
              );
            }}
          >
            <Text style={styles.scheduleButtonText}>📅 Programar Entrenamiento</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Mis Planes</Text>
      {plans.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No tienes planes aún</Text>
          <Text style={styles.emptySubtext}>Crea uno con IA o programa entrenamientos</Text>
        </View>
      ) : (
        plans.map((plan: any) => (
          <TouchableOpacity
            key={plan.id}
            style={styles.planCard}
            onPress={() => setSelectedPlan(plan)}
            onLongPress={() => deletePlan(plan.id)}
          >
            <View style={styles.planCardHeader}>
              <Text style={styles.planCardTitle}>{plan.name}</Text>
              {plan.is_ai_generated === 1 && (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>IA</Text>
                </View>
              )}
            </View>
            <Text style={styles.planCardDescription}>{plan.description}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  async function scheduleChallengeForToday(planId: number) {
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      await api.scheduleChallenge({
        workout_plan_id: planId,
        challenge_date: now.toISOString().split('T')[0],
        scheduled_time: timeStr,
      });
      Alert.alert('¡Programado!', 'Tu entrenamiento ha sido programado para hoy');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
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
  generateButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  planDetailCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  planDetailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#B2BEC3',
    marginBottom: 20,
  },
  weeksContainer: {
    gap: 16,
  },
  weekCard: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 16,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 12,
  },
  dayCard: {
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  dayTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayTypeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#3D3D3D',
  },
  exerciseName: {
    fontSize: 13,
    color: '#FFF',
  },
  exerciseDetail: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  scheduleButton: {
    backgroundColor: '#00B894',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  scheduleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  aiBadge: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planCardDescription: {
    fontSize: 13,
    color: '#B2BEC3',
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
  },
});
