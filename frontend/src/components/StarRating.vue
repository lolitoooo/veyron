<template>
  <div class="star-rating">
    <div 
      v-for="star in 5" 
      :key="star" 
      class="star-wrapper"
    >
      <i class="material-icons star star-empty">star_border</i>
      <i 
        class="material-icons star star-filled"
        :style="{ width: getStarFillPercentage(star) }"
      >
        star
      </i>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  rating: number;
  size?: 'small' | 'medium' | 'large';
}>();

const getStarFillPercentage = (position: number): string => {
  const rating = props.rating;
  
  if (position <= rating) {
    return '100%';
  } else if (position - 1 < rating && rating < position) {
    const fillPercentage = ((rating - (position - 1)) * 100);
    return `${fillPercentage}%`;
  } else {
    return '0%';
  }
};
</script>

<style scoped>
.star-rating {
  display: flex;
  gap: 0.125rem;
  align-items: center;
}

.star-wrapper {
  position: relative;
  display: inline-block;
}

.star {
  font-size: 1.125rem;
  transition: color 0.2s;
}

.star-empty {
  color: #d1d5db;
}

.star-filled {
  position: absolute;
  left: 0;
  top: 0;
  color: #fbbf24;
  overflow: hidden;
  white-space: nowrap;
}

/* Tailles */
:deep(.size-small) .star {
  font-size: 0.875rem;
}

:deep(.size-large) .star {
  font-size: 1.5rem;
}
</style>
