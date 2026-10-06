export type ProductStatus = 'active' | 'inactive' | 'out_of_stock';

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  product_id: string; // SKU or code e.g. 'GS-BTK-01'
  product_name: string;
  price: number;
  discount_price: number | null;
  colors: string[]; // e.g. ['Blue', 'Red', 'Black', 'Green']
  stock: number;
  size: string; // e.g. 'Free Size', 'Unstitched', '38-44'
  fabric: string; // e.g. 'Pure Cotton Batik', 'Silk Batik'
  kameez_length?: string; // e.g. '48 inch'
  salwar_length?: string; // e.g. '42 inch'
  orna_length?: string; // e.g. '5 Haath Pure Cotton'
  description: string;
  delivery_info: string;
  status: ProductStatus;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  color: string;
  quantity: number;
  unit_price: number;
  discount: number;
  subtotal: number;
  image_url?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note?: string;
  changed_by: string; // 'AI Agent' | 'Admin' | 'WhatsApp Command'
  created_at: string;
}

export interface Order {
  id: string;
  order_id: string; // e.g. 'GS-ORD-2026-1001'
  customer_id: string;
  customer_name: string;
  mobile_number: string;
  alternative_phone?: string;
  district: string;
  thana_upazila: string;
  area_village: string;
  full_address: string;
  delivery_note?: string;
  items: OrderItem[];
  subtotal: number;
  discount_total: number;
  delivery_charge: number;
  grand_total: number;
  status: OrderStatus;
  whatsapp_notification_sent: boolean;
  whatsapp_notification_status: 'pending' | 'sent' | 'failed';
  whatsapp_notification_error?: string;
  whatsapp_message_id?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile_number: string;
  facebook_psid?: string;
  total_orders: number;
  total_spent: number;
  district?: string;
  last_order_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender: 'customer' | 'ai' | 'admin';
  text: string;
  image_url?: string;
  order_summary_preview?: any;
  created_at: string;
}

export interface Conversation {
  id: string;
  customer_id: string;
  facebook_psid?: string;
  platform: 'facebook' | 'web_simulator';
  is_human_handoff: boolean;
  handoff_reason?: string;
  handoff_requested_at?: string;
  selected_product_id?: string;
  selected_color?: string;
  order_draft?: Partial<Order>;
  awaiting_confirmation?: boolean;
  last_message_at: string;
  created_at: string;
}

export interface WhatsAppCommunity {
  id: string;
  community_name: string;
  community_id: string; // WhatsApp Community JID / ID
  description: string;
  status: 'active' | 'inactive';
}

export interface WhatsAppGroup {
  id: string;
  community_id: string;
  group_name: string;
  group_id: string; // WhatsApp Group JID
  group_type: 'product_management' | 'order_notification' | 'general';
  description: string;
  status: 'active' | 'inactive';
}

export interface WhatsAppAdmin {
  id: string;
  name: string;
  phone_number: string;
  role: 'super_admin' | 'manager' | 'operator';
  is_authorized: boolean;
  added_at: string;
}

export type AIProvider = 'gemini' | 'openai' | 'grok' | 'deepseek';

export interface AISettings {
  provider: AIProvider;
  model: string;
  business_name: string;
  business_description: string;
  communication_style: string;
  system_prompt: string;
  temperature: number;
  api_keys?: {
    gemini?: string;
    openai?: string;
    grok?: string;
    deepseek?: string;
  };
  available_keys?: {
    gemini: boolean;
    openai: boolean;
    grok: boolean;
    deepseek: boolean;
  };
}

export interface BusinessSettings {
  business_name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  business_hours: string;
  about_business: string;
  delivery_policy: string;
  return_policy: string;
  exchange_policy: string;
  payment_methods: string;
  support_contact: string;
}

export interface DeliverySettings {
  inside_dhaka_charge: number;
  sub_dhaka_charge: number;
  outside_dhaka_charge: number;
  free_delivery_above: number;
  estimated_dhaka_days: string;
  estimated_outside_days: string;
}

export interface FacebookSettings {
  page_id: string;
  page_name: string;
  page_access_token: string;
  verify_token: string;
  app_secret: string;
  webhook_url: string;
  is_connected: boolean;
}

export interface WhatsAppSettings {
  business_account_id: string;
  phone_number_id: string;
  access_token: string;
  webhook_verify_token: string;
  community_id: string;
  product_management_group_id: string;
  order_notification_group_id: string;
  is_connected: boolean;
}

export interface MySQLSettings {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  is_connected: boolean;
  driver: 'mysql2' | 'embedded_sqlite_json';
}

export interface HumanHandoffRequest {
  id: string;
  conversation_id: string;
  customer_name: string;
  customer_phone?: string;
  facebook_psid?: string;
  reason: string;
  status: 'pending' | 'resolved';
  requested_at: string;
  resolved_at?: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: 'AI' | 'Facebook' | 'WhatsApp' | 'Order' | 'Product' | 'Database' | 'Auth';
  message: string;
  details?: any;
}
