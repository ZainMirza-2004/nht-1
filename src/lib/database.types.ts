export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      spa_bookings: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          booking_date: string
          time_slot: string
          package_type: string
          package_price: number
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone: string
          booking_date: string
          time_slot: string
          package_type: string
          package_price: number
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          booking_date?: string
          time_slot?: string
          package_type?: string
          package_price?: number
          created_at?: string
        }
      }
      cinema_bookings: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          booking_date: string
          time_slot: string
          package_type: string
          package_price: number
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone: string
          booking_date: string
          time_slot: string
          package_type: string
          package_price: number
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          booking_date?: string
          time_slot?: string
          package_type?: string
          package_price?: number
          created_at?: string
        }
      }
      featured_properties: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string
          airbnb_url: string
          location: string
          price_per_night: number
          bedrooms: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          image_url: string
          airbnb_url: string
          location: string
          price_per_night: number
          bedrooms?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          airbnb_url?: string
          location?: string
          price_per_night?: number
          bedrooms?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
