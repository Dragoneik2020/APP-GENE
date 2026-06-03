const API_URL = 'https://api.fitgenius.rincon-z.com/api/v1';

class PlanFitApi {
  private userId = 1;

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'user_id': String(this.userId),
      ...options.headers,
    };
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();
    if (!response.ok && data.status !== 200) {
      throw new Error(data.message || 'Error');
    }
    return data;
  }

  async getMain() {
    return this.request('/main');
  }

  async updateMain(minute: number, condition: string) {
    return this.request('/main', {
      method: 'PUT',
      body: JSON.stringify({ minute, condition }),
    });
  }

  async getExercises() {
    return this.request('/exercises');
  }

  async reorderExercises(exercises: { id: number; index: number }[]) {
    return this.request('/exercises', {
      method: 'PUT',
      body: JSON.stringify({ exercises }),
    });
  }

  async addToRoutine(exerciseId: number) {
    return this.request(`/routine?exerciseId=${exerciseId}`, { method: 'POST' });
  }

  async likeExercise(exerciseId: number) {
    return this.request(`/exercises/${exerciseId}/like`, { method: 'PATCH' });
  }

  async unlikeExercise(exerciseId: number) {
    return this.request(`/exercises/${exerciseId}/unlike`, { method: 'PATCH' });
  }

  async getSets(exerciseId: number) {
    return this.request(`/exercises/${exerciseId}/sets`);
  }

  async addSet(exerciseId: number) {
    return this.request(`/exercises/${exerciseId}/set`, { method: 'POST' });
  }

  async completeSet(exerciseId: number) {
    return this.request(`/exercises/${exerciseId}/set`, { method: 'PUT' });
  }

  async getAvailableExercises() {
    return this.request('/exercises/available');
  }

  async getWarmups() {
    return this.request('/warmup');
  }
}

export default new PlanFitApi();
