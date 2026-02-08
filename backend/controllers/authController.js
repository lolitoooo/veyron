const User = require('../models/User');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');
const { welcomeEmailTemplate, resetPasswordEmailTemplate } = require('../templates/emailTemplates');

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Format d\'email invalide' 
      });
    }

    if (password.length < 12) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins 12 caractères' 
      });
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Cet email est déjà utilisé' 
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password
    });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Bienvenue sur Veyron Paris',
        html: welcomeEmailTemplate(user.firstName)
      });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', emailError);
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la création du compte' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Veuillez fournir un email et un mot de passe' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +loginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants invalides' 
      });
    }

    if (user.isLocked) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      return res.status(423).json({ 
        success: false,
        message: `Votre compte a été bloqué suite à 3 tentatives de connexion échouées. Veuillez attendre ${remainingTime} minute(s) avant de réessayer.` 
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      
      const updatedUser = await User.findById(user._id).select('+loginAttempts +lockUntil');
      
      if (updatedUser.isLocked) {
        return res.status(423).json({ 
          success: false,
          message: 'Votre compte a été bloqué suite à 3 tentatives de connexion échouées. Veuillez attendre 5 minutes avant de réessayer.' 
        });
      }
      
      const attemptsLeft = 3 - updatedUser.loginAttempts;
      return res.status(401).json({ 
        success: false,
        message: `Identifiants invalides. ${attemptsLeft} tentative(s) restante(s)` 
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({ 
        success: false,
        message: 'Ce compte a été désactivé' 
      });
    }

    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    const userWith2FA = await User.findById(user._id).select('twoFactorEnabled');
    if (userWith2FA.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        requires2FA: true,
        userId: user._id,
        message: 'Veuillez entrer votre code d\'authentification à deux facteurs'
      });
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Erreur lors de la connexion:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la connexion' 
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Veuillez fournir une adresse email' 
      });
    }
    
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(200).json({ 
        success: true, 
        message: 'Si cet email existe dans notre base de données, un lien de réinitialisation sera envoyé' 
      });
    }
    
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    
    await user.save({ validateBeforeSave: false });
    
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    try {
      await sendEmail({
        to: user.email,
        subject: 'Réinitialisation de votre mot de passe - Veyron Paris',
        html: resetPasswordEmailTemplate(user.firstName, resetUrl)
      });
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', emailError);
      
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({ 
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de réinitialisation' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Si cet email existe dans notre base de données, un lien de réinitialisation sera envoyé',
    });
  } catch (err) {
    console.error('Erreur lors de la demande de réinitialisation:', err);
    
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email de réinitialisation' 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const resetToken = req.params.token;
    
    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: 'Veuillez fournir un nouveau mot de passe' 
      });
    }
    
    if (password.length < 12) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins 12 caractères' 
      });
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole' 
      });
    }
    
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Token invalide ou expiré' 
      });
    }
    
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    
    res.status(200).json({ 
      success: true,
      message: 'Mot de passe réinitialisé avec succès' 
    });
  } catch (err) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la réinitialisation du mot de passe' 
    });
  }
};

exports.activateAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const activationToken = req.params.token;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un mot de passe'
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 12 caractères'
      });
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un symbole'
      });
    }

    const activationTokenHash = crypto
      .createHash('sha256')
      .update(activationToken)
      .digest('hex');

    const user = await User.findOne({
      activationToken: activationTokenHash,
      activationExpire: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Lien d\'activation invalide ou expiré'
      });
    }

    user.password = password;
    user.isActive = true;
    user.activationToken = undefined;
    user.activationExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    console.error('Erreur lors de l\'activation du compte:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'activation du compte'
    });
  }
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  res
    .status(statusCode)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
};

exports.logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie'
    });
  } catch (err) {
    console.error('Erreur lors de la déconnexion:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
};