import { ref, computed } from 'vue';

export function useValidation() {
  const errors = ref<Record<string, string>>({});
  
  const hasErrors = computed(() => Object.keys(errors.value).length > 0);
  
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return 'L\'email est requis';
    }
    if (!emailRegex.test(email)) {
      return 'Format d\'email invalide';
    }
    return '';
  };
  
  const validatePassword = (password: string, minLength = 12): string => {
    if (!password) {
      return 'Le mot de passe est requis';
    }
    if (password.length < minLength) {
      return `Le mot de passe doit contenir au moins ${minLength} caractères`;
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
      return 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole';
    }
    
    return '';
  };
  
  const validateRequired = (value: any, fieldName: string): string => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} est requis`;
    }
    return '';
  };
  
  const validateMinLength = (value: string, minLength: number, fieldName: string): string => {
    if (value.length < minLength) {
      return `${fieldName} doit contenir au moins ${minLength} caractères`;
    }
    return '';
  };
  
  const validateNumber = (field: string, value: any, fieldName: string): boolean => {
    if (isNaN(Number(value))) {
      errors.value[field] = `${fieldName} doit être un nombre`;
      return false;
    }
    delete errors.value[field];
    return true;
  };
  
  const validatePositiveNumber = (field: string, value: any, fieldName: string): boolean => {
    if (isNaN(Number(value)) || Number(value) <= 0) {
      errors.value[field] = `${fieldName} doit être un nombre positif`;
      return false;
    }
    delete errors.value[field];
    return true;
  };
  
  const resetErrors = () => {
    errors.value = {};
  };
  
  return {
    errors,
    hasErrors,
    validateEmail,
    validatePassword,
    validateRequired,
    validateMinLength,
    validateNumber,
    validatePositiveNumber,
    resetErrors
  };
}
