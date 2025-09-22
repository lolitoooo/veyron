import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Product } from '@/types/product';
import api from '@/services/apiService';

export const useProductStore = defineStore('products', () => {
  const products = ref<Product[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getProductById = computed(() => {
    return (productId: string) => products.value.find(p => p.id === productId);
  });

  const getProductsByCategory = computed(() => {
    return (category: string) => products.value.filter(p => p.category === category);
  });

  const categories = computed(() => {
    const categoriesSet = new Set(products.value.map(p => p.category));
    return Array.from(categoriesSet);
  });

  async function fetchProducts() {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get('/products');
      products.value = response.data;
      return products.value;
    } catch (err) {
      error.value = 'Erreur lors du chargement des produits';
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/products', product);
      const newProduct = response.data;
      products.value.push(newProduct);
      return newProduct;
    } catch (err) {
      error.value = 'Erreur lors de l\'ajout du produit';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateProduct(id: string, productData: Partial<Product>) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.put(`/products/${id}`, productData);
      const updatedProduct = response.data;
      
      const index = products.value.findIndex(p => p.id === id);
      if (index !== -1) {
        products.value[index] = updatedProduct;
      }
      
      return updatedProduct;
    } catch (err) {
      error.value = 'Erreur lors de la mise à jour du produit';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteProduct(id: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      await api.delete(`/products/${id}`);
      
      const index = products.value.findIndex(p => p.id === id);
      if (index !== -1) {
        products.value.splice(index, 1);
      }
      
      return true;
    } catch (err) {
      error.value = 'Erreur lors de la suppression du produit';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    products,
    isLoading,
    error,
    getProductById,
    getProductsByCategory,
    categories,
    fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct
  };
});
