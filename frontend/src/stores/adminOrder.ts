import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Order, OrderStatus } from '@/types/order';
import { useAuthStore } from './auth';
import api from '@/services/apiService';

export const useAdminOrderStore = defineStore('adminOrder', () => {
  const authStore = useAuthStore();
  const orders = ref<Order[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const totalOrders = ref(0);
  const totalPages = ref(0);
  const currentPage = ref(1);

  const getOrderById = computed(() => {
    return (orderId: string) => orders.value.find(order => order._id === orderId);
  });

  const getOrdersByStatus = computed(() => {
    return (status: OrderStatus) => orders.value.filter(order => order.status === status);
  });

  const pendingOrdersCount = computed(() => {
    return orders.value.filter(order => order.status === 'pending').length;
  });

  async function fetchOrders(params: { page?: number; limit?: number; status?: string; sort?: string } = {}) {
    const { page = 1, limit = 10, status = '', sort = '-createdAt' } = params;
    if (!authStore.isAuthenticated || authStore.user?.role !== 'admin') {
      error.value = 'Accès non autorisé';
      return;
    }

    isLoading.value = true;
    error.value = null;
    currentPage.value = page;

    try {
      const response = await api.get('/orders', {
        params: { page, limit, status, sort }
      });
      
      orders.value = response.data.data;
      totalOrders.value = response.data.total;
      totalPages.value = response.data.pages;
      
      return response.data;
    } catch (err: any) {
      console.error('Erreur lors de la récupération des commandes:', err);
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des commandes';
    } finally {
      isLoading.value = false;
    }
  }

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    if (!authStore.isAuthenticated || authStore.user?.role !== 'admin') {
      error.value = 'Accès non autorisé';
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.put(`/orders/${orderId}/status`, { status });
      
      const index = orders.value.findIndex(order => order._id === orderId);
      if (index !== -1) {
        orders.value[index] = response.data.data;
      }
      
      return true;
    } catch (err: any) {
      console.error(`Erreur lors de la mise à jour du statut de la commande ${orderId}:`, err);
      error.value = err.response?.data?.message || 'Erreur lors de la mise à jour du statut de la commande';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchOrderDetails(orderId: string) {
    if (!authStore.isAuthenticated || authStore.user?.role !== 'admin') {
      error.value = 'Accès non autorisé';
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data.data;
    } catch (err: any) {
      console.error(`Erreur lors de la récupération des détails de la commande ${orderId}:`, err);
      error.value = err.response?.data?.message || 'Erreur lors de la récupération des détails de la commande';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function generateInvoice(orderId: string) {
    if (!authStore.isAuthenticated || authStore.user?.role !== 'admin') {
      error.value = 'Accès non autorisé';
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

  async function getInvoice(orderId: string) {
    if (!authStore.isAuthenticated || authStore.user?.role !== 'admin') {
      error.value = 'Accès non autorisé';
      return null;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/orders/${orderId}/invoice/download`);
      return response.data;
    } catch (err: any) {
      console.error(`Erreur lors du téléchargement de la facture pour la commande ${orderId}:`, err);
      error.value = err.response?.data?.message || 'Erreur lors du téléchargement de la facture';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    orders,
    isLoading,
    error,
    totalOrders,
    totalPages,
    currentPage,
    getOrderById,
    getOrdersByStatus,
    pendingOrdersCount,
    fetchOrders,
    updateOrderStatus,
    fetchOrderDetails,
    generateInvoice,
    getInvoice
  };
});
