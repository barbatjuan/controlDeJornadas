import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { toast } from 'sonner';
import { WorkDay, MonthStats, Client } from '../types';
import { supabase } from '../utils/supabase';
import { formatDate } from '../utils/dateUtils';

// 1. Definir la forma del contexto
interface IWorkDataContext {
  isLoaded: boolean;
  workDays: WorkDay[];
  clients: Client[];
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  addOrUpdateWorkDays: (days: WorkDay[]) => void;
  addOrUpdateSecondWorkDay: (day: WorkDay) => void;
  removeWorkDay: (date: string, isSecondEntry?: boolean) => void;
  getWorkDay: (date: string) => WorkDay | undefined;
  getSecondWorkDay: (date: string) => WorkDay | undefined;
  getMonthStats: () => MonthStats;
  getFinancialStatusDistribution: (dateFilter: Date | null) => { name: string, value: number }[];
  getMonthlyRevenue: (dateFilter: Date | null) => { name: string, Pagado: number }[];
  getRevenueByClient: (dateFilter: Date | null) => { name: string, value: number }[];
  getTotalPaid: () => number;
  getTotalAmount: () => number;
}

// 2. Crear el Contexto
const WorkDataContext = createContext<IWorkDataContext | undefined>(undefined);

// 3. Crear el Proveedor del Contexto (El componente que maneja el estado)
interface WorkDataProviderProps {
  children: ReactNode;
}

export const WorkDataProvider: React.FC<WorkDataProviderProps> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date());

  const fetchWorkDays = useCallback(async () => {
    console.log('📡 [Context] Fetching work days from Supabase...');
    try {
      const { data, error } = await supabase.from('work_days').select('*');
      if (error) throw error;
      console.log(`✅ [Context] Fetched ${data.length} work days`);
      setWorkDays(data);
    } catch (error) {
      console.error('❌ [Context] Error fetching work days:', error);
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
    if (!days || days.length === 0) return;

    try {
      for (const day of days) {
        // Verificar si ya existe un registro para esa fecha (que no sea segundo registro)
        const existingDay = getWorkDay(day.date);
        
        // Limpiar el objeto para solo incluir campos válidos para la BD
        const cleanDay: any = {
          date: day.date,
          amount: day.amount,
          status: day.status,
          account: day.account,
          notes: day.notes,
          client_id: day.client_id,
          is_second_entry: false // Marcar explícitamente como primer registro
        };

        if (existingDay) {
          // Actualizar registro existente
          const { error } = await supabase
            .from('work_days')
            .update(cleanDay)
            .eq('id', existingDay.id); // Usar ID en lugar de fecha para ser más precisos
            
          if (error) throw error;
        } else {
          // Crear nuevo registro
          const { error } = await supabase
            .from('work_days')
            .insert([cleanDay]);
            
          if (error) throw error;
        }
      }
      
      // Recargar los días después de guardar
      fetchWorkDays();
      toast.success('Guardado correctamente');
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar');
    }
  };

  const addOrUpdateSecondWorkDay = async (day: WorkDay) => {
    if (!day) return;

    try {
      // Verificar si ya existe un segundo registro para esa fecha
      const existingSecondDay = getSecondWorkDay(day.date);
        
      // Limpiar el objeto para solo incluir campos válidos para la BD
      const cleanDay: any = {
        date: day.date,
        amount: day.amount,
        status: day.status,
        account: day.account,
        notes: day.notes,
        client_id: day.client_id,
        is_second_entry: true // Marcar explícitamente como segundo registro
      };

      if (existingSecondDay) {
        // Actualizar segundo registro existente
        const { error } = await supabase
          .from('work_days')
          .update(cleanDay)
          .eq('id', existingSecondDay.id);
            
        if (error) throw error;
      } else {
        // Crear nuevo segundo registro
        const { error } = await supabase
          .from('work_days')
          .insert([cleanDay]);
            
        if (error) throw error;
      }
      
      // Recargar los días después de guardar
      fetchWorkDays();
      toast.success('Segundo registro guardado correctamente');
    } catch (error) {
      console.error('Error al guardar segundo registro:', error);
      toast.error('Error al guardar segundo registro');
    }
  };

  const removeWorkDay = async (date: string, isSecondEntry: boolean = false) => {
    console.log('🗑️ [Context] Removing work day:', date);
    try {
      if (isSecondEntry) {
        const existingSecondDay = getSecondWorkDay(date);
        if (existingSecondDay) {
          const { error } = await supabase
            .from('work_days')
            .delete()
            .eq('id', existingSecondDay.id);
            
          if (error) throw error;
          setWorkDays(workDays.filter(w => w.id !== existingSecondDay.id));
        }
      } else {
        const existingDay = getWorkDay(date);
        if (existingDay) {
          const { error } = await supabase
            .from('work_days')
            .delete()
            .eq('id', existingDay.id);
            
          if (error) throw error;
          setWorkDays(workDays.filter(w => w.id !== existingDay.id));
        }
      }
    } catch (error: any) {
      console.error('❌ [Context] Error removing work day:', error);
      toast.error(`Error al eliminar: ${error.message}`);
    }
  };

  const getWorkDay = (date: string) => {
    return workDays.find(day => day.date === date && !day.is_second_entry);
  };

  const getSecondWorkDay = (date: string) => {
    return workDays.find(day => day.date === date && day.is_second_entry === true);
  };

  const getTotalPaid = () => {
    return workDays
      .filter(wd => wd.status === 'paid')
      .reduce((acc, wd) => acc + wd.amount, 0);
  };

  const getTotalInvoiced = () => {
    return workDays
      .filter(wd => wd.status === 'invoiced')
      .reduce((acc, wd) => acc + wd.amount, 0);
  };

  const getTotalPending = () => {
    return workDays
      .filter(wd => wd.status === 'pending')
      .reduce((acc, wd) => acc + wd.amount, 0);
  };

  const getMonthStats = (year = new Date().getFullYear(), month = new Date().getMonth()) => {
    // Filtramos los workDays del mes seleccionado
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const firstDayStr = formatDate(firstDayOfMonth);
    const lastDayStr = formatDate(lastDayOfMonth);
    
    // Filtramos los workdays del mes actual
    const workDaysInMonth = workDays.filter(day => {
      return day.date >= firstDayStr && day.date <= lastDayStr;
    });
    
    // Estadísticas
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let invoicedAmount = 0;
    let paidDaysCount = 0;
    let pendingDaysCount = 0;
    let invoicedDaysCount = 0;

    // Set para rastrear las fechas únicas que ya han sido contadas para cada estado
    const paidDaysSet = new Set();
    const pendingDaysSet = new Set();
    const invoicedDaysSet = new Set();
    
    // Procesamos cada día y acumulamos estadísticas
    workDaysInMonth.forEach(day => {
      const amount = day.amount || 0;
      totalAmount += amount;
      
      // Procesar el pago según su estado
      if (day.status === 'paid') {
        paidAmount += amount;
        // Solo contamos el día una vez aunque haya múltiples registros
        if (!paidDaysSet.has(day.date)) {
          paidDaysCount++;
          paidDaysSet.add(day.date);
        }
      } else if (day.status === 'pending') {
        pendingAmount += amount;
        if (!pendingDaysSet.has(day.date)) {
          pendingDaysCount++;
          pendingDaysSet.add(day.date);
        }
      } else if (day.status === 'invoiced') {
        invoicedAmount += amount;
        if (!invoicedDaysSet.has(day.date)) {
          invoicedDaysCount++;
          invoicedDaysSet.add(day.date);
        }
      }
    });
    
    return {
      totalDays: workDaysInMonth.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      invoicedAmount,
      paidDays: paidDaysCount,
      pendingDays: pendingDaysCount,
      invoicedDays: invoicedDaysCount
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

    // Acumular ingresos por mes, usando el nuevo modelo de datos
    filteredDays.forEach(day => {
      const monthKey = day.date.substring(0, 7);
      if (monthKey in revenueByMonth) {
        // Añadir pago si está pagado, independientemente de si es un primer o segundo registro
        if (day.status === 'paid') {
          revenueByMonth[monthKey] += day.amount || 0;
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
      // Procesar cada registro independientemente de si es primer o segundo pago
      const amount = day.amount || 0;
      if (day.status === 'paid') distribution.Pagado += amount;
      else if (day.status === 'invoiced') distribution.Facturado += amount;
      else if (day.status === 'pending') distribution.Pendiente += amount;
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
      // Procesamos cada pago individualmente
      const amount = day.amount || 0;
      const clientId = day.client_id || 'sin-cliente';
      if (!revenue[clientId]) {
        revenue[clientId] = 0;
      }
      revenue[clientId] += amount;
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

  const getTotalAmount = () => {
    return workDays.reduce((total, day) => {
      total += day.amount || 0;
      return total;
    }, 0);
  };

  // Objeto con todos los valores y funciones para el contexto
  const value: IWorkDataContext = {
    isLoaded,
    workDays,
    clients,
    selectedMonth,
    setSelectedMonth,
    addOrUpdateWorkDays,
    addOrUpdateSecondWorkDay,
    removeWorkDay,
    getWorkDay,
    getSecondWorkDay,
    getMonthStats,
    getMonthlyRevenue,
    getFinancialStatusDistribution,
    getRevenueByClient,
    getTotalPaid,
    getTotalAmount
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
