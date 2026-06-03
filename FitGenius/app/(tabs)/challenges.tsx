import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '../../src/services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function ChallengesScreen() {
  const router = useRouter();
  const [todayChallenges, setTodayChallenges] = useState([]);
  const [upcomingChallenges, setUpcomingChallenges] = useState([]);
  const [plans, setPlans] = useState([]);
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [selectedType, setSelectedType] = useState<'plan' | 'custom'>('plan');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    registerForPushNotifications();
    loadData();
  }, []);

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      Alert.alert('Aviso', 'Las notificaciones push requieren un dispositivo físico');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos permiso para enviar notificaciones');
      return;
    }

    const token = await Notifications.getExpoPushTokenAsync();
    await api.savePushToken(token.data);
  };

  const loadData = async () => {
    try {
      const [today, upcoming, plansData, workoutsData] = await Promise.all([
        api.getTodayChallenges(),
        api.getUpcomingChallenges(),
        api.getPlans(),
        api.getCustomWorkouts(),
      ]);
      setTodayChallenges(today);
      setUpcomingChallenges(upcoming);
      setPlans(plansData);
      setCustomWorkouts(workoutsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const scheduleChallenge = async () => {
    if (!selectedId) {
      Alert.alert('Error', 'Selecciona un entrenamiento');
      return;
    }

    try {
      const challengeData = {
        challenge_date: selectedDate,
        scheduled_time: selectedTime,
        ...(selectedType === 'plan'
          ? { workout_plan_id: selectedId }
          : { custom_workout_id: selectedId }),
      };

      await api.scheduleChallenge(challengeData);

      await scheduleNotification(
        `¡Hora de entrenar! 💪`,
        `Tu desafío está programado para las ${selectedTime}`,
        selectedDate,
        selectedTime
      );

      Alert.alert('¡Programado!', 'Tu desafío ha sido programado y recibirás una notificación');
      setShowScheduler(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const scheduleNotification = async (title: string, body: string, date: string, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const trigger = new Date();
    trigger.setFullYear(parseInt(date.split('-')[0]));
    trigger.setMonth(parseInt(date.split('-')[1]) - 1);
    trigger.setDate(parseInt(date.split('-')[2]));
    trigger.setHours(hours, minutes, 0, 0);

    if (trigger <= new Date()) {
      trigger.setDate(trigger.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger,
      },
    });
  };

  const completeChallenge = async (id: number) => {
    try {
      await api.completeChallenge(id);
      loadData();
      Alert.alert('¡Completado!', '¡Buen trabajo! Has completado tu desafío 🎉');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const deleteChallenge = async (id: number) => {
    Alert.alert(
      'Eliminar desafío',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteChallenge(id);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const times = ['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Desafíos Diarios</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowScheduler(!showScheduler)}
        >
          <Text style={styles.addButtonText}>{showScheduler ? '✕' : '+'}</Text>
        </TouchableOpacity>
      </View>

      {showScheduler && (
        <View style={styles.schedulerCard}>
          <Text style={styles.schedulerTitle}>Programar Desafío</Text>

          <Text style={styles.label}>Fecha</Text>
          <View style={styles.dateRow}>
            {[0, 1, 2, 3, 4, 5, 6].map((daysAhead) => {
              const date = new Date();
              date.setDate(date.getDate() + daysAhead);
              const dateStr = date.toISOString().split('T')[0];
              const dayName = date.toLocaleDateString('es', { weekday: 'short' });
              return (
                <TouchableOpacity
                  key={daysAhead}
                  style={[
                    styles.dateButton,
                    selectedDate === dateStr && styles.dateButtonActive,
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[styles.dateDay, selectedDate === dateStr && styles.dateDayActive]}>
                    {daysAhead === 0 ? 'Hoy' : dayName}
                  </Text>
                  <Text style={[styles.dateNumber, selectedDate === dateStr && styles.dateNumberActive]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Hora</Text>
          <View style={styles.timeRow}>
            {times.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeButton,
                  selectedTime === time && styles.timeButtonActive,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[styles.timeText, selectedTime === time && styles.timeTextActive]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tipo de entrenamiento</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, selectedType === 'plan' && styles.typeButtonActive]}
              onPress={() => setSelectedType('plan')}
            >
              <Text style={[styles.typeText, selectedType === 'plan' && styles.typeTextActive]}>
                🤖 Plan IA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, selectedType === 'custom' && styles.typeButtonActive]}
              onPress={() => setSelectedType('custom')}
            >
              <Text style={[styles.typeText, selectedType === 'custom' && styles.typeTextActive]}>
                📝 Custom
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Seleccionar entrenamiento</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workoutScroll}>
            {(selectedType === 'plan' ? plans : customWorkouts).map((item: any) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.workoutOption,
                  selectedId === item.id && styles.workoutOptionActive,
                ]}
                onPress={() => setSelectedId(item.id)}
              >
                <Text style={styles.workoutOptionName}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.scheduleButton} onPress={scheduleChallenge}>
            <Text style={styles.scheduleButtonText}>📅 Programar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desafíos de hoy</Text>
        {todayChallenges.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay desafíos para hoy</Text>
            <Text style={styles.emptySubtext}>Programa uno con el botón +</Text>
          </View>
        ) : (
          todayChallenges.map((challenge: any) => (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeCard}
              onPress={() => {
                if (challenge.workout_plan_id) {
                  router.push({
                    pathname: '/(tabs)/plan',
                    params: { planId: challenge.workout_plan_id }
                  });
                } else if (challenge.custom_workout_id) {
                  router.push('/(tabs)/workout');
                }
              }}
              onLongPress={() => deleteChallenge(challenge.id)}
            >

              <View style={styles.challengeInfo}>
                <Text style={styles.challengeName}>
                  {challenge.plan_name || challenge.custom_name || 'Entrenamiento'}
                </Text>
                <Text style={styles.challengeTime}>⏰ {challenge.scheduled_time}</Text>
              </View>
              <View style={[
                styles.challengeStatus,
                challenge.completed && styles.challengeCompleted,
              ]}>
                <Text style={styles.challengeStatusText}>
                  {challenge.completed ? '✓' : '○'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Próximos desafíos</Text>
        {upcomingChallenges.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay desafíos programados</Text>
          </View>
        ) : (
          upcomingChallenges.map((challenge: any) => (
            <View key={challenge.id} style={styles.upcomingCard}>
              <View style={styles.upcomingDate}>
                <Text style={styles.upcomingDay}>
                  {new Date(challenge.challenge_date).getDate()}
                </Text>
                <Text style={styles.upcomingMonth}>
                  {new Date(challenge.challenge_date).toLocaleDateString('es', { month: 'short' })}
                </Text>
              </View>
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingName}>
                  {challenge.plan_name || challenge.custom_name || 'Entrenamiento'}
                </Text>
                <Text style={styles.upcomingTime}>{challenge.scheduled_time}</Text>
              </View>
              <View style={[
                styles.upcomingStatus,
                challenge.completed && styles.upcomingCompleted,
              ]}>
                <Text style={styles.upcomingStatusText}>
                  {challenge.completed ? '✓' : '○'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
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
  schedulerCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  schedulerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#B2BEC3',
    marginBottom: 10,
    marginTop: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#2D2D2D',
    minWidth: 44,
  },
  dateButtonActive: {
    backgroundColor: '#FF6B35',
  },
  dateDay: {
    fontSize: 11,
    color: '#B2BEC3',
    marginBottom: 4,
  },
  dateDayActive: {
    color: '#FFF',
  },
  dateNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  dateNumberActive: {
    color: '#FFF',
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2D2D2D',
  },
  timeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  timeText: {
    color: '#B2BEC3',
    fontSize: 14,
  },
  timeTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2D2D2D',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  typeText: {
    color: '#B2BEC3',
    fontSize: 14,
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#FFF',
  },
  workoutScroll: {
    marginVertical: 8,
  },
  workoutOption: {
    backgroundColor: '#2D2D2D',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 10,
  },
  workoutOptionActive: {
    backgroundColor: '#FF6B35',
  },
  workoutOptionName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
  },
  challengeCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  challengeTime: {
    fontSize: 14,
    color: '#B2BEC3',
    marginTop: 4,
  },
  challengeStatus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeCompleted: {
    backgroundColor: '#00B894',
  },
  challengeStatusText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  upcomingCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  upcomingDate: {
    alignItems: 'center',
    marginRight: 16,
    width: 50,
  },
  upcomingDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  upcomingMonth: {
    fontSize: 12,
    color: '#B2BEC3',
    textTransform: 'uppercase',
  },
  upcomingInfo: {
    flex: 1,
  },
  upcomingName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  upcomingTime: {
    fontSize: 13,
    color: '#B2BEC3',
    marginTop: 2,
  },
  upcomingStatus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingCompleted: {
    backgroundColor: '#00B894',
  },
  upcomingStatusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
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
