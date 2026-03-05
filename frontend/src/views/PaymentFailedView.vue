<template>
  <div class="payment-failed">
    <div class="container">
      <div class="failed-content">
        <div class="failed-icon">
          <i class="fas fa-times-circle"></i>
        </div>
        <h1>Échec du paiement</h1>
        <p v-if="paymentCancelled">Votre paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.</p>
        <p v-else>Nous n'avons pas pu traiter votre paiement. Veuillez vérifier vos informations et réessayer.</p>
        
        <div class="error-info" v-if="sessionId">
          <p>Référence de session : <strong>{{ sessionId }}</strong></p>
          <p v-if="paymentCancelled">Raison : <strong>Paiement annulé par l'utilisateur</strong></p>
          <p v-else>Raison possible : <strong>Carte refusée ou informations incorrectes</strong></p>
        </div>
        
        <div v-if="isLoading" class="loading-spinner">
          <div class="spinner"></div>
          <p>Récupération des informations de paiement...</p>
        </div>
        
        <div class="action-buttons">
          <router-link to="/checkout" class="btn btn-primary">Réessayer le paiement</router-link>
          <router-link to="/cart" class="btn btn-secondary">Retour au panier</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { useNotification } from '../composables/useNotification'
import api from '@/services/apiService'

const route = useRoute()
const cartStore = useCartStore()
const { showNotification } = useNotification()

const sessionId = ref<string | null>(null)
const paymentCancelled = ref(false)
const isLoading = ref(false)
const orderUpdated = ref(false)

async function updateOrderStatus(sessionId: string) {
  try {
    const response = await api.put(`/stripe/cancel-by-session/${sessionId}`, {
      status: 'cancelled',
      cancelReason: 'Paiement annulé par l\'utilisateur'
    })
    
    if (response.data && response.data.success) {
      orderUpdated.value = true
      return true
    }
    return false
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la commande:', error)
    return false
  }
}

onMounted(async () => {
  const sessionIdParam = route.query.session_id as string
  
  if (sessionIdParam) {
    sessionId.value = sessionIdParam
    isLoading.value = true
    
    try {
      await updateOrderStatus(sessionIdParam)
      
      paymentCancelled.value = true
      
      if (!cartStore.items || cartStore.items.length === 0) {
        await cartStore.loadCart()
      }
      
      showNotification({
        type: 'warning',
        message: 'Votre paiement a été annulé. Vous pouvez réessayer quand vous le souhaitez.'
      })
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la session:', error)
      showNotification({
        type: 'error',
        message: 'Impossible de récupérer les détails de votre paiement.'
      })
    } finally {
      isLoading.value = false
    }
  } else {
    showNotification({
      type: 'info',
      message: 'Aucune information de session disponible.'
    })
  }
})
</script>

<style scoped>
.payment-failed {
  min-height: 100vh;
  padding: 4rem 1rem;
  width: 100%;
  background: var(--color-off-white, #fafaf8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  max-width: 720px;
  margin: 0 auto;
}

.failed-content {
  text-align: center;
  background-color: var(--color-white, #ffffff);
  padding: 3rem 2.5rem;
  border-radius: 1rem;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-gray-200, #e8e8e8);
}

.failed-icon {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 1px solid rgba(139, 58, 58, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  background: #fdf4f4;
  color: var(--color-error, #8b3a3a);
  font-size: 2rem;
}

h1 {
  font-family: var(--font-primary, 'Cormorant Garamond', serif);
  font-size: 1.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary, #1a1a1a);
  margin-bottom: 0.75rem;
}

p {
  font-family: var(--font-secondary, 'Montserrat', sans-serif);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  color: var(--color-gray-600, #4a4a4a);
}

.error-info {
  background-color: #fdf4f4;
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  border-left: 3px solid rgba(139, 58, 58, 0.6);
  text-align: left;
}

.error-info p {
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
  text-align: left;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 1.5rem 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #F44336;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: var(--color-primary, #1a1a1a);
  color: var(--color-white, #ffffff);
  border-radius: 999px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.btn-primary:hover {
  background-color: var(--color-primary-light, #2d2d2d);
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-primary, #1a1a1a);
  border: 1px solid var(--color-gray-300, #d4d4d4);
  border-radius: 999px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.85rem;
}

.btn-secondary:hover {
  background-color: var(--color-gray-100, #f8f8f8);
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    margin-bottom: 0.5rem;
  }
}
</style>
