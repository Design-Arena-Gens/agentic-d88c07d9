export type UserRole = 'admin' | 'staff' | 'accountant';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  lowStockThreshold: number;
}

export interface RawMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  lowStockThreshold: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  cost: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerGst?: string;
  items: OrderItem[];
  subtotal: number;
  gstAmount: number;
  gstRate: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  createdBy: string;
  notes?: string;
}

export interface ProfitLoss {
  period: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  profitMargin: number;
}

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}
