const User = require('../models/User');
const Address = require('../models/Address');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePhotoUrl: user.profilePhotoUrl || '',
        phone: user.phone || '',
        birthDate: user.birthDate || '',
        newsletterSubscribed: user.newsletterSubscribed || false,
        smsNotifications: user.smsNotifications || false,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, birthDate, newsletterSubscribed, smsNotifications } = req.body;
    
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }
    
    const fieldsToUpdate = {};
    if (firstName) fieldsToUpdate.firstName = firstName;
    if (lastName) fieldsToUpdate.lastName = lastName;
    if (email) fieldsToUpdate.email = email;
    if (phone !== undefined) fieldsToUpdate.phone = phone;
    if (birthDate !== undefined) fieldsToUpdate.birthDate = birthDate;
    if (newsletterSubscribed !== undefined) fieldsToUpdate.newsletterSubscribed = newsletterSubscribed;
    if (smsNotifications !== undefined) fieldsToUpdate.smsNotifications = smsNotifications;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePhotoUrl: user.profilePhotoUrl || '',
        phone: user.phone || '',
        birthDate: user.birthDate || '',
        newsletterSubscribed: user.newsletterSubscribed || false,
        smsNotifications: user.smsNotifications || false,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Veuillez fournir le mot de passe actuel et le nouveau mot de passe' 
      });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

exports.addAddress = async (req, res) => {
  try {
    req.body.user = req.user.id;
    
    if (!req.body.name) {
      req.body.name = `Adresse ${Date.now().toString().slice(-4)}`;
    }
    
    const addressCount = await Address.countDocuments({ user: req.user.id });
    if (addressCount === 0) {
      req.body.isDefault = true;
    } else if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.user.id, type: req.body.type },
        { isDefault: false }
      );
    }
    
    const address = await Address.create(req.body);
    
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
    
    if (address.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    if (req.body.isDefault) {
      await Address.updateMany(
        { user: req.user.id, type: address.type, _id: { $ne: address._id } },
        { isDefault: false }
      );
    }
    
    if (!req.body.name && !address.name) {
      req.body.name = `Adresse ${Date.now().toString().slice(-4)}`;
    }
    
    address = await Address.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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
    
    if (address.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    if (address.isDefault) {
      return res.status(400).json({ 
        message: 'Impossible de supprimer l\'adresse par défaut. Veuillez définir une autre adresse par défaut d\'abord.' 
      });
    }
    
    await address.remove();
    
    res.status(200).json({
      success: true,
      data: {}
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
    
    if (address.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    await Address.updateMany(
      { user: req.user.id, type: address.type, _id: { $ne: address._id } },
      { isDefault: false }
    );
    
    address.isDefault = true;
    await address.save();
    
    res.status(200).json({
      success: true,
      data: address
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      count: count
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password,
      role, 
      active, 
      birthDate, 
      newsletterSubscribed, 
      phone, 
      smsNotifications 
    } = req.body;
    
    const user = await User.findById(req.params.id).select('+password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (password) user.password = password;
    if (role !== undefined) user.role = role;
    if (active !== undefined) user.isActive = active;
    if (birthDate !== undefined) user.birthDate = birthDate;
    if (newsletterSubscribed !== undefined) user.newsletterSubscribed = newsletterSubscribed;
    if (phone !== undefined) user.phone = phone;
    if (smsNotifications !== undefined) user.smsNotifications = smsNotifications;
    
    await user.save();
    
    const updatedUser = await User.findById(req.params.id).select('-password');
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    await User.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};