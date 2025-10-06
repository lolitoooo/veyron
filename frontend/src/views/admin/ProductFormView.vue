<template>
  <div class="product-form-container">
    <div class="admin-header">
      <h1>{{ isEditMode ? 'Modifier le produit' : 'Créer un produit' }}</h1>
      <button class="btn btn-secondary" @click="goBack">Retour</button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement en cours...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <form v-else @submit.prevent="saveProduct" class="product-form">
      <div class="form-section">
        <h2>Informations générales</h2>
        
        <div class="form-group">
          <label for="name">Nom du produit*</label>
          <input 
            type="text" 
            id="name" 
            v-model="product.name" 
            required 
            placeholder="Nom du produit"
          />
        </div>
        
        <div class="form-group">
          <label for="description">Description*</label>
          <textarea 
            id="description" 
            v-model="product.description" 
            rows="4" 
            required 
            placeholder="Description détaillée du produit"
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="price">Prix de base (€)*</label>
            <input 
              type="number" 
              id="price" 
              v-model.number="product.price" 
              step="0.01" 
              min="0" 
              required 
              placeholder="0.00"
              @input="calculateFromBasePrice"
            />
          </div>
          
          <div class="form-group">
            <label for="discount">Remise (%)</label>
            <input 
              type="number" 
              id="discount" 
              v-model.number="product.discount" 
              step="0.01"
              min="0" 
              max="100" 
              placeholder="0.00"
              @input="calculateFromDiscount"
            />
          </div>
          
          <div class="form-group">
            <label for="finalPrice">Prix après remise (€)</label>
            <input 
              type="number" 
              id="finalPrice" 
              v-model.number="finalPrice" 
              step="0.01"
              min="0" 
              placeholder="0.00"
              @input="calculateFromFinalPrice"
            />
          </div>
        </div>
        
        <div class="form-group">
          <label for="category">Catégorie*</label>
          <select id="category" v-model="product.category" required>
            <option value="" disabled>Sélectionner une catégorie</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category.name   }}
            </option>
          </select>
        </div>
        
        <div class="form-group checkbox-group">
          <input type="checkbox" id="active" v-model="product.active" />
          <label for="active">Produit actif</label>
        </div>
      </div>
      
      <div class="form-section">
        <h2>Tailles disponibles</h2>
        <p class="section-description">Sélectionnez les tailles disponibles pour ce produit</p>
        
        <div class="sizes-container">
          <div 
            v-for="size in availableSizes" 
            :key="size" 
            class="size-checkbox-group"
          >
            <input 
              type="checkbox" 
              :id="`size-${size}`" 
              :value="size" 
              v-model="product.sizes" 
            />
            <label :for="`size-${size}`">{{ size }}</label>
          </div>
        </div>
      </div>
      
      <div class="form-section">
        <h2>Couleurs disponibles</h2>
        <p class="section-description">Ajoutez les différentes couleurs disponibles pour ce produit</p>
        
        <div class="colors-list">
          <div 
            v-for="(color, index) in product.colors" 
            :key="index" 
            class="color-item"
          >
            <div class="color-header">
              <h3>Couleur #{{ index + 1 }}</h3>
              <button 
                type="button" 
                class="btn-icon remove-color" 
                @click="removeColor(index)"
                title="Supprimer cette couleur"
              >
                <span class="material-icons">delete</span>
              </button>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label :for="`color-name-${index}`">Nom de la couleur*</label>
                <input 
                  type="text" 
                  :id="`color-name-${index}`" 
                  v-model="color.name" 
                  required 
                  placeholder="ex: Noir, Blanc, Rouge..."
                />
              </div>
              
              <div class="form-group">
                <label :for="`color-code-${index}`">Code couleur (hex)*</label>
                <div class="color-picker-container">
                  <input 
                    type="color" 
                    :id="`color-code-${index}`" 
                    v-model="color.code" 
                    required 
                  />
                  <input 
                    type="text" 
                    v-model="color.code" 
                    required 
                    placeholder="#000000"
                    class="color-code-input"
                  />
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label>Images pour cette couleur</label>
              <div class="image-upload-container">
                <div class="image-preview-container">
                  <div 
                    v-for="(image, imageIndex) in color.images" 
                    :key="imageIndex" 
                    class="image-preview"
                  >
                    <img :src="getImageUrl(image.url)" alt="Aperçu du produit" />
                    <button 
                      type="button" 
                      class="remove-image" 
                      @click="removeColorImage(index, imageIndex)"
                    >
                      &times;
                    </button>
                    <div class="image-actions">
                      <label class="main-image-checkbox">
                        <input 
                          type="radio" 
                          :name="`main-image-${index}`" 
                          :checked="image.isMain" 
                          @change="setMainImage(index, imageIndex)" 
                        />
                        Image principale
                      </label>
                    </div>
                  </div>
                  
                  <div 
                    v-if="color.images.length < 5" 
                    class="image-upload-box"
                    @click="(event) => triggerColorFileInput(event, index)"
                  >
                    <input 
                      type="file" 
                      class="color-file-input"
                      accept="image/*" 
                      @change="(event) => handleColorImageUpload(event, index)" 
                      style="display: none;"
                    />
                    <span class="upload-icon">+</span>
                    <span>Ajouter une image</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            type="button" 
            class="btn btn-outline" 
            @click="addColor"
          >
            <span class="material-icons">add</span> Ajouter une couleur
          </button>
        </div>
      </div>
      
      <div class="form-section">
        <h2>Gestion des stocks par variante</h2>
        <p class="section-description">Définissez le stock disponible pour chaque combinaison taille/couleur</p>
        
        <div class="variants-table-container">
          <table class="variants-table" v-if="product.sizes.length > 0 && product.colors.length > 0">
            <thead>
              <tr>
                <th>Taille</th>
                <th>Couleur</th>
                <th>Stock</th>
                <th>Prix spécifique (optionnel)</th>
                <th>Référence (SKU)</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="(variant, index) in productVariants" 
                :key="index"
              >
                <td>{{ variant.size }}</td>
                <td>
                  <div class="color-display">
                    <span 
                      class="color-dot" 
                      :style="{ backgroundColor: getColorCode(variant.color) }"
                    ></span>
                    {{ variant.color }}
                  </div>
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="variant.stock" 
                    min="0" 
                    placeholder="0"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    v-model.number="variant.price" 
                    step="0.01" 
                    min="0" 
                    placeholder="Prix de base"
                  />
                </td>
                <td>
                  <input 
                    type="text" 
                    v-model="variant.sku" 
                    placeholder="Référence"
                  />
                </td>
              </tr>
            </tbody>
          </table>
          
          <div v-else class="no-variants-message">
            <p>Veuillez sélectionner au moins une taille et ajouter au moins une couleur pour gérer les stocks par variante.</p>
          </div>
        </div>
      </div>
      
      <div class="form-section">
        <h2>Images générales du produit (optionnel)</h2>
        <p class="section-description">Ces images seront utilisées si aucune couleur spécifique n'est sélectionnée</p>
        
        <div class="image-upload-container">
          <div class="image-preview-container">
            <div 
              v-for="(image, index) in product.images" 
              :key="index" 
              class="image-preview"
            >
              <img :src="getImageUrl(image)" alt="Aperçu du produit" />
              <button 
                type="button" 
                class="remove-image" 
                @click="removeImage(index)"
              >
                &times;
              </button>
            </div>
            
            <div 
              v-if="product.images.length < 5" 
              class="image-upload-box"
              @click="triggerFileInput"
            >
              <input 
                type="file" 
                ref="fileInput" 
                accept="image/*" 
                @change="handleImageUpload" 
                style="display: none;"
              />
              <span class="upload-icon">+</span>
              <span>Ajouter une image</span>
            </div>
          </div>
          
          <p class="image-help-text">
            Formats acceptés: JPG, PNG. Taille max: 2MB. 
            Vous pouvez ajouter jusqu'à 5 images.
          </p>
          
          <div v-if="uploadError" class="upload-error">
            {{ uploadError }}
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn btn-secondary" @click="goBack">Annuler</button>
        <button type="submit" class="btn btn-primary" :disabled="isSaving">
          <span v-if="isSaving" class="spinner-small"></span>
          {{ isEditMode ? 'Mettre à jour' : 'Créer' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/apiService';
import { getImageUrl as baseGetImageUrl } from '@/utils/imageUrl';

interface Image {
  url: string;
  alt?: string;
  isMain?: boolean;
}

interface ColorVariant {
  name: string;
  code: string;
  images: Image[];
}

interface ProductVariant {
  size: string;
  color: string;
  stock: number;
  price?: number;
  sku?: string;
}

interface Product {
  _id?: string;
  name: string;
  description: string;
  price: number;
  discount?: number;
  category: string;
  brand: string;
  stock: number;
  images: string[];
  active: boolean;
  sizes: string[];
  colors: ColorVariant[];
  variants: ProductVariant[];
}

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const isSaving = ref(false);
const error = ref<string | null>(null);
const productId = computed(() => route.params.id as string | undefined);
const isEditMode = computed(() => !!productId.value);
const categories = ref<string[]>([]);
const uploadError = ref<string | null>(null);
const finalPrice = ref(0);

const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Unique'];

const product = ref<Product>({
  name: '',
  description: '',
  price: 0,
  discount: 0,
  category: '',
  brand: 'VEYRON',
  stock: 0,
  images: [],
  active: true,
  sizes: [],
  colors: [],
  variants: []
});

const fileInput = ref<HTMLInputElement | null>(null);

const productVariants = computed(() => {
  const variants: ProductVariant[] = [];
  
  if (product.value.sizes.length === 0 || product.value.colors.length === 0) {
    return variants;
  }
  
  product.value.sizes.forEach(size => {
    product.value.colors.forEach(color => {
      const existingVariant = product.value.variants.find(
        v => v.size === size && v.color === color.name
      );
      
      if (existingVariant) {
        variants.push(existingVariant);
      } else {
        variants.push({
          size,
          color: color.name,
          stock: 0,
          price: undefined,
          sku: `${product.value.name.substring(0, 3).toUpperCase()}-${color.name.substring(0, 3).toUpperCase()}-${size}`
        });
      }
    });
  });
  
  return variants;
});

watch(productVariants, (newVariants) => {
  if (JSON.stringify(newVariants) !== JSON.stringify(product.value.variants)) {
    product.value.variants = [...newVariants];
  }
}, { deep: true });

function calculateFromBasePrice() {
  if (product.value.price >= 0 && product.value.discount >= 0) {
    const discount = Math.min(100, Math.max(0, product.value.discount));
    const discountFactor = (100 - discount) / 100;
    finalPrice.value = parseFloat((product.value.price * discountFactor).toFixed(2));
  }
}

function calculateFromFinalPrice() {
  if (product.value.price > 0 && finalPrice.value >= 0) {
    if (finalPrice.value >= product.value.price) {
      product.value.discount = 0;
      finalPrice.value = product.value.price;
    } else {
      const discountPercent = ((product.value.price - finalPrice.value) / product.value.price) * 100;
      product.value.discount = parseFloat(discountPercent.toFixed(2));
    }
  }
}

function calculateFromDiscount() {
  calculateFromBasePrice();
}

function calculateTotalStock() {
  if (!product.value.variants || product.value.variants.length === 0) {
    return product.value.stock || 0;
  }
  
  return product.value.variants.reduce((total, variant) => {
    return total + (variant.stock || 0);
  }, 0);
}

onMounted(async () => {
  await fetchCategories();
  
  if (isEditMode.value) {
    await fetchProduct();
  } else {
    addColor();
  }
  
  calculateFromBasePrice();
});

async function fetchCategories() {
  try {
    const response = await api.get('/categories');
    categories.value = response.data.data || response.data;
  } catch (err) {
    console.error('Erreur lors du chargement des catégories:', err);
  }
}

async function fetchProduct() {
  loading.value = true;
  error.value = null;
  
  if (!productId.value) {
    error.value = "ID du produit non défini";
    loading.value = false;
    return;
  }
  
  try {
    const response = await api.get(`/products/${productId.value}`);
    const productData = response.data.data || response.data;
    
    product.value = {
      ...productData,
      active: productData.isActive || false,
      sizes: productData.sizes || ['Unique'],
      colors: productData.colors || [],
      variants: productData.variants || []
    };
    
    if (product.value.discountPrice) {
      finalPrice.value = product.value.discountPrice;
    } else {
      calculateFromBasePrice();
    }
    
    if (product.value.colors.length === 0) {
      addColor();
    }
    
    if (product.value.variants.length === 0) {
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement du produit:', err);
    error.value = err.message || 'Erreur lors du chargement du produit';
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push({ name: 'admin-products' });
}
function addColor() {
  product.value.colors.push({
    name: '',
    code: '#000000',
    images: []
  });
}

function removeColor(index: number) {
  const colorName = product.value.colors[index].name;
  product.value.colors.splice(index, 1);
  
  product.value.variants = product.value.variants.filter(v => v.color !== colorName);
}

function getColorCode(colorName: string): string {
  const color = product.value.colors.find(c => c.name === colorName);
  return color ? color.code : '#000000';
}

function triggerColorFileInput(event: Event, colorIndex: number) {
  const parent = (event.currentTarget as HTMLElement);
  const input = parent.querySelector('.color-file-input') as HTMLInputElement;
  if (input) {
    input.click();
  }
}

async function handleColorImageUpload(event: Event, colorIndex: number) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  uploadError.value = null;
  
  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = 'L\'image est trop volumineuse. Taille maximale: 2MB';
    return;
  }
  
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    uploadError.value = 'Format non supporté. Utilisez JPG ou PNG.';
    return;
  }
  
  try {    
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    const imageUrl = response.data.data.url;
    
    if (!product.value.colors[colorIndex].images) {
      product.value.colors[colorIndex].images = [];
    }
    
    const isFirstImage = product.value.colors[colorIndex].images.length === 0;
    
    product.value.colors[colorIndex].images.push({
      url: imageUrl,
      alt: `${product.value.name} - ${product.value.colors[colorIndex].name}`,
      isMain: isFirstImage
    });
    
    target.value = '';
  } catch (err: any) {
    uploadError.value = err.message || 'Erreur lors de l\'upload de l\'image';
  }
}

function removeColorImage(colorIndex: number, imageIndex: number) {
  const images = product.value.colors[colorIndex].images;
  const removedImage = images[imageIndex];
  
  images.splice(imageIndex, 1);
  
  if (removedImage.isMain && images.length > 0) {
    images[0].isMain = true;
  }
}

function setMainImage(colorIndex: number, imageIndex: number) {
  product.value.colors[colorIndex].images.forEach((img, idx) => {
    img.isMain = idx === imageIndex;
  });
}

function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

async function handleImageUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  
  const file = target.files[0];
  uploadError.value = null;
  
  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = 'L\'image est trop volumineuse. Taille maximale: 2MB';
    return;
  }
  
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    uploadError.value = 'Format non supporté. Utilisez JPG ou PNG.';
    return;
  }
  
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    const imageUrl = response.data.data.url;
    
    if (!product.value.images) {
      product.value.images = [];
    }
    
    const newImage = {
      url: imageUrl,
      alt: product.value.name || 'Image produit',
      isMain: product.value.images.length === 0
    };
    
    product.value.images.push(newImage);
    
    if (fileInput.value) fileInput.value.value = '';
  } catch (err: any) {
    uploadError.value = err.message || 'Erreur lors de l\'upload de l\'image';
  }
}

function removeImage(index: number) {
  product.value.images.splice(index, 1);
}

function getImageUrl(imagePath: string | any) {
  if (!imagePath) {
    console.warn('URL d\'image non définie');
    return '';
  }
  
  if (typeof imagePath !== 'string') {
    if (imagePath && typeof imagePath === 'object' && 'url' in imagePath) {
      imagePath = imagePath.url;
    } else {
      console.warn('Format d\'image invalide:', imagePath);
      return '';
    }
  }
  
  return baseGetImageUrl(imagePath);
}

function convertUrlToRelativePath(url: string | { url: string }): string | { url: string, alt?: string, isMain?: boolean } {
  if (typeof url === 'object' && url !== null && 'url' in url) {
    return url;
  }
  
  if (typeof url !== 'string' || !url) return '';
  
  if (url.startsWith('/images/')) return url;
  
  if (!url.startsWith('http') && !url.startsWith('/images/')) {
    const filename = url.split('/').pop();
    return `/images/${filename}`;
  }
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const filename = pathParts[pathParts.length - 1];
    
    return `/images/${filename}`;
  } catch (err) {
    console.error('Erreur lors de la conversion d\'URL:', err);
    const filename = url.split('/').pop();
    return `/images/${filename}`;
  }
}

async function saveProduct() {
  isSaving.value = true;
  error.value = null;
  
  try {
    const totalStock = calculateTotalStock();
    
    const productCopy = JSON.parse(JSON.stringify(product.value));
        
    if (!productCopy.images) {
      productCopy.images = [];
    }
    
    if (productCopy.images && productCopy.images.length > 0) {
      productCopy.images = productCopy.images.map(img => {
        if (typeof img === 'object' && img !== null && 'url' in img) {
          const relativePath = convertUrlToRelativePath(img.url);
          return {
            ...img,
            url: typeof relativePath === 'string' ? relativePath : relativePath.url
          };
        } 
        else if (typeof img === 'string') {
          const relativePath = convertUrlToRelativePath(img);
          return {
            url: typeof relativePath === 'string' ? relativePath : relativePath.url,
            alt: productCopy.name || 'Image produit',
            isMain: false
          };
        }
        return img;
      });
      
      const hasMainImage = productCopy.images.some(img => img.isMain);
      if (!hasMainImage && productCopy.images.length > 0) {
        productCopy.images[0].isMain = true;
      }
    }
    
    if (productCopy.colors && productCopy.colors.length > 0) {
      productCopy.colors.forEach(color => {
        if (color.images && color.images.length > 0) {
          color.images = color.images.map(img => {
            if (typeof img === 'object' && img !== null && 'url' in img) {
              const relativePath = convertUrlToRelativePath(img.url);
              return {
                ...img,
                url: typeof relativePath === 'string' ? relativePath : relativePath.url
              };
            }
            return img;
          });
          
          const hasMainImage = color.images.some(img => img.isMain);
          if (!hasMainImage && color.images.length > 0) {
            color.images[0].isMain = true;
          }
        }
      });
    }
    
    if (productCopy.discount && productCopy.discount > 0) {
      productCopy.discountPrice = finalPrice.value;
    } else {
      productCopy.discountPrice = undefined;
    }
    
    const productData = {
      ...productCopy,
      stock: totalStock,
      isActive: productCopy.active
    };
        
    let response;
    if (isEditMode.value) {
      response = await api.put(`/products/${productId.value}`, productData);
    } else {
      response = await api.post('/products', productData);
    }
        
    router.push({ 
      name: 'admin-products',
      query: { success: isEditMode.value ? 'updated' : 'created' }
    });
  } catch (err: any) {
    console.error('Erreur lors de la sauvegarde du produit:', err);
    error.value = err.message || 'Erreur lors de la sauvegarde du produit';
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.product-form-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-spinner, .spinner-small {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0 8px 0 0;
  display: inline-block;
  vertical-align: middle;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #ffebee;
  color: #d32f2f;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.product-form {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

.form-section h2 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
}

.section-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

input[type="text"],
input[type="number"],
textarea,
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input[type="text"]:focus,
input[type="number"]:focus,
textarea:focus,
select:focus {
  border-color: #1976d2;
  outline: none;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.checkbox-group label {
  margin-bottom: 0;
  cursor: pointer;
}

.sizes-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.size-checkbox-group {
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.size-checkbox-group:hover {
  background-color: #e0e0e0;
}

.size-checkbox-group input[type="checkbox"] {
  margin-right: 0.5rem;
}

.colors-list {
  margin-bottom: 1.5rem;
}

.color-item {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.color-header h3 {
  font-size: 1.1rem;
  margin: 0;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.remove-color {
  color: #d32f2f;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

input[type="color"] {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.color-code-input {
  flex: 1;
}

.variants-table-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.variants-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.variants-table th,
.variants-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.variants-table th {
  background-color: #f5f5f5;
  font-weight: 500;
}

.variants-table input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.color-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.no-variants-message {
  background-color: #f5f5f5;
  padding: 1.5rem;
  border-radius: 4px;
  text-align: center;
  color: #666;
}

.image-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 0.25rem;
  font-size: 0.8rem;
  display: flex;
  justify-content: center;
}

.main-image-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  font-size: 0.7rem;
  margin: 0;
}

.main-image-checkbox input {
  margin: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
  border: none;
}

.btn-primary:hover {
  background-color: #1565c0;
}

.btn-primary:disabled {
  background-color: #90caf9;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #1976d2;
  color: #1976d2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-outline:hover {
  background-color: rgba(25, 118, 210, 0.05);
}

.image-upload-container {
  margin-top: 0.5rem;
}

.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.image-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  border: none;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-upload-box {
  width: 100px;
  height: 100px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.2s;
}

.image-upload-box:hover {
  border-color: #1976d2;
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 5px;
  color: #666;
}

.image-help-text {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
}

.upload-error {
  color: #d32f2f;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .image-preview-container {
    justify-content: center;
  }
  
  .variants-table th,
  .variants-table td {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
}
</style>
