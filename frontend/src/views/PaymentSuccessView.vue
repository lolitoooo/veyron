<template>
  <div class="payment-success">
    <div class="container">
      <div class="success-content">
        <div v-if="isLoading" class="loading-spinner">
          <div class="spinner"></div>
          <p>Récupération des détails de votre commande...</p>
        </div>
        
        <template v-else>
          <div class="success-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h1>Paiement réussi !</h1>
          <p>Merci pour votre commande. Un email de confirmation a été envoyé à votre adresse email.</p>
          
          <div class="order-info">
            <p v-if="orderNumber">Numéro de commande : <strong>{{ orderNumber }}</strong></p>
            <p v-if="orderDate">Date : <strong>{{ formatDate(orderDate) }}</strong></p>
            <p>Montant total : <strong>{{ formatPrice(orderTotal) }} €</strong></p>
          </div>
          
          <div class="action-buttons">
            <router-link to="/account/orders" class="btn btn-primary">Voir mes commandes</router-link>
            <router-link to="/" class="btn btn-secondary">Continuer mes achats</router-link>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useCartStore } from '../stores/cart';
import { useNotification } from '../composables/useNotification';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/apiService';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const { success, warning, error: notifyError, info } = useNotification();
const authStore = useAuthStore();

const isLoading = ref(true);
const orderNumber = ref('');
const orderDate = ref<Date | null>(null);
const orderTotal = ref(0);

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

const formatPrice = (price: number): string => {
  return price.toFixed(2).replace('.', ',');
};
async function getOrderDetails(sessionId: string) {
  try {
    const response = authStore.isAuthenticated
      ? await api.get(`/stripe/checkout-session/${sessionId}`)
      : await api.get(`/stripe/checkout-session-public/${sessionId}`);
    
    if (response.data && response.data.success) {
      const { order } = response.data;
      orderNumber.value = order.invoiceNumber || order._id || order.id;
      orderDate.value = order.createdAt ? new Date(order.createdAt) : null;
      orderTotal.value = typeof order.totalPrice === 'number' ? order.totalPrice : 0;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erreur lors de la récupération des détails de la commande:', error);
    return false;
  }
}

async function clearCartAfterPayment() {
  try {
    await cartStore.clearCart();
    
    success('Votre panier a été vidé après le paiement réussi');
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vidange du panier:', error);
    warning('Impossible de vider votre panier, veuillez rafraîchir la page');
    return false;
  }
}

onMounted(async () => {
  const sessionIdParam = route.query.session_id as string;
  
  if (sessionIdParam) {
    try {
      const orderDetailsSuccess = await getOrderDetails(sessionIdParam);
      
      if (orderDetailsSuccess) {
        await clearCartAfterPayment();
        
        success('Votre commande a été traitée avec succès !');
      } else {
        warning('Impossible de récupérer les détails de votre commande.');
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la page de succès:', error);
      notifyError('Une erreur est survenue lors du traitement de votre paiement.');
    } finally {
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
    info('Aucune information de session disponible.');
    
    setTimeout(() => {
      router.push('/');
    }, 3000);
  }
});
</script>

<style scoped>
.payment-success {
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

.success-content {
  text-align: center;
  background-color: var(--color-white, #ffffff);
  padding: 3rem 2.5rem;
  border-radius: 1rem;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--color-gray-200, #e8e8e8);
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 1px solid var(--color-secondary-light, #e5d4a6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  background: var(--color-cream, #f5f3ef);
  color: var(--color-secondary, #c9a961);
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

.order-info {
  background-color: var(--color-cream, #f5f3ef);
  padding: 1.5rem;
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  text-align: left;
}

.order-info p {
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
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
  border-top-color: var(--color-secondary, #c9a961);
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
