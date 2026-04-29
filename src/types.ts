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

export interface ProductOption {
  id: string;
  name: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  minOptions: number;
  maxOptions: number;
  options: ProductOption[];
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
  isUpsell?: boolean;
  optionGroups?: OptionGroup[];
}

export interface LoyaltyBenefit {
  id: string;
  title: string;
  milestone: number;
}

export interface LoyaltySettings {
  isActive: boolean;
  rules?: string[];
  faqs?: { question: string; answer: string }[];
  benefits: LoyaltyBenefit[];
  cashbackEnabled?: boolean;
  cashbackType?: 'percentage' | 'fixed';
  cashbackValue?: number;
  cashbackPercentage?: number; // Mantido para compatibilidade
}

export interface MenuBanner {
  id: string;
  title?: string;
  subtitle?: string;
  imageUrl: string;
  link?: string;
  isActive: boolean;
  order: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  isActive: boolean;
  expiresAt?: any;
}

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  lastOrderAt: any;
  totalOrders: number;
  totalSpent: number;
  cashbackBalance?: number;
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
  loyaltyProgram?: LoyaltySettings;
  menuBanners?: MenuBanner[];
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedOptions?: SelectedOption[];
  cartId: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  selectedOptions?: SelectedOption[];
}

export interface Order {
  id: string;
  customer: {
    name: string;
    whatsapp?: string;
    address: string;
    orderType: 'delivery' | 'pickup';
    paymentMethod: string;
    notes?: string;
  };
  items: OrderItem[];
  totalPrice: number;
  discountAmount?: number;
  cashbackUsed?: number;
  cashbackEarned?: number;
  couponCode?: string;
  totalItems: number;
  status: 'pending' | 'preparing' | 'on_the_way' | 'completed' | 'cancelled';
  createdAt: any;
  updatedAt: any;
}
