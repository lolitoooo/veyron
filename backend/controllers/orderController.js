const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const InvoiceService = require('../services/invoiceService');
const path = require('path');
const fs = require('fs-extra');

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

exports.createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingPrice,
      taxPrice,
      totalPrice
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Aucun article dans la commande' });
    }
    
    const cleanedOrderItems = orderItems.map(item => ({
      ...item,
      image: cleanImageUrl(item.image)
    }));

    for (const item of cleanedOrderItems) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({ 
          message: `Produit non trouvé: ${item.product}` 
        });
      }
      
      if (product.countInStock < item.qty) {
        return res.status(400).json({ 
          message: `Stock insuffisant pour ${product.name}` 
        });
      }
      
      if (product.price !== item.price) {
        return res.status(400).json({ 
          message: `Le prix du produit ${product.name} a changé` 
        });
      }
    }

    const order = new Order({
      user: req.user.id,
      orderItems: cleanedOrderItems,
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingPrice,
      taxPrice,
      totalPrice,
      status: 'pending'
    });

    order.generateInvoiceNumber();
    const createdOrder = await order.save();

    res.status(201).json({
      success: true,
      data: createdOrder
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .sort('-createdAt')
      .select('_id orderItems totalPrice status isPaid paidAt createdAt invoiceNumber');
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName email');
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
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
      await order.save();
    }
        
    res.status(200).json({
      success: true,
      invoiceNumber: order.invoiceNumber,
      invoiceDate: order.invoiceDate || order.paidAt,
      orderNumber: order.getFormattedOrderNumber(),
      customer: {
        name: `${order.user.firstName} ${order.user.lastName}`,
        email: order.user.email,
        address: order.billingAddress
      },
      items: order.orderItems.map(item => ({
        name: item.name,
        variant: `${item.variant.size} - ${item.variant.color}`,
        quantity: item.qty,
        priceTTC: item.price,
        priceHT: item.priceHT,
        totalTTC: item.price * item.qty,
        totalHT: item.priceHT * item.qty
      })),
      subtotalTTC: order.orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0),
      subtotalHT: order.orderItems.reduce((sum, item) => sum + (item.priceHT * item.qty), 0),
      taxAmount: order.taxPrice,
      shippingPrice: order.shippingPrice,
      totalPrice: order.totalPrice
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    if (!order.canBeCancelled()) {
      return res.status(400).json({ 
        message: 'Cette commande ne peut plus être annulée',
        details: {
          status: order.status,
          isPaid: order.isPaid
        }
      });
    }
    
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock += item.qty;
        await product.save();
      }
    }
    
    order.status = 'cancelled';
    
    try {
      const invoiceController = require('./invoiceController');
      await invoiceController.generateInvoiceOnPayment(order, false);
    } catch (invoiceError) {
      console.error('Erreur lors de la génération de la facture d\'annulation:', invoiceError);
    }
    
    const updatedOrder = await order.save();
    
    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Veuillez fournir un statut' });
    }
    
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.countInStock += item.qty;
          await product.save();
        }
      }
    }
    
    order.status = status;
    
    if (status === 'delivered') {
      order.deliveredAt = Date.now();
    }
    
    const updatedOrder = await order.save();
    
    res.status(200).json({
      success: true,
      data: updatedOrder
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.processPayment = async (req, res) => {
  try {
    return res.status(400).json({ message: 'Cette méthode est obsolète. Veuillez utiliser Stripe pour les paiements.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const sort = req.query.sort || '-createdAt';
    
    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: orders
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @desc    Récupère toutes les commandes sans pagination pour les statistiques
 * @route   GET /api/orders/all
 * @access  Private/Admin
 */
exports.getAllOrdersWithoutPagination = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const sort = req.query.sort || '-createdAt';
    
    const orders = await Order.find(filter)
      .populate('user', 'firstName lastName email')
      .sort(sort);
    
    const total = orders.length;
    
    res.status(200).json({
      success: true,
      count: total,
      total,
      pages: 1,
      currentPage: 1,
      data: orders
    });
  } catch (err) {
    console.error('Erreur lors de la récupération de toutes les commandes:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.cancelOrderBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'ID de session requis' });
    }
    
    const order = await Order.findOne({ stripeSessionId: sessionId });
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée pour cette session' });
    }
    
    if (order.isPaid || order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ 
        message: 'Cette commande ne peut plus être annulée' 
      });
    }
    
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock += item.qty;
        await product.save();
      }
    }
    
    order.status = 'cancelled';
    order.cancelReason = req.body.cancelReason || 'Paiement annulé';
    
    try {
      const invoiceController = require('./invoiceController');
      await invoiceController.generateInvoiceOnPayment(order, false);
    } catch (invoiceError) {
      console.error('Erreur lors de la génération de la facture d\'annulation par session:', invoiceError);
    }
    
    const updatedOrder = await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Commande annulée avec succès',
      data: updatedOrder
    });
  } catch (err) {
    console.error('Erreur lors de l\'annulation de la commande:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getTotalRevenue = async (req, res) => {
  try {
    
    const orders = await Order.find({});
        
    let totalRevenue = 0;
    let orderCount = 0;
    
    for (const order of orders) {
      if (order.totalPrice) {
        totalRevenue += Number(order.totalPrice);
        orderCount++;
      }
    }
    
    
    res.status(200).json({
      success: true,
      totalRevenue: totalRevenue,
      orderCount: orderCount,
      totalOrders: orders.length
    });
  } catch (err) {
    console.error('Erreur lors du calcul du chiffre d\'affaires:', err);
    res.status(500).json({ message: err.message });
  }
};