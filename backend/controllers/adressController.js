const Address = require('../models/Address');
const User = require('../models/User');

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id });
    
    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAddressById = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({ message: 'Adresse non trouvée' });
    }
    
    if (address.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé à accéder à cette adresse' });
    }
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const {
      name,
      title,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      phone,
      isDefault,
      type
    } = req.body;
    
    const address = await Address.create({
      user: req.user.id,
      name: name || `Adresse ${Date.now().toString().slice(-4)}`,
      title,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      phone,
      isDefault,
      type
    });
    
    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id, type: type, _id: { $ne: address._id } },
        { isDefault: false }
      );
    }
    
    res.status(201).json({
      success: true,
      data: address
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    let address = await Address.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({ message: 'Adresse non trouvée' });
    }
    
    if (address.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé à modifier cette adresse' });
    }
    
    const {
      name,
      title,
      firstName,
      lastName,
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country,
      phone,
      isDefault,
      type
    } = req.body;
    
    address = await Address.findByIdAndUpdate(
      req.params.id,
      {
        name,
        title,
        firstName,
        lastName,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        country,
        phone,
        isDefault,
        type
      },
      { new: true, runValidators: true }
    );
    
    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id, type: type, _id: { $ne: address._id } },
        { isDefault: false }
      );
    }
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    let address = await Address.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({ message: 'Adresse non trouvée' });
    }
    
    if (address.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé à modifier cette adresse' });
    }
    
    address = await Address.findByIdAndUpdate(
      req.params.id,
      { isDefault: true },
      { new: true }
    );
    
    await Address.updateMany(
      { user: req.user.id, type: address.type, _id: { $ne: address._id } },
      { isDefault: false }
    );
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    
    if (!address) {
      return res.status(404).json({ message: 'Adresse non trouvée' });
    }
    
    if (address.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé à supprimer cette adresse' });
    }
    
    const addressCount = await Address.countDocuments({ user: req.user.id });
    
    if (address.isDefault && addressCount > 1) {
      return res.status(400).json({ 
        message: "Impossible de supprimer l'adresse par défaut. Veuillez définir une autre adresse par défaut d'abord." 
      });
    }
    
    await address.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Adresse supprimée avec succès'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.validateAddress = async (req, res) => {
  try {
    const {
      addressLine1,
      city,
      postalCode,
      country
    } = req.body;
    
    const isValid = addressLine1 && city && postalCode && country;
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Adresse incomplète ou invalide'
      });
    }
    
    const normalizedAddress = {
      addressLine1: addressLine1.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      country: country.trim()
    };
    
    res.status(200).json({
      success: true,
      message: 'Adresse valide',
      data: normalizedAddress
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAddressesByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!type || (type !== 'shipping' && type !== 'billing')) {
      return res.status(400).json({ 
        message: 'Type d\'adresse invalide. Utilisez "shipping" ou "billing".' 
      });
    }
    
    const addresses = await Address.find({ 
      user: req.user.id,
      type: type
    });
    
    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDefaultAddress = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!type || (type !== 'shipping' && type !== 'billing')) {
      return res.status(400).json({ 
        message: 'Type d\'adresse invalide. Utilisez "shipping" ou "billing".' 
      });
    }
    
    const address = await Address.findOne({ 
      user: req.user.id,
      type: type,
      isDefault: true
    });
    
    if (!address) {
      return res.status(404).json({ 
        message: `Aucune adresse ${type === 'shipping' ? 'de livraison' : 'de facturation'} par défaut trouvée` 
      });
    }
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};