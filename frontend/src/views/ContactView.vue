<template>
  <div class="contact-view">
    <div class="container">
      <h1>Contactez-nous</h1>
      
      <div class="contact-content">
        <div class="contact-info">
          <h2>Nos coordonnées</h2>
          
          <div class="info-item">
            <i class="fas fa-map-marker-alt"></i>
            <div>
              <h3>Adresse</h3>
              <p>123 Avenue de la Mode<br>75008 Paris, France</p>
            </div>
          </div>
          
          <div class="info-item">
            <i class="fas fa-phone"></i>
            <div>
              <h3>Téléphone</h3>
              <p>+33 (0)1 23 45 67 89</p>
            </div>
          </div>
          
          <div class="info-item">
            <i class="fas fa-envelope"></i>
            <div>
              <h3>Email</h3>
              <p>contact@veyron.com</p>
            </div>
          </div>
          
          <div class="info-item">
            <i class="fas fa-clock"></i>
            <div>
              <h3>Horaires d'ouverture</h3>
              <p>Lundi - Vendredi: 10h - 19h<br>Samedi: 10h - 18h<br>Dimanche: Fermé</p>
            </div>
          </div>
          
          <div class="social-links">
            <h3>Suivez-nous</h3>
            <div class="social-icons">
              <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
              <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
              <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a>
              <a href="#" class="social-icon"><i class="fab fa-pinterest"></i></a>
            </div>
          </div>
        </div>
        
        <div class="contact-form">
          <h2>Envoyez-nous un message</h2>
          
          <form @submit.prevent="submitForm">
            <div class="form-group">
              <label for="name">Nom complet</label>
              <input 
                type="text" 
                id="name" 
                v-model="form.name" 
                required
              />
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                v-model="form.email" 
                required
              />
            </div>
            
            <div class="form-group">
              <label for="subject">Sujet</label>
              <input 
                type="text" 
                id="subject" 
                v-model="form.subject" 
                required
              />
            </div>
            
            <div class="form-group">
              <label for="message">Message</label>
              <textarea 
                id="message" 
                v-model="form.message" 
                rows="5" 
                required
              ></textarea>
            </div>
            
            <div class="form-group form-checkbox">
              <input 
                type="checkbox" 
                id="privacy" 
                v-model="form.privacy" 
                required
              />
              <label for="privacy">
                J'accepte que mes données soient utilisées pour me recontacter conformément à la 
                <router-link to="/privacy">politique de confidentialité</router-link>.
              </label>
            </div>
            
            <button 
              type="submit" 
              class="submit-btn" 
              :disabled="loading"
            >
              <span v-if="loading">Envoi en cours...</span>
              <span v-else>Envoyer</span>
            </button>
            
            <div v-if="success" class="success-message">
              Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.
            </div>
            
            <div v-if="error" class="error-message">
              {{ error }}
            </div>
          </form>
        </div>
      </div>
      
      <div class="map-container">
        <h2>Nous trouver</h2>
        <div class="map">
          <img src="https://via.placeholder.com/1200x400?text=Google+Maps" alt="Carte" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
  privacy: false
});

const loading = ref(false);
const success = ref(false);
const error = ref('');

const submitForm = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    form.name = '';
    form.email = '';
    form.subject = '';
    form.message = '';
    form.privacy = false;
    
    success.value = true;
    
    setTimeout(() => {
      success.value = false;
    }, 5000);
    
  } catch (err) {
    error.value = "Une erreur est survenue lors de l'envoi du formulaire. Veuillez réessayer.";
    console.error(err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.contact-view {
  padding: 2rem 0;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

h1 {
  font-family: var(--font-heading);
  margin-bottom: 2rem;
  text-align: center;
}

h2 {
  font-family: var(--font-heading);
  margin-bottom: 1.5rem;
}

h3 {
  font-family: var(--font-heading);
  margin-bottom: 0.5rem;
}

.contact-content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  margin-bottom: 3rem;
}

.contact-info, .contact-form {
  flex: 1;
  min-width: 300px;
}

.info-item {
  display: flex;
  margin-bottom: 1.5rem;
}

.info-item i {
  font-size: 1.5rem;
  margin-right: 1rem;
  color: #000;
  width: 30px;
  text-align: center;
}

.social-links {
  margin-top: 2rem;
}

.social-icons {
  display: flex;
  gap: 1rem;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #000;
  color: #fff;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.social-icon:hover {
  transform: translateY(-3px);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  font-family: var(--font-body);
  font-size: 1rem;
}

textarea {
  resize: vertical;
}

.form-checkbox {
  display: flex;
  align-items: flex-start;
}

.form-checkbox input {
  width: auto;
  margin-right: 0.5rem;
  margin-top: 0.25rem;
}

.form-checkbox label {
  font-weight: normal;
  font-size: 0.9rem;
}

.submit-btn {
  display: block;
  width: 100%;
  padding: 0.75rem;
  background: #000;
  color: #fff;
  border: none;
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 1rem;
  transition: background 0.3s ease;
}

.submit-btn:hover {
  background: #333;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.success-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: #ffebee;
  color: #c62828;
  border-radius: 4px;
}

.map-container {
  margin-top: 3rem;
}

.map {
  width: 100%;
  height: 400px;
  overflow: hidden;
  border-radius: 4px;
}

.map img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .contact-content {
    flex-direction: column;
  }
}
</style>
