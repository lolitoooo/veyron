import { getServerUrl } from './imageUrl';

export const getApiUrl = (path: string): string => {
  const apiPath = import.meta.env.VITE_API_URL || '/api';
  
  if (apiPath.startsWith('http')) {
    return `${apiPath}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  const serverUrl = getServerUrl();
  return `${serverUrl}${apiPath}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getFullApiUrl = (path: string): string => {
  const apiPath = import.meta.env.VITE_API_URL || '/api';
  
  if (apiPath.startsWith('http')) {
    return `${apiPath}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  const serverUrl = getServerUrl();
  return `${serverUrl}${apiPath}${path.startsWith('/') ? path : `/${path}`}`;
};
