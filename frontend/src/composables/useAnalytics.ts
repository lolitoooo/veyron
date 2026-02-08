declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, any>; revenue?: { currency: string; amount: number } }) => void;
  }
}

export function useAnalytics() {
  const trackEvent = (eventName: string, props?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible(eventName, { props });
    }
  };

  const trackPageView = (path?: string) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('pageview', path ? { props: { path } } : undefined);
    }
  };

  const trackPurchase = (orderId: string, amount: number, currency: string = 'EUR', items?: any[]) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Purchase', {
        revenue: { currency, amount },
        props: {
          orderId,
          itemCount: items?.length || 0,
          items: items?.map(item => item.name).join(', ')
        }
      });
    }
  };

  const trackAddToCart = (productId: string, productName: string, price: number, quantity: number = 1) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Add to Cart', {
        props: {
          productId,
          productName,
          price,
          quantity,
          total: price * quantity
        }
      });
    }
  };

  const trackRemoveFromCart = (productId: string, productName: string) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Remove from Cart', {
        props: {
          productId,
          productName
        }
      });
    }
  };

  const trackCheckoutStarted = (cartTotal: number, itemCount: number) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Checkout Started', {
        props: {
          cartTotal,
          itemCount
        }
      });
    }
  };

  const trackSignup = (method: string = 'email') => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Signup', {
        props: { method }
      });
    }
  };

  const trackLogin = (method: string = 'email') => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Login', {
        props: { method }
      });
    }
  };

  const trackSearch = (query: string, resultsCount: number) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Search', {
        props: {
          query,
          resultsCount
        }
      });
    }
  };

  const trackWishlistAdd = (productId: string, productName: string) => {
    if (typeof window !== 'undefined' && window.plausible) {
      window.plausible('Add to Wishlist', {
        props: {
          productId,
          productName
        }
      });
    }
  };

  return {
    trackEvent,
    trackPageView,
    trackPurchase,
    trackAddToCart,
    trackRemoveFromCart,
    trackCheckoutStarted,
    trackSignup,
    trackLogin,
    trackSearch,
    trackWishlistAdd
  };
}
