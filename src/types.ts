import type { ThemeIntensity, ThemePresetId } from './lib/theme';

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  ownerUid: string;
  isActive: boolean;
  settings?: Settings;
  createdAt: any;
  updatedAt: any;
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
  themePreset?: ThemePresetId;
  themeIntensity?: ThemeIntensity;
  primaryColorOverride?: string;
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
  restaurantLogoUrl?: string;
  restaurantHours?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  heroSubtitle?: string;
  heroDescription?: string;
  heroImageUrl?: string;
  footerDescription?: string;
  isOpen?: boolean;
  deliveryTime?: string;
  pickupTime?: string;
  enableReservations?: boolean;
  reservationEnvironments?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
