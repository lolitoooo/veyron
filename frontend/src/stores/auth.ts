import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types/user';
import api from '@/services/apiService';

export const useAuthStore = defineStore('auth', () => {
  const storedToken = localStorage.getItem('auth_token');
  
  const user = ref<User | null>(null);
  const token = ref<string | null>(storedToken);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => {
    const hasToken = !!token.value;
    return hasToken;
  });
  
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function loadUser(): Promise<boolean> {
    if (!token.value) return false;
    
    isLoading.value = true;
    error.value = null;
    
    try {      
      let userData;
      
      const response = await api.get('/user/profile');
      
      if (response.data && typeof response.data === 'object') {
        if (response.data.success && response.data.data) {
          userData = response.data.data;
        }
        else if (response.data.id || response.data.email) {
          userData = response.data;
        }
        else if (response.data.user && typeof response.data.user === 'object') {
          userData = response.data.user;
        }
        else {
          userData = response.data;
        }
      } else {
        throw new Error('Format de réponse utilisateur non reconnu');
      }
      
      user.value = userData;
      return true;
    } catch (err: any) {      
      if (!err.response) {
        error.value = 'Le serveur n\'est pas accessible. Veuillez vérifier que le backend est en cours d\'exécution.';
      } else if (err.response.status === 401) {
        error.value = 'Session expirée. Veuillez vous reconnecter.';
      } else {
        error.value = err.message || 'Erreur lors du chargement des données utilisateur';
      }
      
      token.value = null;
      localStorage.removeItem('auth_token');
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(email: string, password: string): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      let tokenData: string | null = null;
      
      
      if (response.data && response.data.token) {
        tokenData = response.data.token;
      }
      else if (response.data && response.data.data && response.data.data.token) {
        tokenData = response.data.data.token;
      }
      else if (response.data && response.data.access_token) {
        tokenData = response.data.access_token;
      }
      else if (response.data && response.data.data && response.data.data.access_token) {
        tokenData = response.data.data.access_token;
      }
      else if (typeof response.data === 'string') {
        tokenData = response.data;
      }
      
      if (!tokenData) {
        console.error('Format de réponse non reconnu:', response.data);
        error.value = 'Format de réponse non reconnu';
        return false;
      }
      
      token.value = tokenData;
      
      if (token.value) {
        localStorage.setItem('auth_token', token.value);
      }      
      const userLoaded = await loadUser();
      
      return true;
    } catch (err: any) {
      console.error('Erreur lors de la connexion:', err);
      if (!err.response) {
        error.value = 'Le serveur n\'est pas accessible. Veuillez vérifier que le backend est en cours d\'exécution.';
      } else if (err.response && err.response.status === 401) {
        error.value = 'Identifiants invalides';
      } else {
        error.value = err.message || 'Erreur lors de la connexion';
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout() {
    try {
      if (token.value) {
        try {
          await api.post('/auth/logout');
        } catch (apiErr) {
          console.warn('Erreur lors de la déconnexion côté serveur:', apiErr);
        }
      }
    } finally {
      user.value = null;
      token.value = null;
      localStorage.removeItem('auth_token');
    }
  }

  async function register(userData: Omit<User, 'id' | 'role'> & { password: string }): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data && response.data.token) {
        token.value = response.data.token;
        localStorage.setItem('auth_token', response.data.token);
        user.value = response.data.user;
        return true;
      } else {
        error.value = 'Réponse du serveur invalide';
        return false;
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors de l\'inscription';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    loadUser,
    login,
    logout,
    register
  };
});
