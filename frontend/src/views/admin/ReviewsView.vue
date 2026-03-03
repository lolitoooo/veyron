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

    <div class="search-filters-section">
      <div class="search-bar">
        <i class="material-icons">search</i>
        <input 
          v-model="searchQuery"
          type="text" 
          placeholder="Rechercher par produit, utilisateur, email ou commentaire..."
          class="search-input"
        >
        <button v-if="searchQuery" @click="searchQuery = ''" class="clear-btn">
          <i class="material-icons">close</i>
        </button>
      </div>

      <div class="advanced-filters">
        <div class="filter-group">
          <label>Statut :</label>
          <select v-model="currentFilter" class="filter-select">
            <option value="all">Tous ({{ reviews.length }})</option>
            <option value="pending">En attente ({{ pendingCount }})</option>
            <option value="approved">Approuvés ({{ approvedCount }})</option>
            <option value="rejected">Rejetés ({{ rejectedCount }})</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Note :</label>
          <select v-model="ratingFilter" class="filter-select">
            <option value="all">Toutes les notes</option>
            <option value="5">5 étoiles</option>
            <option value="4">4 étoiles</option>
            <option value="3">3 étoiles</option>
            <option value="2">2 étoiles</option>
            <option value="1">1 étoile</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Trier par :</label>
          <select v-model="sortBy" class="filter-select">
            <option value="date-desc">Plus récents</option>
            <option value="date-asc">Plus anciens</option>
            <option value="rating-desc">Note décroissante</option>
            <option value="rating-asc">Note croissante</option>
          </select>
        </div>

        <button @click="resetFilters" class="reset-filters-btn">
          <i class="material-icons">refresh</i>
          Réinitialiser
        </button>
      </div>
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

    <div v-else-if="filteredAndSearchedReviews.length === 0" class="no-reviews">
      <i class="material-icons">rate_review</i>
      <p>Aucun avis trouvé</p>
      <p class="subtitle">Essayez de modifier vos filtres ou votre recherche</p>
    </div>

    <div v-else>
      <div class="pagination-controls">
        <div class="per-page-selector">
          <label>Afficher :</label>
          <button 
            @click="itemsPerPage = 5" 
            :class="{ active: itemsPerPage === 5 }"
            class="per-page-btn"
          >
            5
          </button>
          <button 
            @click="itemsPerPage = 10" 
            :class="{ active: itemsPerPage === 10 }"
            class="per-page-btn"
          >
            10
          </button>
          <button 
            @click="itemsPerPage = 20" 
            :class="{ active: itemsPerPage === 20 }"
            class="per-page-btn"
          >
            20
          </button>
        </div>
        <div class="pagination-info">
          {{ paginationStart }}-{{ paginationEnd }} sur {{ filteredAndSearchedReviews.length }} avis
        </div>
      </div>

      <div class="reviews-table">
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
            <th width="200">Produit & Utilisateur</th>
            <th width="100">Note</th>
            <th>Commentaire</th>
            <th width="80">Images</th>
            <th width="120">Statut</th>
            <th width="120">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="review in paginatedReviews" :key="review._id">
            <td>
              <input 
                type="checkbox" 
                :value="review._id"
                v-model="selectedReviews"
              >
            </td>
            <td>
              <div class="combined-info">
                <div class="product-name">
                  <i class="material-icons">shopping_bag</i>
                  <strong>{{ review.product?.name || 'Produit supprimé' }}</strong>
                </div>
                <div class="user-name">
                  <i class="material-icons">person</i>
                  {{ review.user?.firstName }} {{ review.user?.lastName }}
                </div>
                <div class="review-date">
                  <i class="material-icons">schedule</i>
                  {{ formatDateShort(review.createdAt) }}
                </div>
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
              <div class="comment" :title="review.comment">
                {{ review.comment.substring(0, 80) }}{{ review.comment.length > 80 ? '...' : '' }}
              </div>
            </td>
            <td>
              <div class="review-images-cell">
                <div v-if="review.images && review.images.length > 0" class="images-preview-compact">
                  <img 
                    :src="review.images[0]"
                    alt="Image"
                    class="review-thumbnail-compact"
                    @click="openImagesGallery(review.images)"
                  />
                  <span v-if="review.images.length > 1" class="image-badge">
                    +{{ review.images.length - 1 }}
                  </span>
                </div>
                <span v-else class="no-images">-</span>
              </div>
            </td>
            <td>
              <div class="status-cell">
                <span class="status-badge" :class="review.status">
                  {{ getStatusLabel(review.status) }}
                </span>
              </div>
            </td>
            <td>
              <div class="actions-compact">
                <button 
                  v-if="review.status !== 'approved'"
                  @click="approveReview(review._id)" 
                  class="btn-action approve"
                  title="Approuver"
                >
                  <i class="material-icons">check</i>
                </button>
                <button 
                  v-if="review.status !== 'rejected'"
                  @click="rejectReview(review._id)" 
                  class="btn-action reject"
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

      <div v-if="totalPages > 1" class="pagination-navigation">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          <i class="material-icons">chevron_left</i>
          Précédent
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in displayedPages"
            :key="page"
            @click="currentPage = page"
            :class="{ active: currentPage === page }"
            class="page-btn"
          >
            {{ page }}
          </button>
        </div>

        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Suivant
          <i class="material-icons">chevron_right</i>
        </button>
      </div>
    </div>

    <!-- Modale pour afficher la galerie d'images -->
    <div v-if="galleryImages.length > 0" class="image-modal" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <button @click="closeImageModal" class="close-modal-btn">
          <i class="material-icons">close</i>
        </button>
        
        <button 
          v-if="galleryImages.length > 1 && currentImageIndex > 0"
          @click="previousImage" 
          class="nav-btn prev-btn"
        >
          <i class="material-icons">chevron_left</i>
        </button>
        
        <div class="image-container">
          <img :src="galleryImages[currentImageIndex]" alt="Image en grand" class="modal-image" />
          <div v-if="galleryImages.length > 1" class="image-counter">
            {{ currentImageIndex + 1 }} / {{ galleryImages.length }}
          </div>
        </div>
        
        <button 
          v-if="galleryImages.length > 1 && currentImageIndex < galleryImages.length - 1"
          @click="nextImage" 
          class="nav-btn next-btn"
        >
          <i class="material-icons">chevron_right</i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
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
const currentFilter = ref<'all' | 'pending' | 'approved' | 'rejected'>('all');
const selectedReviews = ref<string[]>([]);
const pendingCount = ref(0);
const approvedCount = ref(0);
const rejectedCount = ref(0);
const searchQuery = ref('');
const ratingFilter = ref<'all' | '1' | '2' | '3' | '4' | '5'>('all');
const sortBy = ref<'date-desc' | 'date-asc' | 'rating-desc' | 'rating-asc'>('date-desc');
const currentPage = ref(1);
const itemsPerPage = ref(10);
const galleryImages = ref<string[]>([]);
const currentImageIndex = ref(0);

const filteredReviews = computed(() => {
  if (currentFilter.value === 'all') return reviews.value;
  return reviews.value.filter(r => r.status === currentFilter.value);
});

const filteredAndSearchedReviews = computed(() => {
  let result = filteredReviews.value;

  // Filtre par note
  if (ratingFilter.value !== 'all') {
    result = result.filter(r => r.rating === parseInt(ratingFilter.value));
  }

  // Recherche textuelle
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(r => {
      const productName = r.product?.name?.toLowerCase() || '';
      const userName = `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.toLowerCase();
      const userEmail = r.user?.email?.toLowerCase() || '';
      const comment = r.comment?.toLowerCase() || '';
      
      return productName.includes(query) || 
             userName.includes(query) || 
             userEmail.includes(query) || 
             comment.includes(query);
    });
  }

  // Tri
  result = [...result].sort((a, b) => {
    switch (sortBy.value) {
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'rating-desc':
        return b.rating - a.rating;
      case 'rating-asc':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredAndSearchedReviews.value.length / itemsPerPage.value);
});

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredAndSearchedReviews.value.slice(start, end);
});

const paginationStart = computed(() => {
  if (filteredAndSearchedReviews.value.length === 0) return 0;
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const paginationEnd = computed(() => {
  const end = currentPage.value * itemsPerPage.value;
  return Math.min(end, filteredAndSearchedReviews.value.length);
});

const displayedPages = computed(() => {
  const pages = [];
  const maxDisplayed = 5;
  let start = Math.max(1, currentPage.value - Math.floor(maxDisplayed / 2));
  let end = Math.min(totalPages.value, start + maxDisplayed - 1);
  
  if (end - start < maxDisplayed - 1) {
    start = Math.max(1, end - maxDisplayed + 1);
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

const allSelected = computed(() => {
  return paginatedReviews.value.length > 0 && 
         paginatedReviews.value.every(r => selectedReviews.value.includes(r._id));
});

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedReviews.value = selectedReviews.value.filter(
      id => !paginatedReviews.value.find(r => r._id === id)
    );
  } else {
    const newSelections = paginatedReviews.value.map(r => r._id);
    selectedReviews.value = [...new Set([...selectedReviews.value, ...newSelections])];
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    scrollToTop();
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    scrollToTop();
  }
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const resetFilters = () => {
  searchQuery.value = '';
  ratingFilter.value = 'all';
  sortBy.value = 'date-desc';
  currentPage.value = 1;
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
    approvedCount.value = reviews.value.filter(r => r.status === 'approved').length;
    rejectedCount.value = reviews.value.filter(r => r.status === 'rejected').length;
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

const formatDateShort = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

const openImagesGallery = (images: string[]) => {
  galleryImages.value = images;
  currentImageIndex.value = 0;
};

const closeImageModal = () => {
  galleryImages.value = [];
  currentImageIndex.value = 0;
};

const nextImage = () => {
  if (currentImageIndex.value < galleryImages.value.length - 1) {
    currentImageIndex.value++;
  }
};

const previousImage = () => {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--;
  }
};

// Réinitialiser la page à 1 lors du changement de filtres
watch([currentFilter, ratingFilter, sortBy, searchQuery], () => {
  currentPage.value = 1;
});

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

.search-filters-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}

.search-bar i {
  position: absolute;
  left: 1rem;
  color: #6b7280;
  font-size: 1.25rem;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1);
}

.clear-btn {
  position: absolute;
  right: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #6b7280;
  display: flex;
  align-items: center;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.advanced-filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 150px;
}

.combined-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.combined-info > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.combined-info i {
  font-size: 1rem;
  color: #6b7280;
}

.product-name {
  font-weight: 600;
  color: #111827;
}

.user-name {
  color: #4b5563;
}

.review-date {
  color: #9ca3af;
  font-size: 0.8125rem;
}

.review-images-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.images-preview-compact {
  position: relative;
  display: inline-block;
}

.review-thumbnail-compact {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 0.375rem;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.review-thumbnail-compact:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #111827;
  z-index: 10;
}

.image-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  background: #111827;
  color: white;
  font-size: 0.625rem;
  padding: 2px 5px;
  border-radius: 0.25rem;
  font-weight: 600;
  border: 2px solid white;
}

.no-images {
  color: #d1d5db;
  font-size: 0.875rem;
  text-align: center;
}

.status-cell {
  display: flex;
  justify-content: center;
}

.actions-compact {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-action {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: #f3f4f6;
}

.btn-action i {
  font-size: 1.25rem;
}

.btn-action.approve {
  color: #059669;
}

.btn-action.approve:hover {
  background: #d1fae5;
  color: #047857;
}

.btn-action.reject {
  color: #dc2626;
}

.btn-action.reject:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
}

.image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image {
  max-width: 80vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 0.5rem;
}

.nav-btn {
  background: white;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.nav-btn:hover {
  background: #f3f4f6;
  transform: scale(1.1);
}

.nav-btn i {
  font-size: 32px;
  color: #111827;
}

.image-counter {
  position: absolute;
  bottom: -2.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  color: #111827;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.close-modal-btn {
  position: absolute;
  top: -3rem;
  right: 0;
  background: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-modal-btn:hover {
  background: #f3f4f6;
  transform: scale(1.1);
}

.close-modal-btn i {
  font-size: 24px;
  color: #111827;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.filter-select {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1);
}

.reset-filters-btn {
  padding: 0.625rem 1.25rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.reset-filters-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.reset-filters-btn i {
  font-size: 1.125rem;
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.per-page-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.per-page-selector label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.per-page-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.per-page-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.per-page-btn.active {
  background: #111827;
  color: white;
  border-color: #111827;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.pagination-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn i {
  font-size: 1.25rem;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-btn {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn.active {
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
