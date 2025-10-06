<template>
  <footer class="footer">
    <div class="footer-container">
      <div class="footer-section brand-section">
        <h3>VEYRON</h3>
        <p>La mode de luxe à votre portée</p>
        
        <div class="social-icons mobile-social">
          <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
          <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
          <a href="#" aria-label="Pinterest"><i class="fab fa-pinterest-p"></i></a>
        </div>
      </div>
      
      <!-- Sections pliables pour mobile -->
      <div class="footer-section collapsible-section">
        <div class="section-header" @click="toggleSection('about')">
          <h4>À propos</h4>
          <i class="material-icons toggle-icon" :class="{ 'rotated': openSections.about }">expand_more</i>
        </div>
        <ul :class="{ 'expanded': openSections.about }">
          <li><router-link to="/about">Notre histoire</router-link></li>
          <li><router-link to="/sustainability">Développement durable</router-link></li>
          <li><router-link to="/careers">Carrières</router-link></li>
        </ul>
      </div>
      
      <div class="footer-section collapsible-section">
        <div class="section-header" @click="toggleSection('service')">
          <h4>Service client</h4>
          <i class="material-icons toggle-icon" :class="{ 'rotated': openSections.service }">expand_more</i>
        </div>
        <ul :class="{ 'expanded': openSections.service }">
          <li><router-link to="/contact">Contact</router-link></li>
          <li><router-link to="/faq">FAQ</router-link></li>
          <li><router-link to="/returns">Retours et échanges</router-link></li>
          <li><router-link to="/shipping">Livraison</router-link></li>
        </ul>
      </div>
      
      <div class="footer-section collapsible-section">
        <div class="section-header" @click="toggleSection('legal')">
          <h4>Informations légales</h4>
          <i class="material-icons toggle-icon" :class="{ 'rotated': openSections.legal }">expand_more</i>
        </div>
        <ul :class="{ 'expanded': openSections.legal }">
          <li><router-link to="/terms">Conditions générales</router-link></li>
          <li><router-link to="/privacy">Politique de confidentialité</router-link></li>
          <li><router-link to="/cookies">Politique des cookies</router-link></li>
          <li><router-link to="/legal">Mentions légales</router-link></li>
        </ul>
      </div>
    </div>
    
    <div class="footer-bottom">
      <p>&copy; {{ currentYear }} VEYRON. Tous droits réservés.</p>
      <div class="social-icons desktop-social">
        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
        <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
        <a href="#" aria-label="Pinterest"><i class="fab fa-pinterest-p"></i></a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';

const currentYear = new Date().getFullYear();
const openSections = reactive({
  about: false,
  service: false,
  legal: false
});

const toggleSection = (section: string) => {
  openSections[section] = !openSections[section];
};
</script>

<style scoped>
.footer {
  background-color: #f8f8f8;
  color: #333;
  padding: 4rem 2rem 2rem;
  margin-top: 4rem;
  font-family: var(--font-body);
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
  font-family: var(--font-heading);
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
  max-height: 1000px;
  overflow: hidden;
  transition: max-height 0.5s ease;
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

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: default;
}

.toggle-icon {
  display: none;
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.mobile-social {
  display: none;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .footer {
    padding: 2rem 1.5rem 1.5rem;
  }
  
  .section-header {
    cursor: pointer;
  }
  
  .toggle-icon {
    display: block;
  }
  
  .footer-container {
    flex-direction: column;
  }
  
  .footer-section {
    margin-bottom: 0.5rem;
    padding-right: 0;
  }
  
  .brand-section {
    margin-bottom: 2rem;
  }
  
  .collapsible-section ul {
    max-height: 0;
    margin: 0;
    transition: max-height 0.3s ease, margin 0.3s ease;
  }
  
  .collapsible-section ul.expanded {
    max-height: 200px;
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .footer-bottom {
    flex-direction: column;
    gap: 1rem;
    padding-top: 1.5rem;
    text-align: center;
  }
  
  .desktop-social {
    display: none;
  }
  
  .mobile-social {
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .footer {
    padding: 1.5rem 1rem 1rem;
    margin-top: 2rem;
  }
  
  .footer-section h3 {
    font-size: 1.2rem;
  }
  
  .footer-section h4 {
    font-size: 0.8rem;
  }
  
  .footer-section a,
  .footer-bottom p {
    font-size: 0.8rem;
  }
}
</style>
