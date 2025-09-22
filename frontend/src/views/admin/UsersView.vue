<template>
  <div class="users-container">
    <div class="admin-header">
      <h1>Gestion des utilisateurs</h1>
      <button class="btn btn-primary" @click="showAddUserModal = true">
        Ajouter un utilisateur
      </button>
    </div>
    
    <div class="search-filters-container">
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchQuery" 
          @input="handleSearch"
          placeholder="Rechercher un utilisateur..." 
          class="search-input"
        />
        <button class="search-button" @click="handleSearch">
          <span class="material-icons">search</span>
        </button>
      </div>
      
      <div class="filters">
        <div class="filter-group">
          <label for="roleFilter">Rôle:</label>
          <select id="roleFilter" v-model="roleFilter" @change="handleRoleFilter" class="filter-select">
            <option value="">Tous</option>
            <option value="admin">Admin</option>
            <option value="user">Utilisateur</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="statusFilter">Statut:</label>
          <select id="statusFilter" v-model="statusFilter" @change="handleStatusFilter" class="filter-select">
            <option value="">Tous</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="usersStore.loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement des utilisateurs...</p>
    </div>

    <div v-else-if="usersStore.error" class="error-message">
      {{ usersStore.error }}
    </div>

    <div v-else-if="usersStore.users.length === 0" class="empty-state">
      <p>Aucun utilisateur trouvé.</p>
      <button class="btn btn-primary" @click="showAddUserModal = true">
        Ajouter un utilisateur
      </button>
    </div>

    <div v-else class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Date d'inscription</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in usersStore.users" :key="user.id || user._id">
            <td>{{ user.id || user._id }}</td>
            <td>{{ user.firstName }} {{ user.lastName }}</td>
            <td>{{ user.email }}</td>
            <td>
              <span :class="['role-badge', `role-${user.role}`]">
                {{ getRoleLabel(user.role) }}
              </span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <span :class="['status-badge', `status-${(user.isActive || user.active) ? 'active' : 'inactive'}`]">
                {{ (user.isActive || user.active) ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button class="btn-icon" @click="editUser(user)">
                  <span class="material-icons">edit</span>
                </button>
                <button class="btn-icon" @click="showUserDetails(user.id)">
                  <span class="material-icons">visibility</span>
                </button>
                <button class="btn-icon delete" @click="confirmDeleteUser(user)">
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination-container">
        <div class="pagination-info">
          Affichage de {{ paginationStart }} à {{ paginationEnd }} sur {{ usersStore.totalUsers }} utilisateurs
        </div>
        
        <div class="pagination">
          <button 
            class="pagination-btn" 
            :disabled="usersStore.currentPage <= 1"
            @click="goToPage(usersStore.currentPage - 1)"
          >
            <span class="material-icons">chevron_left</span>
          </button>
          
          <template v-for="page in displayedPages" :key="page">
            <button 
              v-if="page > 0" 
              class="pagination-btn" 
              :class="{ 'active': usersStore.currentPage === page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
            <span v-else class="pagination-ellipsis">...</span>
          </template>
          
          <button 
            class="pagination-btn" 
            :disabled="usersStore.currentPage >= usersStore.totalPages"
            @click="goToPage(usersStore.currentPage + 1)"
          >
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAddUserModal || showEditUserModal" class="modal">
      <div class="modal-content">
        <h3>{{ showEditUserModal ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur' }}</h3>
        
        <form @submit.prevent="showEditUserModal ? updateUser() : addUser()">
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">Prénom</label>
              <input 
                type="text" 
                id="firstName" 
                v-model="userForm.firstName" 
                required
                class="form-control"
              />
            </div>
            
            <div class="form-group">
              <label for="lastName">Nom</label>
              <input 
                type="text" 
                id="lastName" 
                v-model="userForm.lastName" 
                required
                class="form-control"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="userForm.email" 
              required
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="password">{{ showEditUserModal ? 'Mot de passe (laisser vide pour ne pas modifier)' : 'Mot de passe' }}</label>
            <input 
              type="password" 
              id="password" 
              v-model="userForm.password" 
              :required="!showEditUserModal"
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="phone">Téléphone</label>
            <input 
              type="tel" 
              id="phone" 
              v-model="userForm.phone"
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="birthDate">Date de naissance</label>
            <input 
              type="date" 
              id="birthDate" 
              v-model="userForm.birthDate"
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label for="role">Rôle</label>
            <select id="role" v-model="userForm.role" required class="form-select">
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="checkbox-container">
              <input type="checkbox" v-model="userForm.active" />
              Compte actif
            </label>
          </div>
          
          <div class="form-group">
            <label class="checkbox-container">
              <input type="checkbox" v-model="userForm.newsletterSubscribed" />
              Inscrit à la newsletter
            </label>
          </div>
          
          <div class="form-group">
            <label class="checkbox-container">
              <input type="checkbox" v-model="userForm.smsNotifications" />
              Notifications SMS
            </label>
          </div>
          
          <div class="modal-actions">
            <button 
              type="button" 
              class="btn btn-secondary" 
              @click="closeUserModal"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Traitement...' : (showEditUserModal ? 'Mettre à jour' : 'Ajouter') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h3>Confirmer la suppression</h3>
        
        <p>
          Êtes-vous sûr de vouloir supprimer l'utilisateur 
          <strong>{{ userToDelete?.firstName }} {{ userToDelete?.lastName }}</strong> ?
        </p>
        
        <div class="modal-actions">
          <button 
            type="button" 
            class="btn btn-secondary" 
            @click="showDeleteModal = false"
          >
            Annuler
          </button>
          <button 
            type="button" 
            class="btn btn-danger"
            :disabled="isSubmitting"
            @click="deleteUser"
          >
            {{ isSubmitting ? 'Suppression...' : 'Supprimer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/services/apiService';
import { useUsersStore } from '@/stores/users';

interface User {
  id?: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  active?: boolean;
  birthDate?: string;
  newsletterSubscribed?: boolean;
  phone?: string;
  smsNotifications?: boolean;
  createdAt: string;
}

const router = useRouter();
const usersStore = useUsersStore();

onMounted(async () => {
  await usersStore.fetchUsers({
    page: 1,
    limit: 10
  });
});

const displayedPages = computed(() => {
    const currentPage = usersStore.currentPage;
    const totalPages = usersStore.totalPages;
    
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      const pages = [];
      
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push(-1);
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push(-1);
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
      
      return pages;
    }
  });

  const paginationStart = computed(() => {
    if (usersStore.users.length === 0) return 0;
    return (usersStore.currentPage - 1) * usersStore.itemsPerPage + 1;
  });

  const paginationEnd = computed(() => {
    return Math.min(
      usersStore.currentPage * usersStore.itemsPerPage,
      usersStore.totalUsers
    );
  });

  const goToPage = (page: number) => {
    if (page < 1 || page > usersStore.totalPages) return;
    usersStore.goToPage(page);
  };

  const handleSearch = () => {
    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value);
    }
    
    searchTimeout.value = window.setTimeout(() => {
      usersStore.searchUsers(searchQuery.value);
    }, 300);
  };
  
  const fetchUsers = async () => {
    await usersStore.fetchUsers();
  };

  const handleRoleFilter = () => {
    usersStore.filterByRole(roleFilter.value);
  };

  const handleStatusFilter = () => {
    usersStore.filterByStatus(statusFilter.value);
  };

const formatDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('fr-FR', options);
};

const getRoleLabel = (role: string): string => {
  const roleLabels: Record<string, string> = {
    user: 'Utilisateur',
    admin: 'Administrateur'
  };
  return roleLabels[role] || role;
};

const editUser = (user: User) => {
  userForm.value = {
    id: user.id || user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: '',
    role: user.role,
    active: user.isActive || user.active || false,
    birthDate: user.birthDate || '',
    newsletterSubscribed: user.newsletterSubscribed || false,
    phone: user.phone || '',
    smsNotifications: user.smsNotifications || false
  };
  showEditUserModal.value = true;
};

const updateUser = async () => {
  isSubmitting.value = true;
  
  try {
    if (!userForm.value.id) {
      throw new Error('ID utilisateur manquant');
    }
    
    const userId = userForm.value.id;
    
    const userData = {
      firstName: userForm.value.firstName,
      lastName: userForm.value.lastName,
      email: userForm.value.email,
      role: userForm.value.role,
      active: userForm.value.active,
      birthDate: userForm.value.birthDate,
      newsletterSubscribed: userForm.value.newsletterSubscribed,
      phone: userForm.value.phone,
      smsNotifications: userForm.value.smsNotifications
    };
    
    if (userForm.value.password && userForm.value.password.trim() !== '') {
      userData.password = userForm.value.password;
    }
    
    await api.put(`/user/${userId}`, userData);
    
    await usersStore.fetchUsers();
    
    closeUserModal();
  } catch (err: any) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', err);
    error.value = err.message || 'Erreur lors de la mise à jour de l\'utilisateur';
  } finally {
    isSubmitting.value = false;
  }
};

const addUser = async () => {
  isSubmitting.value = true;
  
  try {
    const response = await api.post('/user', userForm.value);
    
    await usersStore.fetchUsers();
    
    closeUserModal();
  } catch (err: any) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur:', err);
    error.value = err.message || 'Erreur lors de l\'ajout de l\'utilisateur';
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDeleteUser = (user: User) => {
  userToDelete.value = user;
  showDeleteModal.value = true;
};

const deleteUser = async () => {
  if (!userToDelete.value) return;
  
  isSubmitting.value = true;
  
  try {
    const userId = userToDelete.value.id || userToDelete.value._id;
    
    if (!userId) {
      throw new Error('ID utilisateur manquant');
    }
    
    await api.delete(`/user/${userId}`);
    
    await usersStore.fetchUsers();
    
    showDeleteModal.value = false;
    userToDelete.value = null;
  } catch (err: any) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', err);
    error.value = err.message || 'Erreur lors de la suppression de l\'utilisateur';
  } finally {
    isSubmitting.value = false;
  }
};

const showUserDetails = (userId: string) => {
  router.push({ name: 'admin-user-detail', params: { id: userId } });
};

const closeUserModal = () => {
  showAddUserModal.value = false;
  showEditUserModal.value = false;
  
  userForm.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'user',
    active: true,
    birthDate: '',
    newsletterSubscribed: false,
    phone: '',
    smsNotifications: false
  };
};

const showAddUserModal = ref(false);
const showEditUserModal = ref(false);
const showDeleteModal = ref(false);
const selectedUser = ref<User | null>(null);
const isSubmitting = ref(false);
const error = ref<string | null>(null);

const searchQuery = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const searchTimeout = ref<number | null>(null);
const userForm = ref<{
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  active: boolean;
  birthDate: string;
  newsletterSubscribed: boolean;
  phone: string;
  smsNotifications: boolean;
}>({  
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'user',
  active: true,
  birthDate: '',
  newsletterSubscribed: false,
  phone: '',
  smsNotifications: false
});

const userToDelete = ref<User | null>(null);
</script>

<style scoped>

.search-filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
  justify-content: space-between;
}

.search-bar {
  display: flex;
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  padding-right: 3rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.search-button {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  background: none;
  border: none;
  padding: 0 1rem;
  cursor: pointer;
  color: #757575;
  display: flex;
  align-items: center;
}

.search-button:hover {
  color: #1976d2;
}

.filters {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  min-width: 120px;
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

.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #e0e0e0;
}

.users-table th,
.users-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.users-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.users-table tr:hover {
  background-color: #f9f9f9;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.role-admin {
  background-color: #e3f2fd;
  color: #1976d2;
}

.role-user {
  background-color: #f5f5f5;
  color: #616161;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-active {
  background-color: #e8f5e9;
  color: #388e3c;
}

.status-inactive {
  background-color: #ffebee;
  color: #d32f2f;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.btn-icon:hover {
  background-color: #f0f0f0;
}

.btn-icon.delete:hover {
  background-color: #ffebee;
  color: #d32f2f;
}

.material-icons {
  font-size: 1.2rem;
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
  background-color: #f44336;
  color: white;
}

.btn-danger:hover {
  background-color: #d32f2f;
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

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-container input {
  margin-right: 0.5rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.pagination-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #f5f5f5;
  border-color: #bdbdbd;
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

.pagination-ellipsis {
  width: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #757575;
  font-weight: bold;
}

@media (max-width: 768px) {
  .users-container {
    padding: 1rem;
  }
  
  .admin-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .search-filters-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .pagination-container {
    flex-direction: column;
    align-items: center;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .modal-content {
    padding: 1.5rem;
    margin: 0 1rem;
  }
}
</style>
