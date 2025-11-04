<template>
  <div class="category-page">
    <div class="category-header">
      <h1>{{ categoryTitle }}</h1>
      <div class="view-filter-controls">
        <div class="view-controls">
          <span>VUE</span>
          <button 
            class="view-button" 
            :class="{ active: viewMode === 1 }" 
            @click="viewMode = 1"
          >1</button>
          <button 
            class="view-button" 
            :class="{ active: viewMode === 2 }" 
            @click="viewMode = 2"
          >2</button>
        </div>
        <button 
          class="filter-button" 
          :class="{ 'active': showFilters }"
          @click="toggleFilters"
        >
          FILTRES
        </button>
      </div>
    </div>
    
    <div v-if="isLoading" class="loading">
      <div class="loader"></div>
      <p>Chargement des produits...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="filteredProducts.length === 0" class="no-products">
      <p>Aucun produit trouvé dans cette catégorie.</p>
    </div>
    
    <div v-else class="category-content">
      <div class="filter-panel" v-show="showFilters">
        <div class="filter-actions">
          <button class="reset-filters" @click="resetFilters">Réinitialiser les filtres</button>
        </div>
        <div class="filter-section">
          <h3>TRIER PAR</h3>
          <div class="filter-options">
            <div class="filter-option">
              <input type="radio" id="sort-default" name="sort" value="default" v-model="sortOption">
              <label for="sort-default">PERTINENCE</label>
            </div>
            <div class="filter-option">
              <input type="radio" id="sort-price-asc" name="sort" value="price-asc" v-model="sortOption">
              <label for="sort-price-asc">PRIX CROISSANT</label>
            </div>
            <div class="filter-option">
              <input type="radio" id="sort-price-desc" name="sort" value="price-desc" v-model="sortOption">
              <label for="sort-price-desc">PRIX DÉCROISSANT</label>
            </div>
            <div class="filter-option">
              <input type="radio" id="sort-new" name="sort" value="new" v-model="sortOption">
              <label for="sort-new">NEW</label>
            </div>
          </div>
        </div>
        
        <div class="filter-section" @click.stop>
          <h3>PRIX</h3>
          <div class="price-range">
            <!-- <div class="price-inputs">
              <div class="price-input-group">
                <label>Min:</label>
                <input 
                  type="number" 
                  v-model.number="priceRange[0]" 
                  :min="0" 
                  :max="priceRange[1]" 
                  @input="validatePriceInput(0)"
                  @click.stop
                  class="price-input"
                />
                <span>EUR</span>
              </div>
              <div class="price-input-group">
                <label>Max:</label>
                <input 
                  type="number" 
                  v-model.number="priceRange[1]" 
                  :min="priceRange[0]" 
                  :max="maxPrice" 
                  @input="validatePriceInput(1)"
                  @click.stop
                  class="price-input"
                />
                <span>EUR</span>
              </div>
            </div> -->
            
            <div class="custom-price-slider" @click.stop>
              <div class="price-track">
                <div 
                  class="price-range-selected" 
                  :style="{ 
                    left: (priceRange[0] / maxPrice) * 100 + '%', 
                    width: ((priceRange[1] - priceRange[0]) / maxPrice) * 100 + '%' 
                  }"
                ></div>
              </div>
              <div 
                class="price-handle min-handle" 
                :style="{ left: (priceRange[0] / maxPrice) * 100 + '%' }"
                @mousedown="startDrag($event, 0)"
                @touchstart.passive="startDrag($event, 0)"
              ></div>
              <div 
                class="price-handle max-handle" 
                :style="{ left: (priceRange[1] / maxPrice) * 100 + '%' }"
                @mousedown="startDrag($event, 1)"
                @touchstart.passive="startDrag($event, 1)"
              ></div>
            </div>
            
            <div class="price-display">
              {{ formatPrice(priceRange[0]) }} EUR - {{ formatPrice(priceRange[1]) }} EUR
            </div>
          </div>
        </div>
        
        <div class="filter-section">
          <h3>TAILLE</h3>
          <div class="filter-options">
            <div class="filter-option" v-for="size in availableSizes" :key="size">
              <input type="checkbox" :id="`size-${size}`" :value="size" v-model="selectedSizes">
              <label :for="`size-${size}`">{{ size }}</label>
            </div>
            <div class="filter-option see-more" v-if="moreSizes">
              <button @click="showMoreSizes = !showMoreSizes">{{ showMoreSizes ? 'VOIR MOINS' : 'VOIR PLUS' }}</button>
            </div>
          </div>
        </div>
        
        <div class="filter-section">
          <h3>COULEUR</h3>
          <div class="color-options">
            <div 
              v-for="color in availableColors" 
              :key="color.code" 
              class="color-option"
              :class="{ active: selectedColors.includes(color.name) }"
              @click="toggleColor(color.name)"
            >
              <div class="color-swatch" :style="{ backgroundColor: color.code }"></div>
              <span>{{ color.name }}</span>
            </div>
            <div class="filter-option see-more" v-if="moreColors">
              <button @click="showMoreColors = !showMoreColors">{{ showMoreColors ? 'VOIR MOINS' : 'VOIR PLUS' }}</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="products-container">
        <div class="products-grid" :class="{ 'minimal-view': viewMode === 2 }">
          <div 
            v-for="(product, index) in filteredProducts" 
            :key="product._id || index" 
            class="product-card"
            :class="{ 'minimal-card': viewMode === 2 }"
            @click="navigateToProduct(product)"
          >
            <div class="product-image">
              <img 
                :src="viewMode === 1 ? getImageUrl(product) : getFlatProductImage(product)" 
                :alt="product.name" 
              />
            </div>
            
            <div class="product-info" v-if="viewMode === 1">
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-price">
                <template v-if="hasDiscount(product)">
                  <div class="price-container">
                    <span class="original-price">{{ formatPrice(product.price) }} EUR</span>
                    <span class="discount-percentage">-{{ product.discount }}%</span>
                    <span class="discounted-price">{{ formatPrice(product.discountPrice) }} EUR</span>
                  </div>
                </template>
                <template v-else>
                  <span class="current-price">
                    {{ formatPrice(product.price) }} EUR
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>
        <div v-if="filteredProducts.length > 0" class="debug-info" style="display: none;">
          Nombre de produits affichés: {{ filteredProducts.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineProps, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/apiService';
import { getImageUrl as getImageUrlUtil } from '@/utils/imageUrl';

const props = defineProps({
  slug: {
    type: String,
    default: ''
  }
});

const route = useRoute();
const router = useRouter();

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string | { _id: string, name: string, slug?: string };
  images?: Array<{ url: string, alt?: string, isMain?: boolean }>;
  image?: string;
  colors?: Array<{ name: string, code: string, images?: Array<{ url: string, alt?: string, isMain?: boolean }> }>;
  discount?: number;
  discountPrice?: number;
  slug?: string;
}

const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const isLoading = ref(true);
const error = ref('');

const viewMode = ref<number>(1);
const showFilters = ref<boolean>(false);
const sortOption = ref<string>('default');
const priceRange = ref<number[]>([0, 1000]);
const selectedSizes = ref<string[]>([]);
const selectedColors = ref<string[]>([]);
const showMoreSizes = ref<boolean>(false);
const showMoreColors = ref<boolean>(false);

const isDragging = ref<boolean>(false);
const currentHandle = ref<number>(-1);
const categorySlug = computed(() => {
  if (props.slug) {
    return props.slug;
  }
  
  if (route.params.slug) {
    return route.params.slug as string;
  }
  
  const pathSegments = route.path.split('/');
  const lastSegment = pathSegments[pathSegments.length - 1];
  return lastSegment;
});

const categoryTitle = computed(() => {
  const slug = categorySlug.value;
  if (slug === 'femme') return 'Collection Femme';
  if (slug === 'homme') return 'Collection Homme';
  if (slug === 'accessoires') return 'Accessoires';
  if (slug === 'collections') return 'Collections Exclusives';
  return 'Produits';
});

const getCategoryIdBySlug = async (slug: string): Promise<string | null> => {
  try {
    const response = await api.get('/categories');
    
    let categoriesList = [];
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      categoriesList = response.data.data;
    } else if (response.data && Array.isArray(response.data)) {
      categoriesList = response.data;
    } else {
      return null;
    }
    
    
    const category = categoriesList.find(cat => 
      cat.slug === slug || 
      cat.name.toLowerCase() === slug.toLowerCase()
    );
    
    if (category) {
      return category._id;
    } else {
      return null;
    }
  } catch (err) {
    console.error('Erreur lors de la récupération des catégories:', err);
    return null;
  }
};

const loadProducts = async () => {
  isLoading.value = true;
  error.value = '';
  products.value = [];
  
  try {
    const slug = categorySlug.value;
    const categoryId = await getCategoryIdBySlug(slug);
    
    if (!categoryId) {
      error.value = `Catégorie "${slug}" introuvable`;
      isLoading.value = false;
      return;
    }
    
    const response = await api.get(`/products?category=${categoryId}`);
    
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      products.value = response.data.data;
    } else if (response.data && Array.isArray(response.data)) {
      products.value = response.data;
    } else {
      products.value = [];
    }
    
    console.log(`Catégorie ${slug}: ${products.value.length} produits chargés`);
    
    if (products.value.length > 0) {
      const prices = products.value.map(p => p.price);
      const minPrice = Math.floor(Math.min(...prices));
      const maxPriceValue = Math.ceil(Math.max(...prices));
      priceRange.value = [minPrice, maxPriceValue];
    }
    
    
  } catch (err: any) {
    console.error('Erreur lors du chargement des produits:', err);
    error.value = err.message || 'Erreur lors du chargement des produits';
  } finally {
    isLoading.value = false;
  }
};

const getImageUrl = (product: Product): string => {  
  if (product.images && product.images.length > 0) {
    const mainImage = product.images.find(img => img.isMain);
    const image = mainImage || product.images[0];
    
    if (image && image.url) {
      return getImageUrlUtil(image.url);
    }
  }
  
  if (typeof product.image === 'string') {
    return getImageUrlUtil(product.image);
  }
  
  return getImageUrlUtil('/placeholder.jpg');
};

const getFlatProductImage = (product: Product): string => {
  try {
    if (product.colors && product.colors.length > 0) {
      const firstColor = product.colors[0];
      
      if (firstColor.images && firstColor.images.length > 0) {
        const lastImageIndex = firstColor.images.length - 1;
        const lastImage = firstColor.images[lastImageIndex];
        
        if (lastImage && lastImage.url) {
          console.log(`Image à plat trouvée pour ${product.name}: ${lastImage.url}`);
          return getImageUrlUtil(lastImage.url);
        }
      }
    }
    
    if (product.images && product.images.length > 0) {
      const nonMainImage = product.images.find(img => !img.isMain);
      if (nonMainImage && nonMainImage.url) {
        return getImageUrlUtil(nonMainImage.url);
      }
      
      const lastImage = product.images[product.images.length - 1];
      if (lastImage && lastImage.url) {
        return getImageUrlUtil(lastImage.url);
      }
    }
    
    return getImageUrl(product);
  } catch (err) {
    console.error(`Erreur lors de la récupération de l'image à plat pour ${product.name}:`, err);
    return getImageUrl(product);
  }
};

const toggleColor = (colorName: string) => {
  const index = selectedColors.value.indexOf(colorName);
  if (index === -1) {
    selectedColors.value.push(colorName);
  } else {
    selectedColors.value.splice(index, 1);
  }
};

const maxPrice = computed(() => {
  if (products.value.length === 0) return 1000;
  return Math.ceil(Math.max(...products.value.map(p => p.price)) / 10) * 10;
});
const validatePriceInput = (index: number) => {
  if (index === 0) {
    if (priceRange.value[0] > priceRange.value[1]) {
      priceRange.value[0] = priceRange.value[1];
    }
    if (priceRange.value[0] < 0) {
      priceRange.value[0] = 0;
    }
  } else if (index === 1) {
    if (priceRange.value[1] < priceRange.value[0]) {
      priceRange.value[1] = priceRange.value[0];
    }
    if (priceRange.value[1] > maxPrice.value) {
      priceRange.value[1] = maxPrice.value;
    }
  }
  
  showFilters.value = true;
};

const startDrag = (event: MouseEvent | TouchEvent, handleIndex: number) => {
  if (event.type !== 'touchstart') {
    event.preventDefault();
  }
  event.stopPropagation();
  
  isDragging.value = true;
  currentHandle.value = handleIndex;
  
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('touchmove', handleDrag, { passive: true });
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag, { passive: true });
  
  showFilters.value = true;
};

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  
  if (event.type !== 'touchmove') {
    event.preventDefault?.();
  }
  
  let clientX: number;
  if (event instanceof MouseEvent) {
    clientX = event.clientX;
  } else {
    clientX = event.touches[0].clientX;
  }
  
  const slider = document.querySelector('.custom-price-slider') as HTMLElement;
  if (!slider) return;
  
  const rect = slider.getBoundingClientRect();
  const position = (clientX - rect.left) / rect.width;
  const value = Math.round(position * maxPrice.value);
  
  if (currentHandle.value === 0) {
    priceRange.value[0] = Math.max(0, Math.min(value, priceRange.value[1]));
  } else {
    priceRange.value[1] = Math.max(priceRange.value[0], Math.min(value, maxPrice.value));
  }
  
  showFilters.value = true;
};

const stopDrag = () => {
  isDragging.value = false;
  
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchend', stopDrag);
  
  showFilters.value = true;
};

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
  
  if (showFilters.value) {
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
  } else {
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('touchstart', handleOutsideClick);
  }
};

const handleOutsideClick = (event: Event) => {
  const filterPanel = document.querySelector('.filter-panel');
  const filterButton = document.querySelector('.filter-button');
  
  if (filterPanel && !filterPanel.contains(event.target as Node) && 
      filterButton && !filterButton.contains(event.target as Node)) {
    showFilters.value = false;
    
    document.removeEventListener('click', handleOutsideClick);
    document.removeEventListener('touchstart', handleOutsideClick);
  } else {
    event.stopPropagation();
  }
};
const resetFilters = () => {
  sortOption.value = 'default';
  
  if (products.value.length > 0) {
    const prices = products.value.map(p => p.price);
    const minPrice = Math.floor(Math.min(...prices));
    const maxPriceValue = Math.ceil(Math.max(...prices));
    priceRange.value = [minPrice, maxPriceValue];
  } else {
    priceRange.value = [0, 1000];
  }
  
  selectedSizes.value = [];
  selectedColors.value = [];
  
  showFilters.value = true;
};

const allSizes = computed(() => {
  const sizes = new Set<string>();
  products.value.forEach(product => {
    if (product.sizes && Array.isArray(product.sizes)) {
      product.sizes.forEach(size => sizes.add(size));
    }
  });
  return Array.from(sizes);
});

const allColors = computed(() => {
  const colors: { name: string, code: string }[] = [];
  products.value.forEach(product => {
    if (product.colors && Array.isArray(product.colors)) {
      product.colors.forEach(color => {
        if (!colors.some(c => c.name === color.name)) {
          colors.push({ name: color.name, code: color.code });
        }
      });
    }
  });
  return colors;
});

const availableSizes = computed(() => {
  return showMoreSizes.value ? allSizes.value : allSizes.value.slice(0, 8);
});
const moreSizes = computed(() => {
  return allSizes.value.length > 8;
});

const availableColors = computed(() => {
  return showMoreColors.value ? allColors.value : allColors.value.slice(0, 8);
});

const moreColors = computed(() => {
  return allColors.value.length > 8;
});

const filteredProducts = computed(() => {
  if (!showFilters.value) {
    const allProducts = [...products.value];
    console.log(`Mode vue ${viewMode.value}, sans filtres: ${allProducts.length} produits`);
    return allProducts;
  }
  
  let result = [...products.value];
  
  result = result.filter(product => {
    const price = hasDiscount(product) ? product.discountPrice || 0 : product.price;
    return price >= priceRange.value[0] && price <= priceRange.value[1];
  });
  
  if (selectedSizes.value.length > 0) {
    result = result.filter(product => {
      if (!product.sizes) return false;
      return product.sizes.some(size => selectedSizes.value.includes(size));
    });
  }
  
  if (selectedColors.value.length > 0) {
    result = result.filter(product => {
      if (!product.colors) return false;
      return product.colors.some(color => selectedColors.value.includes(color.name));
    });
  }
  
  switch (sortOption.value) {
    case 'price-asc':
      result.sort((a, b) => {
        const priceA = hasDiscount(a) ? a.discountPrice || a.price : a.price;
        const priceB = hasDiscount(b) ? b.discountPrice || b.price : b.price;
        return priceA - priceB;
      });
      break;
    case 'price-desc':
      result.sort((a, b) => {
        const priceA = hasDiscount(a) ? a.discountPrice || a.price : a.price;
        const priceB = hasDiscount(b) ? b.discountPrice || b.price : b.price;
        return priceB - priceA;
      });
      break;
    case 'new':
      result.sort((a, b) => b._id.localeCompare(a._id));
      break;
    default:
      break;
  }
  
  return result;
});

const hasDiscount = (product: Product): boolean => {
  return !!product.discount && product.discount > 0 && !!product.discountPrice;
};

const getDiscountedPrice = (product: Product): number => {
  if (!product.discount || product.discount <= 0) return product.price;
  return product.discountPrice || product.price;
};

const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

const navigateToProduct = (product: Product) => {
  try {
    const productSlug = generateProductSlug(product);
    router.push(`/category/${categorySlug.value}/${productSlug}`);
  } catch (err) {
    console.error('Erreur lors de la navigation vers le produit:', err);
    router.push(`/category/${categorySlug.value}/${product._id}`);
  }
};

const generateProductSlug = (product: Product): string => {
  if (!product._id) {
    console.error('Produit sans ID valide:', product);
    return '';
  }
  
  if (product.slug) {
    if (product.slug.includes(product._id)) {
      return product.slug;
    }
    return `${product.slug}-${product._id}`;
  }
  let slug = '';
  if (product.name) {
    slug = product.name
      .toLowerCase()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } else {
    slug = 'produit';
  }
  
  return `${slug}-${product._id}`;
};

watch(categorySlug, (newSlug, oldSlug) => {
  if (newSlug !== oldSlug) {
    loadProducts();
  }
}, { immediate: false });

onMounted(() => {
  loadProducts();
});
onUnmounted(() => {
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchend', stopDrag);
  document.removeEventListener('click', handleOutsideClick);
  document.removeEventListener('touchstart', handleOutsideClick);
  isDragging.value = false;
  showFilters.value = false;
});
</script>

<style scoped>
.category-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.category-header h1 {
  font-size: 2rem;
  font-weight: 300;
  letter-spacing: 0.1rem;
  margin: 0;
}

.view-filter-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.view-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-controls span {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.view-button {
  width: 30px;
  height: 30px;
  border: 1px solid #ddd;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-button.active {
  background-color: #000;
  color: #fff;
  border-color: #000;
}

.filter-button {
  padding: 0.5rem 1.5rem;
  border: 1px solid #007bff;
  background-color: #fff;
  color: #007bff;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-button:hover {
  background-color: #007bff;
  color: #fff;
}

.filter-button.active {
  background-color: #007bff;
  color: #fff;
  border-color: #0056b3;
}

.category-content {
  display: flex;
  gap: 2rem;
}

.filter-panel {
  width: 250px;
  flex-shrink: 0;
  border-right: 1px solid #eee;
  padding-right: 1.5rem;
}

.filter-actions {
  margin-bottom: 1.5rem;
}

.reset-filters {
  background: none;
  border: 1px solid #ccc;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  width: 100%;
  transition: all 0.2s ease;
}

.reset-filters:hover {
  background-color: #f5f5f5;
  border-color: #999;
  color: #333;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-section h3 {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1rem;
  color: #333;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-option label {
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
}

.price-range {
  margin-top: 1rem;
}

.price-inputs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.price-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.price-input {
  width: 70px;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.custom-price-slider {
  position: relative;
  height: 30px;
  margin: 1rem 0;
  touch-action: none;
}

.price-track {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  width: 100%;
  background-color: #ddd;
  border-radius: 2px;
}

.price-range-selected {
  position: absolute;
  height: 100%;
  background-color: #007bff;
  border-radius: 2px;
}

.price-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #007bff;
  border: 2px solid #fff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  z-index: 10;
  touch-action: none;
}

.min-handle {
  z-index: 11;
}

.price-handle:hover {
  transform: translate(-50%, -50%) scale(1.1);
}

.price-handle:active {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
}

.price-display {
  text-align: center;
  font-size: 0.9rem;
  color: #666;
}

.color-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.color-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.color-swatch {
  width: 25px;
  height: 25px;
  border-radius: 50%;
  border: 1px solid #ddd;
  transition: transform 0.2s ease;
}

.color-option.active .color-swatch {
  transform: scale(1.2);
  border: 2px solid #000;
}

.color-option span {
  font-size: 0.8rem;
  color: #666;
}

.see-more button {
  background: none;
  border: none;
  color: #007bff;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  margin-top: 0.5rem;
}

.see-more button:hover {
  text-decoration: underline;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 0;
}

.loader {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #333;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
  padding: 1rem;
  margin: 2rem 0;
  border-left: 3px solid #dc3545;
}

.no-products {
  text-align: center;
  padding: 4rem 0;
  color: #666;
}

.products-container {
  flex: 1;
  width: 100%;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  width: 100%;
}

.products-grid.minimal-view {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.minimal-card .product-image {
  aspect-ratio: 1/1;
  margin-bottom: 0;
}

.debug-info {
  margin-top: 1rem;
  padding: 0.5rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #666;
}

.product-card {
  cursor: pointer;
  transition: transform 0.3s ease;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3/4;
  background-color: #f9f9f9;
  margin-bottom: 1rem;
}

.wishlist-button {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 2;
}

.wishlist-button:hover {
  background-color: rgba(255, 255, 255, 1);
}

.wishlist-button.active {
  background-color: rgba(255, 0, 0, 0.1);
}

.wishlist-button.active .material-icons {
  color: #ff0000;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #111;
  color: #fff;
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.product-info {
  padding: 0.5rem 0;
}

.product-name {
  font-size: 1rem;
  font-weight: 400;
  margin-bottom: 0.5rem;
  color: #333;
}

.product-price {
  display: flex;
  flex-direction: column;
}

.price-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.original-price {
  color: #999;
  text-decoration: line-through;
  font-size: 0.9rem;
}

.discount-percentage {
  background-color: #000;
  color: white;
  padding: 2px 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.discounted-price {
  font-weight: 600;
  color: #111;
  font-size: 1.1rem;
}

.current-price {
  font-weight: 500;
  color: #111;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 3rem;
  gap: 1rem;
}

.pagination-button {
  background: none;
  border: 1px solid #ddd;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-button:hover:not(:disabled) {
  background-color: #f5f5f5;
}

.pagination-button:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-number {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  background: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-number:hover:not(.active) {
  background-color: #f5f5f5;
}

.page-number.active {
  background-color: #111;
  color: #fff;
  border-color: #111;
}

@media (max-width: 768px) {
  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .view-filter-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .category-content {
    flex-direction: column;
  }
  
  .filter-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #eee;
    padding-right: 0;
    padding-bottom: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
  
  .products-grid.minimal-view {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>
