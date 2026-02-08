<template>
  <div class="auth-container">
    <div class="auth-form-container">
      <h1 class="auth-title">Connexion</h1>
      
      <div v-if="error" class="auth-error" role="alert" aria-live="polite">
        <i class="material-icons" aria-hidden="true">error</i>
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
            :aria-invalid="!!emailError"
            :aria-describedby="emailError ? 'email-error' : undefined"
          />
          <p v-if="emailError" id="email-error" class="error-message" role="alert">{{ emailError }}</p>
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
              :aria-invalid="!!passwordError"
              :aria-describedby="passwordError ? 'password-error' : undefined"
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" aria-hidden="true"></i>
            </button>
          </div>
          <p v-if="passwordError" id="password-error" class="error-message" role="alert">{{ passwordError }}</p>
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
      
      <div class="auth-divider">
        <span>OU</span>
      </div>
      
      <div class="auth-alternatives">
        <button 
          type="button" 
          class="auth-alt-button google-button" 
          @click="loginWithGoogle"
          :disabled="isLoading"
        >
          <i class="fab fa-google"></i>
          Continuer avec Google
        </button>
        
        <button 
          type="button" 
          class="auth-alt-button magic-link-button" 
          @click="showMagicLinkForm = !showMagicLinkForm"
          :disabled="isLoading"
        >
          <i class="material-icons">link</i>
          Connexion par lien magique
        </button>
        
        <div v-if="showMagicLinkForm" class="magic-link-form">
          <input 
            type="email" 
            v-model="magicLinkEmail" 
            placeholder="Votre email"
            class="magic-link-input"
          />
          <button 
            type="button" 
            class="auth-button" 
            @click="sendMagicLink"
            :disabled="isSendingMagicLink"
          >
            <span v-if="isSendingMagicLink">Envoi en cours...</span>
            <span v-else>Envoyer le lien</span>
          </button>
          <p v-if="magicLinkSent" class="success-message">Lien envoyé ! Vérifiez votre email.</p>
        </div>
      </div>
      
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useValidation } from '@/composables/useValidation';
import { useNotification } from '@/composables/useNotification';
import { useAnalytics } from '@/composables/useAnalytics';

const router = useRouter();
const authStore = useAuthStore();
const { validateEmail, validateRequired } = useValidation();
const { success, error: notifyError } = useNotification();
const { trackLogin } = useAnalytics();

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref('');
const emailError = ref('');
const passwordError = ref('');

// Magic Link
const showMagicLinkForm = ref(false);
const magicLinkEmail = ref('');
const isSendingMagicLink = ref(false);
const magicLinkSent = ref(false);

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
      trackLogin('email');
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

const loginWithGoogle = () => {
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  window.location.href = `${backendUrl}/auth/google`;
};

const sendMagicLink = async () => {
  if (!magicLinkEmail.value) {
    notifyError('Veuillez entrer votre email');
    return;
  }

  const emailValidation = validateEmail(magicLinkEmail.value);
  if (emailValidation) {
    notifyError(emailValidation);
    return;
  }

  isSendingMagicLink.value = true;
  magicLinkSent.value = false;

  try {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${backendUrl}/auth/magic-link/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: magicLinkEmail.value })
    });

    const data = await response.json();

    if (data.success) {
      magicLinkSent.value = true;
      success('Lien magique envoyé ! Vérifiez votre email.');
    } else {
      notifyError(data.message || 'Erreur lors de l\'envoi du lien');
    }
  } catch (err) {
    notifyError('Erreur lors de l\'envoi du lien magique');
  } finally {
    isSendingMagicLink.value = false;
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
  gap: 0.5rem;
}

.remember-me input[type="checkbox"] {
  width: auto;
  margin: 0;
  cursor: pointer;
}

.remember-me label {
  margin: 0;
  cursor: pointer;
  font-size: 0.9rem;
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

.auth-divider {
  margin: 2rem 0;
  text-align: center;
  position: relative;
}

.auth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #ddd;
}

.auth-divider span {
  position: relative;
  background-color: #fff;
  padding: 0 1rem;
  color: #999;
  font-size: 0.9rem;
}

.auth-alternatives {
  margin-bottom: 2rem;
}

.auth-alt-button {
  width: 100%;
  padding: 0.9rem;
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  background-color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-weight: 500;
}

.auth-alt-button:hover:not(:disabled) {
  background-color: #f8f8f8;
  border-color: #999;
}

.auth-alt-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-button {
  color: #4285f4;
  border-color: #4285f4;
}

.google-button:hover:not(:disabled) {
  background-color: #4285f4;
  color: #fff;
}

.magic-link-button {
  color: #111;
}

.magic-link-form {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.magic-link-input {
  width: 100%;
  margin-bottom: 1rem;
}

.success-message {
  color: #28a745;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
}

.auth-footer {
  margin-top: 2rem;
  text-align: center;
  color: #666;
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
