const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const PromoCode = require('../models/PromoCode');
const ShippingConfig = require('../models/ShippingConfig');
const invoiceController = require('./invoiceController');
const { sendEmail } = require('../services/emailService');
const { orderConfirmationEmailTemplate, activateAccountEmailTemplate } = require('../templates/emailTemplates');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

const cleanImageUrl = (url) => {
  if (!url) return '';
  
  if (url.startsWith('/images/')) return url;
  
  try {
    if (url.includes('http://') || url.includes('https://')) {
      const urlObj = new URL(url);
      return urlObj.pathname;
    }
    
    if (!url.startsWith('/')) {
      return `/images/${url}`;
    }
    
    return url;
  } catch (err) {
    console.error('Erreur lors du nettoyage de l\'URL de l\'image:', err);
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return `/images/${filename}`;
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, promoCode, shippingMethod, relayPoint, useCashback } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Aucun article dans le panier' });
    }

    const lineItems = [];
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      
      if (!product) {
        return res.status(404).json({ 
          message: `Produit non trouvé: ${item.productId}` 
        });
      }
      
      if (product.countInStock < item.quantity) {
        return res.status(400).json({ 
          message: `Stock insuffisant pour ${product.name}` 
        });
      }

      const priceHT = parseFloat((item.price / 1.2).toFixed(2));
      
      orderItems.push({
        name: item.name,
        qty: item.quantity,
        image: cleanImageUrl(item.image),
        price: item.price,
        priceHT: priceHT,
        variant: item.variant,
        variantId: item.variantId,
        product: item.productId
      });

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `VEYRON - ${item.name} - ${item.variant.size} - ${item.variant.color}`,
            images: [],
            metadata: {
              productId: item.productId,
              variantId: item.variantId
            }
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const subtotalHT = orderItems.reduce((sum, item) => sum + (item.priceHT * item.qty), 0);
    
    // Récupérer la configuration de livraison dynamique
    const shippingConfig = await ShippingConfig.findOne({ 
      name: shippingMethod || 'home_delivery', 
      enabled: true 
    });
    
    if (!shippingConfig) {
      return res.status(400).json({ 
        message: 'Méthode de livraison non disponible' 
      });
    }
    
    // Calculer les frais de livraison selon la configuration
    const shippingPrice = subtotal >= shippingConfig.freeShippingThreshold 
      ? 0 
      : shippingConfig.price;
    
    let promoCodeData = null;
    let discountAmount = 0;
    let discountPercentage = 0;
    
    if (promoCode && promoCode.code) {
      try {
        const promoCodeDoc = await PromoCode.findOne({ code: promoCode.code.toUpperCase() });
        
        if (promoCodeDoc && promoCodeDoc.isValid()) {
          if (subtotal >= promoCodeDoc.minOrderValue) {
            if (promoCodeDoc.discountType === 'percentage') {
              discountPercentage = promoCodeDoc.discountValue;
              discountAmount = parseFloat((subtotal * (discountPercentage / 100)).toFixed(2));
              
              if (promoCodeDoc.maxDiscountAmount && discountAmount > promoCodeDoc.maxDiscountAmount) {
                discountAmount = parseFloat(promoCodeDoc.maxDiscountAmount.toFixed(2));
              }
            } else if (promoCodeDoc.discountType === 'fixed') {
              discountAmount = parseFloat(promoCodeDoc.discountValue.toFixed(2));
              discountPercentage = parseFloat(((discountAmount / subtotal) * 100).toFixed(2));
              
              if (discountAmount > subtotal) {
                discountAmount = subtotal;
                discountPercentage = 100;
              }
            }
            
            promoCodeData = {
              code: promoCodeDoc.code,
              title: promoCodeDoc.title,
              discountType: promoCodeDoc.discountType,
              discountValue: promoCodeDoc.discountValue,
              discountAmount: discountAmount,
              promoCodeId: promoCodeDoc._id
            };
            
            promoCodeDoc.currentUses += 1;
            await promoCodeDoc.save();
          }
        }
      } catch (promoError) {
        console.error('Erreur lors du traitement du code promo:', promoError);
      }
    }
    
    let cashbackUsed = 0;
    if (useCashback !== false) {
      try {
        const loyaltyService = require('../services/loyaltyService');
        const subtotalAfterPromo = subtotal - discountAmount;
        const maxCashback = await loyaltyService.calculateMaxCashbackUsage(req.user.id, subtotalAfterPromo);
        cashbackUsed = maxCashback;
        
        if (cashbackUsed > 0) {
          console.log(`[Checkout] Cashback appliqué: ${cashbackUsed}€ pour user ${req.user.id}`);
        }
      } catch (cashbackError) {
        console.error('[Checkout] Erreur calcul cashback:', cashbackError);
      }
    } else {
      console.log(`[Checkout] Cashback désactivé par l'utilisateur`);
    }
    
    const discountedSubtotal = parseFloat((subtotal - discountAmount - cashbackUsed).toFixed(2));
    const totalPrice = parseFloat((discountedSubtotal + shippingPrice).toFixed(2));

    const order = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: 'stripe',
      shippingMethod: shippingMethod || 'home_delivery',
      ...(shippingMethod === 'relay_point' && relayPoint && {
        relayPoint: {
          id: relayPoint.id,
          carrier: relayPoint.carrier || 'Point Relais',
          name: relayPoint.name,
          address: relayPoint.address,
          postalCode: relayPoint.postalCode,
          city: relayPoint.city
        }
      }),
      shippingPrice,
      taxPrice: parseFloat((subtotal - subtotalHT).toFixed(2)),
      subtotalHT: parseFloat(subtotalHT.toFixed(2)),
      subtotalTTC: parseFloat(subtotal.toFixed(2)),
      discountAmount,
      discountPercentage,
      cashbackUsed,
      promoCode: promoCodeData,
      totalPrice,
      status: 'pending'
    });

    order.generateInvoiceNumber();
    
    // Log pour vérifier les données de la commande
    console.log('Création de commande:', {
      shippingMethod: order.shippingMethod,
      relayPoint: order.relayPoint,
      shippingAddress: order.shippingAddress
    });
    
    const savedOrder = await order.save();

    try {
      await notificationService.notifyNewOrder(savedOrder);
    } catch (notifError) {
      console.error('[Notification] Erreur nouvelle commande:', notifError.message);
    }

    let discountOptions = {};
    
    const totalDiscount = discountAmount + cashbackUsed;
    
    if (totalDiscount > 0) {
      let discountName = '';
      if (discountAmount > 0 && cashbackUsed > 0) {
        discountName = `Réduction (${promoCodeData?.code || 'Promo'}) + Cashback`;
      } else if (discountAmount > 0) {
        discountName = promoCodeData ? promoCodeData.title : 'Réduction appliquée';
      } else if (cashbackUsed > 0) {
        discountName = 'Cashback fidélité';
      }
      
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(totalDiscount * 100),
        currency: 'eur',
        name: discountName,
        duration: 'once'
      });
      
      discountOptions = {
        discounts: [{
          coupon: coupon.id,
        }]
      };
    }
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: req.user.email,
      client_reference_id: savedOrder._id.toString(),
      metadata: {
        orderId: savedOrder._id.toString(),
        userId: req.user.id,
        shippingMethod: shippingMethod || 'home_delivery',
        ...(shippingMethod === 'relay_point' && relayPoint && {
          relayPointId: relayPoint.id,
          relayPointName: relayPoint.name,
          relayPointAddress: `${relayPoint.address}, ${relayPoint.postalCode} ${relayPoint.city}`
        }),
        ...(promoCodeData && { promoCode: promoCodeData.code }),
        ...(discountAmount > 0 && { discountAmount: discountAmount.toString() }),
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed?session_id={CHECKOUT_SESSION_ID}`,
      ...discountOptions,
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(shippingPrice * 100),
              currency: 'eur',
            },
            display_name: shippingMethod === 'relay_point' && relayPoint 
              ? `Point Relais - ${relayPoint.name}` 
              : (shippingPrice > 0 ? 'Livraison standard' : 'Livraison gratuite'),
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 5,
              },
            }
          }
        }
      ]
    });

    savedOrder.stripeSessionId = session.id;
    await savedOrder.save();

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: savedOrder._id
    });
  } catch (err) {
    console.error('Erreur Stripe:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.createCheckoutSessionGuest = async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, promoCode, shippingMethod, relayPoint, email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email requis' });
    }

    const emailLower = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailLower)) {
      return res.status(400).json({ message: 'Format d\'email invalide' });
    }

    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      return res.status(400).json({
        message: 'Cet email possède déjà un compte. Veuillez vous connecter pour finaliser votre commande.'
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Aucun article dans le panier' });
    }

    const lineItems = [];
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: `Produit non trouvé: ${item.productId}`
        });
      }

      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          message: `Stock insuffisant pour ${product.name}`
        });
      }

      const priceHT = parseFloat((item.price / 1.2).toFixed(2));

      orderItems.push({
        name: item.name,
        qty: item.quantity,
        image: cleanImageUrl(item.image),
        price: item.price,
        priceHT: priceHT,
        variant: item.variant,
        variantId: item.variantId,
        product: item.productId
      });

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: `VEYRON - ${item.name} - ${item.variant.size} - ${item.variant.color}`,
            images: [],
            metadata: {
              productId: item.productId,
              variantId: item.variantId
            }
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const subtotalHT = orderItems.reduce((sum, item) => sum + (item.priceHT * item.qty), 0);

    const shippingConfig = await ShippingConfig.findOne({
      name: shippingMethod || 'home_delivery',
      enabled: true
    });

    if (!shippingConfig) {
      return res.status(400).json({
        message: 'Méthode de livraison non disponible'
      });
    }

    const shippingPrice = subtotal >= shippingConfig.freeShippingThreshold
      ? 0
      : shippingConfig.price;

    let promoCodeData = null;
    let discountAmount = 0;
    let discountPercentage = 0;

    if (promoCode && promoCode.code) {
      try {
        const promoCodeDoc = await PromoCode.findOne({ code: promoCode.code.toUpperCase() });

        if (promoCodeDoc && promoCodeDoc.isValid()) {
          if (subtotal >= promoCodeDoc.minOrderValue) {
            if (promoCodeDoc.discountType === 'percentage') {
              discountPercentage = promoCodeDoc.discountValue;
              discountAmount = parseFloat((subtotal * (discountPercentage / 100)).toFixed(2));

              if (promoCodeDoc.maxDiscountAmount && discountAmount > promoCodeDoc.maxDiscountAmount) {
                discountAmount = parseFloat(promoCodeDoc.maxDiscountAmount.toFixed(2));
              }
            } else if (promoCodeDoc.discountType === 'fixed') {
              discountAmount = parseFloat(promoCodeDoc.discountValue.toFixed(2));
              discountPercentage = parseFloat(((discountAmount / subtotal) * 100).toFixed(2));

              if (discountAmount > subtotal) {
                discountAmount = subtotal;
                discountPercentage = 100;
              }
            }

            promoCodeData = {
              code: promoCodeDoc.code,
              title: promoCodeDoc.title,
              discountType: promoCodeDoc.discountType,
              discountValue: promoCodeDoc.discountValue,
              discountAmount: discountAmount,
              promoCodeId: promoCodeDoc._id
            };

            promoCodeDoc.currentUses += 1;
            await promoCodeDoc.save();
          }
        }
      } catch (promoError) {
        console.error('Erreur lors du traitement du code promo:', promoError);
      }
    }

    const discountedSubtotal = parseFloat((subtotal - discountAmount).toFixed(2));
    const totalPrice = parseFloat((discountedSubtotal + shippingPrice).toFixed(2));

    const order = new Order({
      guestEmail: emailLower,
      orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: 'stripe',
      shippingMethod: shippingMethod || 'home_delivery',
      ...(shippingMethod === 'relay_point' && relayPoint && {
        relayPoint: {
          id: relayPoint.id,
          carrier: relayPoint.carrier || 'Point Relais',
          name: relayPoint.name,
          address: relayPoint.address,
          postalCode: relayPoint.postalCode,
          city: relayPoint.city
        }
      }),
      shippingPrice,
      taxPrice: parseFloat((subtotal - subtotalHT).toFixed(2)),
      subtotalHT: parseFloat(subtotalHT.toFixed(2)),
      subtotalTTC: parseFloat(subtotal.toFixed(2)),
      discountAmount,
      discountPercentage,
      promoCode: promoCodeData,
      totalPrice,
      status: 'pending'
    });

    order.generateInvoiceNumber();
    const savedOrder = await order.save();

    let discountOptions = {};

    if (discountAmount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: 'eur',
        name: promoCodeData ? promoCodeData.title : 'Réduction appliquée',
        duration: 'once'
      });

      discountOptions = {
        discounts: [{
          coupon: coupon.id,
        }]
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: emailLower,
      client_reference_id: savedOrder._id.toString(),
      metadata: {
        orderId: savedOrder._id.toString(),
        guestEmail: emailLower,
        shippingMethod: shippingMethod || 'home_delivery',
        ...(shippingMethod === 'relay_point' && relayPoint && {
          relayPointId: relayPoint.id,
          relayPointName: relayPoint.name,
          relayPointAddress: `${relayPoint.address}, ${relayPoint.postalCode} ${relayPoint.city}`
        }),
        ...(promoCodeData && { promoCode: promoCodeData.code }),
        ...(discountAmount > 0 && { discountAmount: discountAmount.toString() }),
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed?session_id={CHECKOUT_SESSION_ID}`,
      ...discountOptions,
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(shippingPrice * 100),
              currency: 'eur',
            },
            display_name: shippingMethod === 'relay_point' && relayPoint
              ? `Point Relais - ${relayPoint.name}`
              : (shippingPrice > 0 ? 'Livraison standard' : 'Livraison gratuite'),
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 5,
              },
            }
          }
        }
      ]
    });

    savedOrder.stripeSessionId = session.id;
    await savedOrder.save();

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      orderId: savedOrder._id
    });
  } catch (err) {
    console.error('Erreur Stripe (guest):', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: 'Session de paiement non trouvée' });
    }
    
    const order = await Order.findOne({ stripeSessionId: sessionId });
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    if (process.env.NODE_ENV === 'development' && !process.env.STRIPE_WEBHOOK_SECRET) {
      
      if (!order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.status = 'processing';
        order.paymentResult = {
          id: session.id,
          status: 'paid',
          update_time: new Date().toISOString(),
          email_address: order.guestEmail || session.customer_details?.email,
          payment_intent: session.payment_intent || 'dev_mode_no_intent'
        };
        
        for (const item of order.orderItems) {
          const product = await Product.findById(item.product);
          if (product) {
            product.countInStock -= item.qty;
            await product.save();
          }
        }
        
        try {
          await invoiceController.generateInvoiceOnPayment(order, false);
        } catch (invoiceError) {
        }
        
        await order.save();
        
        try {
          const user = await User.findById(order.user);
          if (user) {
            await sendEmail({
              to: user.email,
              subject: `Confirmation de commande #${order.invoiceNumber || order._id} - Veyron Paris`,
              html: orderConfirmationEmailTemplate(order, user)
            });
          }
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        }
      }
    } 
    else if (session.payment_status === 'paid' && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: session.id,
        status: session.payment_status,
        update_time: new Date().toISOString(),
        payment_intent: session.payment_intent,
        client_secret: session.client_secret
      };
      
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.countInStock -= item.qty;
          await product.save();
        }
      }
      
      try {
        await invoiceController.generateInvoiceOnPayment(order, false);
      } catch (invoiceError) {
        console.error('Erreur lors de la génération automatique de la facture:', invoiceError);
      }
      
      await order.save();
      
      try {
        const user = await User.findById(order.user);
        if (user) {
          await sendEmail({
            to: user.email,
            subject: `Confirmation de commande #${order.invoiceNumber || order._id} - Veyron Paris`,
            html: orderConfirmationEmailTemplate(order, user)
          });
        }
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
      }
    }
    
    res.status(200).json({
      success: true,
      session,
      order
    });
  } catch (err) {
    console.error('Erreur Stripe:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getCheckoutSessionPublic = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session de paiement non trouvée' });
    }

    const order = await Order.findOne({ stripeSessionId: sessionId });
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    res.status(200).json({
      success: true,
      session: {
        id: session.id,
        payment_status: session.payment_status,
        status: session.status,
        customer_email: session.customer_details?.email || session.customer_email
      },
      order: {
        id: order._id,
        invoiceNumber: order.invoiceNumber,
        isPaid: order.isPaid,
        status: order.status,
        totalPrice: order.totalPrice
      }
    });
  } catch (err) {
    console.error('Erreur Stripe (public session):', err);
    res.status(500).json({ message: err.message });
  }
};

exports.webhook = async (req, res) => {
  if (process.env.NODE_ENV === 'development' && !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(200).json({ received: true, mode: 'development' });
  }
  
  const sig = req.headers['stripe-signature'];
  let event;

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET non défini');
    return res.status(400).send('Configuration du webhook manquante');
  }

  if (!sig) {
    console.error('Header stripe-signature manquant');
    return res.status(400).send('Webhook Error: Missing stripe-signature header');
  }

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Erreur de signature webhook: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      const order = await Order.findOne({ stripeSessionId: session.id });
      
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: session.id,
          status: session.payment_status,
          update_time: new Date().toISOString(),
          email_address: session.customer_details?.email
        };
        
        try {
          await invoiceController.generateInvoiceOnPayment(order, false);
        } catch (invoiceError) {
          console.error('Erreur lors de la génération automatique de la facture via webhook:', invoiceError);
        }
        
        await order.save();
        
        try {
          await notificationService.notifyOrderPaid(order);
        } catch (notifError) {
          console.error('[Notification] Erreur paiement confirmé:', notifError.message);
        }
        
        if (order.user) {
          try {
            const loyaltyService = require('../services/loyaltyService');
            const orderItemsTotal = order.orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
            await loyaltyService.creditCashbackAndXp(
              order.user,
              orderItemsTotal,
              order._id,
              session.id
            );
            
            if (order.cashbackUsed && order.cashbackUsed > 0) {
              await loyaltyService.spendCashback(
                order.user,
                order.cashbackUsed,
                order._id,
                session.id
              );
            }
          } catch (loyaltyError) {
            console.error('[Stripe webhook] Erreur lors du crédit cashback/XP:', loyaltyError);
          }
        }
        
        try {
          const recipientEmail = order.user
            ? (await User.findById(order.user))?.email
            : (order.guestEmail || session.customer_details?.email);

          console.log('[Stripe webhook] checkout.session.completed', {
            sessionId: session.id,
            orderId: order._id?.toString?.() || order._id,
            orderUser: order.user ? order.user.toString?.() || order.user : null,
            orderGuestEmail: order.guestEmail || null,
            sessionCustomerEmail: session.customer_details?.email || null,
            recipientEmail: recipientEmail || null
          });

          const templateUser = order.user
            ? await User.findById(order.user)
            : { firstName: order.shippingAddress?.firstName || 'Bonjour' };

          if (recipientEmail && templateUser) {
            console.log('[Stripe webhook] Envoi email confirmation commande ->', recipientEmail);
            await sendEmail({
              to: recipientEmail,
              subject: `Confirmation de commande #${order.invoiceNumber || order._id} - Veyron Paris`,
              html: orderConfirmationEmailTemplate(order, templateUser)
            });
          }

          if (!order.user) {
            const activationEmail = order.guestEmail || session.customer_details?.email;

            console.log('[Stripe webhook] Activation email candidate ->', activationEmail || null);

            if (activationEmail) {
              const existingUser = await User.findOne({ email: activationEmail.toLowerCase().trim() });

              console.log('[Stripe webhook] existingUser for activationEmail ->', existingUser ? existingUser._id?.toString?.() || existingUser._id : null);

              if (!existingUser) {
                const generatedPassword = crypto.randomBytes(16).toString('hex');
                const newUser = new User({
                  firstName: order.shippingAddress?.firstName || 'Client',
                  lastName: order.shippingAddress?.lastName || 'Veyron',
                  email: activationEmail.toLowerCase().trim(),
                  password: generatedPassword,
                  isActive: false
                });

                const token = newUser.getActivationToken();
                await newUser.save();

                order.user = newUser._id;
                await order.save();

                const activationUrl = `${process.env.FRONTEND_URL}/activate-account/${token}`;

                console.log('[Stripe webhook] Envoi email activation compte ->', newUser.email);
                await sendEmail({
                  to: newUser.email,
                  subject: 'Activez votre compte - Veyron Paris',
                  html: activateAccountEmailTemplate(newUser.firstName, activationUrl)
                });
              } else {
                if (!order.user) {
                  order.user = existingUser._id;
                  await order.save();
                }

                if (existingUser.isActive === false) {
                  const now = Date.now();
                  const tokenExpired = !existingUser.activationExpire || existingUser.activationExpire.getTime() < now;
                  const tokenMissing = !existingUser.activationToken;

                  const token = (tokenMissing || tokenExpired)
                    ? existingUser.getActivationToken()
                    : undefined;

                  if (token) {
                    await existingUser.save();
                  }

                  const activationUrl = `${process.env.FRONTEND_URL}/activate-account/${token || ''}`;

                  console.log('[Stripe webhook] Re-envoi email activation compte ->', existingUser.email);
                  await sendEmail({
                    to: existingUser.email,
                    subject: 'Activez votre compte - Veyron Paris',
                    html: activateAccountEmailTemplate(existingUser.firstName, activationUrl)
                  });
                }
              }
            }
          }
        } catch (emailError) {
          console.error('Erreur lors de l\'envoi de l\'email de confirmation via webhook:', emailError);
        }
      }
      break;
      
    case 'checkout.session.expired':
      const expiredSession = event.data.object;
      const expiredOrder = await Order.findOne({ stripeSessionId: expiredSession.id });
      
      if (expiredOrder && !expiredOrder.isPaid) {
        expiredOrder.status = 'cancelled';
        await expiredOrder.save();
      }
      break;
  }

  res.status(200).json({ received: true });
};

exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('user', 'firstName lastName email');
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    if (!order.isPaid) {
      return res.status(400).json({ message: 'La commande n\'est pas encore payée' });
    }
    
    if (!order.invoiceNumber) {
      order.generateInvoiceNumber();
    }
    
    order.invoiceUrl = `/invoices/${order.invoiceNumber}.pdf`;
    await order.save();
    
    res.status(200).json({
      success: true,
      invoiceNumber: order.invoiceNumber,
      invoiceUrl: order.invoiceUrl
    });
  } catch (err) {
    console.error('Erreur lors de la génération de la facture:', err);
    res.status(500).json({ message: err.message });
  }
};
