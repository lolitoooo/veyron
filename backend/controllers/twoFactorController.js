const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.setup2FA = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'L\'authentification à deux facteurs est déjà activée'
      });
    }

    const secret = speakeasy.generateSecret({
      name: `Veyron Paris (${user.email})`,
      issuer: 'Veyron Paris'
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    user.twoFactorSecret = secret.base32;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      }
    });
  } catch (error) {
    console.error('Erreur setup 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la configuration de l\'authentification à deux facteurs'
    });
  }
};

exports.verify2FA = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir le code de vérification'
      });
    }

    const user = await User.findById(req.user.id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez d\'abord configurer l\'authentification à deux facteurs'
      });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Code de vérification invalide'
      });
    }

    const backupCodes = user.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    user.twoFactorEnabled = true;
    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Authentification à deux facteurs activée avec succès',
      data: {
        backupCodes: backupCodes
      }
    });
  } catch (error) {
    console.error('Erreur vérification 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du code'
    });
  }
};

exports.validate2FA = async (req, res) => {
  try {
    const { token, userId, isBackupCode } = req.body;

    if (!token || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Token et userId requis'
      });
    }

    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur non trouvé ou 2FA non activé'
      });
    }

    let isValid = false;

    if (isBackupCode) {
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        const match = await bcrypt.compare(token, user.twoFactorBackupCodes[i]);
        if (match) {
          isValid = true;
          user.twoFactorBackupCodes.splice(i, 1);
          await user.save();
          break;
        }
      }
    } else {
      isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: token,
        window: 2
      });
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide'
      });
    }

    const jwtToken = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erreur validation 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la validation du code'
    });
  }
};

exports.disable2FA = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis pour désactiver 2FA'
      });
    }

    const user = await User.findById(req.user.id).select('+password +twoFactorSecret +twoFactorBackupCodes');

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Authentification à deux facteurs désactivée'
    });
  } catch (error) {
    console.error('Erreur désactivation 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de l\'authentification à deux facteurs'
    });
  }
};

exports.regenerateBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis'
      });
    }

    const user = await User.findById(req.user.id).select('+password +twoFactorBackupCodes');

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'L\'authentification à deux facteurs n\'est pas activée'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    const backupCodes = user.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    user.twoFactorBackupCodes = hashedBackupCodes;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Codes de secours régénérés',
      data: {
        backupCodes: backupCodes
      }
    });
  } catch (error) {
    console.error('Erreur régénération codes de secours:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la régénération des codes de secours'
    });
  }
};

exports.get2FAStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('twoFactorEnabled');

    res.status(200).json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false
      }
    });
  } catch (error) {
    console.error('Erreur récupération statut 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du statut'
    });
  }
};
