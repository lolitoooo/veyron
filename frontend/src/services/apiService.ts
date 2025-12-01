import axios from 'axios';
import type { AxiosInstance } from 'axios';

import { getServerUrl } from '../utils/imageUrl';

export const serverErrorEvent = new EventTarget();

export function emitServerError(message: string) {
  const event = new CustomEvent('server-error', { detail: { message } });
  serverErrorEvent.dispatchEvent(event);
}

const apiPath = import.meta.env.VITE_API_URL || '/api';
const serverUrl = getServerUrl();

const baseURL = apiPath.startsWith('/') ? `${serverUrl}${apiPath}` : apiPath;

const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 20000 // Augmenté à 20 secondes pour les requêtes lentes (ex: points relais)
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('Erreur API:', error);
    
    if (error.response && error.response.status === 401) {
      console.error('Erreur d\'authentification:', error);
      localStorage.removeItem('auth_token');
    }
    
    if (!error.response) {
      console.error('Erreur réseau:', error);
      emitServerError(`Le serveur backend n'est pas accessible. Vérifiez que le serveur est en cours d'exécution sur ${baseURL}.`);
    } else if (error.response.status >= 500) {
      console.error('Erreur serveur:', error);
      emitServerError(`Erreur serveur: ${error.response.status} - ${error.response.statusText || 'Erreur interne du serveur'}`);
    }
    
    return Promise.reject(error);
  }
);

export default api;
