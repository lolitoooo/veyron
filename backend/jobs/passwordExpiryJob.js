const cron = require('node-cron');
const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');
const { passwordExpiryReminderEmailTemplate } = require('../templates/emailTemplates');

const checkPasswordExpiry = async () => {
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const usersWithExpiredPasswords = await User.find({
      lastPasswordChange: { $lt: sixtyDaysAgo },
      isActive: true
    });
    
    console.log(`[Password Expiry Job] ${usersWithExpiredPasswords.length} utilisateur(s) avec mot de passe expiré trouvé(s)`);
    
    for (const user of usersWithExpiredPasswords) {
      try {
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        user.resetPasswordToken = crypto
          .createHash('sha256')
          .update(resetToken)
          .digest('hex');
        
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
        
        await user.save({ validateBeforeSave: false });
        
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        
        await sendEmail({
          to: user.email,
          subject: 'Mise à jour de votre mot de passe requise - Veyron Paris',
          html: passwordExpiryReminderEmailTemplate(user.firstName, resetUrl)
        });
        
        console.log(`[Password Expiry Job] Email envoyé à ${user.email}`);
      } catch (emailError) {
        console.error(`[Password Expiry Job] Erreur lors de l'envoi de l'email à ${user.email}:`, emailError);
      }
    }
    
    console.log('[Password Expiry Job] Vérification terminée');
  } catch (err) {
    console.error('[Password Expiry Job] Erreur:', err);
  }
};

const startPasswordExpiryJob = () => {
  cron.schedule('0 12 * * *', async () => {
    console.log('[Password Expiry Job] Démarrage de la vérification quotidienne des mots de passe expirés');
    await checkPasswordExpiry();
  });
  
  console.log('[Password Expiry Job] Job configuré pour s\'exécuter tous les jours à 12h00');
};

module.exports = { startPasswordExpiryJob, checkPasswordExpiry };
