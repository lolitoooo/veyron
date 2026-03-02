const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const PANEL_BASE = 'https://panel.sendcloud.sc/api';
const SERVICEPOINTS_BASE = 'https://servicepoints.sendcloud.sc/api/v2';

class SendCloudService {
  constructor() {
    this.publicKey = process.env.SENDCLOUD_API_KEY;
    this.privateKey = process.env.SENDCLOUD_API_SECRET;
    this.hasCredentials = !!(this.publicKey && this.privateKey);
    this.authHeader = this.hasCredentials
      ? 'Basic ' + Buffer.from(`${this.publicKey}:${this.privateKey}`).toString('base64')
      : null;
    this.contractId = process.env.SENDCLOUD_CONTRACT_ID ? parseInt(process.env.SENDCLOUD_CONTRACT_ID, 10) : null;
    this.shippingOptionCode = process.env.SENDCLOUD_SHIPPING_OPTION_CODE || null;
    this.returnShippingOptionCode = process.env.SENDCLOUD_RETURN_SHIPPING_OPTION_CODE || null;
    this.returnContractId = process.env.SENDCLOUD_RETURN_CONTRACT_ID ? parseInt(process.env.SENDCLOUD_RETURN_CONTRACT_ID, 10) : null;
  }

  _headers() {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': this.authHeader
    };
  }

  _getFromAddress() {
    const companyName = process.env.SENDCLOUD_FROM_COMPANY_NAME || 'VEYRON PARIS';
    const name = process.env.SENDCLOUD_FROM_NAME || 'VEYRON';
    const line1 = process.env.SENDCLOUD_FROM_ADDRESS || '123 Avenue des Champs-Élysées';
    const postalCode = process.env.SENDCLOUD_FROM_POSTAL_CODE || '75008';
    const city = process.env.SENDCLOUD_FROM_CITY || 'Paris';
    const country = (process.env.SENDCLOUD_FROM_COUNTRY || 'FR').toUpperCase().slice(0, 2);
    const phone = process.env.SENDCLOUD_FROM_PHONE || '';
    const email = process.env.SENDCLOUD_FROM_EMAIL || process.env.EMAIL_FROM || 'contact@veyron-paris.fr';
    const houseNumber = process.env.SENDCLOUD_FROM_HOUSE_NUMBER || '123';
    return {
      name,
      company_name: companyName,
      address_line_1: line1,
      house_number: houseNumber,
      postal_code: postalCode,
      city,
      country_code: country,
      phone_number: phone || '+33000000000',
      email
    };
  }

  async searchServicePoints(postalCode, country = 'FR', limit = 20) {
    if (!this.hasCredentials) {
      console.warn('[SendCloud] API keys not configured, returning empty service points');
      return [];
    }
    try {
      const params = new URLSearchParams({
        country: country.toUpperCase().slice(0, 2),
        postal_code: String(postalCode).trim()
      });
      const url = `${SERVICEPOINTS_BASE}/service-points?${params}`;
      const response = await axios.get(url, {
        headers: this._headers(),
        timeout: 15000
      });
      const list = Array.isArray(response.data) ? response.data : response.data.service_points || [];
      return list.slice(0, limit).map((sp) => ({
        id: String(sp.id),
        carrier: sp.carrier || 'Point Relais',
        name: sp.name || '',
        address: [sp.street, sp.house_number].filter(Boolean).join(' ').trim() || sp.address_line_1 || '',
        postalCode: sp.postal_code || '',
        city: sp.city || '',
        distance: sp.distance != null ? `${(sp.distance / 1000).toFixed(1)}` : null
      }));
    } catch (err) {
      console.error('[SendCloud] searchServicePoints error:', err.message);
      if (err.response?.data) console.error('[SendCloud] response:', JSON.stringify(err.response.data));
      return [];
    }
  }

  _orderWeightKg(order) {
    const itemCount = order.orderItems.reduce((sum, item) => sum + (item.qty || 0), 0);
    const grams = Math.max(itemCount * 500, 250);
    return (grams / 1000).toFixed(3);
  }

  _toAddress(order) {
    if (order.shippingMethod === 'relay_point' && order.relayPoint) {
      const r = order.relayPoint;
      const addressLine = [r.address].filter(Boolean).join(' ').trim() || 'Point Relais';
      const name = `${order.shippingAddress?.firstName || ''} ${order.shippingAddress?.lastName || ''}`.trim() || r.name || 'Client';
      return {
        name: name || 'Client',
        company_name: r.name || '',
        address_line_1: addressLine,
        house_number: '0',
        postal_code: r.postalCode || '',
        city: r.city || '',
        country_code: (order.shippingAddress?.country || 'FR').toUpperCase().slice(0, 2),
        phone_number: order.shippingAddress?.phone || '+33000000000',
        email: order.guestEmail || order.user?.email || ''
      };
    }
    const a = order.shippingAddress || {};
    const line1 = a.addressLine1 || '';
    const houseMatch = line1.match(/\s+(\d+[a-zA-Z]?)\s*$/);
    const houseNumber = (houseMatch && houseMatch[1]) ? houseMatch[1] : '0';
    const addressLine1 = houseMatch ? line1.replace(/\s+\d+[a-zA-Z]?\s*$/, '').trim() : line1;
    const name = `${a.firstName || ''} ${a.lastName || ''}`.trim() || 'Client';
    return {
      name: name || 'Client',
      company_name: '',
      address_line_1: addressLine1 || line1 || 'Adresse',
      house_number: houseNumber,
      postal_code: a.postalCode || '',
      city: a.city || '',
      country_code: (a.country || 'FR').toUpperCase().slice(0, 2),
      phone_number: a.phone || '+33000000000',
      email: order.guestEmail || order.user?.email || ''
    };
  }

  async generateShippingLabel(order) {
    if (!this.hasCredentials) {
      throw new Error('SendCloud non configuré. Définissez SENDCLOUD_API_KEY et SENDCLOUD_API_SECRET.');
    }
    if (!this.contractId || !this.shippingOptionCode) {
      throw new Error('SendCloud: SENDCLOUD_CONTRACT_ID et SENDCLOUD_SHIPPING_OPTION_CODE sont requis pour générer une étiquette.');
    }
    try {
      const orderNumber = order.getFormattedOrderNumber ? order.getFormattedOrderNumber() : `ORD-${order._id}`;
      const weightKg = this._orderWeightKg(order);
      const toAddress = this._toAddress(order);
      const payload = {
        from_address: this._getFromAddress(),
        to_address: toAddress,
        ship_with: {
          type: 'shipping_option_code',
          properties: {
            shipping_option_code: this.shippingOptionCode,
            contract_id: this.contractId
          }
        },
        order_number: orderNumber,
        total_order_price: { currency: 'EUR', value: String(order.totalPrice || 0) },
        label_details: { mime_type: 'application/pdf', dpi: 72 },
        parcels: [
          {
            weight: { value: weightKg, unit: 'kg' },
            dimensions: { length: '30', width: '20', height: '15', unit: 'cm' }
          }
        ]
      };
      if (order.shippingMethod === 'relay_point' && order.relayPoint?.id) {
        payload.to_service_point = { id: String(order.relayPoint.id) };
      }
      const response = await axios.post(`${PANEL_BASE}/v3/shipments/announce`, payload, {
        headers: this._headers(),
        timeout: 60000
      });
      const data = response.data?.data;
      if (!data?.parcels?.length) {
        throw new Error('Réponse SendCloud invalide: pas de parcel');
      }
      const parcel = data.parcels[0];
      const trackingNumber = parcel.tracking_number || null;
      const shipmentId = data.id || null;
      const parcelId = parcel.id || null;
      let labelUrl = null;
      let pdfBase64 = parcel.label_file || null;
      if (parcel.documents?.length) {
        const docLink = parcel.documents.find((d) => d.type === 'label')?.link;
        if (docLink) {
          try {
            const docRes = await axios.get(docLink, {
              headers: this._headers(),
              responseType: 'arraybuffer',
              timeout: 15000
            });
            const labelDir = path.join(__dirname, '../uploads/labels');
            await fs.ensureDir(labelDir);
            const fileName = `label_${order._id}_${Date.now()}.pdf`;
            const filePath = path.join(labelDir, fileName);
            await fs.writeFile(filePath, docRes.data);
            labelUrl = `${process.env.BACKEND_URL || ''}/uploads/labels/${fileName}`.replace(/\/\/uploads/, '/uploads');
            pdfBase64 = Buffer.from(docRes.data).toString('base64');
          } catch (e) {
            console.error('[SendCloud] Failed to download label document:', e.message);
          }
        }
      }
      if (!labelUrl && pdfBase64) {
        const labelDir = path.join(__dirname, '../uploads/labels');
        await fs.ensureDir(labelDir);
        const fileName = `label_${order._id}_${Date.now()}.pdf`;
        const filePath = path.join(labelDir, fileName);
        await fs.writeFile(filePath, Buffer.from(pdfBase64, 'base64'));
        labelUrl = `${process.env.BACKEND_URL || ''}/uploads/labels/${fileName}`.replace(/\/\/uploads/, '/uploads');
      }
      return {
        success: true,
        trackingNumber,
        carrier: 'SendCloud',
        labelUrl: labelUrl || undefined,
        labelPath: labelUrl ? labelUrl.replace(/^.*\/uploads/, '/uploads/labels') : undefined,
        pdfBase64: pdfBase64 || undefined,
        sendcloudShipmentId: shipmentId ? String(shipmentId) : undefined,
        sendcloudParcelId: parcelId ? String(parcelId) : undefined
      };
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.errors?.[0]?.detail || data?.errors?.[0]?.title || data?.message || err.message;
      const full = data ? JSON.stringify(data) : err.message;
      console.error('[SendCloud] generateShippingLabel error:', msg);
      console.error('[SendCloud] full response:', full);
      throw new Error(`SendCloud: ${msg}`);
    }
  }

  async generateReturnLabel(order, returnReason = '') {
    if (!this.hasCredentials) {
      throw new Error('SendCloud non configuré. Définissez SENDCLOUD_API_KEY et SENDCLOUD_API_SECRET.');
    }
    const returnOption = this.returnShippingOptionCode || this.shippingOptionCode;
    const returnContract = this.returnContractId != null ? this.returnContractId : this.contractId;
    if (!returnOption || returnContract == null) {
      throw new Error('SendCloud: option de retour non configurée (SENDCLOUD_RETURN_SHIPPING_OPTION_CODE ou SENDCLOUD_SHIPPING_OPTION_CODE et contract).');
    }
    try {
      const fromAddress = this._toAddress(order);
      const toAddress = this._getFromAddress();
      const weightKg = parseFloat(this._orderWeightKg(order), 10);
      const payload = {
        from_address: {
          name: fromAddress.name || 'Client',
          company_name: fromAddress.company_name || '',
          address_line_1: fromAddress.address_line_1 || '',
          house_number: fromAddress.house_number || '0',
          postal_code: fromAddress.postal_code || '',
          city: fromAddress.city || '',
          country_code: fromAddress.country_code || 'FR',
          phone_number: fromAddress.phone_number || '+33000000000',
          email: fromAddress.email || ''
        },
        to_address: {
          name: toAddress.name,
          company_name: toAddress.company_name,
          address_line_1: toAddress.address_line_1,
          house_number: toAddress.house_number,
          postal_code: toAddress.postal_code,
          city: toAddress.city,
          country_code: toAddress.country_code,
          phone_number: toAddress.phone_number,
          email: toAddress.email
        },
        ship_with: {
          type: 'shipping_option_code',
          shipping_option_code: returnOption,
          contract: returnContract
        },
        weight: { value: Math.max(0.1, weightKg), unit: 'kg' },
        dimensions: { length: 30, width: 20, height: 15, unit: 'cm' },
        order_number: order.getFormattedOrderNumber ? order.getFormattedOrderNumber() : `ORD-${order._id}`,
        total_order_value: { value: order.totalPrice || 0, currency: 'EUR' },
        parcel_items: (order.orderItems || []).slice(0, 5).map((item) => ({
          description: (item.name || 'Article').slice(0, 100),
          quantity: item.qty || 1,
          weight: { value: 0.3, unit: 'kg' },
          value: { value: item.price || 0, currency: 'EUR' },
          hs_code: '6205.20',
          origin_country: 'FR'
        }))
      };
      const response = await axios.post(`${PANEL_BASE}/v3/returns/announce-synchronously`, payload, {
        headers: this._headers(),
        timeout: 60000
      });
      const returnId = response.data?.return_id;
      const parcelId = response.data?.parcel_id;
      if (!parcelId) {
        throw new Error('Réponse SendCloud retour invalide: pas de parcel_id');
      }
      let returnLabelUrl = null;
      let pdfBase64 = null;
      try {
        const docRes = await axios.get(`${PANEL_BASE}/v3/parcels/${parcelId}/documents/label`, {
          headers: this._headers(),
          responseType: 'arraybuffer',
          timeout: 15000
        });
        const labelDir = path.join(__dirname, '../uploads/labels');
        await fs.ensureDir(labelDir);
        const fileName = `return_label_${order._id}_${Date.now()}.pdf`;
        const filePath = path.join(labelDir, fileName);
        await fs.writeFile(filePath, docRes.data);
        returnLabelUrl = `${process.env.BACKEND_URL || ''}/uploads/labels/${fileName}`.replace(/\/\/uploads/, '/uploads');
        pdfBase64 = Buffer.from(docRes.data).toString('base64');
      } catch (e) {
        console.error('[SendCloud] Failed to fetch return label document:', e.message);
      }
      const trackingRes = await axios.get(`${PANEL_BASE}/v3/parcels/${parcelId}`, {
        headers: this._headers(),
        timeout: 10000
      }).catch(() => null);
      const returnTrackingNumber = trackingRes?.data?.tracking_number || trackingRes?.data?.data?.tracking_number || null;
      return {
        success: true,
        returnTrackingNumber: returnTrackingNumber || undefined,
        returnLabelUrl: returnLabelUrl || undefined,
        returnLabelPath: returnLabelUrl ? returnLabelUrl.replace(/^.*\/uploads/, '/uploads/labels') : undefined,
        pdfBase64: pdfBase64 || undefined
      };
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.detail || err.response?.data?.error?.message || err.message;
      console.error('[SendCloud] generateReturnLabel error:', msg);
      throw new Error(`SendCloud retour: ${msg}`);
    }
  }

  async trackParcel(trackingNumber) {
    if (!this.hasCredentials) {
      return { success: false, error: 'SendCloud non configuré' };
    }
    try {
      const encoded = encodeURIComponent(trackingNumber);
      const response = await axios.get(`${PANEL_BASE}/v3/parcels/tracking/${encoded}`, {
        headers: this._headers(),
        timeout: 10000
      });
      const d = response.data;
      const events = (d.events || []).map((e) => ({
        date: e.event_at,
        label: e.status_description || e.status_code,
        code: e.status_code
      }));
      const lastEvent = events[0];
      return {
        success: true,
        trackingNumber: trackingNumber,
        status: lastEvent?.code || 'unknown',
        statusLabel: lastEvent?.label || '',
        events,
        trackingUrl: d.tracking_numbers?.[0]?.tracking_url || null,
        deliveryDate: d.details?.expected_delivery_date || null
      };
    } catch (err) {
      if (err.response?.status === 404) {
        return { success: false, error: 'Colis non trouvé' };
      }
      const msg = err.response?.data?.detail || err.message;
      return { success: false, error: msg };
    }
  }
}

module.exports = new SendCloudService();
