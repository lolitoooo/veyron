<template>
  <div class="auth-container">
    <div class="auth-form-container">
      <h1 class="auth-title">Authentification à deux facteurs</h1>
      
      <p class="info-text">
        Entrez le code à 6 chiffres généré par votre application d'authentification.
      </p>
      
      <div v-if="error" class="auth-error" role="alert">
        <i class="material-icons">error</i>
        {{ error }}
      </div>
      
      <form @submit.prevent="handleValidate" class="auth-form">
        <div class="form-group">
          <label for="token">Code de vérification</label>
          <input 
            type="text" 
            id="token" 
            v-model="token" 
            placeholder="000000"
            maxlength="6"
            pattern="[0-9]{6}"
            required
            autofocus
            class="code-input"
          />
        </div>
        
        <button 
          type="submit" 
          class="auth-button" 
          :disabled="isLoading || token.length !== 6"
        >
          <span v-if="isLoading">Vérification...</span>
          <span v-else>Valider</span>
        </button>
      </form>
      
      <div class="backup-code-section">
        <button 
          type="button" 
          class="text-button" 
          @click="showBackupCodeInput = !showBackupCodeInput"
        >
          Utiliser un code de secours
        </button>
        
        <div v-if="showBackupCodeInput" class="backup-code-form">
          <input 
            type="text" 
            v-model="backupCode" 
            placeholder="Code de secours"
            class="backup-code-input"
          />
          <button 
            type="button" 
            class="auth-button" 
            @click="handleValidateBackupCode"
            :disabled="isLoading || !backupCode"
          >
            Valider le code de secours
          </button>
        </div>
      </div>
      
      <div class="auth-footer">
        <router-link to="/login" class="auth-link">
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

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { success, error: notifyError } = useNotification();

const token = ref('');
const backupCode = ref('');
const showBackupCodeInput = ref(false);
const isLoading = ref(false);
const error = ref('');
const userId = ref('');

onMounted(() => {
  userId.value = route.query.userId as string;
  if (!userId.value) {
    notifyError('Session invalide');
    router.push('/login');
  }
});

const handleValidate = async () => {
  if (token.value.length !== 6) {
    error.value = 'Le code doit contenir 6 chiffres';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${backendUrl}/auth/2fa/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId.value,
        token: token.value,
        isBackupCode: false
      })
    });

    const data = await response.json();

    if (data.success && data.token) {
      localStorage.setItem('auth_token', data.token);
      authStore.user = data.user;
      authStore.token = data.token;
      
      success('Authentification réussie');
      router.push('/account');
    } else {
      error.value = data.message || 'Code invalide';
    }
  } catch (err) {
    error.value = 'Erreur lors de la validation du code';
  } finally {
    isLoading.value = false;
  }
};

const handleValidateBackupCode = async () => {
  if (!backupCode.value) {
    error.value = 'Veuillez entrer un code de secours';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${backendUrl}/auth/2fa/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId.value,
        token: backupCode.value,
        isBackupCode: true
      })
    });

    const data = await response.json();

    if (data.success && data.token) {
      localStorage.setItem('auth_token', data.token);
      authStore.user = data.user;
      authStore.token = data.token;
      
      success('Authentification réussie avec code de secours');
      router.push('/account');
    } else {
      error.value = data.message || 'Code de secours invalide';
    }
  } catch (err) {
    error.value = 'Erreur lors de la validation du code de secours';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
  background-color: #f8f8f8;
}

.auth-form-container {
  width: 500px;
  background-color: #fff;
  padding: 3rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.auth-title {
  font-size: 1.8rem;
  font-weight: 300;
  margin-bottom: 1rem;
  text-align: center;
  letter-spacing: 0.1rem;
  color: #111;
}

.info-text {
  text-align: center;
  color: #666;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.auth-error {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  border-left: 3px solid #dc3545;
  display: flex;
  align-items: center;
}

.auth-error i {
  margin-right: 0.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #555;
}

.code-input {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  background-color: #f9f9f9;
  font-size: 1.5rem;
  text-align: center;
  letter-spacing: 0.5rem;
  font-weight: 600;
}

.code-input:focus {
  outline: none;
  border-color: #999;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.auth-button {
  width: 100%;
  padding: 1rem;
  background-color: #111;
  color: #fff;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: 500;
  letter-spacing: 0.05rem;
}

.auth-button:hover:not(:disabled) {
  background-color: #000;
}

.auth-button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.backup-code-section {
  margin-top: 2rem;
  text-align: center;
}

.text-button {
  background: none;
  border: none;
  color: #111;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
}

.text-button:hover {
  color: #555;
}

.backup-code-form {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.backup-code-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  background-color: #fff;
  font-size: 1rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
}

.auth-link {
  color: #111;
  text-decoration: underline;
  font-weight: 500;
}

.auth-link:hover {
  color: #555;
}
</style>
