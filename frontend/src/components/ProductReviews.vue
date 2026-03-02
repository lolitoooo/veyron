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
        <ReviewCard
          v-for="review in otherReviews"
          :key="review._id"
          :review="review"
        />
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

const otherReviews = computed(() => {
  if (!userReview.value) return reviews.value;
  return reviews.value.filter(r => r._id !== userReview.value._id);
});

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
</style>
