
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

export interface AppointmentForDisplay {
  id: number;
  created_at: string;
  providers: {
    name: string;
    service_type: string;
    location: string;
  };
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}
