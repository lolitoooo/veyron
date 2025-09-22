<template>
  <div class="categories-container">
    <div class="admin-header">
      <h1>Gestion des catégories</h1>
      <button class="btn btn-primary" @click="openAddModal">
        Ajouter une catégorie
      </button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement en cours...</p>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else class="categories-content">
      <div v-if="categories.length === 0" class="empty-state">
        <p>Aucune catégorie n'a été créée.</p>
      </div>
      
      <div v-else class="categories-table-container">
        <table class="categories-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Nombre de produits</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="category in categories" :key="category.id">
              <td>{{ category.name }}</td>
              <td>{{ category.slug }}</td>
              <td>{{ category.productCount }}</td>
              <td class="actions">
                <button 
                  class="btn-icon edit" 
                  @click="editCategory(category)"
                  title="Modifier"
                >
                  <i class="material-icons">edit</i>
                </button>
                <button 
                  class="btn-icon delete" 
                  @click="confirmDelete(category)"
                  title="Supprimer"
                >
                  <i class="material-icons">delete</i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  
  <div v-if="showAddModal" class="modal">
    <div class="modal-content">
      <h3>Ajouter une catégorie</h3>
      
      <form @submit.prevent="addCategory">
        <div class="form-group">
          <label for="categoryName">Nom de la catégorie*</label>
          <input 
            type="text" 
            id="categoryName" 
            v-model="newCategory.name" 
            required 
            placeholder="Nom de la catégorie"
          />
        </div>
        
        <div class="form-group">
          <label for="categorySlug">Slug*</label>
          <input 
            type="text" 
            id="categorySlug" 
            v-model="newCategory.slug" 
            required 
            placeholder="slug-de-la-categorie"
          />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="closeModals">Annuler</button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  
  <div v-if="showEditModal" class="modal">
    <div class="modal-content">
      <h3>Modifier la catégorie</h3>
      
      <form @submit.prevent="updateCategory">
        <div class="form-group">
          <label for="editCategoryName">Nom de la catégorie*</label>
          <input 
            type="text" 
            id="editCategoryName" 
            v-model="editingCategory.name" 
            required 
            placeholder="Nom de la catégorie"
          />
        </div>
        
        <div class="form-group">
          <label for="editCategorySlug">Slug*</label>
          <input 
            type="text" 
            id="editCategorySlug" 
            v-model="editingCategory.slug" 
            required 
            placeholder="slug-de-la-categorie"
          />
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" @click="closeModals">Annuler</button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
  
  <div v-if="showDeleteModal" class="modal">
    <div class="modal-content">
      <h3>Confirmer la suppression</h3>
      
      <p>
        Êtes-vous sûr de vouloir supprimer la catégorie <strong>{{ categoryToDelete?.name }}</strong> ?
      </p>
      
      <p class="warning" v-if="categoryToDelete && categoryToDelete.productCount > 0">
        Attention : Cette catégorie contient {{ categoryToDelete.productCount }} produit(s). 
        La suppression de cette catégorie affectera ces produits.
      </p>
      
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" @click="closeModals">Annuler</button>
        <button 
          type="button" 
          class="btn btn-danger" 
          @click="deleteCategory"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Suppression...' : 'Supprimer' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/apiService';

interface Category {
  id?: string;
  name: string;
  slug: string;
  productCount?: number;
}

const loading = ref(false);
const error = ref<string | null>(null);
const categories = ref<Category[]>([]);
const isSubmitting = ref(false);
const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);

const newCategory = ref<Category>({ name: '', slug: '' });
const editingCategory = ref<Category>({ name: '', slug: '' });
const categoryToDelete = ref<Category | null>(null);
onMounted(() => {
  fetchCategories();
});

const fetchCategories = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Utilisation de la nouvelle route qui inclut le nombre de produits par catégorie
    const response = await api.get('/categories/with-product-count');
    categories.value = response.data.map((cat: any) => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      featured: cat.featured,
      active: cat.active,
      productCount: cat.productCount || 0
    }));
  } catch (err: any) {
    console.error('Erreur lors du chargement des catégories:', err);
    error.value = err.message || 'Erreur lors du chargement des catégories';
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  newCategory.value = { name: '', slug: '' };
  showAddModal.value = true;
};

const editCategory = (category: Category) => {
  editingCategory.value = { ...category };
  showEditModal.value = true;
};

const confirmDelete = (category: Category) => {
  categoryToDelete.value = category;
  showDeleteModal.value = true;
};

const closeModals = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showDeleteModal.value = false;
  newCategory.value = { name: '', slug: '' };
  editingCategory.value = { name: '', slug: '' };
  categoryToDelete.value = null;
};

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const addCategory = async () => {
  isSubmitting.value = true;
  
  try {
    const response = await api.post('/categories', newCategory.value);
    categories.value.push(response.data);
    closeModals();
  } catch (err: any) {
    console.error('Erreur lors de l\'ajout de la catégorie:', err);
    error.value = err.message || 'Erreur lors de l\'ajout de la catégorie';
  } finally {
    isSubmitting.value = false;
  }
};

const updateCategory = async () => {
  isSubmitting.value = true;
  
  try {
    if (!editingCategory.value.slug) {
      editingCategory.value.slug = generateSlug(editingCategory.value.name);
    }
    
    const response = await api.put(`/categories/${editingCategory.value.id}`, editingCategory.value);
    
    const index = categories.value.findIndex(c => c.id === editingCategory.value.id);
    if (index !== -1) {
      categories.value[index] = {
        id: response.data._id,
        name: response.data.name,
        slug: response.data.slug,
        description: response.data.description,
        image: response.data.image,
        featured: response.data.featured,
        active: response.data.active,
        productCount: categories.value[index].productCount
      };
    }
    
    closeModals();
  } catch (err: any) {
    console.error('Erreur lors de la mise à jour de la catégorie:', err);
    error.value = err.message || 'Erreur lors de la mise à jour de la catégorie';
  } finally {
    isSubmitting.value = false;
  }
};

const deleteCategory = async () => {
  if (!categoryToDelete.value?.id) return;
  
  isSubmitting.value = true;
  
  try {
    await api.delete(`/categories/${categoryToDelete.value.id}`);
    
    categories.value = categories.value.filter(c => c.id !== categoryToDelete.value?.id);
    
    closeModals();
  } catch (err: any) {
    console.error('Erreur lors de la suppression de la catégorie:', err);
    error.value = err.response?.data?.message || err.message || 'Erreur lors de la suppression de la catégorie';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.categories-container {
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
  color: #d32f2f;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #757575;
}

.categories-table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.categories-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
}

.categories-table th,
.categories-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.categories-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.categories-table tr:hover {
  background-color: #f9f9f9;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-icon.edit:hover {
  background-color: #e3f2fd;
}

.btn-icon.delete:hover {
  background-color: #ffebee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover {
  background-color: #1565c0;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #424242;
}

.btn-secondary:hover {
  background-color: #d5d5d5;
}

.btn-danger {
  background-color: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background-color: #c62828;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.warning {
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
  padding: 1rem;
  margin: 1rem 0;
  color: #795548;
}

@media (max-width: 768px) {
  .categories-container {
    padding: 1rem;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modal-content {
    padding: 1.5rem;
    margin: 0 1rem;
  }
}
</style>
