const axios = require('axios');

class NotificationService {
  constructor() {
    this.ntfyUrl = process.env.NTFY_URL || 'https://ntfy.veyron-paris.fr';
    this.enabled = !!process.env.NTFY_URL;
  }

  async sendNotification(topic, message, options = {}) {
    if (!this.enabled) {
      console.log('[Notification] Service désactivé (NTFY_URL non configuré)');
      return;
    }

    try {
      const headers = {
        'Title': options.title || 'Veyron Paris',
        'Priority': options.priority || 'default',
        'Tags': options.tags || 'information_source',
      };

      if (options.clickUrl) {
        headers['Click'] = options.clickUrl;
      }

      if (options.actions) {
        headers['Actions'] = options.actions;
      }

      if (options.icon) {
        headers['Icon'] = options.icon;
      }

      await axios.post(`${this.ntfyUrl}/${topic}`, message, {
        headers,
        timeout: 5000
      });

      console.log(`[Notification] Envoyée sur ${topic}: ${message}`);
    } catch (error) {
      console.error('[Notification] Erreur envoi:', error.message);
    }
  }

  async notifyNewOrder(order) {
    const customerName = order.user 
      ? `${order.user.firstName} ${order.user.lastName}`
      : order.guestEmail;

    await this.sendNotification(
      'veyron-orders',
      `Nouvelle commande de ${customerName}\nMontant: ${order.totalPrice.toFixed(2)}€\nArticles: ${order.orderItems.length}`,
      {
        title: 'Nouvelle commande',
        priority: 'high',
        tags: 'shopping_cart,money',
        clickUrl: `https://veyron-paris.fr/admin/orders/${order._id}`,
        icon: 'https://veyron-paris.fr/logo.png',
        actions: `view, Voir la commande, https://veyron-paris.fr/admin/orders/${order._id}`
      }
    );
  }

  async notifyOrderPaid(order) {
    const customerName = order.shippingAddress 
      ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`
      : order.guestEmail || 'Client';

    await this.sendNotification(
      'veyron-orders',
      `Commande payée par ${customerName}\nMontant: ${order.totalPrice.toFixed(2)}€\nArticles: ${order.orderItems.length}`,
      {
        title: 'Nouvelle commande payée',
        priority: 'high',
        tags: 'white_check_mark,money,shopping_cart',
        clickUrl: `https://veyron-paris.fr/admin/orders/${order._id}`,
        actions: `view, Voir la commande, https://veyron-paris.fr/admin/orders/${order._id}`
      }
    );
  }

  async notifyReturnRequest(order) {
    await this.sendNotification(
      'veyron-returns',
      `Demande de retour pour la commande #${order._id.substring(0, 8)}\nRaison: ${order.returnReason || 'Non spécifiée'}`,
      {
        title: 'Demande de retour',
        priority: 'high',
        tags: 'warning,package',
        clickUrl: `https://veyron-paris.fr/admin/orders/${order._id}`
      }
    );
  }

  async notifyLowStock(product, variant) {
    const variantInfo = variant 
      ? `${variant.size} - ${variant.color}` 
      : 'Produit principal';

    await this.sendNotification(
      'veyron-stock',
      `Stock faible pour "${product.name}"\nVariante: ${variantInfo}\nStock restant: ${variant?.stock || product.countInStock}`,
      {
        title: 'Alerte stock',
        priority: 'high',
        tags: 'warning,package',
        clickUrl: `https://admin.veyron-paris.fr/products/${product._id}`
      }
    );
  }

  async notifyCriticalError(error, context = '') {
    await this.sendNotification(
      'veyron-alerts',
      `Erreur critique détectée\n${context ? `Contexte: ${context}\n` : ''}Message: ${error.message}\nStack: ${error.stack?.split('\n')[0] || 'N/A'}`,
      {
        title: 'Erreur critique',
        priority: 'urgent',
        tags: 'rotating_light,skull',
        clickUrl: 'https://glitchtip.veyron-paris.fr'
      }
    );
  }

  async notifySiteDown(service, message) {
    await this.sendNotification(
      'veyron-uptime',
      `Le service "${service}" est DOWN\n${message}`,
      {
        title: 'Service indisponible',
        priority: 'urgent',
        tags: 'rotating_light,x',
        clickUrl: 'https://uptime.veyron-paris.fr'
      }
    );
  }

  async notifySiteUp(service) {
    await this.sendNotification(
      'veyron-uptime',
      `Le service "${service}" est de nouveau opérationnel`,
      {
        title: 'Service rétabli',
        priority: 'default',
        tags: 'white_check_mark,rocket'
      }
    );
  }

  async notifyNewContact(name, email, subject) {
    await this.sendNotification(
      'veyron-contact',
      `Nouveau message de ${name}\nEmail: ${email}\nSujet: ${subject}`,
      {
        title: 'Nouveau contact',
        priority: 'default',
        tags: 'email,speech_balloon',
        clickUrl: 'https://admin.veyron-paris.fr/messages'
      }
    );
  }

  async notifyNewReview(product, rating, userName) {
    const stars = '⭐'.repeat(rating);
    
    await this.sendNotification(
      'veyron-reviews',
      `Nouvel avis sur "${product.name}"\nNote: ${stars} (${rating}/5)\nPar: ${userName}`,
      {
        title: 'Nouvel avis',
        priority: 'default',
        tags: 'star,speech_balloon',
        clickUrl: `https://veyron-paris.fr/products/${product._id}`
      }
    );
  }

  async notifySalesGoal(amount, goal) {
    await this.sendNotification(
      'veyron-sales',
      `Objectif de ventes atteint!\nMontant: ${amount.toFixed(2)}€\nObjectif: ${goal.toFixed(2)}€`,
      {
        title: 'Objectif atteint!',
        priority: 'default',
        tags: 'tada,chart_with_upwards_trend,money'
      }
    );
  }
}

module.exports = new NotificationService();
