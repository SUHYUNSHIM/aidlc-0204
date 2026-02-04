// Domain Entities

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  imageUrl?: string;
  categoryId: string;
  categoryName: string;
  displayOrder: number;
  isAvailable: boolean;
}

export interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  addedAt: string;
}

export interface Cart {
  items: CartItem[];
  lastUpdated: string;
}

export interface OrderItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  COMPLETED = 'completed',
}

export interface Order {
  orderId: string;
  tableId: string;
  sessionId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  estimatedPrepTime?: number;
}

export interface CustomerSession {
  tableId: string;
  tableName: string;
  storeId: string;
  storeName: string;
  authToken: string;
  sessionId: string;
  expiresAt: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  displayOrder: number;
}

// API Request/Response Types

export interface LoginCredentials {
  storeId: string;
  tableNumber: string;
  tablePassword: string;
}

export interface AuthResponse {
  token: string;
  table_id: string;
  table_name: string;
  store_id: string;
  store_name: string;
  session_id: string;
  expires_at: string;
}

export interface SessionResponse {
  expires_at: string;
}

export interface CreateOrderInput {
  tableId: string;
  sessionId: string;
  items: OrderItem[];
  totalAmount: number;
}

// Validation Result

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
