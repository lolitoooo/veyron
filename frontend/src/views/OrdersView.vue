<template>
  <AccountLayout>
    <div class="orders-header">
      <h2>Mes commandes</h2>
      <p>Consultez l'historique et le statut de vos commandes.</p>
    </div>
    
    <div v-if="loading" class="loading-indicator">
      <p>Chargement des commandes...</p>
    </div>
    
    <div v-else-if="!orders || orders.length === 0" class="empty-state">
      <p>Vous n'avez pas encore passé de commande.</p>
      <router-link :to="{ name: 'home' }" class="btn-primary">Découvrir nos produits</router-link>
    </div>
    
    <div v-else>
      <div class="orders-table desktop-orders">
        <table>
          <thead>
            <tr>
              <th>Commande</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order._id">
              <td>#{{ order.orderNumber || order._id.substring(0, 8) }}</td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>
                <span class="status-badge" :class="order.status">
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td>{{ formatPrice(order.totalPrice) }}</td>
              <td>
                <router-link :to="`/account/orders/${order._id}`" class="btn-link">
                  Détails
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="mobile-orders">
        <div v-for="order in orders" :key="order._id" class="mobile-order-card">
          <div class="order-card-header">
            <h4>Commande #{{ order.orderNumber || order._id.substring(0, 8) }}</h4>
            <span class="status-badge" :class="order.status">
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
          <div class="order-card-body">
            <div class="order-detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div class="order-detail-row">
              <span class="detail-label">Total:</span>
              <span class="detail-value">{{ formatPrice(order.totalPrice) }}</span>
            </div>
          </div>
          <div class="order-card-footer">
            <router-link :to="`/account/orders/${order._id}`" class="btn-outline">
              Voir les détails
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </AccountLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/apiService';
import AccountLayout from '@/layouts/AccountLayout.vue';

const authStore = useAuthStore();
const orders = ref([]);
const loading = ref(false);

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(price);
};

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'En attente',
    'processing': 'En traitement',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée'
  };
  return statusMap[status] || status;
};

const loadOrders = async () => {
  loading.value = true;
  try {
    if (!authStore.isAuthenticated || !authStore.user) {
      console.warn('Utilisateur non authentifié ou données utilisateur manquantes');
      return;
    }
        
    const userId = authStore.user._id || authStore.user.id;
    
    const response = await api.get(`/orders/user/${userId}`);
    
    orders.value = response.data.data;
  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadOrders();
});
</script>

<style scoped>
.orders-header {
  margin-bottom: 2rem;
}

.orders-header h2 {
  font-family: var(--font-heading);
  margin-bottom: 0.5rem;
}

.orders-header p {
  color: #6c757d;
}

.loading-indicator {
  text-align: center;
  padding: 2rem 0;
  color: #6c757d;
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
}

.empty-state p {
  margin-bottom: 1rem;
  color: #6c757d;
}

.orders-table {
  width: 100%;
  overflow-x: auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #f1f1f1;
}

th {
  font-weight: 500;
  color: #6c757d;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-badge.pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-badge.processing {
  background-color: #cce5ff;
  color: #004085;
}

.status-badge.shipped {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-badge.delivered {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.btn-link {
  color: #000;
  text-decoration: underline;
}

.btn-primary {
  display: inline-block;
  background-color: #000;
  color: #fff;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #333;
}

.btn-outline {
  display: inline-block;
  background-color: transparent;
  color: #000;
  padding: 0.75rem 1.5rem;
  border: 1px solid #000;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-outline:hover {
  background-color: #000;
  color: #fff;
}

.mobile-orders {
  display: none;
}

.mobile-order-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
  overflow: hidden;
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.order-card-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 500;
}

.order-card-body {
  padding: 1rem;
}

.order-detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.detail-label {
  font-weight: 500;
  color: #6c757d;
}

.order-card-footer {
  padding: 1rem;
  border-top: 1px solid #eee;
  text-align: right;
}

@media (max-width: 768px) {
  .desktop-orders {
    display: none;
  }
  
  .mobile-orders {
    display: block;
  }
}
</style>
