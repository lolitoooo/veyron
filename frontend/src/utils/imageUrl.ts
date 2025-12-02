export const getServerUrl = (): string => {
  if (window.location.protocol === 'capacitor:') {
    return import.meta.env.VITE_BASE_URL || 'https://preprod.veyron-paris.fr';
  }
  
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL;
  }
  
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  return 'http://localhost:3000';
};

export const getImageServerUrl = (): string => {
  if (window.location.protocol === 'capacitor:') {
    return import.meta.env.VITE_IMAGE_URL || 'https://preprod.veyron-paris.fr';
  }
  
  if (import.meta.env.VITE_IMAGE_URL) {
    return import.meta.env.VITE_IMAGE_URL;
  }
  
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  return 'http://localhost:3000';
};

export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '/placeholder.jpg';
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  const serverUrl = getImageServerUrl();
  
  if (imagePath.startsWith('/')) {
    return `${serverUrl}${imagePath}`;
  } else {
    return `${serverUrl}/${imagePath}`;
  }
};

export default getImageUrl;
