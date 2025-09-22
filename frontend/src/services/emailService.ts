import emailjs from 'emailjs-com';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'votre_service_id';
const ORDER_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID || 'votre_template_commande';
const INVOICE_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_INVOICE_TEMPLATE_ID || 'votre_template_facture';
const USER_ID = import.meta.env.VITE_EMAILJS_USER_ID || 'votre_user_id';

export const initEmailJS = () => {
  emailjs.init(USER_ID);
};

export const sendOrderConfirmation = async (
  email: string,
  name: string,
  orderId: string,
  orderDetails: any
) => {
  try {
    const response = await emailjs.send(
      SERVICE_ID,
      ORDER_TEMPLATE_ID,
      {
        to_email: email,
        to_name: name,
        order_id: orderId,
        order_details: JSON.stringify(orderDetails),
        order_total: orderDetails.total.toFixed(2) + ' €',
        order_date: new Date().toLocaleDateString(),
        items_count: orderDetails.items.length
      },
      USER_ID
    );
    
    if (response.status !== 200) {
      throw new Error(`Erreur lors de l'envoi: ${response.text}`);
    }
    
    return {
      success: true,
      message: `Email de confirmation envoyé à ${email}`
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw new Error('Impossible d\'envoyer l\'email de confirmation');
  }
};

export const sendInvoice = async (
  email: string,
  name: string,
  orderId: string,
  orderDetails: any
) => {
  try {
    const invoiceNumber = 'INV-' + orderId;
    const invoiceDate = new Date().toLocaleDateString();
    
    const response = await emailjs.send(
      SERVICE_ID,
      INVOICE_TEMPLATE_ID,
      {
        to_email: email,
        to_name: name,
        order_id: orderId,
        order_details: JSON.stringify(orderDetails),
        order_total: orderDetails.total.toFixed(2) + ' €',
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        payment_method: orderDetails.paymentMethod || 'Carte bancaire',
        shipping_address: JSON.stringify(orderDetails.shippingAddress)
      },
      USER_ID
    );
    
    if (response.status !== 200) {
      throw new Error(`Erreur lors de l'envoi: ${response.text}`);
    }
    
    return {
      success: true,
      message: `Facture ${invoiceNumber} envoyée à ${email}`,
      invoiceNumber,
      invoiceDate
    };
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la facture:', error);
    throw new Error('Impossible d\'envoyer la facture');
  }
};
