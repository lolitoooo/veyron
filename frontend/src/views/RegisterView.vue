<template>
  <div class="auth-container">
    <div class="auth-form-container">
      <h1 class="auth-title">Créer un compte</h1>
      
      <div v-if="error" class="auth-error" role="alert" aria-live="polite">
        {{ error }}
      </div>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">Prénom</label>
            <input 
              type="text" 
              id="firstName" 
              v-model="firstName" 
              required 
              :class="{ 'input-error': firstNameError }"
              :aria-invalid="!!firstNameError"
              :aria-describedby="firstNameError ? 'firstName-error' : undefined"
            />
            <p v-if="firstNameError" id="firstName-error" class="error-message" role="alert">{{ firstNameError }}</p>
          </div>
          
          <div class="form-group">
            <label for="lastName">Nom</label>
            <input 
              type="text" 
              id="lastName" 
              v-model="lastName" 
              required 
              :class="{ 'input-error': lastNameError }"
              :aria-invalid="!!lastNameError"
              :aria-describedby="lastNameError ? 'lastName-error' : undefined"
            />
            <p v-if="lastNameError" id="lastName-error" class="error-message" role="alert">{{ lastNameError }}</p>
          </div>
        </div>
        
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
              aria-describedby="password-hint password-error"
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
          <PasswordStrengthIndicator :strength="passwordStrength" />
          <p v-if="passwordError" id="password-error" class="error-message" role="alert">{{ passwordError }}</p>
          <p id="password-hint" class="password-hint">Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un symbole.</p>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirmer le mot de passe</label>
          <div class="password-input">
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              required
              :class="{ 'input-error': confirmPasswordError }"
              :aria-invalid="!!confirmPasswordError"
              :aria-describedby="confirmPasswordError ? 'confirmPassword-error' : undefined"
            />
            <button 
              type="button" 
              class="toggle-password" 
              @click="showConfirmPassword = !showConfirmPassword"
              :aria-label="showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
            >
              <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'" aria-hidden="true"></i>
            </button>
          </div>
          <p v-if="confirmPasswordError" id="confirmPassword-error" class="error-message" role="alert">{{ confirmPasswordError }}</p>
        </div>
        
        <div class="form-group terms">
          <input 
            type="checkbox" 
            id="terms" 
            v-model="acceptTerms" 
            required 
            :aria-invalid="!!termsError"
            :aria-describedby="termsError ? 'terms-error' : undefined"
          />
          <label for="terms">
            J'accepte les <router-link to="/terms" class="terms-link">conditions générales</router-link> et la <router-link to="/privacy" class="terms-link">politique de confidentialité</router-link>
          </label>
          <p v-if="termsError" id="terms-error" class="error-message" role="alert">{{ termsError }}</p>
        </div>
        
        <button 
          type="submit" 
          class="auth-button" 
          :disabled="isLoading"
        >
          <span v-if="isLoading">Création en cours...</span>
          <span v-else>Créer mon compte</span>
        </button>
      </form>
      
      <div class="auth-footer">
        <p>Vous avez déjà un compte ?</p>
        <router-link to="/login" class="auth-link">
          Se connecter
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotification } from '@/composables/useNotification';
import { useAnalytics } from '@/composables/useAnalytics';
import { usePasswordStrength } from '@/composables/usePasswordStrength';
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator.vue';

const router = useRouter();
const authStore = useAuthStore();
const { validateEmail, validateRequired, validatePassword, validateMinLength } = useValidation();
const { success, error: notifyError } = useNotification();
const { trackSignup } = useAnalytics();

const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const acceptTerms = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const error = ref('');

const { strength: passwordStrength } = usePasswordStrength(password);

const firstNameError = ref('');
const lastNameError = ref('');
const emailError = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');
const termsError = ref('');

const validateForm = (): boolean => {
  let isValid = true;
  
  firstNameError.value = validateRequired(firstName.value, 'Le prénom');
  if (firstNameError.value) isValid = false;
  
  lastNameError.value = validateRequired(lastName.value, 'Le nom');
  if (lastNameError.value) isValid = false;
  
  emailError.value = validateEmail(email.value);
  if (emailError.value) isValid = false;
  
  passwordError.value = validatePassword(password.value);
  if (passwordError.value) isValid = false;
  
  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Les mots de passe ne correspondent pas';
    isValid = false;
  } else {
    confirmPasswordError.value = '';
  }
  
  if (!acceptTerms.value) {
    termsError.value = 'Vous devez accepter les conditions générales';
    isValid = false;
  } else {
    termsError.value = '';
  }
  
  return isValid;
};

const handleRegister = async () => {
  if (!validateForm()) return;
  
  isLoading.value = true;
  error.value = '';
  
  try {
    const registerSuccess = await authStore.register({
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value
    });
    
    if (registerSuccess) {
      trackSignup('email');
      success('Compte créé avec succès');
      router.push('/account');
    } else {
      error.value = 'Échec de la création du compte. Veuillez réessayer.';
    }
  } catch (err: any) {
    error.value = err.message || 'Une erreur est survenue lors de la création du compte';
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
  max-width: 500px;
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
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
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

.password-hint {
  color: #777;
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

.terms {
  display: flex;
  align-items: flex-start;
}

.terms input {
  margin-right: 0.5rem;
  margin-top: 0.3rem;
}

.terms label {
  font-size: 0.9rem;
  line-height: 1.4;
}

.terms-link {
  color: #111;
  text-decoration: underline;
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
  margin-top: 1rem;
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

@media (max-width: 576px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .auth-form-container {
    padding: 2rem;
  }
}
</style>
