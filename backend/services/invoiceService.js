const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

class InvoiceService {
  static async generateInvoice(order) {
    if (!order.invoiceNumber) {
      order.invoiceNumber = `INV-${Date.now()}-${order._id.toString().slice(-6)}`;
    }
    
    if (!order.invoiceDate) {
      order.invoiceDate = new Date();
    }
    
    const invoicesDir = path.join(__dirname, '../uploads/invoices');
    await fs.ensureDir(invoicesDir);
    
    const fileName = `facture_${order.invoiceNumber}.pdf`;
    const filePath = path.join(invoicesDir, fileName);
    
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        
        writeStream.on('finish', () => {
          resolve({
            path: filePath,
            fileName: fileName,
            relativePath: `/uploads/invoices/${fileName}`
          });
        });
        
        writeStream.on('error', (err) => {
          reject(err);
        });
        
        doc.pipe(writeStream);
        
        this._generateInvoiceContent(doc, order);
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
  
  static _generateInvoiceContent(doc, order) {
    doc.fontSize(20).text('VEYRON', { align: 'center' });
    doc.fontSize(16).text('Facture', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12);
    doc.text(`Numéro de facture: ${order.invoiceNumber}`);
    doc.text(`Date: ${new Date(order.invoiceDate).toLocaleDateString('fr-FR')}`);
    doc.text(`Numéro de commande: ${order._id}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Informations client');
    doc.fontSize(12);
    doc.text(`${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`);
    doc.text(`${order.shippingAddress.addressLine1}`);
    if (order.shippingAddress.addressLine2) {
      doc.text(`${order.shippingAddress.addressLine2}`);
    }
    doc.text(`${order.shippingAddress.postalCode} ${order.shippingAddress.city}`);
    doc.text(`${order.shippingAddress.country}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Détails de la commande');
    doc.fontSize(12);
    
    const tableTop = doc.y + 10;
    const itemX = 50;
    const quantityX = 280;
    const priceX = 350;
    const amountX = 450;
    
    doc.font('Helvetica-Bold');
    doc.text('Produit', itemX, tableTop);
    doc.text('Qté', quantityX, tableTop);
    doc.text('Prix', priceX, tableTop);
    doc.text('Total', amountX, tableTop);
    doc.moveDown();
    
    let y = doc.y;
    doc.font('Helvetica');
    
    order.orderItems.forEach(item => {
      const productName = item.variant ? `${item.name} (${item.variant.size}, ${item.variant.color})` : item.name;
      doc.text(productName, itemX, y, { width: 220 });
      doc.text(item.qty.toString(), quantityX, y);
      doc.text(`${item.price.toFixed(2)} €`, priceX, y);
      doc.text(`${(item.price * item.qty).toFixed(2)} €`, amountX, y);
      
      const textHeight = Math.ceil(doc.heightOfString(productName, { width: 220 }));
      y += Math.max(20, textHeight + 5);
    });
    
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 10;
    
    const subtotalHT = order.subtotalHT || (order.totalPrice - order.taxPrice - order.shippingPrice);
    doc.text('Sous-total HT:', 350, y);
    doc.text(`${subtotalHT.toFixed(2)} €`, amountX, y);
    y += 20;
    
    doc.text('TVA (20%):', 350, y);
    doc.text(`${order.taxPrice.toFixed(2)} €`, amountX, y);
    y += 20;
    
    const subtotalTTC = order.subtotalTTC || (subtotalHT + order.taxPrice);
    doc.text('Sous-total TTC:', 350, y);
    doc.text(`${subtotalTTC.toFixed(2)} €`, amountX, y);
    y += 20;
    
    if (order.promoCode && order.promoCode.code) {
      const discountAmount = order.discountAmount || 0;
      
      doc.fillColor('red');
      if (order.promoCode.discountType === 'percentage') {
        doc.text(`Réduction (${order.promoCode.discountValue}%)`, 350, y);
      } else {
        doc.text(`Réduction (${order.promoCode.code})`, 350, y);
      }
      doc.text(`-${discountAmount.toFixed(2)} €`, amountX, y);
      doc.fillColor('black');
      y += 20;
    }
    
    doc.text('Frais de livraison:', 350, y);
    doc.text(`${order.shippingPrice.toFixed(2)} €`, amountX, y);
    y += 20;
    
    doc.font('Helvetica-Bold');
    doc.text('Total TTC:', 350, y);
    doc.text(`${order.totalPrice.toFixed(2)} €`, amountX, y);
    
    if (order.promoCode && order.promoCode.code && order.discountAmount > 0) {
      y += 30;
      doc.font('Helvetica');
      doc.fillColor('green');
      doc.text(`Vous avez économisé ${order.discountAmount.toFixed(2)} € grâce au code promo ${order.promoCode.code}`, 50, y, { align: 'center' });
      doc.fillColor('black');
    }
    
    doc.fontSize(10);
    doc.text('Merci pour votre commande!', 50, 700, { align: 'center' });
    doc.text('VEYRON - Boutique de vêtements en ligne', 50, 715, { align: 'center' });
  }
}

module.exports = InvoiceService;
