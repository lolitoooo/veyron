<template>
  <div class="review-card" :class="{ 'user-review': isUserReview }">
    <div class="review-header">
      <div class="reviewer-info">
        <div class="avatar">
          <i class="material-icons">person</i>
        </div>
        <div class="reviewer-details">
          <h4 class="reviewer-name">{{ reviewerName }}</h4>
          <p class="review-date">{{ formattedDate }}</p>
        </div>
      </div>
      <div class="rating-stars">
        <i v-for="star in 5" :key="star" class="material-icons star" :class="{ filled: star <= review.rating }">
          {{ star <= review.rating ? 'star' : 'star_border' }}
        </i>
      </div>
    </div>
    <div class="review-content">
      <p>{{ review.comment }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  review: any;
  isUserReview?: boolean;
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
  margin: 0;
}
</style>
