import type { Product } from './product';

export interface CartItemVariant {
  size: string;
  color: string;
  colorCode?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant: CartItemVariant;
  variantId: string;
}

export interface Cart {
  _id?: string;
  userId?: string;
  items: CartItem[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
}
