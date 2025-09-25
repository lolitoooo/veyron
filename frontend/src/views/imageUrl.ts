export const getServerUrl = (): string => {
  if (import.meta.env.VITE_BASE_URL) {
    const baseUrl = import.meta.env.VITE_BASE_URL;
    if (baseUrl.includes('backend:3000')) {
      return 'http://localhost:3000';
    }
    return baseUrl;
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
  
  const serverUrl = getServerUrl();
  
  if (imagePath.startsWith('/')) {
    return `${serverUrl}${imagePath}`;
  } else {
    return `${serverUrl}/${imagePath}`;
  }
};

export default getImageUrl;
