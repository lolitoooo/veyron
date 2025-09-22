<template>
  <div class="orders-view">
    <div class="container">
      <h1>Mes Commandes</h1>
      
      <div class="orders-content">
        <div v-if="loading" class="loading-indicator">
          <p>Chargement de vos commandes...</p>
        </div>
        
        <div v-else-if="error" class="error-message">
          <p>{{ error }}</p>
          <button class="btn-primary" @click="loadOrders">Réessayer</button>
        </div>
        
        <div v-else-if="orders.length === 0" class="empty-orders">
          <p>Aucune commande trouvée.</p>
        </div>
        
        <div v-else class="orders-list">
          <div class="filters">
            <div class="search-filter">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Rechercher une commande..." 
                @input="search"
              />
            </div>
            
            <div class="status-filter">
              <select v-model="statusFilter" @change="filterByStatus">
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="processing">En traitement</option>
                <option value="shipped">Expédié</option>
                <option value="delivered">Livré</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
          </div>
          
          <div class="orders-table">
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
                <tr v-for="order in orders" :key="order.id">
                  <td>#{{ order.orderNumber }}</td>
                  <td>{{ formatDate(order.createdAt) }}</td>
                  <td>
                    <span class="status-badge" :class="order.status">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </td>
                  <td>{{ formatPrice(order.total) }}</td>
                  <td>
                    <router-link :to="{ name: 'order-detail', params: { id: order.id } }" class="btn-link">
                      Détails
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="pagination" v-if="totalPages > 1">
            <button 
              class="pagination-btn" 
              :disabled="currentPage === 1"
              @click="changePage(currentPage - 1)"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            
            <div class="pagination-pages">
              <span>Page {{ currentPage }} sur {{ totalPages }}</span>
            </div>
            
            <button 
              class="pagination-btn" 
              :disabled="currentPage === totalPages"
              @click="changePage(currentPage + 1)"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/apiService';
import { useAuthStore } from '@/stores/auth';

interface Order {
  id: number;
  orderNumber: string;
  createdAt: string;
  status: string;
  total: number;
}

const router = useRouter();
const authStore = useAuthStore();
const orders = ref<Order[]>([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const statusFilter = ref('all');
const currentPage = ref(1);
const itemsPerPage = 5;
const totalItems = ref(0);

const totalPages = computed(() => {
  return Math.ceil(totalItems.value / itemsPerPage);
});
const paginatedOrders = computed(() => {
  return orders.value;
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
    'shipped': 'Expédié',
    'delivered': 'Livré',
    'cancelled': 'Annulé'
  };
  
  return statusMap[status] || status;
};

const filterByStatus = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  statusFilter.value = target.value;
  currentPage.value = 1;
  loadOrders();
};

const search = () => {
  currentPage.value = 1;
  loadOrders();
};

const changePage = (page: number) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  loadOrders();
};

const loadOrders = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    if (!authStore.isAuthenticated) {
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
      return;
    }
    
    const params = {
      page: currentPage.value,
      limit: itemsPerPage,
      search: searchQuery.value || undefined,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined
    };
    
    const response = await api.get(`/orders/user/${authStore.user._id}`);
    
    orders.value = response.data.data;
    totalItems.value = response.data.count;
    
  } catch (err: any) {
    console.error('Erreur lors du chargement des commandes:', err);
    
    if (err.response && err.response.status === 401) {
      authStore.logout();
      router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } });
    } else {
      error.value = 'Une erreur est survenue lors du chargement de vos commandes. Veuillez réessayer.';
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadOrders();
});
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

h1 {
  font-family: var(--font-heading);
  margin-bottom: 2rem;
}

.orders-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
}

.loading-indicator {
  text-align: center;
  padding: 3rem 0;
  color: #6c757d;
}

.empty-orders {
  text-align: center;
  padding: 2rem 0;
  color: #7f8c8d;
}

.empty-icon {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.empty-state h2 {
  font-family: var(--font-heading);
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6c757d;
  margin-bottom: 1.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-filter {
  flex: 1;
  min-width: 200px;
}

.search-filter input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.status-filter select {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 150px;
}

.orders-table {
  width: 100%;
  overflow-x: auto;
  margin-bottom: 1.5rem;
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

.no-results {
  text-align: center;
  padding: 2rem 0;
  color: #6c757d;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
}

.pagination-btn {
  background-color: transparent;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f8f9fa;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-pages {
  margin: 0 1rem;
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
</style>
