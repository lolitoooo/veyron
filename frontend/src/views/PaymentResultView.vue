<template>
  <div class="payment-result-view">
    <div class="container">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Vérification du paiement...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <h2>Erreur</h2>
          <p>{{ error }}</p>
          <button @click="goToHome" class="btn-primary">Retour à l'accueil</button>
        </div>
      </div>
      
      <div v-else-if="paymentSuccess" class="success-container">
        <div class="success-message">
          <div class="success-icon">✓</div>
          <h1>Paiement réussi</h1>
          <p>Merci pour votre commande !</p>
          <p class="order-number">Numéro de commande: <strong>{{ orderNumber }}</strong></p>
          
          <div class="order-details" v-if="order">
            <h2>Détails de votre commande</h2>
            <div class="order-summary">
              <div class="summary-row">
                <span>Date:</span>
                <span>{{ formatDate(order.createdAt) }}</span>
              </div>
              <div class="summary-row">
                <span>Statut:</span>
                <span class="status-badge" :class="statusClass">{{ translateStatus(order.status) }}</span>
              </div>
              <div class="summary-row">
                <span>Total:</span>
                <span>{{ formatPrice(order.totalPrice) }}</span>
              </div>
            </div>
            
            <div class="action-buttons">
              <button @click="viewOrderDetails" class="btn-secondary">Voir les détails</button>
              <button @click="downloadInvoice" class="btn-primary" v-if="order.invoiceUrl">
                Télécharger la facture
              </button>
            </div>
          </div>
          
          <div class="next-steps">
            <h3>Et maintenant ?</h3>
            <p>Vous recevrez un email de confirmation avec les détails de votre commande.</p>
            <p>Vous pouvez suivre l'état de votre commande dans votre espace client.</p>
            <div class="action-buttons">
              <button @click="goToOrders" class="btn-secondary">Mes commandes</button>
              <button @click="goToHome" class="btn-primary">Continuer mes achats</button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="error-container">
        <div class="error-message">
          <h2>Paiement échoué</h2>
          <p>Votre paiement n'a pas pu être traité.</p>
          <p>Veuillez réessayer ou contacter notre service client.</p>
          <div class="action-buttons">
            <button @click="goToCart" class="btn-secondary">Retour au panier</button>
            <button @click="goToHome" class="btn-primary">Retour à l'accueil</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrderStore } from '../stores/order';
import { useCartStore } from '../stores/cart';
import type { Order } from '@/types/order';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/apiService';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const cartStore = useCartStore();
const authStore = useAuthStore();

const isLoading = ref(true);
const error = ref<string | null>(null);
const paymentSuccess = ref(false);
const order = ref<Order | null>(null);
const orderNumber = ref('');

onMounted(async () => {
  const sessionId = route.query.session_id as string;
  
  if (!sessionId) {
    error.value = 'Identifiant de session manquant';
    isLoading.value = false;
    return;
  }
  
  try {
    const result = authStore.isAuthenticated
      ? await orderStore.getCheckoutSession(sessionId)
      : await api.get(`/stripe/checkout-session-public/${sessionId}`).then(r => r.data);
    
    if (result && result.status === 'complete') {
      paymentSuccess.value = true;
      order.value = result.order;
      orderNumber.value = result.order._id;
      
      cartStore.$reset();
    } else if (result && result.success && result.session && (result.session.status === 'complete' || result.session.payment_status === 'paid')) {
      paymentSuccess.value = true;
      order.value = {
        _id: result.order.id,
        totalPrice: result.order.totalPrice,
        status: result.order.status,
        createdAt: new Date().toISOString()
      } as any;
      orderNumber.value = result.order.invoiceNumber || result.order.id;
      cartStore.clearCart();
    } else {
      paymentSuccess.value = false;
    }
  } catch (err) {
    console.error('Erreur lors de la vérification du paiement:', err);
    error.value = 'Une erreur est survenue lors de la vérification de votre paiement';
  } finally {
    isLoading.value = false;
  }
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

const translateStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': 'En attente',
    'processing': 'En traitement',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée'
  };
  
  return statusMap[status] || status;
};

const statusClass = computed(() => {
  if (!order.value) return '';
  
  const statusClassMap: Record<string, string> = {
    'pending': 'status-pending',
    'processing': 'status-processing',
    'shipped': 'status-shipped',
    'delivered': 'status-delivered',
    'cancelled': 'status-cancelled'
  };
  
  return statusClassMap[order.value.status] || '';
});

const goToHome = () => {
  router.push('/');
};

const goToCart = () => {
  router.push('/cart');
};

const goToOrders = () => {
  router.push('/account/orders');
};

const viewOrderDetails = () => {
  if (order.value) {
    router.push(`/account/orders/${order.value._id}`);
  }
};

const downloadInvoice = () => {
  if (order.value && order.value.invoiceUrl) {
    window.open(order.value.invoiceUrl, '_blank');
  }
};
</script>

<style scoped>
.payment-result-view {
  padding: 2rem 0;
  width: 100%;
  min-height: 80vh;
  display: flex;
  align-items: center;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--color-primary);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container, .success-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.error-message {
  background-color: #fff3f3;
  border: 1px solid #ffcaca;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  max-width: 600px;
  width: 100%;
}

.error-message h2 {
  color: #e53935;
  margin-bottom: 1rem;
}

.success-message {
  background-color: #f0fff0;
  border: 1px solid #c8e6c9;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  max-width: 800px;
  width: 100%;
}

.success-icon {
  width: 80px;
  height: 80px;
  background-color: #4caf50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin: 0 auto 1.5rem;
}

h1 {
  font-family: var(--font-heading);
  margin-bottom: 1rem;
  color: #4caf50;
}

h2 {
  font-family: var(--font-heading);
  margin: 2rem 0 1rem;
  font-size: 1.5rem;
}

h3 {
  font-family: var(--font-heading);
  margin: 1.5rem 0 1rem;
  font-size: 1.2rem;
}

.order-number {
  font-size: 1.1rem;
  margin: 1.5rem 0;
}

.order-details {
  margin: 2rem 0;
  text-align: left;
}

.order-summary {
  background-color: #fff;
  border-radius: 6px;
  padding: 1.5rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.8rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid #eee;
}

.summary-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.status-pending {
  background-color: #fff9c4;
  color: #ffa000;
}

.status-processing {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-shipped {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-delivered {
  background-color: #e8f5e9;
  color: #388e3c;
  font-weight: bold;
}

.status-cancelled {
  background-color: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-primary, .btn-secondary {
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-dark);
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.next-steps {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn-primary, .btn-secondary {
    width: 100%;
  }
}
</style>
