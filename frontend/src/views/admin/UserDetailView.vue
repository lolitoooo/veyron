<template>
  <div class="user-detail-container">
    <div class="admin-header">
      <div class="header-left">
        <button class="btn-back" @click="goBack">
          ← Retour aux utilisateurs
        </button>
        <h1>Détails de l'utilisateur</h1>
      </div>
      <div class="header-actions" v-if="user">
        <button class="btn btn-primary" @click="editUser">
          Modifier l'utilisateur
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
    
    <div v-else-if="!user" class="not-found">
      <h2>Utilisateur non trouvé</h2>
      <p>L'utilisateur demandé n'existe pas ou a été supprimé.</p>
      <button class="btn btn-primary" @click="goBack">Retour aux utilisateurs</button>
    </div>
    
    <div v-else class="user-content">
      <div class="user-profile">
        <div class="profile-header">
          <div class="avatar">
            {{ getInitials(user.firstName, user.lastName) }}
          </div>
          <div class="user-info">
            <h2>{{ user.firstName }} {{ user.lastName }}</h2>
            <div class="user-meta">
              <span :class="['role-badge', `role-${user.role}`]">
                {{ getRoleLabel(user.role) }}
              </span>
              <span :class="['status-badge', `status-${user.active ? 'active' : 'inactive'}`]">
                {{ user.active ? 'Actif' : 'Inactif' }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="profile-details">
          <div class="detail-card">
            <h3>Informations personnelles</h3>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">ID:</span>
                <span class="detail-value">{{ user.id }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ user.email }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date d'inscription:</span>
                <span class="detail-value">{{ formatDate(user.createdAt) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Dernière connexion:</span>
                <span class="detail-value">{{ user.lastLogin ? formatDate(user.lastLogin) : 'Jamais' }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-card">
            <h3>Activité</h3>
            <div class="detail-content">
              <div class="detail-row">
                <span class="detail-label">Commandes:</span>
                <span class="detail-value">{{ user.orderCount || 0 }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total des achats:</span>
                <span class="detail-value">{{ formatPrice(user.totalSpent || 0) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Dernière commande:</span>
                <span class="detail-value">{{ user.lastOrderDate ? formatDate(user.lastOrderDate) : 'Aucune' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="user-orders" v-if="userOrders.length > 0">
        <h3>Commandes récentes</h3>
        <div class="orders-table-container">
          <table class="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in userOrders" :key="order.id">
                <td>{{ order.id }}</td>
                <td>{{ formatDate(order.date) }}</td>
                <td>{{ order.itemCount }} article(s)</td>
                <td>{{ formatPrice(order.total) }}</td>
                <td>
                  <span :class="['status-badge', `status-${order.status}`]">
                    {{ getOrderStatusLabel(order.status) }}
                  </span>
                </td>
                <td>
                  <button class="btn-icon" @click="viewOrder(order.id)">
                    <span class="material-icons">visibility</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div v-else class="no-orders">
        <p>Cet utilisateur n'a pas encore passé de commande.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/apiService';

const router = useRouter();
const route = useRoute();
const userId = computed(() => route.params.id as string);

const loading = ref(false);
const error = ref<string | null>(null);
const user = ref<any | null>(null);
const userOrders = ref<any[]>([]);

onMounted(() => {
  fetchUserDetails();
});

const fetchUserDetails = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const response = await api.get(`/users/${userId.value}`);
    user.value = response.data;
    
    const ordersResponse = await api.get(`/users/${userId.value}/orders`);
    userOrders.value = ordersResponse.data;
  } catch (err: any) {
    console.error('Erreur lors du chargement des détails de l\'utilisateur:', err);
    error.value = err.message || 'Erreur lors du chargement des détails de l\'utilisateur';
    
    user.value = null;
    userOrders.value = [];
  } finally {
    loading.value = false;
  }
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};
const getRoleLabel = (role: string): string => {
  const roleLabels: Record<string, string> = {
    user: 'Utilisateur',
    admin: 'Administrateur'
  };
  return roleLabels[role] || role;
};

const getOrderStatusLabel = (status: string): string => {
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

const editUser = () => {
  router.push({ name: 'admin-user-edit', params: { id: userId.value } });
};
const viewOrder = (orderId: string) => {
  router.push({ name: 'admin-order-detail', params: { id: orderId } });
};

const goBack = () => {
  router.push({ name: 'admin-users' });
};
</script>

<style scoped>
.user-detail-container {
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

.user-profile {
  margin-bottom: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #1976d2;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 500;
}

.user-info h2 {
  margin: 0 0 0.5rem 0;
}

.user-meta {
  display: flex;
  gap: 1rem;
}

.profile-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.detail-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-card h3 {
  background-color: #f5f5f5;
  margin: 0;
  padding: 1rem;
  font-size: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.detail-content {
  padding: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #616161;
}

.user-orders {
  margin-top: 2rem;
}

.user-orders h3 {
  margin-bottom: 1rem;
}

.orders-table-container {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
}

.orders-table th,
.orders-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.orders-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.no-orders {
  background-color: #f5f5f5;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
  color: #757575;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-admin {
  background-color: #e3f2fd;
  color: #1976d2;
}

.role-user {
  background-color: #f5f5f5;
  color: #616161;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-active {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-inactive {
  background-color: #ffebee;
  color: #d32f2f;
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

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: #f0f0f0;
}

.material-icons {
  font-size: 1.2rem;
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

@media (max-width: 768px) {
  .user-detail-container {
    padding: 1rem;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .user-meta {
    margin-top: 0.5rem;
  }
}
</style>
