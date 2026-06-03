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
import XpBar from '../../src/components/XpBar';

export default function HomeScreen() {
  const [stats, setStats] = useState({ totalWorkouts: 0, totalPlans: 0, weeklyStreak: 0, longestStreak: 0, xp: 0, level: 1, xpProgress: 0, levelStartXp: 0, levelEndXp: 100 });
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

  const incompleteToday = todayChallenges.filter((c: any) => !c.completed).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B35" />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Dashboard</Text>
          <Text style={styles.title}>FitGenius</Text>
        </View>
        <View style={styles.headerRight}>
          {stats.weeklyStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFire}>🔥</Text>
              <Text style={styles.streakCount}>{stats.weeklyStreak}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.avatarText}>💪</Text>
          </TouchableOpacity>
        </View>
      </View>

      <XpBar
        level={stats.level}
        xp={stats.xp}
        xpProgress={stats.xpProgress}
        levelStartXp={stats.levelStartXp}
        levelEndXp={stats.levelEndXp}
      />

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#FF6B35' }]}>
          <Text style={styles.statIcon}>🏋️</Text>
          <Text style={styles.statNumber}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Entrenos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#6C5CE7' }]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statNumber}>{stats.weeklyStreak}</Text>
          <Text style={styles.statLabel}>Racha</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#00B894' }]}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statNumber}>{stats.totalPlans}</Text>
          <Text style={styles.statLabel}>Planes</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Desafíos de hoy</Text>
          {incompleteToday > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{incompleteToday} pendientes</Text>
            </View>
          )}
        </View>
        {todayChallenges.length > 0 ? (
          todayChallenges.map((challenge: any) => (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeCard}
              onPress={() => router.push('/(tabs)/challenges')}
            >
              <View style={styles.challengeInfo}>
                <View style={styles.challengeRow}>
                  <Text style={[
                    styles.challengeName,
                    challenge.completed && styles.challengeNameDone,
                  ]}>
                    {challenge.plan_name || challenge.custom_name || 'Entrenamiento'}
                  </Text>
                  {challenge.completed && <Text style={styles.doneBadge}>✓ Hecho</Text>}
                </View>
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
          <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/(tabs)/challenges')}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No hay desafíos hoy</Text>
            <Text style={styles.emptySubtext}>Toca para programar uno</Text>
          </TouchableOpacity>
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
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionText}>Programar desafío</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#E17055' }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionText}>Mi progreso</Text>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#B2BEC3',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2D2D',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  streakFire: {
    fontSize: 16,
    marginRight: 4,
  },
  streakCount: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  pendingBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pendingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  challengeCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  challengeNameDone: {
    opacity: 0.6,
    textDecorationLine: 'line-through',
  },
  doneBadge: {
    fontSize: 11,
    color: '#00B894',
    fontWeight: 'bold',
  },
  challengeTime: {
    fontSize: 13,
    color: '#B2BEC3',
    marginTop: 4,
  },
  challengeStatus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeCompleted: {
    backgroundColor: '#00B894',
  },
  challengeStatusText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
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
