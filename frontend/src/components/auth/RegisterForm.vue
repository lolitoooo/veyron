<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotification } from '@/composables/useNotification';
import { useValidation } from '@/composables/useValidation';

const authStore = useAuthStore();
const router = useRouter();
const notification = useNotification();
const { validateEmail, validatePassword, validateRequired, errors, resetErrors } = useValidation();

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const firstName = ref('');
const lastName = ref('');
const isSubmitting = ref(false);

const validate = () => {
  resetErrors();
  
  const isEmailValid = validateEmail(email.value);
  const isPasswordValid = validatePassword(password.value);
  const isFirstNameValid = validateRequired('firstName', firstName.value, 'Prénom');
  const isLastNameValid = validateRequired('lastName', lastName.value, 'Nom');
  
  if (password.value !== confirmPassword.value) {
    errors.value.confirmPassword = 'Les mots de passe ne correspondent pas';
    return false;
  }
  
  return isEmailValid && isPasswordValid && isFirstNameValid && isLastNameValid;
};

const handleSubmit = async function handleSubmit() {
  if (!validate()) return;
  
  isSubmitting.value = true;
  
  try {
    const success = await authStore.register({
      email: email.value,
      password: password.value,
      firstName: firstName.value,
      lastName: lastName.value
    });
    
    if (success) {
      notification.success('Inscription réussie !');
      router.push('/');
    } else {
      notification.error(authStore.error || 'Échec de l\'inscription');
    }
  } catch (error) {
    notification.error('Une erreur est survenue lors de l\'inscription');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="register-form">
    <h2>Inscription</h2>
    
    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-row">
        <div class="form-group">
          <label for="firstName">Prénom</label>
          <input 
            id="firstName"
            v-model="firstName"
            type="text"
            placeholder="Votre prénom"
            :class="{ 'error': errors.firstName }"
          />
          <p v-if="errors.firstName" class="error-message">{{ errors.firstName }}</p>
        </div>
        
        <div class="form-group">
          <label for="lastName">Nom</label>
          <input 
            id="lastName"
            v-model="lastName"
            type="text"
            placeholder="Votre nom"
            :class="{ 'error': errors.lastName }"
          />
          <p v-if="errors.lastName" class="error-message">{{ errors.lastName }}</p>
        </div>
      </div>
      
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
      
      <div class="form-group">
        <label for="confirmPassword">Confirmer le mot de passe</label>
        <input 
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          placeholder="Confirmez votre mot de passe"
          :class="{ 'error': errors.confirmPassword }"
        />
        <p v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</p>
      </div>
      
      <div class="form-actions">
        <button 
          type="submit" 
          class="btn btn-primary"
          :disabled="isSubmitting || authStore.isLoading"
        >
          <span v-if="isSubmitting || authStore.isLoading">Inscription en cours...</span>
          <span v-else>S'inscrire</span>
        </button>
      </div>
      
      <div class="form-footer">
        <p>Déjà inscrit ? <router-link to="/login">Se connecter</router-link></p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.register-form {
  max-width: 500px;
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

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
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

@media (max-width: 576px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
}
</style>
