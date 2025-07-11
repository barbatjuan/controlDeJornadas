export interface WorkDay {
  date: string; // YYYY-MM-DD format
  amount: number;
  isPaid: boolean;
  account: string;
  notes?: string;
}

export interface MonthStats {
  totalDays: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paidDays: number;
  pendingDays: number;
}