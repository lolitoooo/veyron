<template>
  <div class="orders-view">
    <div class="container">
      <div class="orders-header">
        <h1>Mes commandes</h1>
      </div>
      
      <div v-if="errorNotification" class="error-notification">
        <div class="error-notification-content">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ errorNotification }}</span>
        </div>
        <button @click="errorNotification = null" class="error-notification-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Chargement de vos commandes...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <h2>Erreur</h2>
          <p>{{ error }}</p>
          <button @click="fetchOrders" class="btn-primary">Réessayer</button>
        </div>
      </div>
      
      <div v-else-if="orders && orders.length > 0" class="orders-container">
        <div class="orders-list">
          <div v-for="order in orders" :key="order._id" class="order-card">
            <div class="order-card-header">
              <div class="order-info">
                <h3>Commande #{{ order._id.substring(0, 8) }}...</h3>
                <p class="order-date">{{ formatDate(order.createdAt) }}</p>
              </div>
              <div class="order-status">
                <span class="status-badge" :class="getStatusClass(order.status)">
                  {{ translateStatus(order.status) }}
                </span>
              </div>
            </div>
            
            <div class="order-card-body">
              <div class="order-items-preview">
                <p><strong>{{ order.orderItems.length }} article(s)</strong></p>
                <div class="order-items-images">
                  <div v-for="(item, index) in order.orderItems.slice(0, 3)" :key="index" class="item-image">
                    <img :src="item.image" :alt="item.name">
                  </div>
                  <div v-if="order.orderItems.length > 3" class="item-image more">
                    +{{ order.orderItems.length - 3 }}
                  </div>
                </div>
              </div>
              
              <div class="order-total">
                <p>Total: <strong>{{ formatPrice(order.totalPrice) }}</strong></p>
              </div>
            </div>
            
            <div class="order-card-body-actions">
              <router-link :to="`/account/orders/${order._id}`" class="btn-view-details">
                <i class="fas fa-eye"></i> Voir détails
              </router-link>
            </div>
            
            <div class="order-card-footer">
              <router-link :to="`/account/orders/${order._id}`" class="btn-primary">
                Détails complets
              </router-link>
              <button 
                v-if="canCancel(order)" 
                @click="confirmCancel(order._id)" 
                class="btn-danger">
                Annuler
              </button>
              <button 
                v-if="order.invoiceNumber" 
                @click="downloadInvoice(order._id)" 
                class="btn-secondary">
                Facture
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="no-orders">
        <div class="no-orders-message">
          <h2>Aucune commande</h2>
          <p>Vous n'avez pas encore passé de commande.</p>
          <router-link to="/" class="btn-primary">Continuer vos achats</router-link>
        </div>
      </div>
      
      <div v-if="showCancelModal" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-content">
            <h2>Confirmer l'annulation</h2>
            <p>Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.</p>
            <div class="modal-actions">
              <button @click="showCancelModal = false" class="btn-secondary">Annuler</button>
              <button @click="cancelOrder" class="btn-danger" :disabled="cancelInProgress">
                <span v-if="cancelInProgress">Traitement en cours...</span>
                <span v-else>Confirmer l'annulation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOrderStore } from '../stores/order';
import type { Order } from '@/types/order';

const router = useRouter();
const orderStore = useOrderStore();

const isLoading = ref(true);
const error = ref<string | null>(null);
const orders = ref<Order[]>([]);
const showCancelModal = ref(false);
const cancelInProgress = ref(false);
const selectedOrderId = ref<string | null>(null);
const errorNotification = ref<string | null>(null);

const fetchOrders = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    await orderStore.fetchUserOrders();
    orders.value = orderStore.orders;
  } catch (err) {
    console.error('Erreur lors de la récupération des commandes:', err);
    error.value = 'Une erreur est survenue lors de la récupération de vos commandes';
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchOrders);

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
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

const getStatusClass = (status: string) => {
  const statusClassMap: Record<string, string> = {
    'pending': 'status-pending',
    'processing': 'status-processing',
    'shipped': 'status-shipped',
    'delivered': 'status-delivered',
    'cancelled': 'status-cancelled'
  };
  
  return statusClassMap[status] || '';
};

const canCancel = (order: Order) => {
  return ['pending', 'processing'].includes(order.status);
};
const confirmCancel = (orderId: string) => {
  selectedOrderId.value = orderId;
  showCancelModal.value = true;
};

const cancelOrder = async () => {
  if (!selectedOrderId.value || cancelInProgress.value) return;
  
  cancelInProgress.value = true;
  
  try {
    const result = await orderStore.cancelOrder(selectedOrderId.value);
    
    if (result.success) {
      await fetchOrders();
      showCancelModal.value = false;
    } else {
      errorNotification.value = result.message || 'Impossible d\'annuler la commande';
      showCancelModal.value = false;
      
      setTimeout(() => {
        errorNotification.value = null;
      }, 10000);
    }
  } catch (err) {
    console.error('Erreur lors de l\'annulation de la commande:', err);
    errorNotification.value = 'Une erreur est survenue lors de l\'annulation de la commande';
    showCancelModal.value = false;
    
    setTimeout(() => {
      errorNotification.value = null;
    }, 10000);
  } finally {
    cancelInProgress.value = false;
  }
};

const downloadInvoice = (orderId: string) => {
  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      error.value = 'Vous devez être connecté pour voir cette facture.';
      return;
    }
    
    const invoiceUrl = `http://localhost:3000/api/orders/${orderId}/invoice/download?token=${token}`;
    
    window.open(invoiceUrl, '_blank');
  } catch (err) {
    console.error('Erreur lors de l\'affichage de la facture:', err);
    error.value = 'Impossible d\'afficher la facture pour le moment';
  }
};
</script>

<style scoped>
.orders-view {
  padding: 2rem 0;
  width: 100%;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.orders-header {
  margin-bottom: 2rem;
}

.orders-header h1 {
  font-family: var(--font-heading);
  font-size: 2rem;
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

.error-container, .no-orders {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.error-message, .no-orders-message {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
  max-width: 500px;
}

.error-message h2, .no-orders-message h2 {
  margin-bottom: 1rem;
}

.error-message button, .no-orders-message a {
  margin-top: 1.5rem;
}

.orders-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.order-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
}

.order-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.order-date {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.status-badge {
  padding: 0.5rem 1rem;
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

.order-card-body {
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
}

.order-card-body-actions {
  padding: 0 1.5rem 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  border-bottom: 1px solid #eee;
}

.btn-view-details {
  display: inline-flex;
  align-items: center;
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-view-details i {
  margin-right: 0.5rem;
}

.btn-view-details:hover {
  color: var(--color-primary-dark);
  transform: translateY(-2px);
}

.order-items-preview p {
  margin: 0 0 0.5rem 0;
}

.order-items-images {
  display: flex;
  gap: 0.5rem;
}

.item-image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-image.more {
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  color: #666;
}

.order-total {
  text-align: right;
}

.order-total p {
  margin: 0;
}

.order-card-footer {
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-primary, .btn-secondary, .btn-danger {
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
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

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
}

.btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content {
  padding: 2rem;
}

.modal-content h2 {
  margin-bottom: 1rem;
}

.modal-content p {
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

@media (max-width: 576px) {
  .order-card-header, .order-card-body {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .order-status {
    margin-top: 1rem;
  }
  
  .order-total {
    margin-top: 1rem;
    text-align: left;
  }
  
  .order-card-body-actions {
    justify-content: flex-start;
    padding-top: 0.5rem;
  }
  
  .order-card-footer {
    flex-direction: column;
  }
  
  .order-card-footer a, .order-card-footer button {
    width: 100%;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions button {
    width: 100%;
  }
}
.error-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #f44336;
  color: white;
  padding: 15px 20px;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  max-width: 80%;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
