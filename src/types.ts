/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PaymentStatus {
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  DUE = 'DUE',
}

export enum PaymentMode {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  NET_BANKING = 'NET_BANKING',
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'staff';
  storeName: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  outstandingDue: number;
  totalPurchases: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
}

export interface BillItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  priceAtPurchase: number;
  total: number;
}

export interface Bill {
  id: string;
  customerName: string;
  customerId: string;
  items: BillItem[];
  subtotal: number;
  discount: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  mode: PaymentMode;
  billId?: string;
  date: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
}
