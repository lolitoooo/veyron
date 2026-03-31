import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/apiService';

export interface Partner {
  _id: string;
  shopName: string;
  slug: string;
  logo: string;
  description: string;
  design: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    bannerImage: string;
  };
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  phone: string;
  email: string;
  socialLinks: {
    instagram: string;
    facebook: string;
    website: string;
  };
  commission: number;
  bankInfo?: {
    iban: string;
    bic: string;
    bankName: string;
    accountHolder: string;
  };
  isActive: boolean;
  createdAt: string;
}

export interface PartnerPayout {
  _id: string;
  partner: string | Partner;
  period: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  ordersCount: number;
  status: 'pending' | 'paid';
  paidAt?: string;
  reference: string;
}

export const usePartnerStore = defineStore('partner', () => {
  const partners = ref<Partner[]>([]);
  const currentPartner = ref<Partner | null>(null);
  const myPartner = ref<Partner | null>(null);
  const dashboard = ref<any>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // ── Public ──

  async function fetchPartners() {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await api.get('/partners');
      partners.value = res.data.partners;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement des boutiques';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchPartnerBySlug(slug: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const res = await api.get(`/partners/${slug}`);
      currentPartner.value = res.data.partner;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Boutique introuvable';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchPartnerProducts(slug: string) {
    try {
      const res = await api.get(`/partners/${slug}/products`);
      return res.data.products;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return [];
    }
  }

  // ── Espace partenaire ──

  async function fetchMyPartner() {
    try {
      const res = await api.get('/partners/me/profile');
      myPartner.value = res.data.partner;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
    }
  }

  async function updateMyPartner(data: Partial<Partner>) {
    try {
      const res = await api.put('/partners/me/profile', data);
      myPartner.value = res.data.partner;
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return false;
    }
  }

  async function fetchMyDashboard() {
    isLoading.value = true;
    try {
      const res = await api.get('/partners/me/dashboard');
      dashboard.value = res.data.dashboard;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchMyOrders(params?: { page?: number; status?: string }) {
    try {
      const res = await api.get('/partners/me/orders', { params });
      return res.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return { orders: [], total: 0 };
    }
  }

  async function fetchMyOrderDetail(id: string) {
    try {
      const res = await api.get(`/partners/me/orders/${id}`);
      return res.data.order;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  async function fetchMyStats() {
    try {
      const res = await api.get('/partners/me/stats');
      return res.data.stats;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  async function fetchMyProducts() {
    try {
      const res = await api.get('/partners/me/products');
      return res.data.products;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return [];
    }
  }

  async function updateMyProductStock(productId: string, data: any) {
    try {
      const res = await api.put(`/partners/me/products/${productId}/stock`, data);
      return res.data.product;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  async function fetchMyPayouts() {
    try {
      const res = await api.get('/partners/me/payouts');
      return res.data.payouts;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return [];
    }
  }

  // ── Admin ──

  async function adminFetchPartners() {
    isLoading.value = true;
    try {
      const res = await api.get('/partners/admin/all');
      partners.value = res.data.partners;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
    } finally {
      isLoading.value = false;
    }
  }

  async function adminCreatePartner(data: any) {
    try {
      const res = await api.post('/partners/admin', data);
      return res.data.partner;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  async function adminUpdatePartner(id: string, data: any) {
    try {
      const res = await api.put(`/partners/admin/${id}`, data);
      return res.data.partner;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  async function adminDeletePartner(id: string) {
    try {
      await api.delete(`/partners/admin/${id}`);
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return false;
    }
  }

  async function adminFetchPartnerStats(id: string) {
    try {
      const res = await api.get(`/partners/admin/${id}/stats`);
      return res.data.stats;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  async function adminFetchPartnerProducts(id: string) {
    try {
      const res = await api.get(`/partners/admin/${id}/products`);
      return res.data.products;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return [];
    }
  }

  async function adminCreatePartnerProduct(partnerId: string, data: any) {
    try {
      const res = await api.post(`/partners/admin/${partnerId}/products`, data);
      return res.data.product;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  async function adminUpdatePartnerProduct(partnerId: string, productId: string, data: any) {
    try {
      const res = await api.put(`/partners/admin/${partnerId}/products/${productId}`, data);
      return res.data.product;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  async function adminDeletePartnerProduct(partnerId: string, productId: string) {
    try {
      await api.delete(`/partners/admin/${partnerId}/products/${productId}`);
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return false;
    }
  }

  async function adminGeneratePayout(partnerId: string, period: string) {
    try {
      const res = await api.post(`/partners/admin/${partnerId}/payouts`, { period });
      return res.data.payout;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  async function adminMarkPayoutPaid(payoutId: string, data: { reference?: string; notes?: string }) {
    try {
      const res = await api.put(`/partners/admin/payouts/${payoutId}/paid`, data);
      return res.data.payout;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erreur';
      return null;
    }
  }

  return {
    partners, currentPartner, myPartner, dashboard, isLoading, error,
    fetchPartners, fetchPartnerBySlug, fetchPartnerProducts,
    fetchMyPartner, updateMyPartner, fetchMyDashboard,
    fetchMyOrders, fetchMyOrderDetail, fetchMyStats,
    fetchMyProducts, updateMyProductStock, fetchMyPayouts,
    adminFetchPartners, adminCreatePartner, adminUpdatePartner, adminDeletePartner,
    adminFetchPartnerStats, adminFetchPartnerProducts,
    adminCreatePartnerProduct, adminUpdatePartnerProduct, adminDeletePartnerProduct,
    adminGeneratePayout, adminMarkPayoutPaid
  };
});
