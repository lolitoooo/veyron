import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../auth';
import api from '@/services/apiService';

vi.mock('@/services/apiService', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('devrait réussir la connexion avec des identifiants valides', async () => {
      const mockToken = 'mock-token';
      const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' };
      
      (api.post as any).mockResolvedValueOnce({
        data: { token: mockToken }
      });
      
      (api.get as any).mockResolvedValueOnce({
        data: { 
          success: true,
          data: mockUser 
        }
      });
      
      const authStore = useAuthStore();
      
      const result = await authStore.login('test@example.com', 'password');
      
      expect(result).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/auth/login', { 
        email: 'test@example.com', 
        password: 'password' 
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', mockToken);
    });
  });

  describe('register', () => {
    it('devrait réussir l\'inscription avec des données valides', async () => {
      const mockToken = 'mock-token';
      const userData = { 
        _id: '',
        email: 'new@example.com', 
        firstName: 'New',
        lastName: 'User',
        password: 'password123' 
      };
      
      const mockResponse = {
        data: { 
          token: mockToken,
          user: { 
            ...userData, 
            id: '2', 
            role: 'user', 
            password: undefined 
          }
        }
      };
      
      (api.post as any).mockResolvedValueOnce(mockResponse);
      
      const authStore = useAuthStore();
      
      // Act
      const result = await authStore.register(userData);
      
      // Assert
      expect(result).toBe(true);
      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
    });
  });

  describe('logout', () => {
    it('devrait déconnecter l\'utilisateur et effacer les données', async () => {
      (api.post as any).mockResolvedValueOnce({});
      
      const authStore = useAuthStore();
      authStore.token = 'mock-token';
      authStore.user = { id: '1', email: 'test@example.com' } as any;
      
      await authStore.logout();
      
      expect(api.post).toHaveBeenCalledWith('/auth/logout');
      expect(authStore.user).toBeNull();
      expect(authStore.token).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });
  });
});
