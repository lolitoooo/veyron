<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const categories = ref([
  { id: 1, name: 'Femme', slug: 'femme', image: '/images/categories/femme.jpg' },
  { id: 2, name: 'Homme', slug: 'homme', image: '/images/categories/homme.jpg' },
  { id: 3, name: 'Accessoires', slug: 'accessoires', image: '/images/categories/accessoires.jpg' },
  { id: 4, name: 'Collections', slug: 'collections', image: '/images/categories/collections.jpg' }
]);

const currentSlide = ref(0);
const isMobile = ref(window.innerWidth < 768);

const navigateToCategory = (slug: string) => {
  router.push(`/category/${slug}`);
};

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % categories.value.length;
};

const prevSlide = () => {
  currentSlide.value = (currentSlide.value - 1 + categories.value.length) % categories.value.length;
};

const setSlide = (index: number) => {
  currentSlide.value = index;
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  
  if (isMobile.value) {
    startAutoSlide();
  }
});

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
};

let slideInterval: number | null = null;

const startAutoSlide = () => {
  if (slideInterval) return;
  slideInterval = window.setInterval(() => {
    nextSlide();
  }, 5000);
};

const stopAutoSlide = () => {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
};
</script>

<template>
  <main class="home">
    <div class="hero desktop-hero">
      <h1 class="brand-name">VEYRON</h1>
      <p class="tagline">L'élégance parisienne</p>
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
    
    <div class="hero mobile-hero">
      <h1 class="brand-name">VEYRON</h1>
      <p class="tagline">L'élégance parisienne</p>
      
      <div class="mobile-slider">
        <div class="slider-container" :style="{ transform: `translateX(-${currentSlide * 100}%)` }">
          <div 
            v-for="category in categories" 
            :key="category.id" 
            class="slide"
            @click="navigateToCategory(category.slug)"
          >
            <div class="slide-content">
              <h2>{{ category.name }}</h2>
              <button class="explore-btn">Découvrir</button>
            </div>
          </div>
        </div>
        
        <div class="slider-controls">
          <button class="slider-arrow prev" @click="prevSlide" aria-label="Précédent">
            <i class="material-icons">chevron_left</i>
          </button>
          <div class="slider-dots">
            <button 
              v-for="(category, index) in categories" 
              :key="category.id"
              class="slider-dot" 
              :class="{ active: index === currentSlide }"
              @click="setSlide(index)"
              :aria-label="`Slide ${index + 1}`"
            ></button>
          </div>
          <button class="slider-arrow next" @click="nextSlide" aria-label="Suivant">
            <i class="material-icons">chevron_right</i>
          </button>
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
  position: relative;
  overflow: hidden;
}

.hero {
  text-align: center;
  width: 100%;
}

.brand-name {
  font-size: 5rem;
  font-weight: 300;
  letter-spacing: 1.5rem;
  margin-bottom: 1rem;
  color: #111;
  font-family: 'Times New Roman', serif;
}

.tagline {
  font-size: 1.2rem;
  font-weight: 300;
  letter-spacing: 0.2rem;
  margin-bottom: 3rem;
  color: #666;
  font-family: var(--font-body);
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

.mobile-hero {
  display: none;
}

.mobile-slider {
  width: 100%;
  height: 60vh;
  position: relative;
  overflow: hidden;
  margin-top: 2rem;
}

.slider-container {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.5s ease;
}

.slide {
  min-width: 100%;
  height: 100%;
  position: relative;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.slide:nth-child(1) { background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/images/categories/femme.jpg'); }
.slide:nth-child(2) { background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/images/categories/homme.jpg'); }
.slide:nth-child(3) { background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/images/categories/accessoires.jpg'); }
.slide:nth-child(4) { background-image: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/images/categories/collections.jpg'); }

.slide-content {
  text-align: center;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  backdrop-filter: blur(5px);
}

.slide-content h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.2rem;
}

.explore-btn {
  background-color: #fff;
  color: #000;
  border: none;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-body);
}

.explore-btn:hover {
  background-color: #000;
  color: #fff;
}

.slider-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.slider-arrow {
  background: rgba(255, 255, 255, 0.5);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.3s ease;
}

.slider-arrow:hover {
  background: rgba(255, 255, 255, 0.8);
}

.slider-dots {
  display: flex;
  gap: 0.5rem;
}

.slider-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.slider-dot.active {
  background-color: #fff;
}

@media (max-width: 768px) {
  .desktop-hero {
    display: none;
  }
  
  .mobile-hero {
    display: block;
    height: 100%;
    padding: 1rem;
  }
  
  .brand-name {
    font-size: 3rem;
    letter-spacing: 0.8rem;
    margin-top: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .tagline {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
}

@media (max-width: 480px) {
  .brand-name {
    font-size: 2.5rem;
    letter-spacing: 0.5rem;
  }
  
  .mobile-slider {
    height: 50vh;
  }
  
  .slide-content h2 {
    font-size: 1.5rem;
  }
  
  .explore-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
}
</style>
