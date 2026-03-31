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
  promoBannerImageUrl?: string;
  promoBannerIsActive?: boolean;
  promoBannerLink?: string;
  restaurantName?: string;
  restaurantHours?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
