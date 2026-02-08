const crypto = require('crypto');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');

exports.sendMagicLink = async (req, res) => {
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
        message: 'Si un compte existe avec cet email, un lien magique a été envoyé'
      });
    }

    const magicToken = user.getMagicLinkToken();
    await user.save();

    const magicLinkUrl = `${process.env.FRONTEND_URL}/auth/magic-link/verify?token=${magicToken}`;

    const message = `
      <h1>Connexion à Veyron Paris</h1>
      <p>Bonjour ${user.firstName},</p>
      <p>Vous avez demandé un lien de connexion magique. Cliquez sur le lien ci-dessous pour vous connecter :</p>
      <a href="${magicLinkUrl}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0;">
        Se connecter
      </a>
      <p>Ce lien est valide pendant 15 minutes.</p>
      <p>Si vous n'avez pas demandé ce lien, ignorez simplement cet email.</p>
      <p>Cordialement,<br>L'équipe Veyron Paris</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Votre lien de connexion - Veyron Paris',
        html: message
      });

      res.status(200).json({
        success: true,
        message: 'Si un compte existe avec cet email, un lien magique a été envoyé'
      });
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
      
      user.magicLinkToken = undefined;
      user.magicLinkExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email'
      });
    }
  } catch (error) {
    console.error('Erreur envoi magic link:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du lien magique'
    });
  }
};

exports.verifyMagicLink = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const magicLinkToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      magicLinkToken,
      magicLinkExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Lien invalide ou expiré'
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(200).json({
        success: true,
        requires2FA: true,
        userId: user._id,
        message: 'Veuillez entrer votre code d\'authentification à deux facteurs'
      });
    }

    user.magicLinkToken = undefined;
    user.magicLinkExpire = undefined;
    user.lastLogin = Date.now();
    await user.save();
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
    console.error('Erreur vérification magic link:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification du lien'
    });
  }
};
