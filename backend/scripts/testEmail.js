const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.development') });
const { sendEmail } = require('../services/emailService');
const { orderConfirmationEmailTemplate } = require('../templates/emailTemplates copy');

const testOrder = {
  _id: '507f1f77bcf86cd799439011',
  invoiceNumber: 'INV-2024-001',
  orderItems: [
    {
      name: 'T-shirt Veyron Classic',
      variant: {
        size: 'M',
        color: 'Noir'
      },
      qty: 2,
      price: 49.99,
      product: '507f1f77bcf86cd799439012'
    },
    {
      name: 'Pantalon Veyron Sport',
      variant: {
        size: 'L',
        color: 'Bleu'
      },
      qty: 1,
      price: 89.99,
      product: '507f1f77bcf86cd799439013'
    }
  ],
  shippingAddress: {
    firstName: 'Hugo',
    lastName: 'Lopes',
    addressLine1: '1 rue de Paris',
    addressLine2: 'Appartement 5',
    postalCode: '75001',
    city: 'PARIS',
    country: 'FRANCE'
  },
  shippingPrice: 5.99,
  totalPrice: 195.96
};

const testUser = {
  firstName: 'Hugo',
  lastName: 'Lopes',
  email: 'hugo.lop2304@gmail.com'
};

const testReviewLinks = [
  {
    productName: 'T-shirt Veyron Classic',
    url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/review/verified/test-token-abc123`
  },
  {
    productName: 'Pantalon Veyron Sport',
    url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/review/verified/test-token-def456`
  }
];

async function testEmailSending() {
  console.log('=== TEST D\'ENVOI D\'EMAIL ===\n');
  console.log('Configuration:');
  console.log('- Email destinataire:', testUser.email);
  console.log('- SMTP Host:', process.env.SMTP_HOST);
  console.log('- SMTP User:', process.env.SMTP_USER);
  console.log('- Frontend URL:', process.env.FRONTEND_URL);
  console.log('\nGénération du template email...');

  try {
    const emailHtml = orderConfirmationEmailTemplate(testOrder, testUser, testReviewLinks);
    
    console.log('\n✅ Template généré avec succès');
    console.log('- Nombre de produits:', testOrder.orderItems.length);
    console.log('- Nombre de liens d\'avis:', testReviewLinks.length);
    
    console.log('\n📧 Envoi de l\'email...');
    
    const result = await sendEmail({
      to: testUser.email,
      subject: `[TEST] Confirmation de commande #${testOrder.invoiceNumber} - Veyron Paris`,
      html: emailHtml
    });

    console.log('\n✅ Email envoyé avec succès!');
    console.log('Message ID:', result.messageId);
    console.log('\n🎉 Test terminé avec succès!');
    console.log('\nVérifiez votre boîte mail:', testUser.email);
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error('\nDétails:', error);
    process.exit(1);
  }
}

testEmailSending();
