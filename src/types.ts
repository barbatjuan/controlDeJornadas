export type WorkDayStatus = 'pending' | 'invoiced' | 'paid';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface WorkDay {
  date: string; // YYYY-MM-DD format
  amount: number;
  status: WorkDayStatus;
  account: string;
  notes?: string;
  client_id?: string | null;
}

export interface MonthStats {
  totalDays: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  invoicedAmount: number;
  paidDays: number;
  pendingDays: number;
  invoicedDays: number;
}