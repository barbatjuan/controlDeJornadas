import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { toast } from 'sonner';
import { WorkDay, MonthStats, Client } from '../types';
import { supabase } from '../utils/supabase';

// 1. Definir la forma del contexto
interface IWorkDataContext {
  clients: Client[];
  workDays: WorkDay[];
  isLoaded: boolean;
  addOrUpdateWorkDays: (days: WorkDay[]) => Promise<void>;
  addOrUpdateClient: (client: Partial<Client>) => Promise<void>;
  removeWorkDay: (date: string) => Promise<void>;
  getWorkDay: (date: string) => WorkDay | undefined;
  getMonthStats: (year: number, month: number) => MonthStats;
  getTotalInvoiced: () => number;
  getTotalPending: () => number;
  getMonthlyRevenue: (dateFilter?: Date | null) => { name: string; Pagado: number }[];
  getFinancialStatusDistribution: (dateFilter?: Date | null) => { name: string; value: number }[];
  getRevenueByClient: (dateFilter?: Date | null) => { name: string; value: number }[];
}

// 2. Crear el Contexto
const WorkDataContext = createContext<IWorkDataContext | undefined>(undefined);

// 3. Crear el Proveedor del Contexto (El componente que maneja el estado)
interface WorkDataProviderProps {
  children: ReactNode;
}

export const WorkDataProvider: React.FC<WorkDataProviderProps> = ({ children }) => {
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
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

  const fetchClients = useCallback(async () => {
    console.log('📡 [Context] Fetching clients from Supabase...');
    try {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (error) throw error;
      console.log('✅ [Context] Loaded clients from Supabase:', data);
      setClients(data || []);
    } catch (error) {
      console.error('❌ [Context] Error loading clients:', error);
    }
  }, []);

  useEffect(() => {
    fetchWorkDays();
    fetchClients();
  }, [fetchWorkDays, fetchClients]);

  const addOrUpdateClient = async (client: Partial<Client>) => {
    console.log('➕ [Context] Upserting client:', client);
    try {
      const { error } = await supabase.from('clients').upsert(client, { onConflict: 'id' });
      if (error) throw error;
      console.log('✅ [Context] Client upsert successful');
      await fetchClients(); // Recargar clientes para que todos los componentes se actualicen
    } catch (error) {
      console.error('❌ [Context] Error upserting client:', error);
    }
  };

  const addOrUpdateWorkDays = async (days: WorkDay[]) => {
    console.log('➕ [Context] Upserting work days:', days);
    try {
      const { error } = await supabase.from('work_days').upsert(days, { onConflict: 'date' });
      if (error) throw error;
      console.log('✅ [Context] Upsert successful');
      toast.success('Jornadas guardadas correctamente');
      await fetchWorkDays(); // Recargar datos para que todos los componentes se actualicen
    } catch (error: any) {
      console.error('❌ [Context] Error upserting work data:', error);
      toast.error(`Error al guardar: ${error.message}`);
    }
  };

  const removeWorkDay = async (date: string) => {
    console.log('🗑️ [Context] Removing work day:', date);
    try {
      const { error } = await supabase.from('work_days').delete().eq('date', date);
      if (error) throw error;
      console.log('✅ [Context] Deletion successful');
      toast.success('Jornada eliminada correctamente');
      setWorkDays(prev => prev.filter(w => w.date !== date)); // Actualización optimista
    } catch (error: any) {
      console.error('❌ [Context] Error removing work day:', error);
      toast.error(`Error al eliminar: ${error.message}`);
    }
  };

  const getWorkDay = (date: string): WorkDay | undefined => {
    return workDays.find(w => w.date === date);
  };

  const getTotalPending = () => {
    return workDays
      .filter(wd => wd.status === 'pending')
      .reduce((acc, wd) => acc + wd.amount, 0);
  };

  const getTotalInvoiced = () => {
    return workDays
      .filter(wd => wd.status === 'invoiced')
      .reduce((acc, wd) => acc + wd.amount, 0);
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

  const getMonthlyRevenue = (dateFilter: Date | null = null) => {
    const revenueByMonth: { [key: string]: number } = {};
    const today = new Date();
    
    // Determinar el número de meses a mostrar basado en el filtro
    let startDate = new Date(today);
    startDate.setFullYear(today.getFullYear() - 1); // Por defecto, últimos 12 meses
    
    if (dateFilter) {
      startDate = new Date(dateFilter); // Usar el filtro proporcionado
    }
    
    // Crear un mapa de meses desde la fecha de inicio hasta hoy
    let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    while (currentMonth <= today) {
      const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[monthKey] = 0;
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    // Filtrar los días de trabajo por la fecha si es necesario
    const filteredDays = dateFilter 
      ? workDays.filter(day => new Date(day.date) >= dateFilter)
      : workDays;

    // Acumular ingresos por mes
    filteredDays.forEach(day => {
      if (day.status === 'paid') {
        const monthKey = day.date.substring(0, 7);
        if (monthKey in revenueByMonth) {
          revenueByMonth[monthKey] += day.amount;
        }
      }
    });

    return Object.entries(revenueByMonth)
      .map(([name, amount]) => ({ name, Pagado: amount }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getFinancialStatusDistribution = (dateFilter: Date | null = null) => {
    const distribution = {
      Pagado: 0,
      Facturado: 0,
      Pendiente: 0,
    };

    // Filtrar los días de trabajo por la fecha si es necesario
    const filteredDays = dateFilter 
      ? workDays.filter(day => new Date(day.date) >= dateFilter)
      : workDays;

    filteredDays.forEach(day => {
      if (day.status === 'paid') distribution.Pagado += day.amount;
      else if (day.status === 'invoiced') distribution.Facturado += day.amount;
      else if (day.status === 'pending') distribution.Pendiente += day.amount;
    });

    return [
      { name: 'Pagado', value: distribution.Pagado },
      { name: 'Facturado', value: distribution.Facturado },
      { name: 'Pendiente', value: distribution.Pendiente },
    ];
  };

  const getRevenueByClient = (dateFilter: Date | null = null) => {
    const revenue: { [key: string]: number } = {};

    // Filtrar los días de trabajo por la fecha si es necesario
    const filteredDays = dateFilter 
      ? workDays.filter(day => new Date(day.date) >= dateFilter)
      : workDays;

    filteredDays.forEach(day => {
      // Consideramos todos los estados, no solo los pagados
      const clientId = day.client_id || 'sin-cliente';
      if (!revenue[clientId]) {
        revenue[clientId] = 0;
      }
      revenue[clientId] += day.amount;
    });

    // Ordenar por valor descendente para mostrar los clientes con más ingresos primero
    return Object.entries(revenue)
      .map(([clientId, amount]) => {
        const client = clients.find(c => c.id === clientId);
        return {
          name: client ? client.name : 'Sin Cliente',
          value: amount,
        };
      })
      .sort((a, b) => b.value - a.value);
  };

  const value: IWorkDataContext = {
    clients,
    workDays,
    isLoaded,
    addOrUpdateClient,
    addOrUpdateWorkDays,
    removeWorkDay,
    getMonthStats,
    getWorkDay,
    getTotalInvoiced,
    getTotalPending,
    getMonthlyRevenue,
    getFinancialStatusDistribution,
    getRevenueByClient,
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
