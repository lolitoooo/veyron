const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

class ColissimoService {
  constructor() {
    this.apiKey = process.env.LAPOSTE_API_KEY;
    this.trackingUrl = 'https://api.laposte.fr/suivi/v2/idships';
    
    this.hasColissimoContract = !!(process.env.COLISSIMO_CONTRACT_NUMBER && process.env.COLISSIMO_PASSWORD);
    
    if (this.hasColissimoContract) {
      this.contractNumber = process.env.COLISSIMO_CONTRACT_NUMBER;
      this.password = process.env.COLISSIMO_PASSWORD;
      this.apiUrl = process.env.NODE_ENV === 'production'
        ? 'https://ws.colissimo.fr/sls-ws/SlsServiceWSRest'
        : 'https://ws.colissimo.fr/sls-ws/SlsServiceWSRest';
      
      this.expediteur = {
        companyName: 'VEYRON PARIS',
        lastName: 'VEYRON',
        firstName: 'Paris',
        line2: '123 Avenue des Champs-Élysées',
        countryCode: 'FR',
        city: 'Paris',
        zipCode: '75008',
        phoneNumber: '0123456789',
        email: process.env.EMAIL_FROM || 'contact@veyron-paris.fr'
      };
    }
  }

  async generateShippingLabel(order) {
    if (!this.hasColissimoContract) {
      throw new Error('Contrat Colissimo non configuré. Pour générer des étiquettes, vous devez souscrire à Colissimo Entreprise et configurer COLISSIMO_CONTRACT_NUMBER et COLISSIMO_PASSWORD dans les variables d\'environnement.');
    }
    
    try {
      console.log(`[Colissimo] Génération étiquette d'envoi pour commande ${order._id}`);

      const a = order.shippingAddress || {};
      const address = order.shippingMethod === 'relay_point' && order.relayPoint
        ? {
            companyName: order.relayPoint.name || '',
            lastName: a.lastName || 'Client',
            firstName: a.firstName || '',
            line2: order.relayPoint.address || [order.relayPoint.street, order.relayPoint.house_number].filter(Boolean).join(' ').trim() || 'Point Relais',
            countryCode: 'FR',
            city: order.relayPoint.city || '',
            zipCode: order.relayPoint.postalCode || '',
            phoneNumber: a.phone || order.guestPhone || '',
            email: order.user ? (await this.getUserEmail(order.user)) : order.guestEmail || ''
          }
        : {
            companyName: '',
            lastName: a.lastName || 'Client',
            firstName: a.firstName || '',
            line2: a.addressLine1 || '',
            line3: a.addressLine2 || '',
            countryCode: (a.country || 'FR').toUpperCase().slice(0, 2),
            city: a.city || '',
            zipCode: a.postalCode || '',
            phoneNumber: a.phone || '',
            email: order.user ? (await this.getUserEmail(order.user)) : order.guestEmail || ''
          };

      // DOM = livraison à l'adresse (domicile ou adresse du point relais)
      const productCode = 'DOM';

      const totalWeight = this.calculateOrderWeight(order);

      const requestBody = {
        contractNumber: this.contractNumber,
        password: this.password,
        outputFormat: {
          x: 0,
          y: 0,
          outputPrintingType: 'PDF_A4_300dpi'
        },
        letter: {
          service: {
            productCode,
            depositDate: new Date().toISOString().split('T')[0],
            transportationAmount: order.shippingPrice || 0,
            totalAmount: order.totalPrice,
            orderNumber: order.getFormattedOrderNumber ? order.getFormattedOrderNumber() : `ORD-${order._id}`,
            commercialName: 'VEYRON PARIS'
          },
          parcel: {
            weight: totalWeight,
            insuranceValue: order.totalPrice > 100 ? Math.min(order.totalPrice, 5000) : 0,
            returnReceipt: false,
            instructions: order.notes || ''
          },
          customsDeclarations: (address.countryCode && address.countryCode !== 'FR') ? {
            includeCustomsDeclarations: true,
            contents: {
              article: order.orderItems.map(item => ({
                description: item.name,
                quantity: item.qty,
                weight: 500,
                value: item.price,
                hsCode: '6203',
                originCountry: 'FR',
                currency: 'EUR'
              }))
            }
          } : {},
          sender: this.expediteur,
          addressee: address
        }
      };

      console.log('[Colissimo] Envoi requête API:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(
        `${this.apiUrl}/generateLabel`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.labelResponse) {
        const labelData = response.data.labelResponse;
        
        if (labelData.parcelNumber) {
          const labelDir = path.join(__dirname, '../uploads/labels');
          await fs.ensureDir(labelDir);
          
          const labelFileName = `label_${order._id}_${Date.now()}.pdf`;
          const labelPath = path.join(labelDir, labelFileName);
          
          const pdfBuffer = Buffer.from(labelData.label, 'base64');
          await fs.writeFile(labelPath, pdfBuffer);
          
          console.log(`[Colissimo] Étiquette générée: ${labelFileName}`);
          
          return {
            success: true,
            trackingNumber: labelData.parcelNumber,
            labelPath: `/uploads/labels/${labelFileName}`,
            labelUrl: `${process.env.BACKEND_URL}/uploads/labels/${labelFileName}`,
            pdfBase64: labelData.label
          };
        }
      }

      throw new Error('Réponse API invalide');
    } catch (error) {
      console.error('[Colissimo] Erreur génération étiquette:', error.message);
      if (error.response) {
        console.error('[Colissimo] Réponse API:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Erreur génération étiquette: ${error.message}`);
    }
  }

  async generateReturnLabel(order, returnReason = '') {
    if (!this.hasColissimoContract) {
      throw new Error('Contrat Colissimo non configuré. Pour générer des étiquettes de retour, vous devez souscrire à Colissimo Entreprise et configurer COLISSIMO_CONTRACT_NUMBER et COLISSIMO_PASSWORD dans les variables d\'environnement.');
    }
    
    try {
      console.log(`[Colissimo] Génération étiquette de retour pour commande ${order._id}`);

      const s = order.shippingAddress || {};
      const senderEmail = order.user ? await this.getUserEmail(order.user) : (order.guestEmail || '');
      const requestBody = {
        contractNumber: this.contractNumber,
        password: this.password,
        outputFormat: {
          x: 0,
          y: 0,
          outputPrintingType: 'PDF_A4_300dpi'
        },
        letter: {
          service: {
            productCode: 'CORE',
            depositDate: new Date().toISOString().split('T')[0],
            orderNumber: order.getFormattedOrderNumber ? order.getFormattedOrderNumber() : `ORD-${order._id}`,
            commercialName: 'VEYRON PARIS - RETOUR'
          },
          parcel: {
            weight: this.calculateOrderWeight(order),
            instructions: returnReason || 'Retour produit'
          },
          sender: {
            companyName: '',
            lastName: s.lastName || 'Client',
            firstName: s.firstName || '',
            line2: s.addressLine1 || '',
            line3: s.addressLine2 || '',
            countryCode: (s.country || 'FR').toUpperCase().slice(0, 2),
            city: s.city || '',
            zipCode: s.postalCode || '',
            phoneNumber: s.phone || '',
            email: senderEmail
          },
          addressee: this.expediteur
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/generateLabel`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      if (response.data && response.data.labelResponse) {
        const labelData = response.data.labelResponse;
        
        if (labelData.parcelNumber) {
          const labelDir = path.join(__dirname, '../uploads/labels');
          await fs.ensureDir(labelDir);
          
          const labelFileName = `return_label_${order._id}_${Date.now()}.pdf`;
          const labelPath = path.join(labelDir, labelFileName);
          
          const pdfBuffer = Buffer.from(labelData.label, 'base64');
          await fs.writeFile(labelPath, pdfBuffer);
          
          console.log(`[Colissimo] Étiquette retour générée: ${labelFileName}`);
          
          return {
            success: true,
            returnTrackingNumber: labelData.parcelNumber,
            returnLabelPath: `/uploads/labels/${labelFileName}`,
            returnLabelUrl: `${process.env.BACKEND_URL}/uploads/labels/${labelFileName}`,
            pdfBase64: labelData.label
          };
        }
      }

      throw new Error('Réponse API invalide');
    } catch (error) {
      console.error('[Colissimo] Erreur génération étiquette retour:', error.message);
      if (error.response) {
        console.error('[Colissimo] Réponse API:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Erreur génération étiquette retour: ${error.message}`);
    }
  }

  async trackParcel(trackingNumber) {
    if (!this.apiKey) {
      throw new Error('Clé API La Poste non configurée. Veuillez ajouter LAPOSTE_API_KEY dans les variables d\'environnement.');
    }
    
    try {
      console.log(`[Colissimo] Suivi colis: ${trackingNumber}`);

      const response = await axios.get(
        `${this.trackingUrl}/${trackingNumber}`,
        {
          headers: {
            'X-Okapi-Key': this.apiKey,
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.shipment) {
        const shipment = response.data.shipment;
        
        return {
          success: true,
          trackingNumber: trackingNumber,
          status: this.mapColissimoStatus(shipment.event[0]?.code),
          statusLabel: shipment.event[0]?.label,
          events: shipment.event.map(evt => ({
            date: evt.date,
            label: evt.label,
            code: evt.code
          })),
          deliveryDate: shipment.deliveryDate || null
        };
      }

      throw new Error('Réponse API invalide');
    } catch (error) {
      console.error('[Colissimo] Erreur suivi colis:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  mapColissimoStatus(eventCode) {
    const statusMap = {
      'PC1': 'processing',
      'PC2': 'processing',
      'ET1': 'shipped',
      'ET2': 'shipped',
      'ET3': 'shipped',
      'ET4': 'shipped',
      'DI1': 'delivered',
      'DI2': 'delivered',
      'MD1': 'delivered',
      'MD2': 'delivered',
      'ND1': 'processing',
      'RE1': 'processing'
    };
    
    return statusMap[eventCode] || 'processing';
  }

  calculateOrderWeight(order) {
    const itemCount = order.orderItems.reduce((sum, item) => sum + item.qty, 0);
    const estimatedWeight = itemCount * 500;
    return Math.max(estimatedWeight, 250);
  }

  async getUserEmail(userId) {
    try {
      const User = require('../models/User');
      const user = await User.findById(userId);
      return user ? user.email : '';
    } catch (error) {
      return '';
    }
  }
}

module.exports = new ColissimoService();
