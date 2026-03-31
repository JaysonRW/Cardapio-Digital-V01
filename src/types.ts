export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isPromotion?: boolean;
  isActive: boolean;
}

export interface Settings {
  id: string;
  whatsappNumber: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImageUrl?: string;
  bannerIsActive?: boolean;
  metaPixelId?: string;
  googleTagId?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
