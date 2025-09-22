import { ref, reactive } from 'vue';
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { createPaymentIntent, processPayment as confirmPayment } from '@/services/stripeService';

export function useStripe() {
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  const stripe = ref<Stripe | null>(null);
  const elements = ref<StripeElements | null>(null);
  const cardElement = ref<StripeCardElement | null>(null);
  
  const paymentState = reactive({
    isProcessing: false,
    error: null as string | null,
    paymentIntentId: null as string | null,
    clientSecret: null as string | null,
    paymentSuccess: false
  });

  const initStripe = async () => {
    try {
      stripe.value = await stripePromise;
      if (!stripe.value) {
        throw new Error('Impossible de charger Stripe');
      }
      
      elements.value = stripe.value.elements();
      cardElement.value = elements.value.create('card', {
        style: {
          base: {
            fontSize: '16px',
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            '::placeholder': {
              color: '#aab7c4'
            }
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        }
      });
      
      return cardElement.value;
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de Stripe:', error);
      paymentState.error = 'Erreur lors de l\'initialisation du système de paiement';
      return null;
    }
  };

  const createIntent = async (amount: number, currency: string = 'eur', orderId: string) => {
    paymentState.isProcessing = true;
    paymentState.error = null;
    
    try {
      const clientSecret = await createPaymentIntent(amount, currency, orderId);
      paymentState.clientSecret = clientSecret;
      return { clientSecret };
    } catch (error) {
      console.error('Erreur lors de la création de l\'intention de paiement:', error);
      paymentState.error = 'Erreur lors de la préparation du paiement';
      throw error;
    } finally {
      paymentState.isProcessing = false;
    }
  };

  const processPayment = async (billingDetails: {
    name: string;
    email: string;
    address?: {
      line1: string;
      city: string;
      postal_code: string;
      country: string;
    }
  }) => {
    if (!stripe.value || !elements.value || !cardElement.value || !paymentState.clientSecret) {
      paymentState.error = 'Configuration de paiement incomplète';
      return false;
    }

    paymentState.isProcessing = true;
    paymentState.error = null;

    try {
      const { error, paymentIntent } = await stripe.value.confirmCardPayment(
        paymentState.clientSecret,
        {
          payment_method: {
            card: cardElement.value,
            billing_details: billingDetails
          }
        }
      );

      if (error) {
        throw new Error(error.message || 'Erreur de paiement');
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        await confirmPayment(paymentState.clientSecret, {
          id: paymentIntent.payment_method
        });
        paymentState.paymentSuccess = true;
        return true;
      } else {
        throw new Error('Paiement non complété');
      }
    } catch (error: any) {
      console.error('Erreur lors du traitement du paiement:', error);
      paymentState.error = error.message || 'Erreur lors du traitement du paiement';
      return false;
    } finally {
      paymentState.isProcessing = false;
    }
  };

  const cleanup = () => {
    if (cardElement.value) {
      cardElement.value.destroy();
      cardElement.value = null;
    }
  };

  return {
    stripe,
    elements,
    cardElement,
    paymentState,
    initStripe,
    createIntent,
    processPayment,
    cleanup
  };
}
