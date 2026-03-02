<template>
  <div class="reviews-admin">
    <div class="page-header">
      <h1>Gestion des Avis</h1>
      <div class="header-actions">
        <span class="pending-badge" v-if="pendingCount > 0">
          {{ pendingCount }} en attente
        </span>
      </div>
    </div>

    <div class="filters">
      <button 
        @click="currentFilter = 'all'" 
        :class="{ active: currentFilter === 'all' }"
        class="filter-btn"
      >
        Tous ({{ reviews.length }})
      </button>
      <button 
        @click="currentFilter = 'pending'" 
        :class="{ active: currentFilter === 'pending' }"
        class="filter-btn"
      >
        En attente ({{ pendingCount }})
      </button>
      <button 
        @click="currentFilter = 'approved'" 
        :class="{ active: currentFilter === 'approved' }"
        class="filter-btn"
      >
        Approuvés
      </button>
      <button 
        @click="currentFilter = 'rejected'" 
        :class="{ active: currentFilter === 'rejected' }"
        class="filter-btn"
      >
        Rejetés
      </button>
    </div>

    <div v-if="selectedReviews.length > 0" class="bulk-actions">
      <p>{{ selectedReviews.length }} avis sélectionné(s)</p>
      <button @click="bulkApprove" class="btn-approve">
        <i class="material-icons">check</i>
        Approuver la sélection
      </button>
      <button @click="bulkReject" class="btn-reject">
        <i class="material-icons">delete</i>
        Rejeter la sélection
      </button>
      <button @click="selectedReviews = []" class="btn-cancel">
        Annuler
      </button>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Chargement des avis...</p>
    </div>

    <div v-else-if="filteredReviews.length === 0" class="no-reviews">
      <i class="material-icons">rate_review</i>
      <p>Aucun avis {{ currentFilter === 'pending' ? 'en attente' : currentFilter === 'approved' ? 'approuvé' : '' }}</p>
    </div>

    <div v-else class="reviews-table">
      <table>
        <thead>
          <tr>
            <th width="40">
              <input 
                type="checkbox" 
                @change="toggleSelectAll"
                :checked="allSelected"
              >
            </th>
            <th>Produit</th>
            <th>Utilisateur</th>
            <th>Note</th>
            <th>Commentaire</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="review in filteredReviews" :key="review._id">
            <td>
              <input 
                type="checkbox" 
                :value="review._id"
                v-model="selectedReviews"
              >
            </td>
            <td>
              <div class="product-info">
                <strong>{{ review.product?.name || 'Produit supprimé' }}</strong>
              </div>
            </td>
            <td>
              <div class="user-info">
                <strong>{{ review.user?.firstName }} {{ review.user?.lastName }}</strong>
                <span class="email">{{ review.user?.email }}</span>
              </div>
            </td>
            <td>
              <div class="rating">
                <i v-for="star in 5" :key="star" class="material-icons star" :class="{ filled: star <= review.rating }">
                  {{ star <= review.rating ? 'star' : 'star_border' }}
                </i>
              </div>
            </td>
            <td>
              <div class="comment">
                {{ review.comment.substring(0, 100) }}{{ review.comment.length > 100 ? '...' : '' }}
              </div>
            </td>
            <td>
              <div class="date">
                {{ formatDate(review.createdAt) }}
              </div>
            </td>
            <td>
              <span class="status-badge" :class="review.status">
                {{ getStatusLabel(review.status) }}
              </span>
              <div v-if="review.status === 'approved' && review.approvedBy" class="approved-by">
                Par {{ review.approvedBy.firstName }} {{ review.approvedBy.lastName }}
              </div>
              <div v-if="review.status === 'rejected' && review.rejectedBy" class="rejected-by">
                Par {{ review.rejectedBy.firstName }} {{ review.rejectedBy.lastName }}
              </div>
            </td>
            <td>
              <div class="actions">
                <button 
                  v-if="review.status !== 'approved'"
                  @click="approveReview(review._id)" 
                  class="btn-icon approve"
                  title="Approuver"
                >
                  <i class="material-icons">check</i>
                </button>
                <button 
                  v-if="review.status !== 'rejected'"
                  @click="rejectReview(review._id)" 
                  class="btn-icon reject"
                  title="Rejeter"
                >
                  <i class="material-icons">close</i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

interface Review {
  _id: string;
  product: { _id: string; name: string } | null;
  user: { _id: string; firstName: string; lastName: string; email: string } | null;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  isApproved: boolean;
  approvedBy?: { firstName: string; lastName: string };
  approvedAt?: string;
  rejectedBy?: { firstName: string; lastName: string };
  rejectedAt?: string;
  createdAt: string;
}

const reviews = ref<Review[]>([]);
const loading = ref(false);
const currentFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('pending');
const selectedReviews = ref<string[]>([]);
const pendingCount = ref(0);

const filteredReviews = computed(() => {
  if (currentFilter.value === 'all') return reviews.value;
  return reviews.value.filter(r => r.status === currentFilter.value);
});

const allSelected = computed(() => {
  return filteredReviews.value.length > 0 && 
         selectedReviews.value.length === filteredReviews.value.length;
});

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedReviews.value = [];
  } else {
    selectedReviews.value = filteredReviews.value.map(r => r._id);
  }
};

const fetchReviews = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/admin/reviews`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    reviews.value = response.data.data;
    pendingCount.value = reviews.value.filter(r => r.status === 'pending').length;
  } catch (error) {
    console.error('Erreur lors du chargement des avis:', error);
    alert('Erreur lors du chargement des avis');
  } finally {
    loading.value = false;
  }
};

const approveReview = async (reviewId: string) => {
  try {
    const token = localStorage.getItem('auth_token');
    await axios.put(
      `${import.meta.env.VITE_API_URL}/admin/reviews/${reviewId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await fetchReviews();
  } catch (error) {
    console.error('Erreur lors de l\'approbation:', error);
    alert('Erreur lors de l\'approbation de l\'avis');
  }
};

const rejectReview = async (reviewId: string) => {
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.put(
      `${import.meta.env.VITE_API_URL}/admin/reviews/${reviewId}/reject`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await fetchReviews();
    alert('Avis rejeté avec succès');
  } catch (error: any) {
    console.error('Erreur lors du rejet:', error);
    const errorMsg = error.response?.data?.message || 'Erreur lors du rejet de l\'avis';
    alert(errorMsg);
  }
};

const bulkApprove = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    await axios.put(
      `${import.meta.env.VITE_API_URL}/admin/reviews/bulk-approve`,
      { reviewIds: selectedReviews.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    selectedReviews.value = [];
    await fetchReviews();
  } catch (error) {
    console.error('Erreur lors de l\'approbation en masse:', error);
    alert('Erreur lors de l\'approbation des avis');
  }
};

const bulkReject = async () => {
  try {
    const token = localStorage.getItem('auth_token');
    await axios.put(
      `${import.meta.env.VITE_API_URL}/admin/reviews/bulk-reject`,
      { reviewIds: selectedReviews.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    selectedReviews.value = [];
    await fetchReviews();
  } catch (error) {
    console.error('Erreur lors du rejet en masse:', error);
    alert('Erreur lors du rejet des avis');
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    approved: 'Approuvé',
    rejected: 'Rejeté'
  };
  return labels[status] || status;
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(() => {
  fetchReviews();
});
</script>

<style scoped>
.reviews-admin {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.pending-badge {
  background: #ef4444;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
}

.filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.filter-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f9fafb;
}

.filter-btn.active {
  background: #111827;
  color: white;
  border-color: #111827;
}

.bulk-actions {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.bulk-actions p {
  margin: 0;
  font-weight: 500;
}

.bulk-actions button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
  color: white;
}

.btn-reject:hover {
  background: #dc2626;
}

.btn-cancel {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid #e5e7eb;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-reviews {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.no-reviews i {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.reviews-table {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f9fafb;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

td {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}

.product-info strong,
.user-info strong {
  display: block;
  color: #111827;
  margin-bottom: 0.25rem;
}

.email {
  font-size: 0.875rem;
  color: #6b7280;
}

.rating {
  display: flex;
  gap: 0.25rem;
}

.star {
  font-size: 1.125rem;
  color: #d1d5db;
}

.star.filled {
  color: #fbbf24;
}

.comment {
  color: #374151;
  line-height: 1.5;
  max-width: 300px;
}

.date {
  font-size: 0.875rem;
  color: #6b7280;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.approved-by,
.rejected-by {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon i {
  font-size: 1.125rem;
}

.btn-icon.approve {
  background: #d1fae5;
  color: #065f46;
}

.btn-icon.approve:hover {
  background: #a7f3d0;
}

.btn-icon.reject {
  background: #fee2e2;
  color: #991b1b;
}

.btn-icon.reject:hover {
  background: #fecaca;
}
</style>
