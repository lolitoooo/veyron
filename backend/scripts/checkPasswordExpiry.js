const mongoose = require('mongoose');
const User = require('../models/User');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');
const { passwordExpiryReminderEmailTemplate } = require('../templates/emailTemplates');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV || 'development'}`) });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connecté');
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err);
    process.exit(1);
  }
};

const checkPasswordExpiry = async () => {
  await connectDB();
  
  try {
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    
    const usersWithExpiredPasswords = await User.find({
      lastPasswordChange: { $lt: sixtyDaysAgo },
      isActive: true
    });
    
    console.log(`${usersWithExpiredPasswords.length} utilisateur(s) avec mot de passe expiré trouvé(s)`);
    
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
        
        console.log(`Email envoyé à ${user.email}`);
      } catch (emailError) {
        console.error(`Erreur lors de l'envoi de l'email à ${user.email}:`, emailError);
      }
    }
    
    console.log('Vérification des mots de passe expirés terminée');
  } catch (err) {
    console.error('Erreur lors de la vérification des mots de passe expirés:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Connexion MongoDB fermée');
    process.exit(0);
  }
};

checkPasswordExpiry();
