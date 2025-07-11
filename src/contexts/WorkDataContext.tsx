import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { WorkDay, MonthStats } from '../types';
import { supabase } from '../utils/supabase';

// 1. Definir la forma del contexto
interface IWorkDataContext {
  workDays: WorkDay[];
  isLoaded: boolean;
  addOrUpdateWorkDays: (days: WorkDay[]) => Promise<void>;
  removeWorkDay: (date: string) => Promise<void>;
  getWorkDay: (date: string) => WorkDay | undefined;
  getMonthStats: (year: number, month: number) => MonthStats;
  getTotalInvoiced: () => number;
}

// 2. Crear el Contexto
const WorkDataContext = createContext<IWorkDataContext | undefined>(undefined);

// 3. Crear el Proveedor del Contexto (El componente que maneja el estado)
interface WorkDataProviderProps {
  children: ReactNode;
}

export const WorkDataProvider: React.FC<WorkDataProviderProps> = ({ children }) => {
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchWorkDays = useCallback(async () => {
    console.log('📡 [Context] Fetching work days from Supabase...');
    try {
      const { data, error } = await supabase.from('work_days').select('*');
      if (error) throw error;
      console.log('✅ [Context] Loaded data from Supabase:', data);
      setWorkDays(data || []);
    } catch (error) {
      console.error('❌ [Context] Error loading work data:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchWorkDays();
  }, [fetchWorkDays]);

  const addOrUpdateWorkDays = async (days: WorkDay[]) => {
    console.log('➕ [Context] Upserting work days:', days);
    try {
      const { error } = await supabase.from('work_days').upsert(days, { onConflict: 'date' });
      if (error) throw error;
      console.log('✅ [Context] Upsert successful');
      await fetchWorkDays(); // Recargar datos para que todos los componentes se actualicen
    } catch (error) {
      console.error('❌ [Context] Error upserting work data:', error);
    }
  };

  const removeWorkDay = async (date: string) => {
    console.log('🗑️ [Context] Removing work day:', date);
    try {
      const { error } = await supabase.from('work_days').delete().eq('date', date);
      if (error) throw error;
      console.log('✅ [Context] Deletion successful');
      setWorkDays(prev => prev.filter(w => w.date !== date)); // Actualización optimista
    } catch (error) {
      console.error('❌ [Context] Error removing work day:', error);
    }
  };

  const getWorkDay = (date: string): WorkDay | undefined => {
    return workDays.find(w => w.date === date);
  };

  const getMonthStats = (year: number, month: number): MonthStats => {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthWorkDays = workDays.filter(w => w.date.startsWith(monthKey));

    const paidDays = monthWorkDays.filter(w => w.status === 'paid');
    const pendingDays = monthWorkDays.filter(w => w.status === 'pending');
    const invoicedDays = monthWorkDays.filter(w => w.status === 'invoiced');

    return {
      totalDays: monthWorkDays.length,
      totalAmount: monthWorkDays.reduce((sum, w) => sum + w.amount, 0),
      paidAmount: paidDays.reduce((sum, w) => sum + w.amount, 0),
      pendingAmount: pendingDays.reduce((sum, w) => sum + w.amount, 0),
      invoicedAmount: invoicedDays.reduce((sum, w) => sum + w.amount, 0),
      paidDays: paidDays.length,
      pendingDays: pendingDays.length,
      invoicedDays: invoicedDays.length,
    };
  };

  const value = {
    workDays,
    isLoaded,
    fetchWorkDays,
    addOrUpdateWorkDays,
    removeWorkDay,
    getMonthStats,
    getWorkDay,
    getTotalInvoiced,
  };

  return <WorkDataContext.Provider value={value}>{children}</WorkDataContext.Provider>;
};

// 4. Crear un hook personalizado para usar el contexto fácilmente
export const useWorkData = () => {
  const context = useContext(WorkDataContext);
  if (context === undefined) {
    throw new Error('useWorkData must be used within a WorkDataProvider');
  }
  return context;
};
