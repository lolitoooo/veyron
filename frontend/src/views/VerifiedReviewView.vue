<template>
  <div class="verified-review-page">
    <div class="container">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>Vérification du lien...</p>
      </div>

      <div v-else-if="error" class="error-state">
        <i class="material-icons">error_outline</i>
        <h2>{{ error }}</h2>
        <p v-if="errorDetails">{{ errorDetails }}</p>
        <router-link to="/" class="btn-home">
          Retour à l'accueil
        </router-link>
      </div>

      <div v-else-if="tokenData && !submitted" class="review-form-container">
        <div class="header">
          <i class="material-icons verified-icon">verified</i>
          <h1>Avis sur votre achat</h1>
          <p class="subtitle">Cet avis est associé à une commande Veyron Paris.</p>
        </div>

        <div class="product-info">
          <img 
            v-if="productImageUrl" 
            :src="productImageUrl" 
            :alt="tokenData.product?.name || 'Produit commandé'"
            class="product-image"
          >
          <div class="product-details">
            <h3>{{ tokenData.product?.name }}</h3>
            <p class="order-ref">Commande #{{ tokenData.order?.orderNumber || tokenData.order?._id }}</p>
          </div>
        </div>

        <form @submit.prevent="submitReview" class="review-form">
          <div class="form-group">
            <label>Votre note *</label>
            <div class="star-rating-input">
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                @click="rating = star"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                class="star-btn"
              >
                <i class="material-icons">
                  {{ (hoverRating || rating) >= star ? 'star' : 'star_border' }}
                </i>
              </button>
            </div>
            <p v-if="rating" class="rating-text">{{ getRatingText(rating) }}</p>
          </div>

          <div class="form-group">
            <label for="comment">Votre commentaire *</label>
            <textarea
              id="comment"
              v-model="comment"
              rows="6"
              maxlength="1000"
              placeholder="Partagez votre expérience avec ce produit..."
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

          <div class="info-box">
            <i class="material-icons">info</i>
            <div>
              <p><strong>Avis client certifié</strong></p>
              <p>Seules les personnes ayant réellement acheté ce produit peuvent laisser un avis ici.</p>
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="!rating || !comment.trim() || submitting"
            class="submit-btn"
          >
            <span v-if="!submitting">Publier mon avis vérifié</span>
            <span v-else>Publication en cours...</span>
          </button>
        </form>
      </div>

      <div v-else-if="submitted" class="success-state">
        <i class="material-icons success-icon">check_circle</i>
        <h2>Merci pour votre avis !</h2>
        <p>Votre avis vérifié a été soumis avec succès.</p>
        <p class="subtitle">Il sera visible après validation par notre équipe.</p>
        <router-link to="/" class="btn-home">
          Retour à l'accueil
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import ImageUpload from '@/components/ImageUpload.vue';

const route = useRoute();
const token = route.params.token as string;

const loading = ref(true);
const error = ref('');
const errorDetails = ref('');
const tokenData = ref<any>(null);
const rating = ref(0);
const hoverRating = ref(0);
const comment = ref('');
const images = ref<string[]>([]);
const submitting = ref(false);
const submitted = ref(false);

const imageUrl = (import.meta.env.VITE_IMAGE_URL || 'http://localhost:3000').replace(/\/$/, '');

const productImageUrl = computed(() => {
  const product = tokenData.value?.product;
  if (!product || !product.images || !product.images.length) return '';

  const firstImage = product.images[0];
  const path = typeof firstImage === 'string' ? firstImage : firstImage?.url;
  if (!path) return '';

  if (typeof path === 'string' && /^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = typeof path === 'string' ? path : '';
  if (!normalizedPath) return '';

  return normalizedPath.startsWith('/')
    ? `${imageUrl}${normalizedPath}`
    : `${imageUrl}/${normalizedPath}`;
});

const checkToken = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/reviews/verified/check/${token}`
    );

    if (response.data.success) {
      if (!response.data.data.valid) {
        if (response.data.data.used) {
          error.value = 'Ce lien a déjà été utilisé';
          errorDetails.value = 'Vous avez déjà laissé un avis pour ce produit.';
        } else if (response.data.data.expired) {
          error.value = 'Ce lien a expiré';
          errorDetails.value = 'Les liens d\'avis sont valables 30 jours après la commande.';
        } else {
          error.value = 'Lien invalide';
        }
      } else {
        tokenData.value = response.data.data;
      }
    }
  } catch (err: any) {
    console.error('Erreur vérification token:', err);
    error.value = 'Lien invalide ou expiré';
    errorDetails.value = 'Veuillez vérifier le lien dans votre email.';
  } finally {
    loading.value = false;
  }
};

const submitReview = async () => {
  if (!rating.value || !comment.value.trim()) return;

  submitting.value = true;

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/reviews/verified`,
      {
        token,
        rating: rating.value,
        comment: comment.value.trim(),
        images: images.value
      }
    );

    if (response.data.success) {
      submitted.value = true;
    }
  } catch (err: any) {
    console.error('Erreur soumission avis:', err);
    const errorMsg = err.response?.data?.message || 'Erreur lors de la soumission de l\'avis';
    alert(errorMsg);
  } finally {
    submitting.value = false;
  }
};

const getRatingText = (stars: number) => {
  const texts = {
    1: 'Très décevant',
    2: 'Décevant',
    3: 'Correct',
    4: 'Très bien',
    5: 'Excellent'
  };
  return texts[stars as keyof typeof texts] || '';
};

onMounted(() => {
  checkToken();
});
</script>

<style scoped>
.verified-review-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
  padding: 2rem 1rem;
}

.container {
  max-width: 700px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f4f6;
  border-top-color: #111827;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state,
.success-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.error-state i {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.success-state .success-icon {
  font-size: 4rem;
  color: #10b981;
  margin-bottom: 1rem;
}

.verified-icon {
  font-size: 3rem;
  color: #3b82f6;
  margin-bottom: 1rem;
}

.error-state h2,
.success-state h2 {
  font-size: 1.75rem;
  color: #111827;
  margin-bottom: 1rem;
}

.error-state p,
.success-state p {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.btn-home {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.875rem 2rem;
  background: #111827;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-home:hover {
  background: #374151;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.review-form-container {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.header {
  text-align: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  color: var(--color-white);
}

.header h1 {
  font-family: var(--font-primary);
  font-size: var(--text-3xl);
  font-weight: var(--font-medium);
  margin-bottom: 0.5rem;
  color: var(--color-white);
}

.header .subtitle {
  color: var(--color-secondary-light);
  font-size: var(--text-sm);
}

.header .verified-icon {
  color: var(--color-secondary);
  font-size: 2rem;
  margin-bottom: 0.5rem;
  display: block;
}

.product-info {
  display: flex;
  gap: 1.5rem;
  padding: 2rem;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
}

.product-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.product-details h3 {
  font-size: 1.25rem;
  color: #111827;
  margin-bottom: 0.5rem;
}

.order-ref {
  color: #6b7280;
  font-size: 0.875rem;
}

.review-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.75rem;
}

.star-rating-input {
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
  transform: scale(1.2);
}

.star-btn i {
  font-size: 2.5rem;
  color: #fbbf24;
}

.rating-text {
  margin-top: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

textarea {
  width: 100%;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  transition: all 0.2s;
}

textarea:focus {
  outline: none;
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.1);
}

.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.5rem;
}

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-cream);
  border-left: 4px solid var(--color-secondary);
  border-radius: var(--border-radius-md);
  margin-bottom: 2rem;
}

.info-box i {
  color: var(--color-secondary);
  font-size: 1.5rem;
}

.info-box p {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-gray-700);
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background: #111827;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #374151;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.submit-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 640px) {
  .product-info {
    flex-direction: column;
    text-align: center;
  }

  .star-rating-input {
    justify-content: center;
  }
}
</style>
