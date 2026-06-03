import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import api from '../../src/services/api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('beginner');
  const [goals, setGoals] = useState('');
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const [data, statsData] = await Promise.all([
        api.getProfile(),
        api.getStats(),
      ]);
      setProfile(data);
      setStats(statsData);
      setName(data.name || '');
      setAge(data.age?.toString() || '');
      setWeight(data.weight?.toString() || '');
      setHeight(data.height?.toString() || '');
      setFitnessLevel(data.fitness_level || 'beginner');
      setGoals(data.goals || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      await api.updateProfile({
        name,
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        height: height ? parseFloat(height) : null,
        fitness_level: fitnessLevel,
        goals,
      });
      setEditing(false);
      loadProfile();
      Alert.alert('Éxito', 'Perfil actualizado');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  const fitnessLevels = [
    { value: 'beginner', label: 'Principiante', emoji: '🌱' },
    { value: 'intermediate', label: 'Intermedio', emoji: '💪' },
    { value: 'advanced', label: 'Avanzado', emoji: '🏆' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setEditing(!editing)}
        >
          <Text style={styles.editButtonText}>{editing ? 'Cancelar' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.name?.charAt(0) || '👤'}
            </Text>
          </View>
          <Text style={styles.profileName}>{profile?.name || 'Usuario'}</Text>
          <Text style={styles.profileEmail}>{profile?.email}</Text>
        </View>

        {stats && !editing && (
          <View style={styles.statsSection}>
            <View style={styles.statsRow}>
              <View style={[styles.miniStat, { backgroundColor: '#FF6B35' }]}>
                <Text style={styles.statEmoji}>🏆</Text>
                <Text style={styles.statValue}>Nv.{stats.level}</Text>
                <Text style={styles.statLabel}>Nivel</Text>
              </View>
              <View style={[styles.miniStat, { backgroundColor: '#6C5CE7' }]}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={styles.statValue}>{stats.xp}</Text>
                <Text style={styles.statLabel}>XP total</Text>
              </View>
              <View style={[styles.miniStat, { backgroundColor: '#00B894' }]}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statValue}>{stats.longestStreak || stats.weeklyStreak}</Text>
                <Text style={styles.statLabel}>Mejor racha</Text>
              </View>
            </View>
            {stats.levelEndXp > stats.levelStartXp && (
              <View style={styles.xpMiniBar}>
                <View style={styles.xpMiniBarBg}>
                  <View style={[styles.xpMiniBarFill, { width: `${Math.min(stats.xpProgress * 100, 100)}%` }]} />
                </View>
                <Text style={styles.xpMiniText}>
                  Nivel {stats.level}: {stats.xp - stats.levelStartXp}/{stats.levelEndXp - stats.levelStartXp} XP
                </Text>
              </View>
            )}
          </View>
        )}

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Edad</Text>
                <TextInput
                  style={styles.input}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Altura (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.label}>Nivel de fitness</Text>
            <View style={styles.levelRow}>
              {fitnessLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.levelButton,
                    fitnessLevel === level.value && styles.levelActive,
                  ]}
                  onPress={() => setFitnessLevel(level.value)}
                >
                  <Text style={styles.levelEmoji}>{level.emoji}</Text>
                  <Text
                    style={[
                      styles.levelText,
                      fitnessLevel === level.value && styles.levelTextActive,
                    ]}
                  >
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Objetivos</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={goals}
              onChangeText={setGoals}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
              <Text style={styles.saveButtonText}>💾 Guardar cambios</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Edad</Text>
              <Text style={styles.infoValue}>{profile?.age || '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Peso</Text>
              <Text style={styles.infoValue}>{profile?.weight ? `${profile.weight} kg` : '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Altura</Text>
              <Text style={styles.infoValue}>{profile?.height ? `${profile.height} cm` : '-'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nivel</Text>
              <Text style={styles.infoValue}>
                {fitnessLevels.find((l) => l.value === profile?.fitness_level)?.label || '-'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Objetivos</Text>
              <Text style={[styles.infoValue, { flex: 1, textAlign: 'right' }]}>
                {profile?.goals || '-'}
              </Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>🚪 Cerrar Sesión</Text>
      </TouchableOpacity>
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
  editButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    color: '#FFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileEmail: {
    fontSize: 14,
    color: '#B2BEC3',
    marginTop: 4,
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  infoLabel: {
    fontSize: 14,
    color: '#B2BEC3',
  },
  infoValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
  },
  editForm: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: '#B2BEC3',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 14,
    color: '#FFF',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 10,
  },
  levelButton: {
    flex: 1,
    backgroundColor: '#2D2D2D',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  levelActive: {
    backgroundColor: '#FF6B35',
  },
  levelEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  levelText: {
    fontSize: 12,
    color: '#B2BEC3',
  },
  levelTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  statsSection: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  miniStat: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#FFF',
    opacity: 0.85,
    marginTop: 2,
  },
  xpMiniBar: {
    marginTop: 4,
  },
  xpMiniBarBg: {
    height: 6,
    backgroundColor: '#2D2D2D',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  xpMiniBarFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 3,
  },
  xpMiniText: {
    fontSize: 11,
    color: '#B2BEC3',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#00B894',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#E17055',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
