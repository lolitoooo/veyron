const express = require('express');
const router = express.Router();
const PromoCode = require('../models/PromoCode');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const promoCodes = await PromoCode.find({});
    res.json({ success: true, data: promoCodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Code promo non trouvé' });
    }
    res.json({ success: true, data: promoCode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      maxUses,
      startDate,
      endDate,
      isActive,
      applicableProducts,
      applicableCategories,
      excludedProducts,
      firstTimeCustomersOnly
    } = req.body;

    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'Ce code promo existe déjà' });
    }

    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      title,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      maxUses,
      startDate,
      endDate,
      isActive,
      applicableProducts,
      applicableCategories,
      excludedProducts,
      firstTimeCustomersOnly
    });

    const savedPromoCode = await promoCode.save();
    res.status(201).json({ success: true, data: savedPromoCode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscountAmount,
      maxUses,
      startDate,
      endDate,
      isActive,
      applicableProducts,
      applicableCategories,
      excludedProducts,
      firstTimeCustomersOnly
    } = req.body;

    if (code) {
      const existingCode = await PromoCode.findOne({ 
        code: code.toUpperCase(), 
        _id: { $ne: req.params.id } 
      });
      
      if (existingCode) {
        return res.status(400).json({ success: false, message: 'Ce code promo existe déjà' });
      }
    }

    const updatedPromoCode = await PromoCode.findByIdAndUpdate(
      req.params.id,
      {
        ...(code && { code: code.toUpperCase() }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(discountType && { discountType }),
        ...(discountValue !== undefined && { discountValue }),
        ...(minOrderValue !== undefined && { minOrderValue }),
        ...(maxDiscountAmount !== undefined && { maxDiscountAmount }),
        ...(maxUses !== undefined && { maxUses }),
        ...(startDate && { startDate }),
        ...(endDate !== undefined && { endDate }),
        ...(isActive !== undefined && { isActive }),
        ...(applicableProducts && { applicableProducts }),
        ...(applicableCategories && { applicableCategories }),
        ...(excludedProducts && { excludedProducts }),
        ...(firstTimeCustomersOnly !== undefined && { firstTimeCustomersOnly }),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedPromoCode) {
      return res.status(404).json({ success: false, message: 'Code promo non trouvé' });
    }

    res.json({ success: true, data: updatedPromoCode });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const deletedPromoCode = await PromoCode.findByIdAndDelete(req.params.id);
    if (!deletedPromoCode) {
      return res.status(404).json({ success: false, message: 'Code promo non trouvé' });
    }
    res.json({ success: true, message: 'Code promo supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code promo requis' });
    }

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });
    
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Code promo invalide' });
    }

    if (!promoCode.isValid()) {
      return res.status(400).json({ success: false, message: 'Ce code promo a expiré ou n\'est plus valide' });
    }

    if (promoCode.firstTimeCustomersOnly) {
      const Order = require('../models/Order');
      const previousOrders = await Order.countDocuments({ user: req.user._id });
      
      if (previousOrders > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ce code promo est réservé aux nouveaux clients' 
        });
      }
    }

    const discount = promoCode.calculateDiscount(orderTotal || 0);
    
    if (orderTotal && orderTotal < promoCode.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `Le montant minimum de commande pour ce code est de ${promoCode.minOrderValue}€`,
        minOrderValue: promoCode.minOrderValue
      });
    }

    res.json({
      success: true,
      data: {
        promoCode: {
          _id: promoCode._id,
          code: promoCode.code,
          title: promoCode.title,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue,
          minOrderValue: promoCode.minOrderValue,
          maxDiscountAmount: promoCode.maxDiscountAmount
        },
        discount,
        originalTotal: orderTotal,
        discountedTotal: orderTotal ? (orderTotal - discount) : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/apply', protect, async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code promo requis' });
    }

    if (!orderTotal) {
      return res.status(400).json({ success: false, message: 'Montant de la commande requis' });
    }

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase() });
    
    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Code promo invalide' });
    }

    if (!promoCode.isValid()) {
      return res.status(400).json({ success: false, message: 'Ce code promo a expiré ou n\'est plus valide' });
    }

    if (orderTotal < promoCode.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `Le montant minimum de commande pour ce code est de ${promoCode.minOrderValue}€` 
      });
    }

    const discount = promoCode.calculateDiscount(orderTotal);

    promoCode.currentUses += 1;
    await promoCode.save();

    res.json({
      success: true,
      data: {
        promoCode: {
          _id: promoCode._id,
          code: promoCode.code,
          title: promoCode.title,
          discountType: promoCode.discountType,
          discountValue: promoCode.discountValue
        },
        discount,
        originalTotal: orderTotal,
        discountedTotal: orderTotal - discount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
