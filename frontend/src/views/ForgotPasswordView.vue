<template>
  <div class="forgot-password-view">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Mot de passe oublié</h1>
          <p>Entrez votre adresse e-mail pour recevoir un lien de réinitialisation</p>
        </div>
        
        <form @submit.prevent="handleSubmit" class="auth-form">
          <div class="form-group" :class="{ 'has-error': errors.email }">
            <label for="email">Adresse e-mail</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="Votre adresse e-mail"
              required
              autocomplete="email"
            />
            <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
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
              <span v-if="loading">Envoi en cours...</span>
              <span v-else>Envoyer le lien</span>
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
import { ref } from 'vue';
import api from '@/services/apiService';

const email = ref('');
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const errors = ref<Record<string, string>>({});

const validateForm = (): boolean => {
  errors.value = {};
  
  if (!email.value) {
    errors.value.email = 'L\'adresse e-mail est requise';
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    errors.value.email = 'Veuillez entrer une adresse e-mail valide';
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
    await api.post('/auth/forgot-password', { email: email.value });
    
    successMessage.value = 'Un e-mail contenant les instructions de réinitialisation de mot de passe a été envoyé à ' + email.value;
    email.value = '';
    
  } catch (error: any) {
    console.error('Erreur lors de la demande de réinitialisation de mot de passe:', error);
    
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else {
      errorMessage.value = 'Une erreur est survenue lors de l\'envoi de l\'e-mail de réinitialisation. Veuillez réessayer.';
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.forgot-password-view {
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
