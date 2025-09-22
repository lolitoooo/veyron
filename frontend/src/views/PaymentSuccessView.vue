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
import api from '@/services/apiService';

const route = useRoute();
const router = useRouter();
const cartStore = useCartStore();
const { showNotification } = useNotification();

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
    const response = await api.get(`/stripe/checkout-session/${sessionId}`);
    
    if (response.data && response.data.success) {
      const { order } = response.data;
      orderNumber.value = order.invoiceNumber || order._id;
      orderDate.value = new Date(order.createdAt);
      orderTotal.value = order.totalPrice;
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
    
    showNotification({
      type: 'success',
      message: 'Votre panier a été vidé après le paiement réussi'
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la vidange du panier:', error);
    showNotification({
      type: 'warning',
      message: 'Impossible de vider votre panier, veuillez rafraîchir la page'
    });
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
        
        showNotification({
          type: 'success',
          message: 'Votre commande a été traitée avec succès !'
        });
      } else {
        showNotification({
          type: 'warning',
          message: 'Impossible de récupérer les détails de votre commande.'
        });
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la page de succès:', error);
      showNotification({
        type: 'error',
        message: 'Une erreur est survenue lors du traitement de votre paiement.'
      });
    } finally {
      isLoading.value = false;
    }
  } else {
    isLoading.value = false;
    showNotification({
      type: 'info',
      message: 'Aucune information de session disponible.'
    });
    
    setTimeout(() => {
      router.push('/');
    }, 3000);
  }
});
</script>

<style scoped>
.payment-success {
  padding: 4rem 0;
  width: 100%;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.success-content {
  text-align: center;
  background-color: #fff;
  padding: 3rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.success-icon {
  font-size: 4rem;
  color: #4CAF50;
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

.order-info {
  background-color: #f9f9f9;
  padding: 1.5rem;
  border-radius: 4px;
  margin-bottom: 2rem;
}

.order-info p {
  margin-bottom: 0.5rem;
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
  border-top-color: #4CAF50;
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
