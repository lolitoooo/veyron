<template>
  <div class="verify-container">
    <div class="verify-content">
      <div v-if="isLoading" class="loading">
        <i class="material-icons spin">sync</i>
        <p>Vérification du lien magique...</p>
      </div>
      
      <div v-else-if="error" class="error">
        <i class="material-icons">error</i>
        <p>{{ error }}</p>
        <router-link to="/login" class="btn-back">
          Retour à la connexion
        </router-link>
      </div>
      
      <div v-else-if="requires2FA" class="info">
        <i class="material-icons">lock</i>
        <p>Authentification à deux facteurs requise</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotification } from '@/composables/useNotification';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { success, error: notifyError } = useNotification();

const isLoading = ref(true);
const error = ref('');
const requires2FA = ref(false);

onMounted(async () => {
  const token = route.query.token as string;

  if (!token) {
    error.value = 'Lien invalide ou expiré';
    isLoading.value = false;
    return;
  }

  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${backendUrl}/auth/magic-link/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();

    if (data.success) {
      if (data.requires2FA) {
        requires2FA.value = true;
        setTimeout(() => {
          router.push({
            path: '/auth/2fa',
            query: { userId: data.userId }
          });
        }, 1500);
      } else if (data.token) {
        localStorage.setItem('auth_token', data.token);
        authStore.user = data.user;
        authStore.token = data.token;
        
        success('Connexion réussie');
        router.push('/account');
      }
    } else {
      error.value = data.message || 'Lien invalide ou expiré';
    }
  } catch (err) {
    error.value = 'Erreur lors de la vérification du lien';
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.verify-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  background-color: #f8f8f8;
}

.verify-content {
  text-align: center;
  padding: 3rem;
  background-color: #fff;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  min-width: 400px;
}

.loading,
.error,
.info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading i,
.info i {
  font-size: 3rem;
  color: #111;
}

.error i {
  font-size: 3rem;
  color: #dc3545;
}

.loading p,
.error p,
.info p {
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
