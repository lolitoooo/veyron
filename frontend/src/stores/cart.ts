import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Cart, CartItem } from '@/types/cart';

interface CartItemWithStock extends CartItem {
  stockVariant?: number;
}
import { useAuthStore } from './auth';
import api from '@/services/apiService';

export const useCartStore = defineStore('cart', () => {
  const authStore = useAuthStore();
  const items = ref<CartItemWithStock[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const promoCode = ref<{
    code: string;
    title: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    promoCodeId: string;
  } | null>(null);

  const subtotal = computed(() => {
    return items.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  });

  const discountAmount = computed(() => {
    return promoCode.value ? promoCode.value.discountAmount : 0;
  });

  const total = computed(() => {
    return subtotal.value - discountAmount.value;
  });

  const itemCount = computed(() => {
    return items.value.reduce((count, item) => count + item.quantity, 0);
  });

  async function ensureUserAuthenticated() {
    if (!authStore.isAuthenticated) {
      return false;
    }
    
    if (!authStore.user || !authStore.user.id) {
      try {
        const userLoaded = await authStore.loadUser();
        if (!userLoaded || !authStore.user?.id) {
          try {
            const profileResponse = await api.get('/user/profile');
            
            if (profileResponse.data && profileResponse.data.data && profileResponse.data.data.id) {
              authStore.$patch({
                user: profileResponse.data.data
              });
              
              if (authStore.user && authStore.user.id) {
                return true;
              }
            }
            throw new Error('Format de réponse utilisateur non reconnu');
          } catch (profileErr) {
            console.error('Impossible de charger les données utilisateur');
            console.error('authStore.isAuthenticated =', authStore.isAuthenticated);
            console.error('authStore.token =', authStore.token ? 'Présent' : 'Absent');
            return false;
          }
        }
        return true;
      } catch (err) {
        console.error('Erreur lors du chargement des données utilisateur:', err);
        return false;
      }
    }
    
    return true;
  }

  async function addToCart(item: CartItem) {
    error.value = null;
    
    try {
      const productResponse = await api.get(`/products/${item.productId}`);
      
      if (productResponse.data && productResponse.data.success) {
        const product = productResponse.data.data;
        
        const variant = product.variants?.find((v: { size: string; color: string; stock: number }) => 
          v.size === item.variant.size && v.color === item.variant.color
        );
        
        if (!variant) {
          throw new Error('Variante non disponible');
        }
        
        const stockDisponible = variant.stock;
        
        const existingItem = items.value.find(cartItem => 
          cartItem.productId === item.productId && 
          cartItem.variant.size === item.variant.size && 
          cartItem.variant.color === item.variant.color
        );
        
        let totalQuantity = item.quantity;
        if (existingItem) {
          totalQuantity += existingItem.quantity;
        }
        
        if (totalQuantity > stockDisponible) {
          const availableToAdd = stockDisponible - (existingItem?.quantity || 0);
          
          if (availableToAdd <= 0) {
            throw new Error(`Désolé, vous avez déjà la quantité maximale disponible dans votre panier`);
          }
          
          item.quantity = availableToAdd;
          throw new Error(`Désolé, il ne reste que ${availableToAdd} article(s) disponible(s) pour cette variante`);
        }
        
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          items.value.push({
            ...item,
            stockVariant: stockDisponible
          });
        }
      } else {
        throw new Error('Impossible de vérifier le stock disponible');
      }
      
      if (await ensureUserAuthenticated()) {
        await saveCartToServer();
      }
      
      return true;
    } catch (err: any) {
      console.error('Erreur dans addToCart:', err);
      error.value = err.message || 'Erreur lors de l\'ajout au panier';
      throw err;
    }
  }

  async function updateQuantity(productId: string, variantId: string, quantity: number) {
    if (quantity <= 0) {
      await removeFromCart(productId, variantId);
      return;
    }
    
    const item = items.value.find(item => 
      item.productId === productId && 
      item.variantId === variantId
    );
    
    if (item) {
      item.quantity = quantity;
      
      if (await ensureUserAuthenticated()) {
        try {
          await saveCartToServer();
        } catch (err) {
          console.error('Erreur lors de la mise à jour de la quantité:', err);
          error.value = 'Erreur lors de la mise à jour de la quantité';
        }
      }
    }
  }

  async function removeFromCart(productId: string, variantId: string) {
    const index = items.value.findIndex(item => 
      item.productId === productId && 
      item.variantId === variantId
    );
    
    if (index !== -1) {
      items.value.splice(index, 1);
      
      if (items.value.length === 0) {
        removePromoCode();
      }
      
      if (await ensureUserAuthenticated()) {
        try {
          await saveCartToServer();
          
        } catch (err) {
          console.error('Erreur lors de la suppression de l\'article:', err);
          error.value = 'Erreur lors de la suppression de l\'article';
        }
      }
    }
  }

  async function clearCart() {
    items.value = [];
    
    removePromoCode();
    
    if (await ensureUserAuthenticated()) {
      try {
        await api.delete(`/cart/${authStore.user!.id}/clear`);
      } catch (err) {
        console.error('Erreur lors du vidage du panier sur le serveur:', err);
        error.value = 'Erreur lors du vidage du panier';
      }
    }
    
    return true;
  }

  async function saveCartToServer() {
    if (!await ensureUserAuthenticated()) {
      return;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/cart', {
        userId: authStore.user!.id,
        items: items.value,
        total: total.value
      });
      
    } catch (err: any) {
      console.error('Erreur détaillée lors de la sauvegarde du panier:', err);
      
      if (err.response) {
        if (err.response.status === 401) {
          error.value = 'Session expirée. Veuillez vous reconnecter.';
          authStore.logout();
        } else if (err.response.status === 404) {
          error.value = 'Utilisateur non trouvé sur le serveur';
        } else {
          error.value = `Erreur lors de la sauvegarde du panier: ${err.response.status}`;
        }
      } else if (err.request) {
        error.value = 'Le serveur ne répond pas. Veuillez réessayer plus tard.';
      } else {
        error.value = 'Erreur lors de la sauvegarde du panier';
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchCartFromServer() {
    if (!await ensureUserAuthenticated()) {
      items.value = [];
      return;
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get(`/cart/${authStore.user!.id}`);
      
      if (response.data) {
        if (Array.isArray(response.data.items)) {
          items.value = response.data.items;
        } else if (response.data.items) {
          items.value = Object.values(response.data.items);
        } else if (Array.isArray(response.data)) {
          items.value = response.data;
        } else {
          items.value = [];
        }
      } else {
        items.value = [];
      }
      
    } catch (err: any) {
      console.error('Erreur lors du chargement du panier:', err);
      
      if (err.response && err.response.status === 404) {
        items.value = [];
        
        try {
          await saveCartToServer();
        } catch (saveErr) {
          console.error('Échec de la création d\'un nouveau panier:', saveErr);
        }
      } else {
        error.value = 'Erreur lors du chargement du panier';
        items.value = [];
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function initCart() {
    isLoading.value = true;
    
    try {
      if (authStore.isAuthenticated) {
        await fetchCartFromServer();
      } else {
        items.value = [];
      }
      
    } catch (err) {
      console.error('Erreur lors de l\'initialisation du panier:', err);
      items.value = [];
    } finally {
      isLoading.value = false;
    }
  }
  
  watch(() => authStore.isAuthenticated, async (isAuthenticated) => {
    if (isAuthenticated) {
      await fetchCartFromServer();
    } else {
      items.value = [];
    }
  });
  
  watch(() => authStore.user, async (newUser) => {
    if (newUser && authStore.isAuthenticated) {
      await fetchCartFromServer();
    }
  });

  initCart();

  function setPromoCode(code: {
    code: string;
    title: string;
    discountType: string;
    discountValue: number;
    discountAmount: number;
    promoCodeId: string;
  }) {
    promoCode.value = code;
    
    localStorage.setItem('veyron_promo_code', JSON.stringify(code));
  }
  
  function removePromoCode() {
    promoCode.value = null;
    localStorage.removeItem('veyron_promo_code');
  }
  
  function loadSavedPromoCode() {
    const savedPromoCode = localStorage.getItem('veyron_promo_code');
    if (savedPromoCode) {
      try {
        promoCode.value = JSON.parse(savedPromoCode);
      } catch (e) {
        console.error('Erreur lors du chargement du code promo:', e);
        localStorage.removeItem('veyron_promo_code');
      }
    }
  }
  
  loadSavedPromoCode();

  return {
    items,
    isLoading,
    error,
    subtotal,
    total,
    discountAmount,
    promoCode,
    itemCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    initCart,
    setPromoCode,
    removePromoCode
  };
});
