const fs = require('fs');
const path = require('path');
const User = require('../models/User');

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Veuillez télécharger une image' 
      });
    }

    const relativePath = `/uploads/profile/${req.file.filename}`;
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Erreur lors de la suppression du fichier:', err);
      });
      
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    if (user.profilePhotoUrl) {
      const oldPhotoPath = path.join(__dirname, '../public', user.profilePhotoUrl);
      
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlink(oldPhotoPath, (err) => {
          if (err) console.error('Erreur lors de la suppression de l\'ancienne photo:', err);
        });
      }
    }
    
    user.profilePhotoUrl = relativePath;
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePhotoUrl: user.profilePhotoUrl,
        phone: user.phone,
        birthDate: user.birthDate,
        newsletterSubscribed: user.newsletterSubscribed,
        smsNotifications: user.smsNotifications
      }
    });
  } catch (err) {
    console.error('Erreur lors du téléchargement de la photo:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

exports.deleteProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }
    
    if (!user.profilePhotoUrl) {
      return res.status(400).json({ 
        success: false,
        message: 'Aucune photo de profil à supprimer' 
      });
    }
    
    const photoPath = path.join(__dirname, '../public', user.profilePhotoUrl);
    
    if (fs.existsSync(photoPath)) {
      fs.unlink(photoPath, (err) => {
        if (err) {
          console.error('Erreur lors de la suppression du fichier:', err);
        }
      });
    }
    
    user.profilePhotoUrl = '';
    await user.save();
    
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profilePhotoUrl: '',
        phone: user.phone,
        birthDate: user.birthDate,
        newsletterSubscribed: user.newsletterSubscribed,
        smsNotifications: user.smsNotifications
      }
    });
  } catch (err) {
    console.error('Erreur lors de la suppression de la photo:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
