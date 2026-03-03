<template>
  <div class="review-form-overlay" @click.self="$emit('cancel')">
    <div class="review-form-modal">
      <div class="modal-header">
        <h3>{{ existingReview ? 'Modifier votre avis' : 'Laisser un avis' }}</h3>
        <button @click="$emit('cancel')" class="close-btn">
          <i class="material-icons">close</i>
        </button>
      </div>

      <form @submit.prevent="submitReview" class="review-form">
        <div class="form-group">
          <label>Note <span class="required">*</span></label>
          <div class="star-rating">
            <button
              v-for="star in 5"
              :key="star"
              type="button"
              @click="rating = star"
              @mouseenter="hoverRating = star"
              @mouseleave="hoverRating = 0"
              class="star-btn"
            >
              <i class="material-icons star" :class="{ filled: star <= (hoverRating || rating) }">
                {{ star <= (hoverRating || rating) ? 'star' : 'star_border' }}
              </i>
            </button>
          </div>
          <p v-if="rating" class="rating-text">{{ ratingText }}</p>
        </div>

        <div class="form-group">
          <label for="comment">Commentaire <span class="required">*</span></label>
          <textarea
            id="comment"
            v-model="comment"
            rows="5"
            placeholder="Partagez votre expérience avec ce produit..."
            maxlength="1000"
            required
          ></textarea>
          <p class="char-count">{{ comment.length }}/1000 caractères</p>
        </div>

        <ImageUpload 
          v-model="images"
          :max-images="3"
          :max-file-size="5"
          label="Ajoutez des photos de votre produit (optionnel)"
        />

        <div v-if="error" class="error-message">
          <i class="material-icons">error</i>
          {{ error }}
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('cancel')" class="btn-secondary">
            Annuler
          </button>
          <button type="submit" class="btn-primary" :disabled="!isValid || loading">
            <span v-if="loading" class="spinner-small"></span>
            {{ existingReview ? 'Modifier' : 'Publier' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import ImageUpload from '@/components/ImageUpload.vue';

const props = defineProps<{
  productId: string;
  existingReview?: any;
}>();

const emit = defineEmits<{
  (e: 'review-submitted'): void;
  (e: 'cancel'): void;
}>();

const rating = ref(0);
const hoverRating = ref(0);
const comment = ref('');
const images = ref<string[]>([]);
const loading = ref(false);
const error = ref('');

const ratingText = computed(() => {
  const texts = ['', 'Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'];
  return texts[rating.value] || '';
});

const isValid = computed(() => {
  return rating.value > 0 && comment.value.trim().length > 0;
});

const submitReview = async () => {
  if (!isValid.value) return;

  loading.value = true;
  error.value = '';

  try {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      error.value = 'Vous devez être connecté pour laisser un avis';
      loading.value = false;
      return;
    }
    
    const data = {
      product: props.productId,
      rating: rating.value,
      comment: comment.value.trim(),
      images: images.value
    };

    if (props.existingReview) {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/reviews/${props.existingReview._id}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/reviews`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    emit('review-submitted');
  } catch (err: any) {
    const errorMessage = err.response?.data?.message || 'Erreur lors de l\'envoi de l\'avis';
    error.value = errorMessage;
    
    if (err.response?.status === 403) {
      setTimeout(() => {
        emit('cancel');
      }, 3000);
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  if (props.existingReview) {
    rating.value = props.existingReview.rating;
    comment.value = props.existingReview.comment;
    images.value = props.existingReview.images || [];
  }
});
</script>

<style scoped>
.review-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.review-form-modal {
  background: white;
  border-radius: 0.5rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #111827;
}

.review-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.required {
  color: #ef4444;
}

.star-rating {
  display: flex;
  gap: 0.5rem;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s;
}

.star-btn:hover {
  transform: scale(1.1);
}

.star {
  font-size: 2rem;
  color: #d1d5db;
  transition: color 0.2s;
}

.star.filled {
  color: #fbbf24;
}

.rating-text {
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 1rem;
  resize: vertical;
  transition: border-color 0.2s;
}

textarea:focus {
  outline: none;
  border-color: #111827;
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #fee2e2;
  color: #991b1b;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}

.error-message i {
  font-size: 1.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-secondary,
.btn-primary {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #111827;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1f2937;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
