<template>
  <div class="auth-container">
    <div class="auth-form-container">
      <h1 class="auth-title">Connexion</h1>
      
      <div v-if="error" class="auth-error">
        <i class="material-icons">error</i>
        {{ error }}
      </div>
      
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            :class="{ 'input-error': emailError }"
          />
          <p v-if="emailError" class="error-message">{{ emailError }}</p>
        </div>
        
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <div class="password-input">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              required
              :class="{ 'input-error': passwordError }"
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
          <p v-if="passwordError" class="error-message">{{ passwordError }}</p>
        </div>
        
        <div class="form-actions">
          <div class="remember-me">
            <input type="checkbox" id="remember" v-model="rememberMe" />
            <label for="remember">Se souvenir de moi</label>
          </div>
          
          <router-link to="/forgot-password" class="forgot-password">
            Mot de passe oublié ?
          </router-link>
        </div>
        
        <button 
          type="submit" 
          class="auth-button" 
          :disabled="isLoading"
        >
          <span v-if="isLoading">Connexion en cours...</span>
          <span v-else>Se connecter</span>
        </button>
      </form>
      
      <div class="auth-footer">
        <p>Vous n'avez pas de compte ?</p>
        <router-link to="/register" class="auth-link">
          Créer un compte
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useValidation } from '@/composables/useValidation';
import { useNotification } from '@/composables/useNotification';

const router = useRouter();
const authStore = useAuthStore();
const { validateEmail, validateRequired } = useValidation();
const { success, error: notifyError } = useNotification();

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref('');
const emailError = ref('');
const passwordError = ref('');

const validateForm = (): boolean => {
  let isValid = true;
  
  emailError.value = validateEmail(email.value);
  if (emailError.value) isValid = false;
  
  passwordError.value = validateRequired(password.value, 'Le mot de passe');
  if (passwordError.value) isValid = false;
  
  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;
  
  isLoading.value = true;
  error.value = '';
  
  try {
    const loginSuccess = await authStore.login(email.value, password.value);
    
    if (loginSuccess) {
      success('Connexion réussie');
      await router.push({ path: '/account' });
    } else {
      error.value = authStore.error || 'Identifiants invalides. Veuillez vérifier votre email et mot de passe.';
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Une erreur est survenue lors de la connexion';
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
  max-width: 400px;
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

.auth-error i {
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

input[type="email"],
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
  color: #777;
  cursor: pointer;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.remember-me {
  display: flex;
  align-items: center;
}

.remember-me input {
  margin-right: 0.5rem;
}

.forgot-password {
  color: #777;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s;
}

.forgot-password:hover {
  color: #000;
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
}

.auth-button:hover {
  background-color: #000;
}

.auth-button:disabled {
  background-color: #999;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: #777;
}

.auth-link {
  color: #111;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.auth-link:hover {
  color: #000;
  text-decoration: underline;
}
</style>
