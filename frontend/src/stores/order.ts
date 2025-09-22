import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Order, OrderStatus } from '@/types/order';
import { useAuthStore } from './auth';
import api from '@/services/apiService';

export const useOrderStore = defineStore('order', () => {
  const authStore = useAuthStore();
  const orders = ref<Order[]>([]);
  const currentOrder = ref<Order | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getOrderById = computed(() => {
    return (orderId: string) => orders.value.find(order => order._id === orderId);
  });

  const getOrdersByStatus = computed(() => {
    return (status: OrderStatus) => orders.value.filter(order => order.status === status);
  });

  async function fetchUserOrders() {
    if (!authStore.isAuthenticated || !authStore.user) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const userId = authStore.user.id;
      const response = await api.get(`/orders/user/${userId}`);
      orders.value = response.data.data;
    } catch (err: any) {
      console.error('Erreur lors de la récupération des commandes:', err);
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des commandes';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchOrderById(orderId: string) {
    if (!authStore.isAuthenticated) {
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/orders/${orderId}`);
      currentOrder.value = response.data.data;
      return currentOrder.value;
    } catch (err: any) {
      console.error(`Erreur lors de la récupération de la commande ${orderId}:`, err);
      error.value = err.response?.data?.message || 'Erreur lors de la récupération de la commande';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function createCheckoutSession(cartItems: any[], shippingAddress: any, billingAddress: any = null) {
    if (!authStore.isAuthenticated) {
      error.value = 'Vous devez être connecté pour passer commande';
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.post('/stripe/create-checkout-session', {
        items: cartItems,
        shippingAddress,
        billingAddress: billingAddress || shippingAddress
      });

      return response.data;
    } catch (err: any) {
      console.error('Erreur lors de la création de la session de paiement:', err);
      error.value = err.response?.data?.message || 'Erreur lors de la création de la session de paiement';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function getCheckoutSession(sessionId: string) {
    if (!authStore.isAuthenticated) {
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/stripe/checkout-session/${sessionId}`);
      
      if (response.data.order) {
        currentOrder.value = response.data.order;
      }
      
      return response.data;
    } catch (err: any) {
      console.error('Erreur lors de la récupération de la session de paiement:', err);
      error.value = err.response?.data?.message || 'Erreur lors de la récupération de la session de paiement';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function cancelOrder(orderId: string) {
    if (!authStore.isAuthenticated) {
      return { success: false, message: 'Vous devez être connecté pour annuler une commande' };
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/orders/${orderId}/cancel`);
      
      const index = orders.value.findIndex(order => order._id === orderId);
      if (index !== -1) {
        orders.value[index] = response.data.data;
      }
      
      if (currentOrder.value && currentOrder.value._id === orderId) {
        currentOrder.value = response.data.data;
      }
      
      return { success: true };
    } catch (err: any) {
      console.error(`Erreur lors de l'annulation de la commande ${orderId}:`, err);
      
      if (err.response?.status === 400) {
        const details = err.response.data.details;
        let message = err.response.data.message || 'Cette commande ne peut plus être annulée';
        
        if (details) {
          if (details.isPaid) {
            message += ' car elle a déjà été payée.';
          } else if (details.status && !['pending', 'processing'].includes(details.status)) {
            message += ` car son statut est "${details.status}".`;
          }
        }
        
        error.value = message;
        return { success: false, message };
      }
      
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'annulation de la commande';
      error.value = errorMessage;
      return { success: false, message: errorMessage };
    } finally {
      isLoading.value = false;
    }
  }

  async function generateInvoice(orderId: string) {
    if (!authStore.isAuthenticated) {
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/orders/${orderId}/invoice`);
      return response.data;
    } catch (err: any) {
      console.error(`Erreur lors de la génération de la facture pour la commande ${orderId}:`, err);
      error.value = err.response?.data?.message || 'Erreur lors de la génération de la facture';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    orders,
    currentOrder,
    isLoading,
    error,
    getOrderById,
    getOrdersByStatus,
    fetchUserOrders,
    fetchOrderById,
    createCheckoutSession,
    getCheckoutSession,
    cancelOrder,
    generateInvoice
  };
});
