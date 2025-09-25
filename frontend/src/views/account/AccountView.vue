<template>
  <div class="account-view">
    <div class="container">
      <h1>Mon Compte</h1>
      
      <div v-if="authStore.error" class="server-error-message">
        <div class="error-icon">
          <i class="material-icons">error</i>
        </div>
        <div class="error-content">
          <h3>Erreur de connexion</h3>
          <p>{{ authStore.error }}</p>
          <button @click="retryLoadUser" class="btn-retry">
            <i class="material-icons">retry</i> Réessayer
          </button>
        </div>
      </div>
      
      <div v-if="loading" class="loading-indicator">
        <i class="material-icons">spinner</i> Chargement des données...
      </div>
      
      <div class="account-content" v-if="authStore.user">
        <div class="account-sidebar">
          <div class="user-info">
            <div class="user-avatar">
              <img 
                  v-if="authStore.user.profilePhotoUrl" 
                  :src="getFullPhotoUrl(authStore.user.profilePhotoUrl)" 
                  alt="Photo de profil" 
                  class="profile-photo"
                />
                <div v-else class="profile-photo-placeholder">
                    {{ authStore.user.firstName && authStore.user.lastName ? 
                      authStore.user.firstName.charAt(0) + authStore.user.lastName.charAt(0) : 
                      'UT' }}
                </div>
            </div>
            <div class="user-details">
              <h2>{{ authStore.user.firstName }} {{ authStore.user.lastName }}</h2>
              <p>{{ authStore.user.email }}</p>
              <p class="member-since">Membre depuis {{ formatDate(authStore.user.createdAt) }}</p>
            </div>
          </div>
          
          <nav class="account-nav">
            <router-link :to="{ name: 'account' }" class="nav-item" exact-active-class="active">
              <i class="material-icons">home</i>
              <span>Tableau de bord</span>
            </router-link>
            <router-link :to="{ name: 'orders' }" class="nav-item" active-class="active">
              <i class="material-icons">shopping_bag</i>
              <span>Mes commandes</span>
            </router-link>
            <router-link :to="{ name: 'profile' }" class="nav-item" active-class="active">
              <i class="material-icons">account_box</i>
              <span>Mon profil</span>
            </router-link>
            <router-link :to="{ name: 'addresses' }" class="nav-item" active-class="active">
              <i class="material-icons">location_on</i>
              <span>Mes adresses</span>
            </router-link>
            <router-link :to="{ name: 'wishlist' }" class="nav-item" active-class="active">
              <i class="material-icons">favorite</i>
              <span>Mes favoris</span>
            </router-link>
            <a href="#" class="nav-item" @click.prevent="logout">
              <i class="material-icons">logout</i>
              <span>Déconnexion</span>
            </a>
          </nav>
        </div>
        
        <div class="account-dashboard">
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
            
            <div v-else class="orders-table">
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useWishlistStore } from '@/stores/wishlist';
import api from '@/services/apiService';
import { getServerUrl } from '@/utils/imageUrl';

const router = useRouter();
const authStore = useAuthStore();
const wishlistStore = useWishlistStore();

const orders = ref(null);

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
    console.error('Détails de l\'erreur:', error.response ? error.response.data : error.message);
  } finally {
    loading.value = false;
  }
};

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};

const retryLoadUser = async () => {
  try {
    await authStore.loadUser();
    await loadOrders();
  } catch (error) {
    console.error('Erreur lors du rechargement des données utilisateur:', error);
  }
};

onMounted(async () => {
  loading.value = true;
  
  try {
    await authStore.loadUser();
    
    if (authStore.user) {      
      await loadOrders();
      
      await wishlistStore.fetchWishlist();
    } else {
      console.warn('Aucune donnée utilisateur n\'a été chargée');
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
  } finally {
    loading.value = false;
  }
});

const getFullPhotoUrl = (relativeUrl: string | undefined): string => {
  if (!relativeUrl) return '';
  
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  
  const serverUrl = getServerUrl();
  return `${serverUrl}${relativeUrl}`;
};
</script>

<style scoped>
.account-view {
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

.account-content {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}

.account-sidebar {
  flex: 0 0 250px;
}

.user-info {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 1rem;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details h2 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.user-details p {
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.member-since {
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.account-nav {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: #212529;
  text-decoration: none;
  border-bottom: 1px solid #f1f1f1;
  transition: background-color 0.3s;
}

.nav-item:last-child {
  border-bottom: none;
}

.nav-item:hover {
  background-color: #f8f9fa;
}

.nav-item.active {
  background-color: #f8f9fa;
  font-weight: 500;
  border-left: 3px solid #000;
}

.nav-item i {
  margin-right: 0.75rem;
  width: 20px;
  text-align: center;
}

.account-dashboard {
  flex: 1;
  min-width: 0;
}

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

.server-error-message {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: flex-start;
  border-left: 5px solid #dc3545;
}

.error-icon {
  font-size: 2rem;
  color: #dc3545;
  margin-right: 1.5rem;
}

.error-content h3 {
  font-family: var(--font-heading);
  margin-bottom: 0.5rem;
}

.error-content p {
  margin-bottom: 1.5rem;
  color: #6c757d;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-family: var(--font-body);
  transition: background-color 0.3s;
}

.btn-retry i {
  margin-right: 0.5rem;
}

.btn-retry:hover {
  background-color: #c82333;
}

.debug-message {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
  border-left: 5px solid #17a2b8;
}

.debug-message h3 {
  font-family: var(--font-heading);
  margin-bottom: 1rem;
  color: #17a2b8;
}

.debug-message p {
  margin-bottom: 0.5rem;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: var(--color-text-light);
}

.loading-indicator i {
  margin-right: 0.5rem;
  color: var(--color-accent);
}

.debug-box {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.debug-box h3 {
  margin-bottom: 1rem;
  font-family: var(--font-heading);
  color: #343a40;
}

.debug-box p {
  margin-bottom: 0.5rem;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.btn-primary:hover {
  background-color: #0069d9;
}

@media (max-width: 768px) {
  .account-content {
    flex-direction: column;
  }
  
  .account-sidebar {
    flex: 0 0 100%;
  }
}
</style>
