const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const colissimoService = require('../services/colissimoService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/generate/:orderId', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).populate('user', 'email');

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (!order.isPaid) {
      return res.status(400).json({ message: 'La commande doit être payée avant de générer une étiquette' });
    }

    if (order.shippingLabelUrl) {
      return res.status(400).json({ 
        message: 'Une étiquette a déjà été générée pour cette commande',
        labelUrl: order.shippingLabelUrl
      });
    }

    const result = await colissimoService.generateShippingLabel(order);

    if (result.success) {
      order.trackingNumber = result.trackingNumber;
      order.carrier = 'Colissimo';
      order.shippingLabelUrl = result.labelUrl;
      order.shippingLabelPath = result.labelPath;
      order.shippingLabelGeneratedAt = new Date();
      order.status = 'processing';
      
      await order.save();

      res.json({
        success: true,
        message: 'Étiquette générée avec succès',
        trackingNumber: result.trackingNumber,
        labelUrl: result.labelUrl,
        pdfBase64: result.pdfBase64
      });
    } else {
      throw new Error('Échec de la génération de l\'étiquette');
    }
  } catch (error) {
    console.error('Erreur génération étiquette:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la génération de l\'étiquette',
      error: error.message 
    });
  }
});

router.post('/return/:orderId', protect, authorize('admin'), async (req, res) => {
  try {
    const { returnReason } = req.body;
    const order = await Order.findById(req.params.orderId).populate('user', 'email');

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (!order.isPaid) {
      return res.status(400).json({ message: 'La commande doit être payée' });
    }

    if (order.returnLabelUrl) {
      return res.status(400).json({ 
        message: 'Une étiquette de retour a déjà été générée',
        labelUrl: order.returnLabelUrl
      });
    }

    const result = await colissimoService.generateReturnLabel(order, returnReason);

    if (result.success) {
      order.returnTrackingNumber = result.returnTrackingNumber;
      order.returnLabelUrl = result.returnLabelUrl;
      order.returnLabelPath = result.returnLabelPath;
      order.returnLabelGeneratedAt = new Date();
      order.returnStatus = 'label_generated';
      order.returnReason = returnReason || 'Retour client';
      
      if (!order.returnRequestedAt) {
        order.returnRequestedAt = new Date();
      }
      
      await order.save();

      res.json({
        success: true,
        message: 'Étiquette de retour générée avec succès',
        returnTrackingNumber: result.returnTrackingNumber,
        labelUrl: result.returnLabelUrl,
        pdfBase64: result.pdfBase64
      });
    } else {
      throw new Error('Échec de la génération de l\'étiquette de retour');
    }
  } catch (error) {
    console.error('Erreur génération étiquette retour:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la génération de l\'étiquette de retour',
      error: error.message 
    });
  }
});

router.get('/track/:trackingNumber', protect, async (req, res) => {
  try {
    const result = await colissimoService.trackParcel(req.params.trackingNumber);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json({ 
        message: 'Impossible de suivre le colis',
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Erreur suivi colis:', error);
    res.status(500).json({ 
      message: 'Erreur lors du suivi du colis',
      error: error.message 
    });
  }
});

router.post('/request-return/:orderId', protect, async (req, res) => {
  try {
    const { returnReason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (order.user && order.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    if (!order.isPaid) {
      return res.status(400).json({ message: 'La commande doit être payée' });
    }

    if (order.returnStatus !== 'none') {
      return res.status(400).json({ message: 'Un retour a déjà été demandé pour cette commande' });
    }

    const daysSinceDelivery = order.deliveredAt 
      ? Math.floor((Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (order.deliveredAt && daysSinceDelivery > 30) {
      return res.status(400).json({ 
        message: 'Le délai de retour de 30 jours est dépassé' 
      });
    }

    order.returnStatus = 'requested';
    order.returnReason = returnReason || 'Retour demandé par le client';
    order.returnRequestedAt = new Date();
    
    await order.save();

    res.json({
      success: true,
      message: 'Demande de retour enregistrée. Un administrateur va générer votre étiquette de retour.',
      order
    });
  } catch (error) {
    console.error('Erreur demande retour:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la demande de retour',
      error: error.message 
    });
  }
});

router.post('/refund/:orderId', protect, authorize('admin'), async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    if (!order.isPaid) {
      return res.status(400).json({ message: 'La commande n\'est pas payée' });
    }

    if (order.refundStatus === 'full') {
      return res.status(400).json({ message: 'Cette commande a déjà été entièrement remboursée' });
    }

    if (!order.paymentResult || !order.paymentResult.payment_intent) {
      return res.status(400).json({ message: 'Aucun paiement Stripe trouvé pour cette commande' });
    }

    const refundAmount = amount || order.totalPrice;

    if (refundAmount > order.totalPrice) {
      return res.status(400).json({ message: 'Le montant du remboursement ne peut pas dépasser le total de la commande' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.paymentResult.payment_intent,
      amount: Math.round(refundAmount * 100),
      reason: 'requested_by_customer',
      metadata: {
        orderId: order._id.toString(),
        reason: reason || 'Remboursement demandé'
      }
    });

    order.refundStatus = refundAmount >= order.totalPrice ? 'full' : 'partial';
    order.refundAmount = refundAmount;
    order.refundReason = reason || 'Remboursement effectué';
    order.refundedAt = new Date();
    order.stripeRefundId = refund.id;
    
    if (order.returnStatus === 'received') {
      order.returnStatus = 'completed';
    }
    
    await order.save();

    res.json({
      success: true,
      message: `Remboursement de ${refundAmount}€ effectué avec succès`,
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status
      },
      order
    });
  } catch (error) {
    console.error('Erreur remboursement:', error);
    
    if (order) {
      order.refundStatus = 'failed';
      await order.save();
    }
    
    res.status(500).json({ 
      message: 'Erreur lors du remboursement',
      error: error.message 
    });
  }
});

router.put('/update-return-status/:orderId', protect, authorize('admin'), async (req, res) => {
  try {
    const { returnStatus } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    const validStatuses = ['none', 'requested', 'label_generated', 'in_transit', 'received', 'completed'];
    if (!validStatuses.includes(returnStatus)) {
      return res.status(400).json({ message: 'Statut de retour invalide' });
    }

    order.returnStatus = returnStatus;
    
    if (returnStatus === 'received') {
      order.returnReceivedAt = new Date();
    }
    
    await order.save();

    res.json({
      success: true,
      message: 'Statut de retour mis à jour',
      order
    });
  } catch (error) {
    console.error('Erreur mise à jour statut retour:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du statut',
      error: error.message 
    });
  }
});

module.exports = router;
