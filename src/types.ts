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

// Tipos para el sistema de proyectos
export type ProjectStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type PhaseStatus = 'pending' | 'in_progress' | 'completed';
export type PaymentStatus = 'pending' | 'paid';

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  total_amount: number;
  status: ProjectStatus;
  start_date: string;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  order_index: number;
  status: PhaseStatus;
  amount?: number; // Pago asociado a esta fase
  percentage: number; // Porcentaje que representa esta fase del proyecto total (0-100)
  completed_at?: string;
  created_at: string;
}

export interface ProjectPayment {
  id: string;
  project_id: string;
  phase_id?: string;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  notes?: string;
  created_at: string;
}