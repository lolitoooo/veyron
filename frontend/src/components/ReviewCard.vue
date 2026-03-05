<template>
  <div class="review-card" :class="{ 'user-review': isUserReview }">
    <div class="review-header">
      <div class="reviewer-info">
        <div class="avatar">
          <i class="material-icons">person</i>
        </div>
        <div class="reviewer-details">
          <h4 class="reviewer-name">
            {{ reviewerName }}
            <div class="badges-group">
              <span v-if="review.isVerified" class="verified-badge" title="Achat vérifié">
                <i class="material-icons">verified</i>
                Vérifié
              </span>
              <span v-else class="unverified-badge" title="Avis non vérifié">
                Non vérifié
              </span>
              <span v-if="showStatus && review.status === 'pending'" class="status-badge pending">
                <i class="material-icons">schedule</i>
                En attente
              </span>
              <span v-else-if="showStatus && review.status === 'approved'" class="status-badge approved">
                <i class="material-icons">check_circle</i>
                Approuvé
              </span>
              <span v-else-if="showStatus && review.status === 'rejected'" class="status-badge rejected">
                <i class="material-icons">cancel</i>
                Rejeté
              </span>
            </div>
          </h4>
          <p class="review-date">{{ formattedDate }}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="rating-stars">
          <i v-for="star in 5" :key="star" class="material-icons star" :class="{ filled: star <= review.rating }">
            {{ star <= review.rating ? 'star' : 'star_border' }}
          </i>
        </div>
        <button 
          v-if="!isUserReview" 
          @click="$emit('report', review._id)" 
          class="report-btn"
          title="Signaler cet avis"
        >
          <i class="material-icons">flag</i>
        </button>
      </div>
    </div>
    <div class="review-content">
      <p>{{ review.comment }}</p>
      
      <div v-if="review.images && review.images.length > 0" class="review-images">
        <img 
          v-for="(image, index) in review.images" 
          :key="index"
          :src="image"
          :alt="`Image ${index + 1}`"
          class="review-image"
          @click="openImageModal(image)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  review: any;
  isUserReview?: boolean;
  showStatus?: boolean;
}>();

const emit = defineEmits<{
  (e: 'report', reviewId: string): void;
}>();

const reviewerName = computed(() => {
  if (props.review.user) {
    return `${props.review.user.firstName} ${props.review.user.lastName}`;
  }
  return 'Utilisateur';
});

const formattedDate = computed(() => {
  const date = new Date(props.review.createdAt);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

const openImageModal = (image: string) => {
  window.open(image, '_blank');
};
</script>

<style scoped>
.review-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  transition: box-shadow 0.2s;
}

.review-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
  width: 3rem;
  height: 3rem;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar i {
  font-size: 1.75rem;
  color: #6b7280;
}

.reviewer-details {
  display: flex;
  flex-direction: column;
}

.reviewer-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badges-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.review-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.rating-stars {
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

.review-content p {
  color: #374151;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #eff6ff;
  color: #3b82f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0;
}

.verified-badge i {
  font-size: 1rem;
}

.unverified-badge {
  display: inline-flex;
  align-items: center;
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge i {
  font-size: 0.875rem;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.report-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #9ca3af;
  transition: all 0.2s;
  border-radius: 0.25rem;
}

.report-btn:hover {
  background: #fef2f2;
  color: #ef4444;
}

.report-btn i {
  font-size: 1.25rem;
}

.review-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.review-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.review-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media (max-width: 640px) {
  .review-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .reviewer-name {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .verified-badge,
  .unverified-badge {
    margin-left: 0;
    align-self: flex-start;
  }
}
</style>

