<template>
  <div class="order-detail-view">
    <div class="container">
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
        <p>Chargement des détails de la commande...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <h2>Erreur</h2>
          <p>{{ error }}</p>
          <button @click="goBack" class="btn-primary">Retour</button>
        </div>
      </div>
      
      <div v-else-if="order" class="order-container">
        <div class="order-header">
          <div class="order-title">
            <h1>Détails de la commande</h1>
            <p class="order-id">Commande #{{ order._id }}</p>
            <p class="order-date">Passée le {{ formatDate(order.createdAt) }}</p>
          </div>
          
          <div class="order-status">
            <span class="status-badge" :class="statusClass">{{ translateStatus(order.status) }}</span>
          </div>
        </div>
        
        <div class="order-grid">
          <div class="order-details">
            <div class="section">
              <h2>Articles commandés</h2>
              <div class="order-items">
                <div v-for="item in order.orderItems" :key="item.variantId" class="order-item">
                  <div class="item-image">
                    <img :src="item.image" :alt="item.name">
                  </div>
                  <div class="item-details">
                    <h3>{{ item.name }}</h3>
                    <p>{{ item.variant.size }} - {{ item.variant.color }}</p>
                    <p>Quantité: {{ item.qty }}</p>
                    <p class="item-price">{{ formatPrice(item.price) }} TTC</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="section addresses">
              <div class="address-section">
                <h2>Adresse de livraison</h2>
                <div class="address-card">
                  <p><strong>{{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}</strong></p>
                  <p>{{ order.shippingAddress.addressLine1 }}</p>
                  <p v-if="order.shippingAddress.addressLine2">{{ order.shippingAddress.addressLine2 }}</p>
                  <p>{{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}</p>
                  <p>{{ order.shippingAddress.country }}</p>
                  <p>{{ order.shippingAddress.phone }}</p>
                </div>
              </div>
              
              <div class="address-section">
                <h2>Adresse de facturation</h2>
                <div class="address-card">
                  <p><strong>{{ order.billingAddress.firstName }} {{ order.billingAddress.lastName }}</strong></p>
                  <p>{{ order.billingAddress.addressLine1 }}</p>
                  <p v-if="order.billingAddress.addressLine2">{{ order.billingAddress.addressLine2 }}</p>
                  <p>{{ order.billingAddress.postalCode }} {{ order.billingAddress.city }}</p>
                  <p>{{ order.billingAddress.country }}</p>
                  <p>{{ order.billingAddress.phone }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="order-summary">
            <div class="section">
              <h2>Récapitulatif</h2>
              
              <div class="summary-totals">
                <div class="summary-row">
                  <span>Sous-total TTC:</span>
                  <span>{{ formatPrice(order.totalPrice - order.taxPrice - order.shippingPrice) }}</span>
                </div>
                <div class="summary-row">
                  <span>TVA (20%):</span>
                  <span>{{ formatPrice(order.taxPrice) }}</span>
                </div>
                <div class="summary-row">
                  <span>Frais de livraison:</span>
                  <span>{{ formatPrice(order.shippingPrice) }}</span>
                </div>
                <div class="summary-row total">
                  <span>Total:</span>
                  <span>{{ formatPrice(order.totalPrice) }}</span>
                </div>
              </div>
            </div>
            
            <div class="section payment-info">
              <h2>Informations de paiement</h2>
              <div class="payment-details">
                <div class="payment-row">
                  <span>Méthode:</span>
                  <span>{{ order.paymentMethod }}</span>
                </div>
                <div class="payment-row">
                  <span>Statut:</span>
                  <span>{{ order.isPaid ? 'Payé' : 'Non payé' }}</span>
                </div>
                <div v-if="order.isPaid" class="payment-row">
                  <span>Date de paiement:</span>
                  <span>{{ formatDate(order.paidAt) }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="order.invoiceNumber" class="section invoice-section">
              <h2>Facture</h2>
              <div class="invoice-details">
                <div class="invoice-row">
                  <span>Numéro:</span>
                  <span>{{ order.invoiceNumber }}</span>
                </div>
                <div class="invoice-row">
                  <span>Date:</span>
                  <span>{{ formatDate(order.invoiceDate) }}</span>
                </div>
                <button @click="downloadInvoice" class="btn-primary btn-invoice">
                  Télécharger la facture
                </button>
              </div>
            </div>
            
            <div class="section actions">
              <button v-if="canCancel" @click="confirmCancel" class="btn-danger">
                Annuler la commande
              </button>
              <button @click="goToOrders" class="btn-secondary">
                Retour à mes commandes
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="error-container">
        <div class="error-message">
          <h2>Commande introuvable</h2>
          <p>La commande demandée n'existe pas ou vous n'avez pas les droits pour y accéder.</p>
          <button @click="goBack" class="btn-primary">Retour</button>
        </div>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrderStore } from '../../stores/order';
import type { Order } from '@/types/order';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();

const isLoading = ref(true);
const error = ref<string | null>(null);
const order = ref<Order | null>(null);
const showCancelModal = ref(false);
const cancelInProgress = ref(false);
const errorNotification = ref<string | null>(null);

onMounted(async () => {
  const orderId = route.params.id as string;
  
  if (!orderId) {
    error.value = 'Identifiant de commande manquant';
    isLoading.value = false;
    return;
  }
  
  try {
    const result = await orderStore.fetchOrderById(orderId);
    if (result) {
      order.value = result;
    } else {
      error.value = 'Commande introuvable';
    }
  } catch (err) {
    console.error(`Erreur lors de la récupération de la commande ${orderId}:`, err);
    error.value = 'Une erreur est survenue lors de la récupération des détails de la commande';
  } finally {
    isLoading.value = false;
  }
});

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  
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

const canCancel = computed(() => {
  if (!order.value) return false;
  
  return ['pending', 'processing'].includes(order.value.status);
});

const downloadInvoice = async () => {
  if (!order.value) return;
  
  try {
    const invoiceData = await orderStore.generateInvoice(order.value._id);
    
    if (invoiceData && invoiceData.invoiceUrl) {
      window.open(invoiceData.invoiceUrl, '_blank');
    } else {
      error.value = 'Impossible de générer la facture';
    }
  } catch (err) {
    console.error('Erreur lors de la génération de la facture:', err);
    error.value = 'Une erreur est survenue lors de la génération de la facture';
  }
};

const confirmCancel = () => {
  showCancelModal.value = true;
};
const cancelOrder = async () => {
  if (!order.value || cancelInProgress.value) return;
  
  cancelInProgress.value = true;
  
  try {
    const result = await orderStore.cancelOrder(order.value._id);
    
    if (result.success) {
      await orderStore.fetchOrderById(order.value._id);
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

const goBack = () => {
  router.back();
};

const goToOrders = () => {
  router.push('/account/orders');
};
</script>

<style scoped>
.order-detail-view {
  padding: 2rem 0;
  width: 100%;
}

.container {
  max-width: 1200px;
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

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.error-message {
  background-color: #fff3f3;
  border: 1px solid #ffcaca;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  max-width: 500px;
}

.error-message h2 {
  color: #e53935;
  margin-bottom: 1rem;
}

.error-message button {
  margin-top: 1.5rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.order-title h1 {
  font-family: var(--font-heading);
  margin-bottom: 0.5rem;
}

.order-id {
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
  font-weight: 500;
}

.order-date {
  color: #666;
  font-size: 0.9rem;
}

.order-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .order-grid {
    grid-template-columns: 1fr;
  }
  
  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .order-status {
    margin-top: 1rem;
  }
}

.section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.section h2 {
  font-family: var(--font-heading);
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
}

.order-items {
  margin-bottom: 1rem;
}

.order-item {
  display: flex;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.order-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  margin-right: 1rem;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.item-details {
  flex-grow: 1;
}

.item-details h3 {
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
}

.item-details p {
  margin: 0.2rem 0;
  font-size: 0.9rem;
  color: #666;
}

.item-price {
  font-weight: bold;
  color: #000 !important;
}

.addresses {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 576px) {
  .addresses {
    grid-template-columns: 1fr;
  }
}

.address-card {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 1rem;
  margin-top: 0.5rem;
}

.address-card p {
  margin: 0.3rem 0;
  font-size: 0.9rem;
}

.summary-totals {
  margin-top: 1rem;
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
}

.summary-row.total {
  font-weight: bold;
  font-size: 1.1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.payment-details, .invoice-details {
  margin-top: 1rem;
}

.payment-row, .invoice-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.btn-invoice {
  margin-top: 1rem;
  width: 100%;
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

.btn-primary, .btn-secondary, .btn-danger {
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

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.actions button {
  width: 100%;
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
  .modal-actions {
    flex-direction: column;
  }
  
  .modal-actions button {
    width: 100%;
  }
}
.error-notification {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-notification-content {
  display: flex;
  align-items: center;
}

.error-notification-content i {
  margin-right: 10px;
}

.error-notification-close {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  margin-left: 15px;
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