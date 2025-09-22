const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const Product = require('../models/Product');
const invoiceController = require('./invoiceController');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress } = req.body;
    
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
        image: item.image,
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
    const shippingPrice = subtotal > 50 ? 0 : 5.95;
    const totalPrice = subtotal + shippingPrice;

    const order = new Order({
      user: req.user.id,
      orderItems,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod: 'stripe',
      shippingPrice,
      taxPrice: parseFloat((subtotal - (subtotal / 1.2)).toFixed(2)),
      totalPrice,
      status: 'pending'
    });

    order.generateInvoiceNumber();
    const savedOrder = await order.save();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: req.user.email,
      client_reference_id: savedOrder._id.toString(),
      metadata: {
        orderId: savedOrder._id.toString(),
        userId: req.user.id
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-failed?session_id={CHECKOUT_SESSION_ID}`,
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: Math.round(shippingPrice * 100),
              currency: 'eur',
            },
            display_name: shippingPrice > 0 ? 'Livraison standard' : 'Livraison gratuite',
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
          email_address: req.user.email,
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

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody, 
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
