import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import LoginForm from '../LoginForm.vue';
import { RouterLinkStub } from '@vue/test-utils';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn()
  }))
}));

vi.mock('@/composables/useNotification', () => ({
  useNotification: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn()
  }))
}));

vi.mock('@/composables/useValidation', () => ({
  useValidation: vi.fn(() => ({
    validateEmail: vi.fn(() => true),
    validatePassword: vi.fn(() => true),
    errors: { value: {} },
    resetErrors: vi.fn()
  }))
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    login: vi.fn().mockResolvedValue(true),
    error: null,
    isLoading: false
  }))
}));

describe('LoginForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  
  const mountComponent = () => {
    return mount(LoginForm, {
      global: {
        stubs: {
          'router-link': RouterLinkStub
        }
      }
    });
  };

  it('devrait afficher le formulaire de connexion avec les champs requis', () => {
    const wrapper = mountComponent();
    
    expect(wrapper.find('h2').text()).toBe('Connexion');
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('devrait mettre à jour les valeurs des champs lors de la saisie', async () => {
    const wrapper = mountComponent();
    
    const emailInput = wrapper.find('input[type="email"]');
    const passwordInput = wrapper.find('input[type="password"]');
    
    await emailInput.setValue('test@example.com');
    await passwordInput.setValue('password123');
    
    expect(wrapper.vm.email).toBe('test@example.com');
    expect(wrapper.vm.password).toBe('password123');
  });

  it('devrait soumettre le formulaire avec les valeurs correctes', async () => {
    const wrapper = mountComponent();
    
    await wrapper.find('input[type="email"]').setValue('test@example.com');
    await wrapper.find('input[type="password"]').setValue('password123');
    
    await wrapper.find('form').trigger('submit');
    
    const authStore = wrapper.vm.authStore;
    expect(authStore.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
