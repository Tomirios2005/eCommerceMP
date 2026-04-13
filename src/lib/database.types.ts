export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string;
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string;
          role?: 'user' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string;
          role?: 'user' | 'admin';
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          price: number;
          compare_price: number | null;
          stock: number;
          sku: string;
          main_image: string;
          category_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          price: number;
          compare_price?: number | null;
          stock?: number;
          sku?: string;
          main_image?: string;
          category_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string;
          price?: number;
          compare_price?: number | null;
          stock?: number;
          sku?: string;
          main_image?: string;
          category_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          url?: string;
          alt?: string;
          sort_order?: number;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
          total: number;
          subtotal: number;
          shipping_cost: number;
          payment_id: string;
          payment_method: string;
          mercadopago_preference_id: string;
          mercadopago_payment_id: string;
          shipping_address: Json;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
          total: number;
          subtotal: number;
          shipping_cost?: number;
          payment_id?: string;
          payment_method?: string;
          mercadopago_preference_id?: string;
          mercadopago_payment_id?: string;
          shipping_address?: Json;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
          total?: number;
          subtotal?: number;
          shipping_cost?: number;
          payment_id?: string;
          payment_method?: string;
          mercadopago_preference_id?: string;
          mercadopago_payment_id?: string;
          shipping_address?: Json;
          notes?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_image: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_image?: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at?: string;
        };
        Update: {
          quantity?: number;
          unit_price?: number;
          total_price?: number;
        };
      };
    };
  };
}
