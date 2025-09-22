<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-section">
        <h3>VEYRON</h3>
        <p>La mode de luxe à votre portée</p>
      </div>
      
      <div class="footer-section">
        <h4>À propos</h4>
        <ul>
          <li><router-link to="/about">Notre histoire</router-link></li>
          <li><router-link to="/sustainability">Développement durable</router-link></li>
          <li><router-link to="/careers">Carrières</router-link></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h4>Service client</h4>
        <ul>
          <li><router-link to="/contact">Contact</router-link></li>
          <li><router-link to="/faq">FAQ</router-link></li>
          <li><router-link to="/returns">Retours et échanges</router-link></li>
          <li><router-link to="/shipping">Livraison</router-link></li>
        </ul>
      </div>
      
      <div class="footer-section">
        <h4>Informations légales</h4>
        <ul>
          <li><router-link to="/terms">Conditions générales</router-link></li>
          <li><router-link to="/privacy">Politique de confidentialité</router-link></li>
          <li><router-link to="/cookies">Politique des cookies</router-link></li>
          <li><router-link to="/legal">Mentions légales</router-link></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>&copy; {{ currentYear }} VEYRON. Tous droits réservés.</p>
      <div class="social-icons">
        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
        <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
        <a href="#" aria-label="Pinterest"><i class="fab fa-pinterest-p"></i></a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const currentYear = new Date().getFullYear();
</script>

<style scoped>
.footer {
  background-color: #f8f8f8;
  color: #333;
  padding: 4rem 2rem 2rem;
  margin-top: 4rem;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

.footer-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.footer-section {
  flex: 1;
  min-width: 200px;
  margin-bottom: 2rem;
  padding-right: 2rem;
}

.footer-section h3 {
  font-size: 1.5rem;
  font-weight: 300;
  margin-bottom: 1rem;
  letter-spacing: 0.2rem;
}

.footer-section h4 {
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  margin-bottom: 1rem;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 0.5rem;
}

.footer-section a {
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: #000;
}

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 2rem;
  border-top: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #666;
}

.social-icons {
  display: flex;
  gap: 1.5rem;
}

.social-icons a {
  color: #666;
  transition: color 0.3s ease;
}

.social-icons a:hover {
  color: #000;
}

@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
  }
  
  .footer-section {
    margin-bottom: 2rem;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
