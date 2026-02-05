import { computed, type Ref } from 'vue';

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  percentage: number;
  feedback: string[];
}

export function usePasswordStrength(password: Ref<string>) {
  const strength = computed((): PasswordStrength => {
    const pwd = password.value;
    
    if (!pwd || pwd.length === 0) {
      return {
        score: 0,
        label: '',
        color: '#ddd',
        percentage: 0,
        feedback: []
      };
    }

    let score = 0;
    const feedback: string[] = [];

    if (pwd.length >= 12) {
      score += 25;
    } else {
      feedback.push(`${12 - pwd.length} caractère(s) manquant(s)`);
    }

    if (/[A-Z]/.test(pwd)) {
      score += 20;
    } else {
      feedback.push('Ajoutez une majuscule');
    }

    if (/[a-z]/.test(pwd)) {
      score += 20;
    } else {
      feedback.push('Ajoutez une minuscule');
    }

    if (/[0-9]/.test(pwd)) {
      score += 20;
    } else {
      feedback.push('Ajoutez un chiffre');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      score += 15;
    } else {
      feedback.push('Ajoutez un symbole');
    }

    let label = '';
    let color = '';

    if (score < 40) {
      label = 'Très faible';
      color = '#e74c3c';
    } else if (score < 60) {
      label = 'Faible';
      color = '#e67e22';
    } else if (score < 80) {
      label = 'Moyen';
      color = '#f39c12';
    } else if (score < 100) {
      label = 'Bon';
      color = '#3498db';
    } else {
      label = 'Excellent';
      color = '#27ae60';
    }

    return {
      score,
      label,
      color,
      percentage: score,
      feedback
    };
  });

  return {
    strength
  };
}
