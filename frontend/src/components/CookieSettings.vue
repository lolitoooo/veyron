<template>
  <Transition name="fade">
    <div v-if="cookieStore.showSettings" class="cookie-settings-overlay" @click.self="cookieStore.closeSettings()">
      <div class="cookie-settings-modal">
        <div class="modal-header">
          <h2>Paramètres des cookies</h2>
          <button @click="cookieStore.closeSettings()" class="close-btn" aria-label="Fermer">
            <i class="material-icons">close</i>
          </button>
        </div>

        <div class="modal-content">
          <p class="intro-text">
            Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
            Vous pouvez choisir les catégories de cookies que vous souhaitez autoriser.
          </p>

          <div class="cookie-category">
            <div class="category-header">
              <div class="category-info">
                <h3>
                  <i class="material-icons">check_circle</i>
                  Cookies essentiels
                </h3>
                <span class="badge required">Toujours actifs</span>
              </div>
            </div>
            <p class="category-description">
              Ces cookies sont nécessaires au bon fonctionnement du site. Ils permettent l'utilisation des fonctionnalités 
              essentielles comme la connexion, le panier d'achat et la sécurité. Ils ne peuvent pas être désactivés.
            </p>
            <div class="cookie-examples">
              <strong>Exemples :</strong> Session, Authentification, Sécurité, Panier
            </div>
          </div>

          <div class="cookie-category">
            <div class="category-header">
              <div class="category-info">
                <h3>
                  <i class="material-icons">tune</i>
                  Cookies de préférences
                </h3>
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="localPreferences.preferences"
                  >
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            <p class="category-description">
              Ces cookies permettent de mémoriser vos préférences et choix (langue, devise, taille) pour vous offrir 
              une expérience personnalisée lors de vos prochaines visites.
            </p>
            <div class="cookie-examples">
              <strong>Exemples :</strong> Langue, Devise, Préférences d'affichage
            </div>
          </div>

          <div class="cookie-category">
            <div class="category-header">
              <div class="category-info">
                <h3>
                  <i class="material-icons">analytics</i>
                  Cookies analytiques
                </h3>
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="localPreferences.analytics"
                  >
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            <p class="category-description">
              Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site en collectant des 
              informations anonymes. Cela nous permet d'améliorer continuellement votre expérience.
            </p>
            <div class="cookie-examples">
              <strong>Exemples :</strong> Google Analytics, Hotjar, Statistiques de visite
            </div>
          </div>

          <div class="cookie-category">
            <div class="category-header">
              <div class="category-info">
                <h3>
                  <i class="material-icons">campaign</i>
                  Cookies marketing
                </h3>
                <label class="toggle-switch">
                  <input 
                    type="checkbox" 
                    v-model="localPreferences.marketing"
                  >
                  <span class="slider"></span>
                </label>
              </div>
            </div>
            <p class="category-description">
              Ces cookies sont utilisés pour afficher des publicités pertinentes et suivre l'efficacité de nos 
              campagnes marketing. Ils peuvent être déposés par nos partenaires publicitaires.
            </p>
            <div class="cookie-examples">
              <strong>Exemples :</strong> Facebook Pixel, Google Ads, Réseaux sociaux
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="saveAndClose" class="btn-primary">
            Enregistrer mes préférences
          </button>
          <button @click="acceptAllAndClose" class="btn-secondary">
            Tout accepter
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCookieStore } from '@/stores/cookies'
import type { CookiePreferences } from '@/stores/cookies'

const cookieStore = useCookieStore()

const localPreferences = ref<CookiePreferences>({ ...cookieStore.preferences })

watch(() => cookieStore.showSettings, (newVal) => {
  if (newVal) {
    localPreferences.value = { ...cookieStore.preferences }
  }
})

const saveAndClose = () => {
  cookieStore.preferences = { ...localPreferences.value }
  cookieStore.savePreferences()
}

const acceptAllAndClose = () => {
  cookieStore.acceptAll()
}
</script>

<style scoped>
.cookie-settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  overflow-y: auto;
}

.cookie-settings-modal {
  background-color: #fff;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  margin: 0;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background-color: #f5f5f5;
}

.close-btn i {
  font-size: 24px;
  color: #666;
}

.modal-content {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

.intro-text {
  margin-bottom: 2rem;
  line-height: 1.6;
  color: #666;
}

.cookie-category {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.category-header {
  margin-bottom: 1rem;
}

.category-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.category-info h3 {
  font-family: var(--font-heading);
  font-size: 1.1rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.category-info h3 i {
  font-size: 20px;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
}

.badge.required {
  background-color: #e3f2fd;
  color: #1976d2;
}

.category-description {
  margin: 0.75rem 0;
  line-height: 1.6;
  color: #666;
  font-size: 0.95rem;
}

.cookie-examples {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #fff;
  border-radius: 4px;
  font-size: 0.9rem;
  color: #666;
}

.cookie-examples strong {
  color: #333;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #000;
}

input:checked + .slider:before {
  transform: translateX(24px);
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-primary {
  background-color: #000;
  color: #fff;
}

.btn-primary:hover {
  background-color: #333;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active .cookie-settings-modal,
.fade-leave-active .cookie-settings-modal {
  transition: transform 0.3s ease;
}

.fade-enter-from .cookie-settings-modal {
  transform: scale(0.9);
}

.fade-leave-to .cookie-settings-modal {
  transform: scale(0.9);
}

@media (max-width: 768px) {
  .cookie-settings-modal {
    max-height: 95vh;
    margin: 0.5rem;
  }

  .modal-header {
    padding: 1rem 1.5rem;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }

  .modal-content {
    padding: 1.5rem;
  }

  .cookie-category {
    padding: 1rem;
  }

  .category-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .modal-footer {
    padding: 1rem 1.5rem;
    flex-direction: column-reverse;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-header h2 {
    font-size: 1.1rem;
  }

  .category-info h3 {
    font-size: 1rem;
  }

  .category-description,
  .cookie-examples {
    font-size: 0.85rem;
  }
}
</style>
