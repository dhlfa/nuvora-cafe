export interface Category {
  id: string;
  category_id: string;
  name: string;
  category_name: string;
  parent_category_id: string;
  category_type: string;
  sort_order: number;
  status: string;
  subcategories: string[];
}

export interface Menu {
  id: string;
  menu_id: string;
  category_id: string;
  sku: string;
  name: string;
  menu_name: string;
  description: string;
  price: number;
  discount_price: number;
  final_price: number;
  stock: number;
  minimum_stock: number;
  image_url: string;
  is_recommended: string;
  recommended: 'yes' | 'no' | boolean;
  status: string;
  is_available: boolean;
  subcategory: string;
}

export interface MenuOption {
  id: string;
  option_id: string;
  name: string;
  option_name: string;
  price: number;
  additional_price: number;
  status?: string;
}

export interface OptionGroup {
  id: string;
  option_group_id: string;
  name: string;
  group_name: string;
  selection_type: 'single' | 'multiple';
  is_required: boolean | 'yes' | 'no';
  minimum_selection: number;
  maximum_selection: number;
  options: MenuOption[];
}

export interface MenuDetail extends Menu {
  option_groups: OptionGroup[];
}

export interface MenuDetailResponse {
  menu: Menu;
  option_groups: OptionGroup[];
}

export interface CartItem {
  id: string; // unique item id (composite of menu_id + selected options hash)
  cart_item_id?: string;
  menu_id: string;
  menu_name: string;
  category_id?: string;
  image_url?: string;
  base_price: number;
  quantity: number;
  selected_options: {
    group_id: string;
    group_name: string;
    options: MenuOption[];
  }[];
  option_total?: number;
  item_note: string;
  item_total: number; // calculated total for this item (quantity * (base_price + options_price))
}

export interface OrderItemInput {
  menu_id: string;
  quantity: number;
  note: string;
  options: {
    option_id: string;
    quantity: number;
  }[];
}

export interface OrderInput {
  action: 'createOrder';
  order_type: 'dine_in' | 'delivery';
  table_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_name?: string;
  delivery_phone?: string;
  delivery_address?: string;
  delivery_note?: string;
  delivery_fee?: number;
  payment_method: string;
  payment_gateway: string;
  customer_note: string;
  items: OrderItemInput[];
}

export interface OrderDetailItem {
  menu_id: string;
  menu_name: string;
  quantity: number;
  price: number;
  note: string;
  options: {
    option_id: string;
    name: string;
    price: number;
  }[];
}

export interface Order {
  order_id: string;
  order_number: string;
  table_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_method: string;
  payment_status: 'UNPAID' | 'PENDING' | 'WAITING_PAYMENT' | 'PAID' | 'EXPIRED' | 'FAILED' | 'CANCELLED';
  order_status: 'WAITING' | 'CONFIRMED' | 'COOKING' | 'READY' | 'DELIVERING' | 'DELIVERED' | 'DONE';
  total_price: number;
  items: OrderDetailItem[];
  created_at?: string;
}

export interface PaymentResponse {
  success: boolean;
  data: {
    token: string;
    redirect_url: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface Table {
  id: string;
  name: string;
  token: string;
  status: string;
  table_id?: string;
  table_number?: string | number;
  table_name?: string;
  capacity?: number;
}

export interface GoogleUser {
  user_id: string;
  google_user_id: string;
  name: string;
  email: string;
  photo_url: string;
  role: string;
  session_token: string;
}

