const { sendEmail } = require('../services/emailService');
const { contactConfirmationEmailTemplate, contactNotificationEmailTemplate } = require('../templates/emailTemplates');
const validator = require('validator');

exports.sendContactMessage = async (req, res) => {
  try {
    let { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs obligatoires'
      });
    }

    name = validator.escape(validator.trim(name));
    subject = validator.escape(validator.trim(subject));
    message = validator.escape(validator.trim(message));
    email = validator.normalizeEmail(validator.trim(email));

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Le nom doit contenir entre 2 et 100 caractères'
      });
    }

    if (subject.length < 3 || subject.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Le sujet doit contenir entre 3 et 200 caractères'
      });
    }

    if (message.length < 10 || message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Le message doit contenir entre 10 et 5000 caractères'
      });
    }

    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /eval\(/i,
      /expression\(/i
    ];

    const combinedText = `${name} ${subject} ${message}`;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(combinedText)) {
        return res.status(400).json({
          success: false,
          message: 'Contenu suspect détecté. Veuillez vérifier votre message.'
        });
      }
    }

    const decodedName = validator.unescape(name);
    const decodedSubject = validator.unescape(subject);
    const decodedMessage = validator.unescape(message);

    console.log('📧 Tentative d\'envoi d\'email de contact');
    console.log('De:', decodedName, '(' + email + ')');
    console.log('Sujet:', decodedSubject);

    try {
      console.log('Envoi de l\'email de confirmation au client:', email);
      await sendEmail({
        to: email,
        subject: 'Confirmation de réception de votre message - Veyron Paris',
        html: contactConfirmationEmailTemplate(decodedName, decodedMessage)
      });
      console.log('✅ Email de confirmation envoyé au client');
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de confirmation au client:', emailError);
    }

    const adminEmail = process.env.EMAIL_ADMIN || process.env.EMAIL_USER;
    console.log('Envoi de l\'email de notification à l\'admin:', adminEmail);
    
    try {
      await sendEmail({
        to: adminEmail,
        replyTo: `${decodedName} <${email}>`,
        subject: `Nouveau message de contact - ${decodedSubject}`,
        html: contactNotificationEmailTemplate(decodedName, email, decodedSubject, decodedMessage)
      });
      console.log('✅ Email de notification envoyé à l\'admin:', adminEmail);
      console.log('Reply-To configuré:', email);
    } catch (emailError) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de notification à l\'admin:', emailError);
      console.error('Détails:', emailError.message);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi du message'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.'
    });
  } catch (err) {
    console.error('Erreur lors de l\'envoi du message de contact:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message'
    });
  }
};
