export type UserRole = 'artisan' | 'seller' | 'buyer';

export type LanguageCode = 'en' | 'hi' | 'ta' | 'te' | 'bn' | 'mr' | 'gu' | 'kn' | 'ml' | 'or' | 'od' | 'pa' | 'as' | 'ur';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  speechCode: string;
}

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  is_verified: boolean;
  verification_type?: 'gst' | 'pan' | null;
  gstin?: string;
  enrollment_id?: string;
  pan?: string;
  pan_holder_name?: string;
  full_name?: string;
  business_name?: string;
  craft_category?: string;
  state?: string;
  profile_completed: boolean;
  created_at?: string;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  business_name: string;
  craft_category: string;
  bio_story: string;
  state: string;
  district: string;
  pincode?: string;
  address?: string;
  languages_spoken: string[];
  experience_years?: number;
  upi_id?: string;
  bank_account?: string;
  bank_ifsc?: string;
  avatar_url?: string;
  badges: string[];
  updated_at?: string;
}

export interface Product {
  id: string;
  artisan_id: string;
  artisan_name: string;
  artisan_location: string;
  title: string;
  title_translations?: Record<string, string>;
  description: string;
  description_translations?: Record<string, string>;
  cultural_story?: string;
  category: string;
  craft_technique?: string;
  materials: string[];
  hours_worked: number;
  price: number;
  wholesale_price?: number;
  fair_price_suggested?: number;
  images: string[];
  stock: number;
  unit: string;
  state: string;
  district: string;
  created_at?: string;
}

export interface FairPricingResult {
  materials_cost: number;
  hours_worked: number;
  skill_level: string;
  hourly_wage_applied: number;
  labor_cost: number;
  artisan_base_cost: number;
  heritage_multiplier: number;
  fair_wholesale_price: number;
  suggested_retail_price: number;
  fair_price_range: {
    min: number;
    max: number;
  };
  breakdown_explanation: string;
}

export interface ChatMessage {
  sender_id: string;
  sender_name: string;
  sender_role: string;
  text: string;
  language: string;
  translated_text?: string;
  translated_lang?: string;
  price_offer?: number;
  timestamp: string;
}

export interface NegotiationSession {
  session_id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  buyer_id: string;
  buyer_name: string;
  buyer_lang: string;
  seller_id: string;
  seller_name: string;
  seller_lang: string;
  status: 'active' | 'accepted' | 'rejected' | 'closed';
  current_offer?: number;
  messages: ChatMessage[];
  created_at: string;
}
