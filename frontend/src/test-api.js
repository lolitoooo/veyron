import axios from 'axios';

const getServerUrl = () => {
  if (import.meta.env.VITE_BASE_URL) {
    return import.meta.env.VITE_BASE_URL;
  }
  
  if (import.meta.env.PROD) {
    return window.location.origin;
  }
  
  return 'http://localhost:3000';
};

async function testApi() {
  try {
    const serverUrl = getServerUrl();
    
    const baseResponse = await axios.get(`${serverUrl}/`);
    console.log('Réponse de la route de base:', baseResponse.data);
    
    const loginData = {
      email: 'loanpena77@gmail.com',
      password: 'Password123'
    };
    
    console.log('Test de la route de login...');
    const loginResponse = await axios.post(`${serverUrl}/api/auth/login`, loginData);
    console.log('Réponse de login:', loginResponse.data);
    
    return 'Tests terminés avec succès';
  } catch (error) {
    console.error('Erreur lors des tests:', error.message);
    if (error.response) {
      console.error('Détails de la réponse:', error.response.data);
      console.error('Status code:', error.response.status);
    }
    return 'Tests échoués';
  }
}

testApi().then(console.log);
