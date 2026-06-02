import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://fitgenius.rincon-z.com/api';

class ApiService {
  private token: string | null = null;

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('auth_token', token);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('auth_token');
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }
    return data;
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    age?: number;
    weight?: number;
    height?: number;
    fitness_level?: string;
    goals?: string;
  }) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    await this.setToken(data.token);
    return data;
  }

  async login(email: string, password: string) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await this.setToken(data.token);
    return data;
  }

  async getProfile() {
    return this.request('/user/profile');
  }

  async updateProfile(profile: any) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async savePushToken(pushToken: string) {
    return this.request('/user/push-token', {
      method: 'POST',
      body: JSON.stringify({ pushToken }),
    });
  }

  async generatePlan(planData: {
    goals: string;
    days_per_week: number;
    session_duration: number;
    equipment: string;
    limitations: string;
  }) {
    return this.request('/ai/generate-plan', {
      method: 'POST',
      body: JSON.stringify(planData),
    });
  }

  async getPlans() {
    return this.request('/plans');
  }

  async getPlan(id: number) {
    return this.request(`/plans/${id}`);
  }

  async deletePlan(id: number) {
    return this.request(`/plans/${id}`, { method: 'DELETE' });
  }

  async createCustomWorkout(workout: {
    name: string;
    exercises: any[];
    duration_minutes?: number;
    difficulty?: string;
  }) {
    return this.request('/workouts/custom', {
      method: 'POST',
      body: JSON.stringify(workout),
    });
  }

  async getCustomWorkouts() {
    return this.request('/workouts/custom');
  }

  async deleteCustomWorkout(id: number) {
    return this.request(`/workouts/custom/${id}`, { method: 'DELETE' });
  }

  async scheduleChallenge(data: {
    workout_plan_id?: number;
    custom_workout_id?: number;
    challenge_date: string;
    scheduled_time: string;
  }) {
    return this.request('/challenges/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTodayChallenges() {
    return this.request('/challenges/today');
  }

  async getUpcomingChallenges() {
    return this.request('/challenges/upcoming');
  }

  async completeChallenge(id: number) {
    return this.request(`/challenges/${id}/complete`, { method: 'PUT' });
  }

  async getExercises() {
    return this.request('/exercises');
  }

  async getStats() {
    return this.request('/stats');
  }

  async logout() {
    await this.clearToken();
  }
}

export default new ApiService();
