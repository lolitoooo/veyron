const Order = require('../models/Order');
const InvoiceService = require('../services/invoiceService');
const path = require('path');
const fs = require('fs-extra');

exports.generateInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    const invoiceResult = await InvoiceService.generateInvoice(order);
    
    order.invoicePath = invoiceResult.relativePath;
    order.invoiceUrl = `/api/orders/${order._id}/invoice/download`;
    
    if (!order.invoiceDate) {
      order.invoiceDate = new Date();
    }
    
    await order.save();
    
    res.status(200).json({
      success: true,
      data: {
        invoiceUrl: order.invoiceUrl,
        invoiceNumber: order.invoiceNumber,
        invoiceDate: order.invoiceDate
      }
    });
  } catch (err) {
    console.error('Erreur lors de la génération de la facture:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Commande non trouvée' });
    }
    
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    
    let filePath;
    let fileName = `facture_${order.invoiceNumber || order._id}.pdf`;
    
    if (order.invoicePath) {
      filePath = path.resolve(path.join(__dirname, '..', order.invoicePath));
      
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
      
    }
    
    const invoiceResult = await InvoiceService.generateInvoice(order);
    
    if (!invoiceResult || !invoiceResult.relativePath) {
      return res.status(500).json({ message: 'Impossible de générer la facture' });
    }
    
    order.invoicePath = invoiceResult.relativePath;
    await order.save();
    
    const newFilePath = path.resolve(path.join(__dirname, '..', invoiceResult.relativePath));
    
    if (!fs.existsSync(newFilePath)) {
      console.error('Erreur: Le fichier généré n\'existe pas:', newFilePath);
      return res.status(500).json({ message: 'Erreur lors de la génération de la facture' });
    }
    
    res.sendFile(newFilePath);
  } catch (err) {
    console.error('Erreur lors du téléchargement de la facture:', err);
    res.status(500).json({ message: 'Erreur lors du téléchargement de la facture: ' + err.message });
  }
};

exports.generateInvoiceOnPayment = async (order, save = true) => {
  try {
    const invoiceResult = await InvoiceService.generateInvoice(order);
    
    order.invoicePath = invoiceResult.relativePath;
    order.invoiceUrl = `/api/orders/${order._id}/invoice/download`;
    
    if (!order.invoiceDate) {
      order.invoiceDate = new Date();
    }
    
    if (save) {
      await order.save();
    }
    
    return order;
  } catch (err) {
    console.error('Erreur lors de la génération automatique de la facture:', err);
    return order;
  }
};
