const getEmailHeader = () => `
  <div style="background-color: #000000; padding: 30px 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-family: 'Arial', sans-serif; font-size: 28px; letter-spacing: 2px;">
      VEYRON PARIS
    </h1>
  </div>
`;

const getEmailFooter = () => `
  <div style="background-color: #f5f5f5; padding: 30px 20px; text-align: center; margin-top: 40px;">
    <p style="color: #666666; font-size: 14px; margin: 0 0 10px 0;">
      © ${new Date().getFullYear()} Veyron Paris. Tous droits réservés.
    </p>
    <p style="color: #999999; font-size: 12px; margin: 0;">
      ${process.env.FRONTEND_URL || 'https://veyron-paris.fr'}
    </p>
  </div>
`;

const getBaseTemplate = (content) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Veyron Paris</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f9f9f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f9f9;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <tr>
            <td>
              ${getEmailHeader()}
              <div style="padding: 40px 30px;">
                ${content}
              </div>
              ${getEmailFooter()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const welcomeEmailTemplate = (firstName) => {
  const content = `
    <h2 style="color: #333333; font-size: 24px; margin-bottom: 20px;">
      Bienvenue ${firstName} !
    </h2>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Merci de vous être inscrit sur <strong>Veyron Paris</strong>.
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Votre compte a été créé avec succès. Vous pouvez maintenant profiter de toutes nos fonctionnalités et découvrir notre collection exclusive.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://veyron-paris.fr'}" 
         style="background-color: #000000; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
        Découvrir la boutique
      </a>
    </div>
    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
      Si vous avez des questions, n'hésitez pas à nous contacter.
    </p>
  `;
  return getBaseTemplate(content);
};

const resetPasswordEmailTemplate = (firstName, resetUrl) => {
  const content = `
    <h2 style="color: #333333; font-size: 24px; margin-bottom: 20px;">
      Réinitialisation de votre mot de passe
    </h2>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Bonjour ${firstName},
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="background-color: #000000; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
        Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
      Ce lien est valable pendant 10 minutes.
    </p>
    <p style="color: #999999; font-size: 14px; line-height: 1.6;">
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
    </p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
      <p style="color: #666666; font-size: 12px; margin: 0; word-break: break-all;">
        Si le bouton ne fonctionne pas, copiez ce lien : <br>
        <a href="${resetUrl}" style="color: #666666;">${resetUrl}</a>
      </p>
    </div>
  `;
  return getBaseTemplate(content);
};

const orderConfirmationEmailTemplate = (order, user) => {
  const itemsHtml = order.orderItems.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eeeeee;">
        <strong style="color: #333333;">${item.name}</strong><br>
        <span style="color: #999999; font-size: 14px;">
          ${item.variant.size} - ${item.variant.color}
        </span>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eeeeee; text-align: center; color: #666666;">
        ${item.qty}
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eeeeee; text-align: right; color: #666666;">
        ${(item.price * item.qty).toFixed(2)} €
      </td>
    </tr>
  `).join('');

  const content = `
    <h2 style="color: #333333; font-size: 24px; margin-bottom: 20px;">
      Confirmation de commande
    </h2>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Bonjour ${user.firstName},
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Merci pour votre commande ! Nous avons bien reçu votre paiement et votre commande est en cours de traitement.
    </p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 30px 0;">
      <p style="color: #333333; font-size: 14px; margin: 0 0 5px 0;">
        <strong>Numéro de commande :</strong> ${order.invoiceNumber || order._id}
      </p>
      <p style="color: #333333; font-size: 14px; margin: 0;">
        <strong>Date :</strong> ${new Date(order.createdAt).toLocaleDateString('fr-FR')}
      </p>
    </div>

    <h3 style="color: #333333; font-size: 18px; margin: 30px 0 15px 0;">
      Détails de la commande
    </h3>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eeeeee; border-radius: 5px;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 15px; text-align: left; color: #333333; font-size: 14px;">Produit</th>
          <th style="padding: 15px; text-align: center; color: #333333; font-size: 14px;">Quantité</th>
          <th style="padding: 15px; text-align: right; color: #333333; font-size: 14px;">Prix</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr>
          <td colspan="2" style="padding: 15px; text-align: right; color: #666666;">
            Sous-total :
          </td>
          <td style="padding: 15px; text-align: right; color: #666666;">
            ${order.orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2)} €
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 15px; text-align: right; color: #666666;">
            Livraison :
          </td>
          <td style="padding: 15px; text-align: right; color: #666666;">
            ${order.shippingPrice.toFixed(2)} €
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 15px; text-align: right; color: #333333; font-weight: bold; font-size: 16px;">
            Total :
          </td>
          <td style="padding: 15px; text-align: right; color: #333333; font-weight: bold; font-size: 16px;">
            ${order.totalPrice.toFixed(2)} €
          </td>
        </tr>
      </tbody>
    </table>

    <h3 style="color: #333333; font-size: 18px; margin: 30px 0 15px 0;">
      Adresse de livraison
    </h3>
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
        ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
        ${order.shippingAddress.addressLine1}<br>
        ${order.shippingAddress.addressLine2 ? order.shippingAddress.addressLine2 + '<br>' : ''}
        ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
        ${order.shippingAddress.country}
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0 20px 0;">
      <a href="${process.env.FRONTEND_URL}/account/orders/${order._id}" 
         style="background-color: #000000; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
        Suivre ma commande
      </a>
    </div>

    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
      Vous recevrez un email de confirmation d'expédition dès que votre commande sera envoyée.
    </p>
  `;
  return getBaseTemplate(content);
};

const contactConfirmationEmailTemplate = (name, message) => {
  const content = `
    <h2 style="color: #333333; font-size: 24px; margin-bottom: 20px;">
      Message reçu
    </h2>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Bonjour ${name},
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Notre équipe vous répondra dans les plus brefs délais.
    </p>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 30px 0;">
      <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;">
        <strong>Votre message :</strong>
      </p>
      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
        ${message}
      </p>
    </div>

    <p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
      Cordialement,<br>
      L'équipe Veyron Paris
    </p>
  `;
  return getBaseTemplate(content);
};

const contactNotificationEmailTemplate = (name, email, subject, message) => {
  const content = `
    <h2 style="color: #333333; font-size: 24px; margin-bottom: 20px;">
      Nouveau message de contact
    </h2>
    
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
      <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;">
        <strong>De :</strong> ${name}
      </p>
      <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;">
        <strong>Email :</strong> <a href="mailto:${email}" style="color: #666666;">${email}</a>
      </p>
      <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;">
        <strong>Sujet :</strong> ${subject}
      </p>
    </div>

    <div style="background-color: #ffffff; padding: 20px; border: 1px solid #eeeeee; border-radius: 5px; margin: 20px 0;">
      <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0;">
        <strong>Message :</strong>
      </p>
      <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">
        ${message}
      </p>
    </div>
  `;
  return getBaseTemplate(content);
};

const activateAccountEmailTemplate = (firstName, activationUrl) => {
  const content = `
    <h2 style="color: #333333; font-size: 24px; margin-bottom: 20px;">
      Activez votre compte
    </h2>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Bonjour ${firstName},
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Merci pour votre commande ! Pour retrouver facilement vos commandes et suivre leur statut, vous pouvez activer votre compte en définissant un mot de passe.
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${activationUrl}"
         style="background-color: #000000; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
        Définir mon mot de passe
      </a>
    </div>
    <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
      Ce lien est valable pendant 24 heures.
    </p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
      <p style="color: #666666; font-size: 12px; margin: 0; word-break: break-all;">
        Si le bouton ne fonctionne pas, copiez ce lien : <br>
        <a href="${activationUrl}" style="color: #666666;">${activationUrl}</a>
      </p>
    </div>
  `;
  return getBaseTemplate(content);
};

const passwordExpiryReminderEmailTemplate = (firstName, resetUrl) => {
  const content = `
    <h2 style="color: #333333; font-size: 24px; margin-bottom: 20px;">
      Mise à jour de votre mot de passe requise
    </h2>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Bonjour ${firstName},
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe tous les 60 jours.
    </p>
    <p style="color: #666666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
      Votre mot de passe n'a pas été modifié depuis plus de 60 jours. Cliquez sur le bouton ci-dessous pour le réinitialiser :
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" 
         style="background-color: #000000; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
        Réinitialiser mon mot de passe
      </a>
    </div>
    <p style="color: #999999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
      Ce lien est valable pendant 10 minutes.
    </p>
    <p style="color: #999999; font-size: 14px; line-height: 1.6;">
      Si vous avez récemment changé votre mot de passe, vous pouvez ignorer cet email.
    </p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
      <p style="color: #666666; font-size: 12px; margin: 0; word-break: break-all;">
        Si le bouton ne fonctionne pas, copiez ce lien : <br>
        <a href="${resetUrl}" style="color: #666666;">${resetUrl}</a>
      </p>
    </div>
  `;
  return getBaseTemplate(content);
};

module.exports = {
  welcomeEmailTemplate,
  resetPasswordEmailTemplate,
  orderConfirmationEmailTemplate,
  contactConfirmationEmailTemplate,
  contactNotificationEmailTemplate,
  activateAccountEmailTemplate,
  passwordExpiryReminderEmailTemplate
};
