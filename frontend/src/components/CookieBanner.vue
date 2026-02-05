<template>
  <Transition name="slide-up">
    <div v-if="cookieStore.showBanner" class="cookie-banner">
      <div class="cookie-banner-content">
        <div class="cookie-banner-text">
          <h3>🍪 Nous utilisons des cookies</h3>
          <p>
            Nous utilisons des cookies pour améliorer votre expérience sur notre site, analyser le trafic et personnaliser le contenu. 
            Vous pouvez accepter tous les cookies ou personnaliser vos préférences.
          </p>
          <router-link to="/cookies" class="cookie-link">En savoir plus sur notre politique de cookies</router-link>
        </div>
        
        <div class="cookie-banner-actions">
          <button @click="cookieStore.openSettings()" class="btn-secondary">
            Personnaliser
          </button>
          <button @click="cookieStore.rejectAll()" class="btn-secondary">
            Refuser tout
          </button>
          <button @click="cookieStore.acceptAll()" class="btn-primary">
            Accepter tout
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useCookieStore } from '@/stores/cookies'

const cookieStore = useCookieStore()
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.cookie-banner-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.cookie-banner-text {
  flex: 1;
}

.cookie-banner-text h3 {
  font-family: var(--font-heading);
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.cookie-banner-text p {
  margin: 0 0 0.5rem 0;
  line-height: 1.5;
  color: #666;
  font-size: 0.95rem;
}

.cookie-link {
  color: #000;
  text-decoration: underline;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.cookie-link:hover {
  color: #333;
}

.cookie-banner-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
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

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .cookie-banner {
    padding: 1rem;
  }

  .cookie-banner-content {
    flex-direction: column;
    gap: 1rem;
  }

  .cookie-banner-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    padding: 0.875rem 1rem;
  }

  .cookie-banner-text h3 {
    font-size: 1.1rem;
  }

  .cookie-banner-text p {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .cookie-banner-text h3 {
    font-size: 1rem;
  }

  .cookie-banner-text p,
  .cookie-link {
    font-size: 0.85rem;
  }
}
</style>
