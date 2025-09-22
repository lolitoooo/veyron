<template>
  <div class="orders-container">
    <div class="admin-header">
      <h1>Gestion des commandes</h1>
      <div class="filters">
        <select v-model="statusFilter" class="filter-select">
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="processing">En traitement</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement en cours...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else class="orders-content">
      <div v-if="filteredOrders.length === 0" class="empty-state">
        <p>Aucune commande trouvée.</p>
      </div>
      
      <div v-else class="orders-table-container">
        <table class="orders-table">
          <thead>
            <tr>
              <th>N° Commande</th>
              <th>Date</th>
              <th>Client</th>
              <th>Articles</th>
              <th>Total</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order._id">
              <td>{{ order._id.substring(0, 8) }}...</td>
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>{{ order.user?.firstName }} {{ order.user?.lastName }}</td>
              <td>{{ order.orderItems.length }} article(s)</td>
              <td>{{ formatPrice(order.totalPrice) }}</td>
              <td>
                <span :class="['status-badge', `status-${order.status}`]">
                  {{ getStatusLabel(order.status) }}
                </span>
              </td>
              <td class="actions">
                <button 
                  class="btn-icon view" 
                  @click="viewOrderDetails(order._id)"
                  title="Voir les détails"
                >
                  <span class="material-icons">visibility</span>
                </button>
                <button 
                  class="btn-icon update-status" 
                  @click="showUpdateStatusModal(order)"
                  title="Modifier le statut"
                >
                  <span class="material-icons">edit</span>
                </button>
                <button 
                  v-if="!order.invoiceNumber" 
                  class="btn-icon generate-invoice" 
                  @click="generateInvoice(order._id)"
                  title="Générer une facture"
                >
                  <span class="material-icons">receipt</span>
                </button>
                <button 
                  v-else 
                  class="btn-icon download-invoice" 
                  @click="downloadInvoice(order._id)"
                  title="Télécharger la facture"
                >
                  <span class="material-icons">download</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-if="totalPages > 1" class="pagination">
        <button 
          class="pagination-btn" 
          :disabled="currentPage === 1" 
          @click="goToPage(currentPage - 1)"
        >
          <span class="material-icons">chevron_left</span>
        </button>
        
        <template v-for="page in displayedPages" :key="page">
          <button 
            v-if="page > 0" 
            class="pagination-btn" 
            :class="{ 'active': currentPage === page }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <span v-else class="pagination-ellipsis">...</span>
        </template>
        
        <button 
          class="pagination-btn" 
          :disabled="currentPage === totalPages" 
          @click="goToPage(currentPage + 1)"
        >
          <span class="material-icons">chevron_right</span>
        </button>
      </div>
      
      <div class="orders-info">
        <p>Affichage de {{ (currentPage - 1) * itemsPerPage + 1 }} à {{ Math.min(currentPage * itemsPerPage, totalOrders) }} sur {{ totalOrders }} commandes</p>
      </div>
    </div>
  </div>
  
  <div v-if="showStatusModal" class="modal">
    <div class="modal-content">
      <h3>Modifier le statut de la commande</h3>
      
      <p v-if="selectedOrder">
        Commande <strong>#{{ selectedOrder._id.substring(0, 8) }}...</strong> - Client: {{ selectedOrder.user?.firstName }} {{ selectedOrder.user?.lastName }}
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
        <p><strong>Statut actuel :</strong> <span :class="['status-badge', `status-${selectedOrder?.status}`]">{{ getStatusLabel(selectedOrder?.status || '') }}</span></p>
        <p><strong>Total :</strong> {{ selectedOrder ? formatPrice(selectedOrder.totalPrice) : '' }}</p>
        <p><strong>Articles :</strong> {{ selectedOrder ? selectedOrder.orderItems.length : 0 }} article(s)</p>
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" @click="closeModal">Annuler</button>
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
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminOrderStore } from '@/stores/adminOrder';
import type { Order } from '@/types/order';

const router = useRouter();
const adminOrderStore = useAdminOrderStore();

const isLoading = computed(() => adminOrderStore.isLoading);
const error = computed(() => adminOrderStore.error);
const orders = computed(() => adminOrderStore.orders);
const totalOrders = computed(() => adminOrderStore.totalOrders);
const totalPages = computed(() => adminOrderStore.totalPages);
const statusFilter = ref('all');
const showStatusModal = ref(false);
const selectedOrder = ref<Order | null>(null);
const newStatus = ref('');
const currentPage = ref(1);
const itemsPerPage = ref(10);

const filteredOrders = computed(() => {
  if (statusFilter.value === 'all') {
    return orders.value;
  }
  return orders.value.filter(order => order.status === statusFilter.value);
});

watch(statusFilter, () => {
  currentPage.value = 1;
  fetchOrders();
});

onMounted(() => {
  fetchOrders();
});
async function fetchOrders() {
  try {
    await adminOrderStore.fetchOrders({
      page: currentPage.value,
      limit: itemsPerPage.value,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined
    });
  } catch (err) {
    console.error('Erreur lors du chargement des commandes:', err);
  }
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchOrders();
}

const displayedPages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages: number[] = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    
    if (current > 3) {
      pages.push(-1);
    }
    
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (current < total - 2) {
      pages.push(-2);
    }
    
    pages.push(total);
  }
  
  return pages;
});

const formatDate = (dateString: string | undefined): string => {
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

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

const getStatusLabel = (status: string): string => {
  const statusLabels: Record<string, string> = {
    'pending': 'En attente',
    'processing': 'En traitement',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée'
  };
  
  return statusLabels[status] || status;
};

const viewOrderDetails = (orderId: string) => {
  router.push(`/admin/orders/${orderId}`);
};
const generateInvoice = async (orderId: string) => {
  try {
    await adminOrderStore.generateInvoice(orderId);
    fetchOrders();
  } catch (err) {
    console.error('Erreur lors de la génération de la facture:', err);
  }
};

const downloadInvoice = async (orderId: string) => {
  try {
    const invoiceData = await adminOrderStore.getInvoice(orderId);
    if (invoiceData && invoiceData.invoiceUrl) {
      window.open(invoiceData.invoiceUrl, '_blank');
    }
  } catch (err) {
    console.error('Erreur lors du téléchargement de la facture:', err);
  }
};

const showUpdateStatusModal = (order: Order) => {
  selectedOrder.value = order;
  newStatus.value = order.status;
  showStatusModal.value = true;
};

const updateOrderStatus = async () => {
  if (!selectedOrder.value || !newStatus.value) return;
  
  try {
    await adminOrderStore.updateOrderStatus(selectedOrder.value._id, newStatus.value);
    
    fetchOrders();
    
    closeModal();
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut:', err);
  }
};

const closeModal = () => {
  showStatusModal.value = false;
  selectedOrder.value = null;
  newStatus.value = '';
};
</script>

<style scoped>
.orders-container {
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

.filters {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
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

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #757575;
}

.orders-table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
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

.orders-table tr:hover {
  background-color: #f9f9f9;
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

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-icon .material-icons {
  font-size: 20px;
}

.btn-icon.view {
  color: #1976d2;
}

.btn-icon.view:hover {
  background-color: #e3f2fd;
}

.btn-icon.update-status {
  color: #388e3c;
}

.btn-icon.update-status:hover {
  background-color: #e8f5e9;
}

.btn-icon.generate-invoice {
  color: #f57c00;
}

.btn-icon.generate-invoice:hover {
  background-color: #fff8e1;
}

.btn-icon.download-invoice {
  color: #7b1fa2;
}

.btn-icon.download-invoice:hover {
  background-color: #f3e5f5;
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

.pagination {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
  gap: 0.5rem;
  align-items: center;
}

.pagination-ellipsis {
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #757575;
  font-weight: bold;
}

.pagination-btn {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  background-color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pagination-btn.active {
  background-color: #1976d2;
  color: white;
  border-color: #1976d2;
}

.pagination-btn:hover:not(:disabled):not(.active) {
  background-color: #f5f5f5;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.orders-info {
  text-align: center;
  color: #757575;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .orders-container {
    padding: 1rem;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modal-content {
    padding: 1.5rem;
    margin: 0 1rem;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style>
