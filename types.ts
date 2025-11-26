

export enum Role {
  USER = 'USER',
  BOT = 'BOT',
  SYSTEM = 'SYSTEM',
}

export interface Message {
  role: Role;
  text: string;
  imageUrl?: string;
  bookingDetails?: BookingDetails;
  isComponent?: boolean;
}

export enum UserView {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
}

export enum AccountType {
  CLIENT = 'CLIENT',
  PROVIDER = 'PROVIDER',
}

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
  profile_image_url?: string;
}


export enum Language {
  AR = 'ar',
  EN = 'en',
  FR = 'fr',
}

export interface BookingDetails {
  name: string;
  phone: string;
  service: string;
  provider: string;
  location: string;
  discount: string;
  appointmentId: number;
}

export interface ProviderRegistrationDetails {
  name: string;
  service: string;
  location: string;
  username: string;
  phone: string;
}

export interface FollowUp {
  id: number;
  client_id: number;
  provider_id: number;
  next_appointment_date: string;
  notes: string;
  medication_image_url?: string;
  clients: { full_name: string; phone: string; };
}

export interface Announcement {
  id: number;
  provider_id: number;
  message: string;
  created_at: string;
  providers: { name: string };
}

export interface SystemAnnouncement {
  id: number;
  title: string;
  message: string;
  image_url?: string;
  images?: string[]; // Added support for multiple images
  is_active: boolean;
  created_at: string;
}

export interface AppointmentForDisplay {
  id: number;
  created_at: string;
  providers: {
    name: string;
    service_type: string;
    location: string;
  };
}

export interface ProviderService {
  id: number;
  provider_id: number;
  name: string;
  price: number;
  discount_price?: number;
}

export interface ProviderNotification {
  id: number;
  provider_id: number;
  message: string;
  created_at: string;
  is_read: boolean;
  type: 'BOOKING' | 'SYSTEM';
  status: 'pending' | 'completed'; // New: Track if client arrived
  booking_id?: number; // Link to appointment
  client_details?: any; // virtual field for UI
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  sizes?: string[]; // New: Available sizes
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string; // New: User selected size
  note?: string; // New: User note
}

export interface Order {
  id: number;
  user_id: number;
  user_type: string; // 'CLIENT' or 'PROVIDER'
  total_amount: number;
  status: 'pending' | 'delivered' | 'cancelled';
  items: CartItem[];
  customer_details?: {
    name: string;
    phone: string;
  };
  created_at: string;
}