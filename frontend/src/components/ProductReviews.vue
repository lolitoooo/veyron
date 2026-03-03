<template>
  <div class="product-reviews">
    <div class="reviews-header">
      <h2>Avis clients</h2>
      <div v-if="averageRating" class="rating-summary">
        <div class="average-rating">
          <span class="rating-number">{{ averageRating.toFixed(1) }}</span>
          <StarRating :rating="averageRating" />
          <span class="review-count">{{ totalReviews }} avis</span>
        </div>
      </div>
    </div>

    <div v-if="isAuthenticated && !userReview" class="add-review-section">
      <button @click="showReviewForm = true" class="btn-primary">
        <i class="material-icons">rate_review</i>
        Laisser un avis
      </button>
    </div>

    <ReviewForm
      v-if="showReviewForm"
      :product-id="productId"
      :existing-review="userReview"
      @review-submitted="handleReviewSubmitted"
      @cancel="showReviewForm = false"
    />

    <div v-if="userReview && !showReviewForm" class="user-review-card" :class="{ 'approved': userReview.status === 'approved' }">
      <div class="review-header">
        <h3>Votre avis</h3>
        <div class="review-status">
          <span v-if="userReview.status === 'pending'" class="status-badge pending">
            <i class="material-icons">schedule</i>
            En attente de validation
          </span>
          <span v-else-if="userReview.status === 'approved'" class="status-badge approved">
            <i class="material-icons">check_circle</i>
            Approuvé
          </span>
          <span v-else-if="userReview.status === 'rejected'" class="status-badge rejected">
            <i class="material-icons">cancel</i>
            Rejeté
          </span>
        </div>
        <div class="review-actions">
          <button 
            v-if="userReview.status !== 'approved'"
            @click="showReviewForm = true" 
            class="btn-icon" 
            title="Modifier"
          >
            <i class="material-icons">edit</i>
          </button>
          <button @click="deleteUserReview" class="btn-icon delete" title="Cliquez pour supprimer définitivement">
            <i class="material-icons">delete</i>
          </button>
        </div>
      </div>
      <ReviewCard :review="userReview" :is-user-review="true" />
    </div>

    <div class="reviews-list">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement des avis...</p>
      </div>

      <div v-else-if="reviews.length === 0 && !userReview" class="no-reviews">
        <i class="material-icons">rate_review</i>
        <p>Aucun avis pour le moment</p>
        <p class="subtitle">Soyez le premier à donner votre avis sur ce produit</p>
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
          </div>
          <div class="pagination-info">
            {{ paginationStart }}-{{ paginationEnd }} sur {{ otherReviews.length }} avis
          </div>
        </div>

        <div class="reviews-container">
          <ReviewCard
            v-for="review in paginatedReviews"
            :key="review._id"
            :review="review"
            @report="reportReview"
          />
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import ReviewCard from './ReviewCard.vue';
import ReviewForm from './ReviewForm.vue';
import StarRating from './StarRating.vue';
import axios from 'axios';

const props = defineProps<{
  productId: string;
}>();

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const reviews = ref<any[]>([]);
const userReview = ref<any>(null);
const averageRating = ref<number>(0);
const totalReviews = ref<number>(0);
const loading = ref(false);
const showReviewForm = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(5);

const otherReviews = computed(() => {
  if (!userReview.value) return reviews.value;
  return reviews.value.filter(r => r._id !== userReview.value._id);
});

const totalPages = computed(() => {
  return Math.ceil(otherReviews.value.length / itemsPerPage.value);
});

const paginatedReviews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return otherReviews.value.slice(start, end);
});

const paginationStart = computed(() => {
  return (currentPage.value - 1) * itemsPerPage.value + 1;
});

const paginationEnd = computed(() => {
  const end = currentPage.value * itemsPerPage.value;
  return Math.min(end, otherReviews.value.length);
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

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    scrollToReviews();
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    scrollToReviews();
  }
};

const scrollToReviews = () => {
  const reviewsSection = document.querySelector('.reviews-list');
  if (reviewsSection) {
    reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const fetchReviews = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/reviews/product/${props.productId}`);
    reviews.value = response.data.data;
  } catch (error) {
    console.error('Erreur lors du chargement des avis:', error);
  } finally {
    loading.value = false;
  }
};

const fetchAverageRating = async () => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/reviews/product/${props.productId}/average`);
    averageRating.value = response.data.data.averageRating || 0;
    totalReviews.value = response.data.data.totalReviews || 0;
  } catch (error) {
    console.error('Erreur lors du chargement de la note moyenne:', error);
  }
};

const reportReview = async (reviewId: string) => {
  if (!isAuthenticated.value) {
    alert('Vous devez être connecté pour signaler un avis');
    return;
  }

  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/reviews/${reviewId}/report`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      alert('Avis signalé avec succès. Notre équipe va l\'examiner.');
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.message || 'Erreur lors du signalement';
    alert(errorMsg);
  }
};

const fetchUserReview = async () => {
  if (!isAuthenticated.value) return;
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/reviews/product/${props.productId}/user`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    userReview.value = response.data.data;
  } catch (error: any) {
    if (error.response?.status !== 404 && error.response?.status !== 401) {
      console.error('Erreur lors du chargement de votre avis:', error);
    }
  }
};

const handleReviewSubmitted = (error?: string) => {
  showReviewForm.value = false;
  if (error) {
    alert(error);
  }
  fetchReviews();
  fetchAverageRating();
  fetchUserReview();
};

const deleteUserReview = async () => {
  if (!userReview.value) {
    alert('Aucun avis à supprimer');
    return;
  }
  
  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.delete(
      `${import.meta.env.VITE_API_URL}/reviews/${userReview.value._id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    userReview.value = null;
    fetchReviews();
    fetchAverageRating();
    alert('Avis supprimé avec succès');
  } catch (error: any) {
    console.error('Data complète:', error.response?.data);
  }
};

onMounted(() => {
  fetchReviews();
  fetchAverageRating();
  fetchUserReview();
});
</script>

<style scoped>
.product-reviews {
  margin-top: 3rem;
  padding: 2rem;
  border-top: 1px solid #e5e7eb;
  width: 100%;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.reviews-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.reviews-header h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #111827;
}

.rating-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.average-rating {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rating-number {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
}


.review-count {
  color: #6b7280;
  font-size: 0.875rem;
}

.add-review-section {
  margin-bottom: 2rem;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #111827;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #1f2937;
}

.btn-primary i {
  font-size: 1.25rem;
}

.user-review-card {
  background: #f9fafb;
  border: 2px solid #111827;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.user-review-card.approved {
  background: #d1fae5;
  border-color: #10b981;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.review-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.review-status {
  flex: 1;
  display: flex;
  justify-content: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge i {
  font-size: 1.125rem;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #10b981;
  color: white;
}

.status-badge.rejected {
  background: #ef4444;
  color: white;
}

.review-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.btn-icon.delete:hover {
  background: #fee2e2;
  border-color: #ef4444;
  color: #ef4444;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.no-reviews p {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.no-reviews .subtitle {
  font-size: 0.875rem;
  color: #9ca3af;
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

.reviews-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

@media (max-width: 640px) {
  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .pagination-navigation {
    flex-wrap: wrap;
  }
  
  .page-numbers {
    order: -1;
    width: 100%;
    justify-content: center;
  }
}
</style>
