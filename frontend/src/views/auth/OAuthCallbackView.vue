<template>
  <div class="callback-container">
    <div class="callback-content">
      <div v-if="isLoading" class="loading">
        <i class="material-icons spin">sync</i>
        <p>Connexion en cours...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <i class="material-icons">error</i>
        <p>{{ error }}</p>
        <router-link to="/login" class="btn-back">
          Retour à la connexion
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotification } from '@/composables/useNotification';
import { useAnalytics } from '@/composables/useAnalytics';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { success, error: notifyError } = useNotification();
const analytics = useAnalytics();

const isLoading = ref(true);
const error = ref('');

onMounted(async () => {
  const token = route.query.token as string;
  const errorParam = route.query.error as string;

  if (errorParam) {
    error.value = 'Erreur lors de la connexion avec Google';
    isLoading.value = false;
    notifyError(error.value);
    return;
  }

  if (!token) {
    error.value = 'Token manquant';
    isLoading.value = false;
    return;
  }

  try {
    localStorage.setItem('auth_token', token);
    authStore.token = token;

    await authStore.loadUser();

    analytics.trackLogin('google');
    success('Connexion réussie avec Google');
    router.push('/account');
  } catch (err) {
    error.value = 'Erreur lors de la connexion';
    notifyError(error.value);
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.callback-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  background-color: #f8f8f8;
}

.callback-content {
  text-align: center;
  padding: 3rem;
  background-color: #fff;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading i {
  font-size: 3rem;
  color: #111;
}

.loading p {
  font-size: 1.1rem;
  color: #666;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.error i {
  font-size: 3rem;
  color: #dc3545;
}

.error p {
  font-size: 1.1rem;
  color: #666;
}

.btn-back {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #111;
  color: #fff;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.btn-back:hover {
  background-color: #000;
}
</style>
