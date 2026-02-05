<template>
  <div class="reset-password-view">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Réinitialiser votre mot de passe</h1>
          <p>Entrez votre nouveau mot de passe</p>
        </div>
        
        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group" :class="{ 'has-error': errors.password }">
            <label for="password">Nouveau mot de passe</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="Minimum 12 caractères"
              required
              autocomplete="new-password"
            />
            <PasswordStrengthIndicator :strength="passwordStrength" />
            <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
          </div>
          
          <div class="form-group" :class="{ 'has-error': errors.confirmPassword }">
            <label for="confirmPassword">Confirmer le mot de passe</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              placeholder="Confirmez votre mot de passe"
              required
              autocomplete="new-password"
            />
            <p v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</p>
          </div>
          
          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
          
          <div v-if="errorMessage" class="error-message global-error">
            {{ errorMessage }}
          </div>
          
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="loading"
            >
              <span v-if="loading">Réinitialisation en cours...</span>
              <span v-else>Réinitialiser le mot de passe</span>
            </button>
          </div>
          
          <div class="auth-links">
            <router-link to="/login">Retour à la connexion</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/apiService';
import { usePasswordStrength } from '@/composables/usePasswordStrength';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator.vue';

const route = useRoute();
const router = useRouter();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const errors = ref<Record<string, string>>({});
const token = ref('');

const { strength: passwordStrength } = usePasswordStrength(password);

onMounted(() => {
  token.value = route.params.token as string;
  
  if (!token.value) {
    errorMessage.value = 'Token de réinitialisation invalide';
  }
});

const validateForm = (): boolean => {
  errors.value = {};
  
  if (!password.value) {
    errors.value.password = 'Le mot de passe est requis';
    return false;
  }
  
  if (password.value.length < 12) {
    errors.value.password = 'Le mot de passe doit contenir au moins 12 caractères';
    return false;
  }
  
  const hasUpperCase = /[A-Z]/.test(password.value);
  const hasLowerCase = /[a-z]/.test(password.value);
  const hasNumber = /[0-9]/.test(password.value);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password.value);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
    errors.value.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole';
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
  if (!validateForm()) return;
  
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  
  try {
    await api.put('/auth/reset-password/' + token.value, { 
      password: password.value 
    });
    
    successMessage.value = 'Votre mot de passe a été réinitialisé avec succès. Redirection vers la page de connexion...';
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);
    
  } catch (error: any) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = 'Une erreur est survenue. Le lien a peut-être expiré. Veuillez faire une nouvelle demande.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.reset-password-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f8f9fa;
}

.auth-container {
  width: 100%;
  max-width: 450px;
}

.auth-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-family: var(--font-heading);
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #6c757d;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group.has-error input {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.global-error {
  background-color: #f8d7da;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}

.form-actions {
  display: flex;
  justify-content: center;
}

.btn-primary {
  background-color: #000;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #333;
}

.btn-primary:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.auth-links {
  text-align: center;
  margin-top: 1rem;
}

.auth-links a {
  color: #000;
  text-decoration: underline;
}

.auth-links a:hover {
  color: #333;
}
</style>
