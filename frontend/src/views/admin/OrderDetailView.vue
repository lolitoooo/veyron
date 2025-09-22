<template>
  <div class="order-detail-container">
    <div class="admin-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          ← Retour aux commandes
        </button>
        <h1>Détails de la commande #{{ orderId.substring(0, 8) }}...</h1>
      </div>
      <div class="header-actions" v-if="order">
        <span :class="['status-badge', `status-${order.status}`]">
          {{ getStatusLabel(order.status) }}
        </span>
        <button class="btn btn-primary" @click="showUpdateStatusModal = true">
          Modifier le statut
        </button>
        <button 
          v-if="!order.invoiceNumber" 
          class="btn btn-secondary" 
          @click="generateInvoice(order._id)"
        >
          Générer une facture
        </button>
        <button 
          v-else 
          class="btn btn-secondary" 
          @click="downloadInvoice(order._id)"
        >
          Télécharger la facture
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement en cours...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="!order" class="not-found">
      <h2>Commande non trouvée</h2>
      <p>La commande demandée n'existe pas ou a été supprimée.</p>
      <button class="btn btn-primary" @click="goBack">Retour aux commandes</button>
    </div>
    
    <div v-else class="order-content">
      <div class="order-info-grid">
        <div class="info-card">
          <h3>Informations client</h3>
          <div class="info-content">
            <p><strong>Nom:</strong> {{ order.user?.firstName }} {{ order.user?.lastName }}</p>
            <p><strong>Email:</strong> {{ order.user?.email }}</p>
            <p v-if="order.user?.phone"><strong>Téléphone:</strong> {{ order.user?.phone }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>Adresse de livraison</h3>
          <div class="info-content">
            <p>{{ order.shippingAddress?.address }}</p>
            <p>{{ order.shippingAddress?.postalCode }} {{ order.shippingAddress?.city }}</p>
            <p>{{ order.shippingAddress?.country }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>Adresse de facturation</h3>
          <div class="info-content">
            <p>{{ order.billingAddress?.address }}</p>
            <p>{{ order.billingAddress?.postalCode }} {{ order.billingAddress?.city }}</p>
            <p>{{ order.billingAddress?.country }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>Paiement</h3>
          <div class="info-content">
            <p><strong>Méthode:</strong> {{ order.paymentMethod === 'card' ? 'Carte bancaire' : order.paymentMethod }}</p>
            <p v-if="order.paymentDetails?.last4"><strong>Carte:</strong> **** **** **** {{ order.paymentDetails?.last4 }}</p>
            <p v-if="order.paymentDetails?.transactionId"><strong>Transaction ID:</strong> {{ order.paymentDetails?.transactionId }}</p>
            <p><strong>Date:</strong> {{ formatDate(order.createdAt) }}</p>
            <p v-if="order.paidAt"><strong>Date de paiement:</strong> {{ formatDate(order.paidAt) }}</p>
            <p v-if="order.invoiceNumber"><strong>N° Facture:</strong> {{ order.invoiceNumber }}</p>
          </div>
        </div>
        
        <div class="info-card">
          <h3>Résumé</h3>
          <div class="info-content summary">
            <div class="summary-row">
              <span>Sous-total HT:</span>
              <span>{{ formatPrice(order.itemsPrice) }}</span>
            </div>
            <div class="summary-row">
              <span>Frais de livraison:</span>
              <span>{{ formatPrice(order.shippingPrice) }}</span>
            </div>
            <div v-if="order.taxPrice > 0" class="summary-row">
              <span>TVA (20%):</span>
              <span>{{ formatPrice(order.taxPrice) }}</span>
            </div>
            <div v-if="order.discountPrice > 0" class="summary-row discount">
              <span>Remise:</span>
              <span>-{{ formatPrice(order.discountPrice) }}</span>
            </div>
            <div class="summary-row total">
              <span>Total TTC:</span>
              <span>{{ formatPrice(order.totalPrice) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- <div class="order-items">
        <h3>Articles commandés</h3>
        <div class="items-table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix unitaire</th>
                <th>Quantité</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in order.orderItems" :key="item._id">
                <td>
                  <div class="product-cell">
                    <div class="product-image">
                      <img :src="item.product?.images?.[0] || 'https://via.placeholder.com/50'" :alt="item.product?.name" />
                    </div>
                    <div class="product-info">
                      <div class="product-name">{{ item.product?.name }}</div>
                      <div class="product-id" v-if="item.variant">
                        <span v-if="item.variant.size">Taille: {{ item.variant.size }}</span>
                        <span v-if="item.variant.color">, Couleur: {{ item.variant.color }}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>{{ formatPrice(item.price) }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatPrice(item.price * item.quantity) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div> -->
    </div>
  </div>
  
  <div v-if="showUpdateStatusModal" class="modal">
    <div class="modal-content">
      <h3>Modifier le statut de la commande</h3>
      
      <p v-if="order">
        Commande <strong>#{{ order._id.substring(0, 8) }}...</strong> - Client: {{ order.user?.firstName }} {{ order.user?.lastName }}
      </p>
      
      <div class="form-group">
        <label for="orderStatus">Statut de la commande</label>
        <select id="orderStatus" v-model="newStatus" class="form-select">
          <option value="pending">En attente</option>
          <option value="processing">En traitement</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>
      
      <div class="form-group">
        <p><strong>Statut actuel :</strong> <span :class="['status-badge', `status-${order?.status}`]">{{ getStatusLabel(order?.status || '') }}</span></p>
        <p><strong>Date de commande :</strong> {{ order ? formatDate(order.createdAt) : '' }}</p>
        <p><strong>Total :</strong> {{ order ? formatPrice(order.totalPrice) : '' }}</p>
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" @click="showUpdateStatusModal = false">Annuler</button>
        <button 
          type="button" 
          class="btn btn-primary" 
          @click="updateOrderStatus"
        >
          Mettre à jour
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminOrderStore } from '@/stores/adminOrder';
import type { Order } from '@/types/order';

const router = useRouter();
const route = useRoute();
const adminOrderStore = useAdminOrderStore();
const orderId = computed(() => route.params.id as string);
const loading = computed(() => adminOrderStore.isLoading);
const error = computed(() => adminOrderStore.error);
const order = ref<Order | null>(null);
const showUpdateStatusModal = ref(false);
const newStatus = ref('');

async function fetchOrderDetails() {
  if (!orderId.value) return;
  
  try {
    const orderDetails = await adminOrderStore.fetchOrderDetails(orderId.value);
    if (orderDetails) {
      order.value = orderDetails;
    }
  } catch (err) {
    console.error('Erreur lors du chargement des détails de la commande:', err);
  }
};

onMounted(() => {
  fetchOrderDetails();
});

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée'
  };
  return statusLabels[status] || status;
};

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(price);
};

async function updateOrderStatus() {
  if (!order.value || !newStatus.value) return;
  
  try {
    const success = await adminOrderStore.updateOrderStatus(orderId.value, newStatus.value);
    
    if (success) {
      await fetchOrderDetails();
      showUpdateStatusModal.value = false;
    }
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut:', err);
  }
}

async function generateInvoice(orderId: string) {
  try {
    await adminOrderStore.generateInvoice(orderId);
    await fetchOrderDetails();
  } catch (err) {
    console.error('Erreur lors de la génération de la facture:', err);
  }
}

async function downloadInvoice(orderId: string) {
  try {
    const invoiceData = await adminOrderStore.getInvoice(orderId);
    if (invoiceData && invoiceData.invoiceUrl) {
      window.open(invoiceData.invoiceUrl, '_blank');
    }
  } catch (err) {
    console.error('Erreur lors du téléchargement de la facture:', err);
  }
}

const goBack = () => {
  router.push({ name: 'admin-orders' });
};
</script>

<style scoped>
.order-detail-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.btn-back:hover {
  text-decoration: underline;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.not-found {
  text-align: center;
  padding: 3rem;
  color: #757575;
}

.order-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.info-card h3 {
  background-color: #f5f5f5;
  margin: 0;
  padding: 1rem;
  font-size: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.info-content {
  padding: 1rem;
}

.info-content p {
  margin: 0.5rem 0;
}

.summary {
  padding: 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.discount {
  color: #d32f2f;
}

.summary-row.total {
  font-weight: bold;
  background-color: #f9f9f9;
}

.order-items {
  margin-top: 2rem;
}

.order-items h3 {
  margin-bottom: 1rem;
}

.items-table-container {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
}

.items-table th,
.items-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.items-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.product-image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 500;
}

.product-id {
  font-size: 0.8rem;
  color: #757575;
  margin-top: 0.25rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-pending {
  background-color: #fff8e1;
  color: #f57c00;
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
  color: #2e7d32;
  font-weight: 600;
}

.status-cancelled {
  background-color: #ffebee;
  color: #d32f2f;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover {
  background-color: #1565c0;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #424242;
}

.btn-secondary:hover {
  background-color: #d5d5d5;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

@media (max-width: 768px) {
  .order-detail-container {
    padding: 1rem;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .order-info-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    padding: 1.5rem;
    margin: 0 1rem;
  }
}
</style>
