
export enum Role { USER = 'USER', BOT = 'BOT', SYSTEM = 'SYSTEM' }
export interface Message { role: Role; text: string; imageUrl?: string; bookingDetails?: BookingDetails; isComponent?: boolean; isWelcomeAd?: boolean; }
export enum UserView { CLIENT = 'CLIENT', PROVIDER = 'PROVIDER' }
export enum AccountType { CLIENT = 'CLIENT', PROVIDER = 'PROVIDER' }
export enum Language { AR = 'ar', EN = 'en', FR = 'fr' }

export interface AuthenticatedUser {
  id: number;
  name: string;
  accountType: AccountType;
  phone?: string;
  username?: string;
  isActive?: boolean;
  subscriptionEndDate?: string;
  latitude?: number;
  longitude?: number;
  bio?: string;
  // NEW CATEGORY FIELDS
  category?: string;
  specialty?: string;
  neighborhood?: string;
  
  // NEW AI FIELDS
  custom_ai_instructions?: string; 
  price_info?: string;
  location_info?: string;
  working_hours?: string;
  booking_info?: string; 
  
  profile_image_url?: string;
  social_links?: { instagram?: string; facebook?: string; gps?: string; };
  service_type?: string;
  followers_count?: number;
  visits_count?: number;
}

// NEW AD TYPE
export interface ProviderAd {
    id: number;
    provider_id: number;
    message: string;
    image_url?: string;
    created_at: string;
    is_active: boolean;
    // New Feed Fields
    is_sponsored?: boolean;
    sponsored_end_date?: string;
    likes_count?: number;
    comments_count?: number;
    providers?: { name: string; profile_image_url: string; location: string; phone: string; neighborhood?: string; service_type?: string; };
    user_has_liked?: boolean;
}

export interface AdComment {
    id: number;
    ad_id: number;
    user_id: number;
    user_name: string;
    comment: string;
    created_at: string;
}

export interface SponsoredRequest {
    id: number;
    provider_id: number;
    ad_id: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    providers?: { name: string; phone: string };
    provider_ads?: { message: string; image_url: string };
}

export interface BookingDetails { 
    appointmentId: number; 
    name: string; 
    phone: string; 
    service: string; 
    provider: string; 
    providerId: number; // Added for security check
    location: string; 
    discount: string; 
    offerTitle?: string; 
    price?: number;
    message?: string;
}

export interface ProviderRegistrationDetails { name: string; service: string; location: string; username: string; phone: string; }
export interface FollowUp { id: number; client_id: number; provider_id: number; next_appointment_date: string; notes: string; medication_image_url?: string; clients: { full_name: string; phone: string; }; }
export interface Announcement { id: number; provider_id: number; message: string; created_at: string; providers: { name: string }; }
export interface SystemAnnouncement { id: number; title: string; message: string; image_url?: string; images?: string[]; is_active: boolean; created_at: string; provider_id?: number; }
export interface AppointmentForDisplay { id: number; created_at: string; providers: { name: string; service_type: string; location: string; }; }
export interface ProviderService { id: number; provider_id: number; name: string; price: number; discount_price?: number; }
export interface ProviderNotification { id: number; provider_id: number; message: string; created_at: string; is_read: boolean; type: 'BOOKING' | 'SYSTEM' | 'FOLLOW'; status: 'pending' | 'completed'; booking_id?: number; client_details?: any; }

export interface ChatHistoryItem {
    id: number;
    user_id: number;
    provider_id?: number; // Null for General Bot
    role: string;
    text: string;
    image_url?: string;
    created_at: string;
}

export interface Product { 
    id: number; 
    name: string; 
    description: string; 
    price: number; 
    image_url: string; 
    images?: string[]; // Multiple images
    category: string; 
    sizes?: string[]; 
    created_at: string; 
}

export interface ProductReview {
    id: number;
    product_id: number;
    user_name: string;
    comment: string;
    created_at: string;
}

// Dynamic Categories Types
export interface AppCategory {
    id: number;
    name: string;
    created_at?: string;
}

export interface AppSpecialty {
    id: number;
    category_id: number;
    name: string;
    created_at?: string;
}

export interface Category { id: number; name: string; created_at: string; }
export interface CartItem extends Product { quantity: number; selectedSize?: string; note?: string; }
export interface Order { id: number; user_id: number; user_type: string; total_amount: number; status: 'pending' | 'delivered' | 'cancelled'; items: CartItem[]; customer_details?: { name: string; phone: string; }; created_at: string; promo_code?: string; discount_amount?: number; }
export interface AdRequest { id: number; provider_id: number; message: string; image_url: string; status: 'pending' | 'approved' | 'rejected'; created_at: string; providers?: { name: string; phone: string; }; }

export interface Offer {
    id: number;
    provider_id: number;
    title: string;
    description: string;
    original_price: number;
    discount_price: number;
    image_url?: string;
    end_date?: string;
}

export interface UrgentAd {
    id: number;
    provider_id: number;
    message: string;
    is_active: boolean;
    created_at: string;
    provider_name?: string;
    providers?: { name: string };
}

export interface Property {
  id: number;
  created_at: string;
  agent_id?: number;
  title: string;
  description?: string;
  price: number;
  location: string;
  type: 'rent' | 'buy';
  images?: string[];
  contact_phone: string;
}

export interface JobPost {
  id: number;
  created_at: string;
  user_id?: number;
  user_name: string;
  title: string;
  description?: string;
  skills?: string[];
  contact_phone: string;
  likes?: number;
  category?: string;
  post_type?: 'SEEKER' | 'EMPLOYER';
  image_url?: string;
  comments_count?: number;
}

export interface JobComment {
  id: number;
  created_at: string;
  job_id: number;
  user_name: string;
  comment: string;
}

// NEW AFFILIATE TYPES
export interface AffiliatePartner {
    id: number;
    user_id: number;
    promo_code: string;
    commission_rate: number; // e.g. 0.05 for 5%
    discount_rate: number; // e.g. 0.10 for 10%
    total_earnings: number;
    status: 'pending' | 'approved' | 'rejected'; // Added Status
    created_at: string;
    clients?: { full_name: string; phone: string }; // For join query
}

export interface AffiliateSale {
    id: number;
    partner_id: number;
    order_id: number;
    amount: number;
    commission: number;
    created_at: string;
}
