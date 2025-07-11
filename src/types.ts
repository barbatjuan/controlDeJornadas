export type WorkDayStatus = 'pending' | 'invoiced' | 'paid';

export interface WorkDay {
  date: string; // YYYY-MM-DD format
  amount: number;
  status: WorkDayStatus;
  account: string;
  notes?: string;
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