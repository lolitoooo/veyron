import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import RegisterForm from '../RegisterForm.vue';
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
    validateRequired: vi.fn(() => true),
    errors: { value: {} },
    resetErrors: vi.fn()
  }))
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    register: vi.fn().mockResolvedValue(true),
    error: null,
    isLoading: false
  }))
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  
  const mountComponent = () => {
    return mount(RegisterForm, {
      global: {
        stubs: {
          'router-link': RouterLinkStub
        }
      }
    });
  };

  it('devrait afficher le formulaire d\'inscription avec tous les champs requis', () => {
    const wrapper = mountComponent();
    
    expect(wrapper.find('h2').text()).toBe('Inscription');
    expect(wrapper.find('input#firstName').exists()).toBe(true);
    expect(wrapper.find('input#lastName').exists()).toBe(true);
    expect(wrapper.find('input#email').exists()).toBe(true);
    expect(wrapper.find('input#password').exists()).toBe(true);
    expect(wrapper.find('input#confirmPassword').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('devrait mettre à jour les valeurs des champs lors de la saisie', async () => {
    const wrapper = mountComponent();
    
    await wrapper.find('input#firstName').setValue('John');
    await wrapper.find('input#lastName').setValue('Doe');
    await wrapper.find('input#email').setValue('john.doe@example.com');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('input#confirmPassword').setValue('password123');
    
    expect(wrapper.vm.firstName).toBe('John');
    expect(wrapper.vm.lastName).toBe('Doe');
    expect(wrapper.vm.email).toBe('john.doe@example.com');
    expect(wrapper.vm.password).toBe('password123');
    expect(wrapper.vm.confirmPassword).toBe('password123');
  });

  it('devrait soumettre le formulaire avec les valeurs correctes', async () => {
    const wrapper = mountComponent();
    
    await wrapper.find('input#firstName').setValue('John');
    await wrapper.find('input#lastName').setValue('Doe');
    await wrapper.find('input#email').setValue('john.doe@example.com');
    await wrapper.find('input#password').setValue('password123');
    await wrapper.find('input#confirmPassword').setValue('password123');
    
    await wrapper.find('form').trigger('submit');
    
    const authStore = wrapper.vm.authStore;
    expect(authStore.register).toHaveBeenCalledWith({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123'
    });
  });
});
