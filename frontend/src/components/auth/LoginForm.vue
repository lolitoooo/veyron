<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotification } from '@/composables/useNotification';
import { useValidation } from '@/composables/useValidation';

const authStore = useAuthStore();
const router = useRouter();
const notification = useNotification();
const { validateEmail, validatePassword, errors, resetErrors } = useValidation();

const email = ref('');
const password = ref('');
const isSubmitting = ref(false);

const validate = () => {
  resetErrors();
  const isEmailValid = validateEmail(email.value);
  const isPasswordValid = validatePassword(password.value);
  return isEmailValid && isPasswordValid;
};

const handleSubmit = async () => {
  if (!validate()) return;
  
  isSubmitting.value = true;
  
  try {
    const success = await authStore.login(email.value, password.value);
    
    if (success) {
      notification.success('Connexion réussie !');
      router.push('/');
    } else {
      notification.error(authStore.error || 'Échec de la connexion');
    }
  } catch (error) {
    notification.error('Une erreur est survenue lors de la connexion');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="login-form">
    <h2>Connexion</h2>
    
    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          id="email"
          v-model="email"
          type="email"
          placeholder="Votre email"
          :class="{ 'error': errors.email }"
        />
        <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
      </div>
      
      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input 
          id="password"
          v-model="password"
          type="password"
          placeholder="Votre mot de passe"
          :class="{ 'error': errors.password }"
        />
        <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
      </div>
      
      <div class="form-actions">
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="isSubmitting || authStore.isLoading"
        >
          <span v-if="isSubmitting || authStore.isLoading">Connexion en cours...</span>
          <span v-else>Se connecter</span>
        </button>
      </div>
      
      <div class="form-footer">
        <p>Pas encore de compte ? <router-link to="/register">S'inscrire</router-link></p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background-color: white;
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #42b883;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.form-actions {
  margin-top: 1.5rem;
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #42b883;
  color: white;
}

.btn-primary:hover {
  background-color: #3aa876;
}

.btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.form-footer {
  margin-top: 1.5rem;
  text-align: center;
}

.form-footer a {
  color: #42b883;
  text-decoration: none;
}

.form-footer a:hover {
  text-decoration: underline;
}
</style>
