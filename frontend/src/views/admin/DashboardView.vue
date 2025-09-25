<template>
  <div class="admin-dashboard">
    <div class="dashboard-header">
      <h1>Tableau de bord administrateur</h1>
      <p class="welcome-message">Bienvenue dans l'interface d'administration de VEYRON</p>
    </div>

    <div class="dashboard-stats">
      <router-link to="/admin/products" class="stat-card">
        <div class="stat-icon">
          <span class="material-icons">inventory_2</span>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalProducts }}</h3>
          <p>Produits</p>
        </div>
      </router-link>

      <router-link to="/admin/orders" class="stat-card">
        <div class="stat-icon">
          <span class="material-icons">shopping_cart</span>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalOrders }}</h3>
          <p>Commandes</p>
        </div>
      </router-link>

      <router-link to="/admin/users" class="stat-card">
        <div class="stat-icon">
          <span class="material-icons">people</span>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalUsers }}</h3>
          <p>Utilisateurs</p>
        </div>
      </router-link>

    <div class="stat-categories">
      <router-link to="/admin/categories" class="stat-card">
        <div class="stat-icon">
          <span class="material-icons">category</span>
        </div>
          <div class="stat-content">
            <h3>{{ stats.totalCategories }}</h3>
            <p>Catégories</p>
          </div>
        </router-link>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <span class="material-icons">euro</span>
        </div>
        <div class="stat-content">
          <h3>{{ formatPrice(stats.totalRevenue) }}</h3>
          <p>Chiffre d'affaires</p>
        </div>
      </div>

      <router-link to="/admin/statistics" class="stat-card">
        <div class="stat-icon">
          <span class="material-icons">query_stats</span>
        </div>
        <div class="stat-content">
          <p>Statistiques avancées</p>
        </div>
      </router-link>


    </div>

    <div class="dashboard-sections">
      <div class="dashboard-section">
        <h2>Commandes récentes</h2>
        <div v-if="loading.orders" class="loading-indicator">Chargement...</div>
        <div v-else-if="recentOrders.length === 0" class="empty-state">
          Aucune commande récente
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Date</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in recentOrders" :key="order.id">
              <td>#{{ order._id ? order._id.toString().substring(0, 8) : (order.id ? order.id.toString().substring(0, 8) : 'N/A') }}</td>
              <td>{{ order.user && order.user.firstName ? `${order.user.firstName} ${order.user.lastName || ''}` : 'Client inconnu' }}</td>
              <td>{{ order.createdAt ? formatDate(order.createdAt) : 'N/A' }}</td>
              <td>{{ order.totalAmount !== undefined ? formatPrice(order.totalAmount) : formatPrice(0) }}</td>
              <td>
                <span v-if="order.status" :class="'status-badge status-' + order.status.toLowerCase()">
                  {{ getOrderStatusLabel(order.status) }}
                </span>
                <span v-else class="status-badge status-pending">En attente</span>
              </td>
              <td>
                <button class="btn-icon" @click="viewOrder(order._id)" :disabled="!order._id">
                  <i class="fas fa-eye"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="section-footer">
          <router-link to="/admin/orders" class="btn-text">Voir toutes les commandes</router-link>
        </div>
      </div>

      <div class="dashboard-section">
        <h2>Produits populaires</h2>
        <div v-if="loading.products" class="loading-indicator">Chargement...</div>
        <div v-else-if="popularProducts.length === 0" class="empty-state">
          Aucun produit disponible
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Catégorie</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Ventes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in popularProducts" :key="product.id">
              <td class="product-cell">
                <div class="product-info">
                  <img v-if="product.images && product.images.length > 0" :src="getFullImageUrl(product.images[0].url)" :alt="product.name" class="product-thumbnail" />
                  <img v-else src="" alt="Image non disponible" class="product-thumbnail" />
                  <span>{{ product.name || 'Produit sans nom' }}</span>
                </div>
              </td>
              <td>{{ product.category || 'Non catégorisé' }}</td>
              <td>{{ product.price !== undefined ? formatPrice(product.price) : formatPrice(0) }}</td>
              <td>{{ product.stock !== undefined ? product.stock : 0 }}</td>
              <td>{{ product.salesCount !== undefined ? product.salesCount : 0 }}</td>
              <td>
                <button class="btn-icon" @click="editProduct(product.id)" :disabled="!product.id">
                  <i class="fas fa-edit"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="section-footer">
          <router-link to="/admin/products" class="btn-text">Gérer les produits</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/apiService';
import { useUsersStore } from '@/stores/users';
import { getImageUrl as getFullImageUrl } from '@/utils/imageUrl';

const router = useRouter();
const usersStore = useUsersStore();

interface Order {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  totalAmount: number;
  status: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  salesCount: number;
  images: string[];
}

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  totalCategories: number;
}

const recentOrders = ref<Order[]>([]);
const popularProducts = ref<Product[]>([]);
const stats = ref<Stats>({
  totalProducts: 0,
  totalOrders: 0,
  totalUsers: 0,
  totalRevenue: 0,
  totalCategories: 0
});

const loading = ref({
  stats: true,
  orders: true,
  products: true
});

const error = ref({
  stats: '',
  orders: '',
  products: ''
});

const fetchDashboardStats = async () => {
  loading.value.stats = true;
  error.value.stats = null;
  
  try {    
    let productsData = [];
    try {
      const productsResponse = await api.get('/products');
      
      if (productsResponse && productsResponse.data) {
        if (productsResponse.data.data && Array.isArray(productsResponse.data.data)) {
          productsData = productsResponse.data.data;
        } else if (Array.isArray(productsResponse.data)) {
          productsData = productsResponse.data;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
    }
    
    let ordersData = [];
    let totalOrders = 0;
    let totalRevenue = 0;
    
    try {
      const ordersCountResponse = await api.get('/orders?page=1&limit=1');
      
      if (ordersCountResponse && ordersCountResponse.data) {
        if (ordersCountResponse.data.total !== undefined) {
          totalOrders = ordersCountResponse.data.total;
        } else if (ordersCountResponse.data.data && Array.isArray(ordersCountResponse.data.data)) {
          totalOrders = ordersCountResponse.data.total || 0;
        } else if (Array.isArray(ordersCountResponse.data)) {
          totalOrders = ordersCountResponse.data.length;
        }
      }
            
      const recentOrdersResponse = await api.get('/orders?page=1&limit=5&sort=-createdAt');
      if (recentOrdersResponse && recentOrdersResponse.data) {
        if (recentOrdersResponse.data.data && Array.isArray(recentOrdersResponse.data.data)) {
          ordersData = recentOrdersResponse.data.data;
        } else if (Array.isArray(recentOrdersResponse.data)) {
          ordersData = recentOrdersResponse.data;
        }
      }
      
      try {
        const revenueResponse = await api.get('/orders/stats/revenue');
        if (revenueResponse && revenueResponse.data) {
          if (typeof revenueResponse.data.totalRevenue === 'number') {
            totalRevenue = revenueResponse.data.totalRevenue;
          } else if (typeof revenueResponse.data === 'number') {
            totalRevenue = revenueResponse.data;
          }
        }
      } catch (revenueError) {
        console.error('Erreur lors de la récupération du chiffre d\'affaires, calcul côté client:', revenueError);
        totalRevenue = calculateTotalRevenue(ordersData);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des commandes:', err);
    }
    
    let usersData = [];
    try {
      const usersResponse = await api.get('/user/all');
      
      if (usersResponse && usersResponse.data) {
        if (usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
          usersData = usersResponse.data.data;
        } else if (Array.isArray(usersResponse.data)) {
          usersData = usersResponse.data;
        }
      }
    } catch (error) {
      console.error('Erreur avec /user/all, tentative avec /users:', error);
      try {
        const usersResponse = await api.get('/users');
        
        if (usersResponse && usersResponse.data) {
          if (usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
            usersData = usersResponse.data.data;
          } else if (Array.isArray(usersResponse.data)) {
            usersData = usersResponse.data;
          }
        }
      } catch (secondError) {
        console.error('Erreur lors de la récupération des utilisateurs avec /users:', secondError);
      }
    }
    
    let categoriesData = [];
    try {
      const categoriesResponse = await api.get('/categories');
      
      if (categoriesResponse && categoriesResponse.data) {
        if (categoriesResponse.data.data && Array.isArray(categoriesResponse.data.data)) {
          categoriesData = categoriesResponse.data.data;
        } else if (Array.isArray(categoriesResponse.data)) {
          categoriesData = categoriesResponse.data;
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      if (productsData.length > 0) {
        const uniqueCategories = new Set();
        productsData.forEach(product => {
          if (product.category) uniqueCategories.add(product.category);
        });
        categoriesData = Array.from(uniqueCategories).map(name => ({ name }));
      }
    }
    
    stats.value = {
      totalProducts: productsData.length,
      totalOrders: totalOrders,
      totalUsers: usersData.length,
      totalRevenue: totalRevenue,
      totalCategories: categoriesData.length
    };
    
  } catch (err: any) {
    console.error('Erreur globale lors du chargement des statistiques:', err);
    error.value.stats = err.message || 'Erreur lors du chargement des statistiques';
  } finally {
    loading.value.stats = false;
  }
};

const calculateTotalRevenue = (orders: any[]): number => {
  if (!Array.isArray(orders) || orders.length === 0) return 0;
    
  return orders.reduce((sum, order) => {
    const amount = order.totalPrice || order.totalAmount || order.total || 0;
    return sum + Number(amount || 0);
  }, 0);
};

const fetchRecentOrders = async () => {
  loading.value.orders = true;
  error.value.orders = '';
  
  try {    
    try {
      const response = await api.get('/orders?sort=-createdAt&limit=5');
      
      if (response.data && Array.isArray(response.data)) {
        recentOrders.value = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        recentOrders.value = response.data.data;
      } else {
        throw new Error('Format de réponse non valide');
      }
    } catch (sortError) {
      console.warn('Échec avec le paramètre de tri, tentative sans tri:', sortError);
      
      const response = await api.get('/orders');
      
      if (response.data && Array.isArray(response.data)) {
        recentOrders.value = [...response.data]
          .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - 
                          new Date(a.createdAt || a.date || 0).getTime())
          .slice(0, 5);
      } else if (response.data && Array.isArray(response.data.data)) {
        recentOrders.value = [...response.data.data]
          .sort((a, b) => new Date(b.createdAt || b.date || 0).getTime() - 
                          new Date(a.createdAt || a.date || 0).getTime())
          .slice(0, 5);
      } else {
        throw new Error('Format de réponse non valide');
      }
    }
    
  } catch (err: any) {
    console.error('Erreur lors du chargement des commandes récentes:', err);
    error.value.orders = err.message || 'Erreur lors du chargement des commandes récentes';
    recentOrders.value = [];
  } finally {
    loading.value.orders = false;
  }
};

const fetchPopularProducts = async () => {
  loading.value.products = true;
  error.value.products = '';
  
  try {    
    try {
      const response = await api.get('/products?sort=popular&limit=5');
      
      if (response.data && Array.isArray(response.data)) {
        popularProducts.value = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        popularProducts.value = response.data.data;
      } else {
        throw new Error('Format de réponse non valide');
      }
    } catch (sortError) {
      console.warn('Échec avec le paramètre de tri, tentative sans tri:', sortError);
      
      const response = await api.get('/products');
      
      if (response.data && Array.isArray(response.data)) {
        popularProducts.value = response.data.slice(0, 5);
      } else if (response.data && Array.isArray(response.data.data)) {
        popularProducts.value = response.data.data.slice(0, 5);
      } else {
        throw new Error('Format de réponse non valide');
      }
    }
    
  } catch (err: any) {
    console.error('Erreur lors du chargement des produits populaires:', err);
    error.value.products = err.message || 'Erreur lors du chargement des produits populaires';
    popularProducts.value = [];
  } finally {
    loading.value.products = false;
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

const getOrderStatusLabel = (status: string): string => {
  switch (status) {
    case 'PENDING': return 'En attente';
    case 'PROCESSING': return 'En traitement';
    case 'SHIPPED': return 'Expédiée';
    case 'DELIVERED': return 'Livrée';
    case 'COMPLETED': return 'Terminée';
    case 'CANCELLED': return 'Annulée';
    default: return status;
  }
};

const viewOrder = (orderId: string) => {
  router.push(`/admin/orders/${orderId}`);
};

const editProduct = (productId: string) => {
  router.push(`/admin/products/edit/${productId}`);
};

onMounted(() => {
  fetchDashboardStats();
  fetchRecentOrders();
  fetchPopularProducts();
  usersStore.fetchUsers();
});

</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  margin-bottom: 2rem;
  text-align: center;
}

.dashboard-header h1 {
  font-size: 2rem;
  font-weight: 300;
  margin-bottom: 0.5rem;
}

.welcome-message {
  color: #666;
  font-size: 1.1rem;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.stat-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  background-color: #f0f4f8;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.5rem;
  color: #333;
}

.stat-content h3 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.2;
}

.stat-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.dashboard-sections {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.dashboard-section {
  background-color: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dashboard-section h2 {
  font-size: 1.4rem;
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.product-cell {
  max-width: 250px;
}

.product-info {
  display: flex;
  align-items: center;
}

.product-thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 0.75rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
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
  color: #388e3c;
}

.status-completed {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-cancelled {
  background-color: #fbe9e7;
  color: #d32f2f;
}

.btn-icon {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  transition: color 0.2s;
}

.btn-icon:hover {
  color: #000;
}

.section-footer {
  margin-top: 1rem;
  text-align: right;
}

.btn-text {
  background: none;
  border: none;
  color: #1976d2;
  cursor: pointer;
  font-size: 0.9rem;
  text-decoration: none;
  transition: color 0.2s;
}

.btn-text:hover {
  color: #0d47a1;
  text-decoration: underline;
}

.loading-indicator {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .dashboard-stats {
    grid-template-columns: 1fr;
  }
  
  .data-table th:nth-child(2),
  .data-table td:nth-child(2),
  .data-table th:nth-child(5),
  .data-table td:nth-child(5) {
    display: none;
  }
}
</style>
