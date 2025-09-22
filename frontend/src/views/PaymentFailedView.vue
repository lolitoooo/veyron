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
  padding: 4rem 0;
  width: 100%;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.failed-content {
  text-align: center;
  background-color: #fff;
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.failed-icon {
  font-size: 4rem;
  color: #F44336;
  margin-bottom: 1.5rem;
}

h1 {
  font-family: var(--font-heading);
  margin-bottom: 1rem;
}

p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  color: #666;
}

.error-info {
  background-color: #FFF8F8;
  padding: 1.5rem;
  border-radius: 4px;
  margin-bottom: 2rem;
  border-left: 4px solid #F44336;
}

.error-info p {
  margin-bottom: 0.5rem;
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
  background-color: #000;
  color: #fff;
}

.btn-primary:hover {
  background-color: #333;
}

.btn-secondary {
  background-color: transparent;
  color: #000;
  border: 1px solid #000;
}

.btn-secondary:hover {
  background-color: #f5f5f5;
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
