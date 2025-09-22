import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Order, OrderStatus } from '@/types/order';
import { useAuthStore } from './auth';
import { useCartStore } from './cart';
import api from '@/services/apiService';
import { sendOrderConfirmation, sendInvoice } from '@/services/emailService';

export const useOrderStore = defineStore('orders', () => {
  const authStore = useAuthStore();
  const cartStore = useCartStore();
  
  const orders = ref<Order[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const userOrders = computed(() => {
    if (!authStore.user) return [];
    return orders.value.filter(order => order.user === authStore.user?._id);
  });

  const getOrderByIdGetter = computed(() => {
    return (id: string) => {
      return orders.value.find(order => order._id === id);
    };
  });

  async function fetchUserOrders() {
    if (!authStore.isAuthenticated || !authStore.user) return [];
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get(`/orders/user/${authStore.user._id}`);
      orders.value = response.data;
      return orders.value;
    } catch (err) {
      error.value = 'Erreur lors du chargement des commandes';
      return [];
    } finally {
      isLoading.value = false;
    }
  }
  
  async function fetchAllOrders() {
    if (!authStore.isAuthenticated || !authStore.isAdmin) return [];
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get('/orders');
      orders.value = response.data;
      return orders.value;
    } catch (err) {
      error.value = 'Erreur lors du chargement des commandes';
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
    if (!authStore.isAuthenticated || !authStore.user) {
      throw new Error('Utilisateur non authentifié');
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.post('/orders', orderData);
      const newOrder = response.data;
      
      orders.value.push(newOrder);
      
      cartStore.clearCart();
      
      if (authStore.user.email) {
        await sendOrderConfirmation(
          authStore.user.email,
          `${authStore.user.firstName} ${authStore.user.lastName}`,
          newOrder.id,
          newOrder
        );
      }
      
      return newOrder;
    } catch (err) {
      error.value = 'Erreur lors de la création de la commande';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function getOrderById(id: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.get(`/orders/${id}`);
      const order = response.data;
      
      if (!order) {
        throw new Error('Commande non trouvée');
      }
      
      return order;
    } catch (err) {
      error.value = 'Erreur lors de la récupération de la commande';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updateOrderStatus(id: string, status: OrderStatus) {
    if (!authStore.isAuthenticated) {
      throw new Error('Utilisateur non authentifié');
    }
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.patch(`/orders/${id}`, { status });
      const updatedOrder = response.data;
      
      const index = orders.value.findIndex(o => o._id === id);
      if (index !== -1) {
        orders.value[index] = updatedOrder;
      }
      
      if (status === 'delivered' && updatedOrder.userId) {
        const userResponse = await api.get(`/users/${updatedOrder.userId}`);
        const user = userResponse.data;
        
        if (user && user.email) {
          await sendInvoice(
            user.email,
            `${user.firstName} ${user.lastName}`,
            updatedOrder.id,
            updatedOrder
          );
        }
      }
      
      return updatedOrder;
    } catch (err) {
      error.value = 'Erreur lors de la mise à jour de la commande';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function processPayment(orderId: string, paymentMethod: any) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const response = await api.post(`/orders/${orderId}/payment`, {
        paymentMethod
      });
      
      const updatedOrder = response.data.order;
      const paymentId = response.data.paymentId;
      
      const orderIndex = orders.value.findIndex(order => order._id === orderId);
      if (orderIndex !== -1) {
        orders.value[orderIndex] = updatedOrder;
      } else {
        orders.value.push(updatedOrder);
      }
      
      return {
        success: true,
        order: updatedOrder,
        paymentId
      };
    } catch (err) {
      error.value = 'Erreur lors du traitement du paiement';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    orders,
    isLoading,
    error,
    getOrderByIdGetter,
    fetchUserOrders,
    fetchAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    processPayment
  };
});
