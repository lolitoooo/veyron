export interface ProductImage {
  url: string;
  alt?: string;
  isMain?: boolean;
}

export interface ProductColor {
  name: string;
  code: string;
  images?: ProductImage[];
}

export interface ProductVariant {
  _id: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  images?: ProductImage[];
  colors?: ProductColor[];
  sizes?: string[];
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  brand?: string;
  category?: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}
