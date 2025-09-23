export const getApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getFullApiUrl = (path: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  
  if (baseUrl.startsWith('/')) {
    return `${window.location.origin}${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};
