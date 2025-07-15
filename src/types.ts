export type WorkDayStatus = 'pending' | 'invoiced' | 'paid';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  company_name?: string;
  notes?: string;
  created_at: string;
}

export interface WorkDay {
  id?: string; // ID único del registro en la base de datos
  date: string; // YYYY-MM-DD format
  amount: number;
  status: WorkDayStatus;
  account: string;
  notes?: string;
  client_id?: string | null;
  is_second_entry?: boolean; // Indica si es un segundo registro para el mismo día
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