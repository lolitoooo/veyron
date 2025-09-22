import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/apiService';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  isActive?: boolean;
  createdAt: string;
}

export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([]);
  const displayedUsers = ref<User[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentPage = ref(1);
  const totalPages = ref(1);
  const totalUsersCount = ref(0);
  const itemsPerPage = ref(10);
  const searchQuery = ref('');
  const roleFilter = ref('');
  const statusFilter = ref('');
  
  const totalUsers = computed(() => totalUsersCount.value);
  const activeUsers = computed(() => users.value.filter(user => user.active).length);
  const adminUsers = computed(() => users.value.filter(user => user.role === 'admin').length);
  const applyPagination = () => {
    const startIndex = (currentPage.value - 1) * itemsPerPage.value;
    const endIndex = startIndex + itemsPerPage.value;
    displayedUsers.value = users.value.slice(startIndex, endIndex);
  };
  
  const fetchUsers = async (params: UserSearchParams = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const page = params.page || currentPage.value;
      const limit = params.limit || itemsPerPage.value;
      const search = params.search || searchQuery.value;
      const role = params.role || roleFilter.value;
      const status = params.status || statusFilter.value;
      
      currentPage.value = page;
      itemsPerPage.value = limit;
      
      const queryParams: Record<string, any> = {};
      if (search) queryParams.search = search;
      if (role) queryParams.role = role;
      if (status) queryParams.status = status;
      
      const response = await api.get('/user/all', { params: queryParams });
      
      if (response.data && Array.isArray(response.data)) {
        users.value = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        users.value = response.data.data;
      } else if (response.data && typeof response.data === 'object' && response.data.success) {
        if (Array.isArray(response.data.data)) {
          users.value = response.data.data;
        } else {
          throw new Error('Format de réponse API non valide');
        }
      } else if (response.data && typeof response.data === 'object') {
        const userData = response.data.data || response.data.user || response.data;
        if (userData && userData.id) {
          users.value = [userData];
        } else {
          throw new Error('Format de réponse API non valide');
        }
      } else {
        throw new Error('Format de réponse API non valide');
      }
      
      let filteredUsers = [...users.value];
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }
      
      if (role) {
        filteredUsers = filteredUsers.filter(user => user.role === role);
      }
      
      if (status === 'active') {
        filteredUsers = filteredUsers.filter(user => user.active || (user.isActive === true));
      } else if (status === 'inactive') {
        filteredUsers = filteredUsers.filter(user => !user.active && !user.isActive);
      }
      
      users.value = filteredUsers;
      
      totalUsersCount.value = users.value.length;
      totalPages.value = Math.ceil(totalUsersCount.value / itemsPerPage.value);
      
      applyPagination();
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      error.value = err.message || 'Erreur lors du chargement des utilisateurs';
      users.value = [];
      totalUsersCount.value = 0;
      totalPages.value = 1;
    } finally {
      loading.value = false;
    }
  };
  
  const searchUsers = async (query: string) => {
    searchQuery.value = query;
    currentPage.value = 1;
    await fetchUsers();
  };
  
  const filterByRole = async (role: string) => {
    roleFilter.value = role;
    currentPage.value = 1;
    await fetchUsers();
  };
  
  const filterByStatus = async (status: string) => {
    statusFilter.value = status;
    currentPage.value = 1;
    await fetchUsers();
  };
  
  const goToPage = async (page: number) => {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    applyPagination();
  };
  
  return {
    users: displayedUsers,
    allUsers: users,
    loading,
    error,
    totalUsers,
    activeUsers,
    adminUsers,
    currentPage,
    totalPages,
    totalUsersCount,
    itemsPerPage,
    searchQuery,
    roleFilter,
    statusFilter,
    fetchUsers,
    searchUsers,
    filterByRole,
    filterByStatus,
    goToPage
  };
});
