import { loadStripe } from '@stripe/stripe-js';
import api from './apiService';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_votreclépublique';

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
  }
  return stripePromise;
};

export const createPaymentIntent = async (amount: number, currency = 'eur', orderId: string) => {
  try {
    const response = await api.post('/payments/create-intent', {
      amount,
      currency,
      orderId
    });
    
    return response.data.clientSecret;
  } catch (error) {
    console.error('Erreur lors de la création de l\'intention de paiement:', error);
    throw new Error('Impossible de créer l\'intention de paiement');
  }
};

export const processPayment = async (clientSecret: string, paymentMethod: any) => {
  try {
    const stripe = await getStripe();
    
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    await api.post('/payments/confirm', {
      paymentIntentId: result.paymentIntent.id,
      paymentMethodId: paymentMethod.id
    });
    
    return {
      success: true,
      paymentId: result.paymentIntent.id,
      status: result.paymentIntent.status
    };
  } catch (error) {
    console.error('Erreur lors du traitement du paiement:', error);
    throw error;
  }
};

export const createCheckoutSession = async (orderId: string) => {
  try {
    const response = await api.post('/payments/create-checkout-session', { orderId });
    
    const stripe = await getStripe();
    const result = await stripe.redirectToCheckout({
      sessionId: response.data.sessionId
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    throw error;
  }
};
