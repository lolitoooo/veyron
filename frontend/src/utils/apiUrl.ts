/**
 * Utilitaire pour obtenir l'URL de l'API en fonction de l'environnement
 * Utilise la variable d'environnement VITE_API_URL si disponible, sinon utilise localhost
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Utilitaire pour obtenir l'URL complète de l'API (avec protocole et domaine)
 * Utile pour les téléchargements, ouvertures dans de nouveaux onglets, etc.
 */
export const getFullApiUrl = (path: string): string => {
  // Si VITE_API_URL est une URL relative (commence par /), on ajoute l'origine de la page
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  if (baseUrl.startsWith('/')) {
    return `${window.location.origin}${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
