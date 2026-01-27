<template>
  <div class="auth-container">
    <div class="auth-form-container">
      <h1 class="auth-title">Activer votre compte</h1>
      
      <div v-if="successMessage" class="auth-success">
        <i class="material-icons">check_circle</i>
        {{ successMessage }}
      </div>

      <div v-if="errorMessage" class="auth-error">
        <i class="material-icons">error</i>
        {{ errorMessage }}
      </div>

      <form v-if="!successMessage" @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <div class="password-input">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model="password"
              required
              autocomplete="new-password"
              placeholder="Minimum 6 caractères"
              :class="{ 'input-error': errors.password }"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmer le mot de passe</label>
          <div class="password-input">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              id="confirmPassword"
              v-model="confirmPassword"
              required
              autocomplete="new-password"
              placeholder="Confirmez votre mot de passe"
              :class="{ 'input-error': errors.confirmPassword }"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <p v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</p>
        </div>

        <button type="submit" class="auth-button" :disabled="isLoading">
          <span v-if="isLoading">Activation en cours...</span>
          <span v-else>Activer mon compte</span>
        </button>

        <div class="auth-footer">
          <p>Vous avez déjà un compte ?</p>
          <router-link to="/login" class="auth-link">Se connecter</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/apiService';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const errors = ref<Record<string, string>>({});
const token = ref('');

onMounted(() => {
  token.value = route.params.token as string;

  if (!token.value) {
    errorMessage.value = 'Lien d\'activation invalide.';
  }
});

const validateForm = (): boolean => {
  errors.value = {};

  if (!password.value) {
    errors.value.password = 'Le mot de passe est requis';
    return false;
  }

  if (password.value.length < 6) {
    errors.value.password = 'Le mot de passe doit contenir au moins 6 caractères';
    return false;
  }

  if (!confirmPassword.value) {
    errors.value.confirmPassword = 'Veuillez confirmer votre mot de passe';
    return false;
  }

  if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Les mots de passe ne correspondent pas';
    return false;
  }

  return true;
};

const handleSubmit = async () => {
  if (!token.value) return;
  if (!validateForm()) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const response = await api.put('/auth/activate/' + token.value, {
      password: password.value
    });

    const jwt = response.data?.token;
    if (!jwt) {
      throw new Error('Réponse serveur invalide');
    }

    authStore.token = jwt;
    localStorage.setItem('auth_token', jwt);
    await authStore.loadUser();

    successMessage.value = 'Compte activé avec succès. Redirection vers votre compte...';

    setTimeout(() => {
      router.push('/account');
    }, 1500);
  } catch (err: any) {
    console.error('Erreur activation compte:', err);
    errorMessage.value = err.response?.data?.message || 'Une erreur est survenue. Le lien a peut-être expiré.';
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
  width: 100%;
  max-width: 420px;
  background-color: #fff;
  padding: 3rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.auth-title {
  font-size: 1.8rem;
  font-weight: 300;
  margin-bottom: 2rem;
  text-align: center;
  letter-spacing: 0.1rem;
  color: #111;
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
  font-weight: 500;
}

.auth-success {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
  padding: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  border-left: 3px solid #28a745;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.auth-error i,
.auth-success i {
  margin-right: 0.5rem;
  font-size: 1.2rem;
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

input[type="password"],
input[type="text"] {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  background-color: #f9f9f9;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
}

input:focus {
  outline: none;
  border-color: #999;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.input-error {
  border-color: #dc3545 !important;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #777;
}

.auth-button {
  width: 100%;
  padding: 1rem;
  background-color: #111;
  color: #fff;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  letter-spacing: 0.05rem;
  transition: background-color 0.3s;
}

.auth-button:hover {
  background-color: #333;
}

.auth-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #555;
}

.auth-link {
  display: inline-block;
  margin-top: 0.5rem;
  color: #111;
  text-decoration: none;
  font-weight: 500;
}

.auth-link:hover {
  text-decoration: underline;
}
</style>
