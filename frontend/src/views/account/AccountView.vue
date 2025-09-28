<template>
  <AccountLayout>
    <div class="dashboard-header">
      <h2>Tableau de bord</h2>
      <p>Bienvenue sur votre espace personnel, {{ authStore.user.firstName }}.</p>
    </div>
    
    <div class="dashboard-summary">
      <div v-if="!orders || orders.length === 0" class="empty-state">
        <p>Vous n'avez pas encore de statistiques disponibles.</p>
        <router-link :to="{ name: 'home' }" class="btn-primary">Découvrir nos produits</router-link>
      </div>
      
      <template v-else>
        <div class="summary-card">
          <div class="card-icon">
            <i class="material-icons">shopping_bag</i>
          </div>
          <div class="card-content">
            <h3>{{ orders ? orders.length : 0 }}</h3>
            <p>Commandes totales</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <i class="material-icons">local_shipping</i>
          </div>
          <div class="card-content">
            <h3>{{ pendingOrdersCount }}</h3>
            <p>Commandes en cours</p>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-icon">
            <i class="material-icons">favorite</i>
          </div>
          <div class="card-content">
            <h3>{{ wishlistStore.count }}</h3>
            <p>Articles favoris</p>
          </div>
        </div>
      </template>
    </div>
    
    <div class="recent-orders">
      <div class="section-header">
        <h3>Commandes récentes</h3>
        <router-link :to="{ name: 'orders' }" class="view-all">Voir toutes mes commandes</router-link>
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
              <tr v-for="order in recentOrders" :key="order._id">
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
          <div v-for="order in recentOrders" :key="order._id" class="mobile-order-card">
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
    </div>
    
    <div class="account-actions">
      <div class="action-card">
        <h3>Informations personnelles</h3>
        <p>Mettez à jour vos informations personnelles et votre mot de passe.</p>
        <router-link :to="{ name: 'profile' }" class="btn-outline">
          Modifier mon profil
        </router-link>
      </div>
      
      <div class="action-card">
        <h3>Adresses</h3>
        <p>Gérez vos adresses de livraison et de facturation.</p>
        <router-link :to="{ name: 'addresses' }" class="btn-outline">
          Gérer mes adresses
        </router-link>
      </div>
    </div>
  </AccountLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useWishlistStore } from '@/stores/wishlist';
import api from '@/services/apiService';
import AccountLayout from '@/layouts/AccountLayout.vue';

const authStore = useAuthStore();
const wishlistStore = useWishlistStore();

const orders = ref(null);
const loading = ref(false);

const pendingOrdersCount = computed(() => {
  if (!orders.value) return 0;
  return orders.value.filter(order => ['processing', 'pending', 'shipped'].includes(order.status)).length;
});

const recentOrders = computed(() => {
  if (!orders.value) return [];
  return [...orders.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);
});

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
    console.error('Détails de l\'erreur:', error.response ? error.response.data : error.message);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  try {
    if (authStore.user) {      
      await loadOrders();
      await wishlistStore.fetchWishlist();
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  }
});
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-header h2 {
  font-family: var(--font-heading);
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  color: #6c757d;
}

.dashboard-summary {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.summary-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  display: flex;
  align-items: center;
}

.card-icon {
  width: 50px;
  height: 50px;
  background-color: #f8f9fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.card-icon i {
  font-size: 1.5rem;
  color: #000;
}

.card-content h3 {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.card-content p {
  color: #6c757d;
  margin: 0;
}

.recent-orders {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h3 {
  font-family: var(--font-heading);
  margin: 0;
}

.view-all {
  color: #000;
  text-decoration: underline;
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

.account-actions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.action-card h3 {
  font-family: var(--font-heading);
  margin-bottom: 0.75rem;
}

.action-card p {
  color: #6c757d;
  margin-bottom: 1rem;
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

@media (max-width: 992px) {
  .dashboard-summary {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  
  .account-actions {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 768px) {
  .desktop-orders {
    display: none;
  }
  
  .mobile-orders {
    display: block;
  }
  
  .dashboard-summary {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

@media (max-width: 480px) {
  .dashboard-summary {
    grid-template-columns: 1fr;
  }
  
  .account-actions {
    grid-template-columns: 1fr;
  }
  
  .summary-card {
    padding: 1rem;
  }
  
  .card-icon {
    width: 40px;
    height: 40px;
  }
  
  .card-content h3 {
    font-size: 1.25rem;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
