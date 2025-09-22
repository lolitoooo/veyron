<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const categories = ref([
  { id: 1, name: 'Femme', slug: 'femme' },
  { id: 2, name: 'Homme', slug: 'homme' },
  { id: 3, name: 'Accessoires', slug: 'accessoires' },
  { id: 4, name: 'Collections', slug: 'collections' }
]);

const navigateToCategory = (slug: string) => {
  router.push(`/category/${slug}`);
};
</script>

<template>
  <main class="home">
    <div class="hero">
      <h1 class="brand-name">VEYRON</h1>
      <div class="categories">
        <div 
          v-for="category in categories" 
          :key="category.id" 
          class="category"
          @click="navigateToCategory(category.slug)"
        >
          {{ category.name }}
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f8f8f8;
}

.hero {
  text-align: center;
}

.brand-name {
  font-size: 5rem;
  font-weight: 300;
  letter-spacing: 1.5rem;
  margin-bottom: 3rem;
  color: #111;
  font-family: 'Times New Roman', serif;
}

.categories {
  display: flex;
  justify-content: center;
  gap: 3rem;
}

.category {
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.2rem;
  color: #333;
  cursor: pointer;
  padding: 0.5rem 0;
  position: relative;
  transition: all 0.3s ease;
}

.category::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #333;
  transition: width 0.3s ease;
}

.category:hover {
  color: #000;
}

.category:hover::after {
  width: 100%;
}
</style>
