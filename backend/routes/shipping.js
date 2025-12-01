const express = require('express');
const router = express.Router();
const ShippingConfig = require('../models/ShippingConfig');
const { protect, authorize } = require('../middleware/auth');
const relayPointService = require('../services/relayPointService');

router.get('/', async (req, res) => {
  try {
    const shippingConfigs = await ShippingConfig.find({ enabled: true }).sort({ price: 1 });
    
    res.json({
      success: true,
      data: shippingConfigs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des configurations de livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des configurations de livraison'
    });
  }
});

router.get('/:name', async (req, res) => {
  try {
    const shippingConfig = await ShippingConfig.findOne({ name: req.params.name });
    
    if (!shippingConfig) {
      return res.status(404).json({
        success: false,
        message: 'Configuration de livraison non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: shippingConfig
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la configuration'
    });
  }
});

router.post('/calculate', async (req, res) => {
  try {
    const { shippingMethod, cartTotal } = req.body;
    
    if (!shippingMethod || cartTotal === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Méthode de livraison et montant du panier requis'
      });
    }
    
    const shippingConfig = await ShippingConfig.findOne({ name: shippingMethod, enabled: true });
    
    if (!shippingConfig) {
      return res.status(404).json({
        success: false,
        message: 'Méthode de livraison non disponible'
      });
    }
    
    let shippingCost = shippingConfig.price;
    let isFreeShipping = false;
    
    if (cartTotal >= shippingConfig.freeShippingThreshold) {
      shippingCost = 0;
      isFreeShipping = true;
    }
    
    res.json({
      success: true,
      data: {
        shippingCost,
        isFreeShipping,
        freeShippingThreshold: shippingConfig.freeShippingThreshold,
        remainingForFreeShipping: Math.max(0, shippingConfig.freeShippingThreshold - cartTotal)
      }
    });
  } catch (error) {
    console.error('Erreur lors du calcul des frais de livraison:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul des frais de livraison'
    });
  }
});

router.get('/relay-points/search', async (req, res) => {
  try {
    const { postalCode, country = 'FR', limit = 10 } = req.query;
    
    if (!postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Code postal requis'
      });
    }
    
    const relayPoints = await relayPointService.searchRelayPoints(
      postalCode,
      country,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: relayPoints
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de points relais:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche de points relais'
    });
  }
});

router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const shippingConfigs = await ShippingConfig.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: shippingConfigs
    });
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération'
    });
  }
});

router.post('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, displayName, price, freeShippingThreshold, enabled, estimatedDays, description } = req.body;
    
    if (!name || !displayName || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nom, nom d\'affichage et prix requis'
      });
    }
    
    let shippingConfig = await ShippingConfig.findOne({ name });
    
    if (shippingConfig) {
      shippingConfig.displayName = displayName;
      shippingConfig.price = price;
      shippingConfig.freeShippingThreshold = freeShippingThreshold || 70;
      shippingConfig.enabled = enabled !== undefined ? enabled : true;
      if (estimatedDays) shippingConfig.estimatedDays = estimatedDays;
      if (description) shippingConfig.description = description;
      
      await shippingConfig.save();
    } else {
      shippingConfig = new ShippingConfig({
        name,
        displayName,
        price,
        freeShippingThreshold: freeShippingThreshold || 70,
        enabled: enabled !== undefined ? enabled : true,
        estimatedDays,
        description
      });
      
      await shippingConfig.save();
    }
    
    res.json({
      success: true,
      message: shippingConfig ? 'Configuration mise à jour' : 'Configuration créée',
      data: shippingConfig
    });
  } catch (error) {
    console.error('Erreur lors de la création/mise à jour de la configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création/mise à jour de la configuration'
    });
  }
});

router.put('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { displayName, price, freeShippingThreshold, enabled, estimatedDays, description } = req.body;
    
    const shippingConfig = await ShippingConfig.findById(req.params.id);
    
    if (!shippingConfig) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée'
      });
    }
    
    if (displayName) shippingConfig.displayName = displayName;
    if (price !== undefined) shippingConfig.price = price;
    if (freeShippingThreshold !== undefined) shippingConfig.freeShippingThreshold = freeShippingThreshold;
    if (enabled !== undefined) shippingConfig.enabled = enabled;
    if (estimatedDays) shippingConfig.estimatedDays = estimatedDays;
    if (description !== undefined) shippingConfig.description = description;
    
    await shippingConfig.save();
    
    res.json({
      success: true,
      message: 'Configuration mise à jour',
      data: shippingConfig
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    });
  }
});

router.delete('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const shippingConfig = await ShippingConfig.findByIdAndDelete(req.params.id);
    
    if (!shippingConfig) {
      return res.status(404).json({
        success: false,
        message: 'Configuration non trouvée'
      });
    }
    
    res.json({
      success: true,
      message: 'Configuration supprimée'
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    });
  }
});

module.exports = router;
