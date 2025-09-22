import { defineStore } from 'pinia';
import api from '../services/apiService';
import { useAuthStore } from './auth';

interface WishlistItem {
  _id: string;
  user: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    description: string;
    slug: string;
    category: string;
  };
  addedAt: string;
  createdAt: string;
  updatedAt: string;
}

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    items: [] as WishlistItem[],
    loading: false,
    error: null as string | null,
  }),
  
  getters: {
    count: (state) => state.items.length,
    isInWishlist: (state) => (productId: string) => {
      return state.items.some(item => item.product._id === productId);
    },
  },
  
  actions: {
    async fetchWishlist() {
      const authStore = useAuthStore();
      
      if (!authStore.isAuthenticated) {
        this.items = [];
        return;
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        const response = await api.get('/wishlist');
        
        this.items = response.data.data;
      } catch (error: any) {
        console.error('Erreur lors du chargement des favoris:', error);
        this.error = error.response?.data?.message || 'Erreur lors du chargement des favoris';
      } finally {
        this.loading = false;
      }
    },
    
    async addToWishlist(productId: string) {
      const authStore = useAuthStore();
      
      if (!authStore.isAuthenticated) {
        throw new Error('Vous devez être connecté pour ajouter des produits aux favoris');
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        const response = await api.post('/wishlist', { productId });
        
        await this.fetchWishlist();
        
        return response.data;
      } catch (error: any) {
        console.error('Erreur lors de l\'ajout aux favoris:', error);
        this.error = error.response?.data?.message || 'Erreur lors de l\'ajout aux favoris';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async removeFromWishlist(wishlistItemId: string) {
      const authStore = useAuthStore();
      
      if (!authStore.isAuthenticated) {
        throw new Error('Vous devez être connecté pour gérer vos favoris');
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        await api.delete(`/wishlist/${wishlistItemId}`);
        
        this.items = this.items.filter(item => item._id !== wishlistItemId);
        
      } catch (error: any) {
        console.error('Erreur lors de la suppression du favori:', error);
        this.error = error.response?.data?.message || 'Erreur lors de la suppression du favori';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async removeProductFromWishlist(productId: string) {
      const authStore = useAuthStore();
      
      if (!authStore.isAuthenticated) {
        throw new Error('Vous devez être connecté pour gérer vos favoris');
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        await api.delete(`/wishlist/product/${productId}`);
        
        this.items = this.items.filter(item => item.product._id !== productId);
        
      } catch (error: any) {
        console.error('Erreur lors de la suppression du favori:', error);
        this.error = error.response?.data?.message || 'Erreur lors de la suppression du favori';
        throw error;
      } finally {
        this.loading = false;
      }
    },
    
    async checkWishlistItem(productId: string) {
      const authStore = useAuthStore();
      
      if (!authStore.isAuthenticated) {
        return { inWishlist: false };
      }
      
      try {
        const response = await api.get(`/wishlist/check/${productId}`);
        
        return response.data;
      } catch (error) {
        console.error('Erreur lors de la vérification du favori:', error);
        return { inWishlist: false };
      }
    },
    
    clearWishlist() {
      this.items = [];
      this.error = null;
    }
  }
});
