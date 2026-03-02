import type { CartItem } from './cart';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderAddress {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  name: string;
  qty: number;
  image: string;
  price: number;
  priceHT: number;
  variant: {
    size: string;
    color: string;
    colorCode?: string;
  };
  variantId: string;
  product: string;
}

export interface PaymentResult {
  id: string;
  status: string;
  update_time: string;
  email_address: string;
  payment_intent?: string;
  client_secret?: string;
}

export interface Order {
  _id: string;
  user: string | {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  orderItems: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  paymentMethod: string;
  paymentResult?: PaymentResult;
  stripeSessionId?: string;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  status: OrderStatus;
  shippingMethod?: 'home_delivery' | 'relay_point';
  relayPoint?: {
    id: string;
    carrier: string;
    name: string;
    address: string;
    postalCode: string;
    city: string;
  };
  deliveredAt?: string;
  trackingNumber?: string;
  carrier?: string;
  returnStatus?: 'none' | 'requested' | 'label_generated' | 'in_transit' | 'received' | 'completed';
  returnReason?: string;
  returnRequestedAt?: string;
  returnTrackingNumber?: string;
  returnLabelUrl?: string;
  returnLabelGeneratedAt?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    address: OrderAddress;
  };
  items: {
    name: string;
    variant: string;
    quantity: number;
    priceTTC: number;
    priceHT: number;
    totalTTC: number;
    totalHT: number;
  }[];
  subtotalTTC: number;
  subtotalHT: number;
  taxAmount: number;
  shippingPrice: number;
  totalPrice: number;
}
