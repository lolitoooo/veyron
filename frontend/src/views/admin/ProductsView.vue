<template>
  <div class="admin-products">
    <div class="products-header">
      <h1>Gestion des produits</h1>
      <router-link to="/admin/products/create" class="btn-primary">
        <span class="material-icons">add</span> Ajouter un produit
      </router-link>
    </div>

    <div class="filters-bar">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Rechercher un produit..." 
          @input="handleSearch"
        >
        <span class="material-icons">search</span>
      </div>
      
      <div class="filters">
        <select v-model="categoryFilter" @change="applyFilters">
          <option value="">Toutes les catégories</option>
          <option value="homme">Homme</option>
          <option value="femme">Femme</option>
          <option value="accessoires">Accessoires</option>
          <option value="collections">Collections</option>
        </select>
        
        <select v-model="stockFilter" @change="applyFilters">
          <option value="">Tous les stocks</option>
          <option value="in-stock">En stock</option>
          <option value="low-stock">Stock faible</option>
          <option value="out-of-stock">Rupture de stock</option>
        </select>
        
        <select v-model="sortOption" @change="applyFilters">
          <option value="newest">Plus récents</option>
          <option value="name-asc">Nom (A-Z)</option>
          <option value="name-desc">Nom (Z-A)</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement des produits...</p>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="filteredProducts.length === 0" class="empty-state">
      <span class="material-icons">inventory</span>
      <p>{{ searchQuery || categoryFilter || stockFilter ? 'Aucun produit ne correspond à votre recherche' : 'Aucun produit disponible. Cliquez sur "Ajouter un produit" pour commencer.' }}</p>
    </div>

    <div v-else class="products-table-container">
      <table class="products-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Prix</th>
            <th>Stock</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in paginatedProducts" :key="product.id">
            <td class="product-image">
              <img :src="getImageUrl(product.images[0].url)" :alt="product.name" v-if="product.images && product.images.length > 0">
              <div class="no-image" v-else>Pas d'image</div>
            </td>
            <td class="product-name">{{ product.name }}</td>
            <td>{{ getCategoryLabel(product.category) }}</td>
            <td>{{ formatPrice(product.price) }}</td>
            <td>
              <span :class="getStockClass(product.stock)">{{ product.stock }}</span>
            </td>
            <td>
              <span :class="['status-badge', product.isActive ? 'status-active' : 'status-inactive']">
                {{ product.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="actions">
              <button class="btn-icon" @click="editProduct(product._id)" title="Modifier">
                <span class="material-icons">edit</span>
              </button>
              <button class="btn-icon" @click="toggleProductStatus(product)" :title="product.isActive ? 'Archiver' : 'Activer'">
                <span class="material-icons">{{ product.isActive ? 'visibility' : 'visibility_off' }}</span>
              </button>
              <button class="btn-icon delete" @click="confirmDelete(product)" title="Supprimer">
                <span class="material-icons">delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="pagination-btn" 
        :disabled="currentPage === 1" 
        @click="changePage(currentPage - 1)">
        <i class="fas fa-chevron-left"></i>
      </button>
      
      <button 
        v-for="page in displayedPages" 
        :key="page" 
        class="pagination-btn" 
        :class="{ active: currentPage === page }" 
        @click="changePage(page)">
        {{ page }}
      </button>
      
      <button 
        class="pagination-btn" 
        :disabled="currentPage === totalPages" 
        @click="changePage(currentPage + 1)">
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>
    
    <div class="modal" v-if="showDeleteModal">
      <div class="modal-content">
        <h3>Confirmer la suppression</h3>
        <p>Êtes-vous sûr de vouloir supprimer le produit <strong>{{ productToDelete?.name }}</strong> ?</p>
        <p class="warning">Cette action est irréversible.</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="cancelDelete">Annuler</button>
          <button class="btn-danger" @click="deleteProduct">Supprimer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/apiService';
import { getImageUrl } from '@/utils/imageUrl';

const router = useRouter();

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  isActive: boolean;
  discount: number;
  images: Array<{ url: string, alt?: string, isMain?: boolean }>;
  createdAt: string;
}

const products = ref<Product[]>([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const categoryFilter = ref('');
const stockFilter = ref('');
const sortOption = ref('newest');
const currentPage = ref(1);
const itemsPerPage = 10;
const showDeleteModal = ref(false);
const productToDelete = ref<Product | null>(null);

const filteredProducts = computed(() => {
  let result = [...products.value];
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(product => 
      product.name.toLowerCase().includes(query) || 
      product.description.toLowerCase().includes(query)
    );
  }
  
  if (categoryFilter.value) {
    result = result.filter(product => product.category === categoryFilter.value);
  }
  
  if (stockFilter.value) {
    switch (stockFilter.value) {
      case 'in-stock':
        result = result.filter(product => product.stock > 10);
        break;
      case 'low-stock':
        result = result.filter(product => product.stock > 0 && product.stock <= 10);
        break;
      case 'out-of-stock':
        result = result.filter(product => product.stock === 0);
        break;
    }
  }
  
  switch (sortOption.value) {
    case 'name-asc':
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      result.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'newest':
    default:
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }
  
  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage);
});

const paginatedProducts = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return filteredProducts.value.slice(startIndex, endIndex);
});

const displayedPages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;
  
  if (totalPages.value <= maxVisiblePages) {
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i);
    }
  } else {
    let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    
    if (endPage > totalPages.value) {
      endPage = totalPages.value;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
  }
  
  return pages;
});

const handleSearch = () => {
  currentPage.value = 1;
};

const applyFilters = () => {
  currentPage.value = 1;
};

const changePage = (page: number) => {
  currentPage.value = page;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const fetchProducts = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const response = await api.get('/products?showAll=true');
    
    if (response.data && Array.isArray(response.data)) {
      products.value = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      products.value = response.data.data;
    } else if (response.data && typeof response.data === 'object') {
      products.value = [];
      console.warn('Format de réponse API inattendu:', response.data);
    } else {
      products.value = [];
    }
  } catch (err: any) {
    console.error('Erreur lors du chargement des produits:', err);
    error.value = err.message || 'Erreur lors du chargement des produits';
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'homme': return 'Homme';
    case 'femme': return 'Femme';
    case 'accessoires': return 'Accessoires';
    case 'collections': return 'Collections';
    default: return category;
  }
};

const getStockClass = (stock: number): string => {
  if (stock === 0) return 'stock-out';
  if (stock <= 10) return 'stock-low';
  return 'stock-ok';
};

const editProduct = (productId: string) => {
  router.push(`/admin/products/${productId}/edit`);
};

const toggleProductStatus = async (product: Product) => {
  try {
    await api.put(`/products/${product._id}`, { isActive: !product.isActive });
    
    product.isActive = !product.isActive;
    
  } catch (err: any) {
    console.error('Erreur lors de la modification du statut:', err);
    error.value = err.message || 'Erreur lors de la modification du statut';
  }
};

const confirmDelete = (product: Product) => {
  productToDelete.value = product;
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  productToDelete.value = null;
};

const deleteProduct = async () => {
  if (!productToDelete.value) return;
  
  try {
    await api.delete(`/products/${productToDelete.value._id}`);
    
    products.value = products.value.filter(p => p._id !== productToDelete.value?._id);
    
    showDeleteModal.value = false;
    productToDelete.value = null;
    
  } catch (err: any) {
    console.error('Erreur lors de la suppression:', err);
    error.value = err.message || 'Erreur lors de la suppression du produit';
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
.admin-products {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.products-header h1 {
  font-size: 2rem;
  font-weight: 300;
  margin: 0;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1565c0;
}

.filters-bar {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  height: 42px;
  box-sizing: border-box;
}

.search-box .material-icons {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 20px;
}

.filters {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filters select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
  min-width: 150px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #666;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ccc;
}

.products-table-container {
  overflow-x: auto;
  margin-bottom: 1.5rem;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.products-table th,
.products-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.products-table th {
  background-color: #f9f9f9;
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.products-table tbody tr:hover {
  background-color: #f5f5f5;
}

.product-image {
  width: 60px;
}

.product-image img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.no-image {
  width: 50px;
  height: 50px;
  background-color: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #999;
  text-align: center;
}

.product-name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stock-ok {
  color: #388e3c;
}

.stock-low {
  color: #f57c00;
}

.stock-out {
  color: #d32f2f;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-active {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-inactive {
  background-color: #f5f5f5;
  color: #757575;
}

.actions {
  white-space: nowrap;
}

.btn-icon {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
  margin: 0 0.25rem;
  transition: color 0.2s;
}

.btn-icon:hover {
  color: #000;
}

.btn-icon.delete:hover {
  color: #d32f2f;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  gap: 0.5rem;
}

.pagination-btn {
  min-width: 40px;
  height: 40px;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.pagination-btn.active {
  background-color: #1976d2;
  color: white;
  border-color: #1976d2;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 500;
}

.modal-content p {
  margin-bottom: 1.5rem;
}

.modal-content p.warning {
  color: #d32f2f;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

.btn-danger {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background-color: #b71c1c;
}

@media (max-width: 768px) {
  .products-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .filters-bar {
    flex-direction: column;
  }
  
  .search-box {
    width: 100%;
  }
  
  .filters {
    width: 100%;
  }
  
  .products-table th:nth-child(3),
  .products-table td:nth-child(3),
  .products-table th:nth-child(5),
  .products-table td:nth-child(5) {
    display: none;
  }
}
</style>
