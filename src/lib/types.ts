export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface Product {
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
  category?: Category;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  sort_order: number;
  created_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface ShippingAddress {
  full_name: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  shipping_cost: number;
  payment_id: string;
  payment_method: string;
  mercadopago_preference_id: string;
  mercadopago_payment_id: string;
  shipping_address: ShippingAddress;
  notes: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  profile?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
