export interface Event {
  id: string;
  title: string;
  description: string;
  category: 'social' | 'networking' | 'business' | 'workshop' | 'conference' | 'entertainment';
  date: string;
  time: string;
  location: string;
  organizer_id: string;
  organizer_name: string;
  organizer_avatar?: string;
  image_url: string;
  price: number;
  currency: string;
  capacity: number;
  attendees_count: number;
  rating: number;
  reviews_count: number;
  features: string[];
  speakers: string[];
  status: 'upcoming' | 'happening' | 'past';
  is_livestream: boolean;
  livestream_url?: string;
  created_at: string;
  updated_at: string;
}

export interface EventMemory {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  image_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface EventComment {
  id: string;
  memory_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  likes_count: number;
  created_at: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: 'venue' | 'catering' | 'decor' | 'audio' | 'photography' | 'entertainment' | 'security' | 'transport' | 'ushering';
  description: string;
  expertise: string;
  base_price: number;
  rating: number;
  reviews_count: number;
  contact_email: string;
  contact_phone: string;
  portfolio_images: string[];
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventBooking {
  id: string;
  event_id: string;
  organizer_id: string;
  event_name: string;
  event_date: string;
  services: Array<{
    provider_id: string;
    provider_name: string;
    category: string;
    quantity: number;
    unit_price: number;
  }>;
  total_cost: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  created_at: string;
  updated_at: string;
}
