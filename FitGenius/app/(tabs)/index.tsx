import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../src/services/api';

export default function HomeScreen() {
  const [stats, setStats] = useState({ totalWorkouts: 0, totalPlans: 0, weeklyStreak: 0 });
  const [todayChallenges, setTodayChallenges] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, challengesData] = await Promise.all([
        api.getStats(),
        api.getTodayChallenges(),
      ]);
      setStats(statsData);
      setTodayChallenges(challengesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola! 👋</Text>
          <Text style={styles.title}>FitGenius</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>💪</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#FF6B35' }]}>
          <Text style={styles.statNumber}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Entrenamientos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#6C5CE7' }]}>
          <Text style={styles.statNumber}>{stats.weeklyStreak}</Text>
          <Text style={styles.statLabel}>Racha semanal</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#00B894' }]}>
          <Text style={styles.statNumber}>{stats.totalPlans}</Text>
          <Text style={styles.statLabel}>Planes creados</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desafíos de hoy</Text>
        {todayChallenges.length > 0 ? (
          todayChallenges.map((challenge: any) => (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeCard}
              onPress={() => router.push('/(tabs)/challenges')}
            >
              <View style={styles.challengeInfo}>
                <Text style={styles.challengeName}>
                  {challenge.plan_name || challenge.custom_name || 'Entrenamiento'}
                </Text>
                <Text style={styles.challengeTime}>{challenge.scheduled_time}</Text>
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
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay desafíos programados para hoy</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#FF6B35' }]}
            onPress={() => router.push('/(tabs)/plan')}
          >
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={styles.actionText}>Generar plan con IA</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#6C5CE7' }]}
            onPress={() => router.push('/(tabs)/workout')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>Crear entrenamiento</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#00B894' }]}
            onPress={() => router.push('/(tabs)/challenges')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Programar desafío</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#E17055' }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Configuración</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 30,
  },
  greeting: {
    fontSize: 16,
    color: '#B2BEC3',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeCompleted: {
    backgroundColor: '#00B894',
  },
  challengeStatusText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
