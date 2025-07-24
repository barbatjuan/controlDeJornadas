import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { toast } from 'sonner';
import { WorkDay, MonthStats, Client, ProjectPayment, Project, RecurringInvoice, RecurringPayment } from '../types';
import { supabase } from '../utils/supabase';
import { formatDate } from '../utils/dateUtils';

// 1. Definir la forma del contexto
interface IWorkDataContext {
  isLoaded: boolean;
  workDays: WorkDay[];
  clients: Client[];
  projectPayments: ProjectPayment[];
  projects: Project[];
  recurringInvoices: RecurringInvoice[];
  recurringPayments: RecurringPayment[];
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
  addOrUpdateClient: (client: Partial<Client>) => void;
  addOrUpdateWorkDays: (days: WorkDay[]) => void;
  addOrUpdateSecondWorkDay: (day: WorkDay) => void;
  removeWorkDay: (date: string, isSecondEntry?: boolean) => void;
  getWorkDay: (date: string) => WorkDay | undefined;
  getSecondWorkDay: (date: string) => WorkDay | undefined;
  getMonthStats: () => MonthStats;
  getProjectStats: () => { totalAmount: number; paidAmount: number; pendingAmount: number; };
  getRecurringStats: () => { totalAmount: number; paidAmount: number; pendingAmount: number; overdueAmount: number; };
  getFinancialStatusDistribution: (dateFilter: Date | null) => { name: string, value: number }[];
  getMonthlyRevenue: (dateFilter: Date | null) => { name: string, Pagado: number }[];
  getRevenueByClient: (dateFilter: Date | null) => { name: string, value: number }[];
  getTotalPaid: () => number;
  getTotalAmount: () => number;
  addOrUpdateRecurringInvoice: (invoice: Partial<RecurringInvoice>) => Promise<void>;
  generateRecurringPayments: () => Promise<number>;
  updateRecurringPaymentStatus: (paymentId: string, status: 'paid' | 'pending', paymentDate?: string) => Promise<boolean>;
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
  const [projectPayments, setProjectPayments] = useState<ProjectPayment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
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

  const fetchProjects = useCallback(async () => {
    console.log('📡 [Context] Fetching projects from Supabase...');
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      console.log('✅ [Context] Loaded projects from Supabase:', data);
      setProjects(data || []);
    } catch (error) {
      console.error('❌ [Context] Error loading projects:', error);
    }
  }, []);

  const fetchProjectPayments = useCallback(async () => {
    console.log('📡 [Context] Fetching project payments from Supabase...');
    try {
      const { data, error } = await supabase.from('project_payments').select('*').order('payment_date', { ascending: false });
      if (error) throw error;
      console.log('✅ [Context] Loaded project payments from Supabase:', data);
      setProjectPayments(data || []);
    } catch (error) {
      console.error('❌ [Context] Error loading project payments:', error);
    }
  }, []);

  const fetchRecurringInvoices = useCallback(async () => {
    console.log('📋 [Context] Fetching recurring invoices...');
    try {
      const { data, error } = await supabase
        .from('recurring_invoices')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        if (error.code === '42P01') {
          console.log('❌ [Context] recurring_invoices table does not exist. Please run the SQL script first.');
          setRecurringInvoices([]);
          return;
        }
        throw error;
      }
      
      console.log(`✅ [Context] Loaded ${data?.length || 0} recurring invoices`);
      setRecurringInvoices(data || []);
    } catch (error) {
      console.error('❌ [Context] Error fetching recurring invoices:', error);
      setRecurringInvoices([]);
    }
  }, [clients]);

  const fetchRecurringPayments = useCallback(async () => {
    console.log('📋 [Context] Fetching recurring payments...');
    try {
      const { data, error } = await supabase
        .from('recurring_payments')
        .select('*')
        .order('due_date', { ascending: false });
      
      if (error) {
        if (error.code === '42P01') {
          console.log('⚠️ [Context] recurring_payments table does not exist, using sample data');
          // Crear datos de ejemplo para probar la funcionalidad
          const samplePayments: RecurringPayment[] = [
            {
              id: 'sample-payment-1',
              recurring_invoice_id: 'sample-invoice-1',
              amount: 150,
              due_date: '2024-01-15',
              status: 'pending',
              payment_date: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'sample-payment-2',
              recurring_invoice_id: 'sample-invoice-1',
              amount: 150,
              due_date: '2023-12-15',
              status: 'paid',
              payment_date: '2023-12-20',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          setRecurringPayments(samplePayments);
          return;
        }
        throw error;
      }
      
      console.log(`✅ [Context] Loaded ${data?.length || 0} recurring payments`);
      setRecurringPayments(data || []);
    } catch (error) {
      console.error('❌ [Context] Error fetching recurring payments:', error);
      setRecurringPayments([]);
    }
  }, []);

  useEffect(() => {
    fetchWorkDays();
    fetchClients();
    fetchProjects();
    fetchProjectPayments();
    fetchRecurringInvoices();
    fetchRecurringPayments();
  }, []); // Solo ejecutar una vez al montar el componente

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
    
    // Determinar la fecha de inicio para el rango de meses
    const today = new Date();
    
    // Obtener fechas de todas las fuentes de datos
    const workDayDates = workDays.map(day => new Date(day.date).getTime());
    const projectPaymentDates = projectPayments.map(payment => new Date(payment.payment_date).getTime());
    const recurringPaymentDates = recurringPayments
      .filter(payment => payment.payment_date)
      .map(payment => new Date(payment.payment_date!).getTime());
    const allDates = [...workDayDates, ...projectPaymentDates, ...recurringPaymentDates];
    
    const startDate = dateFilter || (allDates.length > 0 ? new Date(Math.min(...allDates)) : today);
    
    // Si no hay datos, devolver array vacío
    if (workDays.length === 0 && projectPayments.length === 0 && recurringPayments.length === 0) {
      return [];
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

    // Acumular ingresos por mes de work_days
    filteredDays.forEach(day => {
      const monthKey = day.date.substring(0, 7);
      if (monthKey in revenueByMonth) {
        // Añadir pago si está pagado, independientemente de si es un primer o segundo registro
        if (day.status === 'paid') {
          revenueByMonth[monthKey] += day.amount || 0;
        }
      }
    });

    // Filtrar los pagos de proyectos por la fecha si es necesario
    const filteredProjectPayments = dateFilter 
      ? projectPayments.filter(payment => new Date(payment.payment_date) >= dateFilter)
      : projectPayments;

    // Acumular ingresos por mes de project_payments
    filteredProjectPayments.forEach(payment => {
      const monthKey = payment.payment_date.substring(0, 7);
      if (monthKey in revenueByMonth) {
        // Añadir pago si está pagado
        if (payment.status === 'paid') {
          revenueByMonth[monthKey] += payment.amount || 0;
        }
      }
    });

    // Filtrar los pagos recurrentes por la fecha si es necesario
    const filteredRecurringPayments = dateFilter 
      ? recurringPayments.filter(payment => payment.payment_date && new Date(payment.payment_date) >= dateFilter)
      : recurringPayments.filter(payment => payment.payment_date);

    // Acumular ingresos por mes de recurring_payments
    filteredRecurringPayments.forEach(payment => {
      const monthKey = payment.payment_date!.substring(0, 7);
      if (monthKey in revenueByMonth) {
        // Añadir pago si está pagado
        if (payment.status === 'paid') {
          revenueByMonth[monthKey] += payment.amount || 0;
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

    // Filtrar los pagos de proyectos por la fecha si es necesario
    const filteredProjectPayments = dateFilter 
      ? projectPayments.filter(payment => new Date(payment.payment_date) >= dateFilter)
      : projectPayments;

    filteredProjectPayments.forEach(payment => {
      const amount = payment.amount || 0;
      if (payment.status === 'paid') {
        distribution.Pagado += amount;
      } else if (payment.status === 'pending') {
        distribution.Pendiente += amount;
      }
      // Los pagos de proyectos solo tienen estados 'paid' y 'pending', no 'invoiced'
    });

    // Filtrar los pagos recurrentes por la fecha si es necesario
    const filteredRecurringPayments = dateFilter 
      ? recurringPayments.filter(payment => {
          // Para pagos recurrentes, usar due_date si no hay payment_date
          const relevantDate = payment.payment_date || payment.due_date;
          return new Date(relevantDate) >= dateFilter;
        })
      : recurringPayments;

    filteredRecurringPayments.forEach(payment => {
      const amount = payment.amount || 0;
      if (payment.status === 'paid') {
        distribution.Pagado += amount;
      } else if (payment.status === 'pending' || payment.status === 'overdue') {
        distribution.Pendiente += amount;
      }
      // Los pagos recurrentes tienen estados 'paid', 'pending' y 'overdue'
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

    // Filtrar los pagos de proyectos por la fecha si es necesario
    const filteredProjectPayments = dateFilter 
      ? projectPayments.filter(payment => new Date(payment.payment_date) >= dateFilter)
      : projectPayments;

    // Agregar ingresos de pagos de proyectos
    filteredProjectPayments.forEach(payment => {
      const amount = payment.amount || 0;
      // Obtener el client_id del proyecto asociado
      const project = projects.find(p => p.id === payment.project_id);
      const clientId = project?.client_id || 'sin-cliente';
      
      if (!revenue[clientId]) {
        revenue[clientId] = 0;
      }
      revenue[clientId] += amount;
    });

    // Filtrar los pagos recurrentes por la fecha si es necesario
    const filteredRecurringPayments = dateFilter 
      ? recurringPayments.filter(payment => {
          const relevantDate = payment.payment_date || payment.due_date;
          return new Date(relevantDate) >= dateFilter;
        })
      : recurringPayments;

    // Agregar ingresos de pagos recurrentes
    filteredRecurringPayments.forEach(payment => {
      const amount = payment.amount || 0;
      // Obtener el client_id de la factura recurrente asociada
      const recurringInvoice = recurringInvoices.find(inv => inv.id === payment.recurring_invoice_id);
      const clientId = recurringInvoice?.client_id || 'sin-cliente';
      
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

  const getTotalPaid = () => {
    const workDaysPaid = workDays.reduce((total, day) => {
      return day.status === 'paid' ? total + (day.amount || 0) : total;
    }, 0);
    
    const projectPaymentsPaid = projectPayments.reduce((total, payment) => {
      return payment.status === 'paid' ? total + (payment.amount || 0) : total;
    }, 0);
    
    const recurringPaymentsPaid = recurringPayments.reduce((total, payment) => {
      return payment.status === 'paid' ? total + (payment.amount || 0) : total;
    }, 0);
    
    return workDaysPaid + projectPaymentsPaid + recurringPaymentsPaid;
  };

  const getTotalAmount = () => {
    const workDaysTotal = workDays.reduce((total, day) => {
      total += day.amount || 0;
      return total;
    }, 0);
    
    const projectPaymentsTotal = projectPayments.reduce((total, payment) => {
      total += payment.amount || 0;
      return total;
    }, 0);
    
    const recurringPaymentsTotal = recurringPayments.reduce((total, payment) => {
      total += payment.amount || 0;
      return total;
    }, 0);
    
    return workDaysTotal + projectPaymentsTotal + recurringPaymentsTotal;
  };

  const addOrUpdateRecurringInvoice = async (invoice: Partial<RecurringInvoice>) => {
    console.log('➕ [Context] Saving recurring invoice to Supabase:', invoice);
    
    try {
      const { data, error } = await supabase
        .from('recurring_invoices')
        .upsert(invoice, { onConflict: 'id' })
        .select();
        
      if (error) {
        console.error('❌ [Context] Supabase error:', error);
        toast.error(`Error al guardar la factura: ${error.message}`);
        return;
      }
      
      console.log('✅ [Context] Recurring invoice saved successfully:', data);
      
      // Recargar las facturas desde la base de datos
      await fetchRecurringInvoices();
      
      toast.success(invoice.id ? 'Factura actualizada correctamente' : 'Factura creada correctamente');
    } catch (error) {
      console.error('❌ [Context] Error saving recurring invoice:', error);
      toast.error('Error al guardar la factura');
    }
  };

  const generateRecurringPayments = async () => {
    console.log('🔄 [Context] Generating recurring payments...');
    try {
      const { data, error } = await supabase.rpc('generate_recurring_payments');
      if (error) {
        if (error.code === '42883') {
          console.log('⚠️ [Context] generate_recurring_payments function does not exist, skipping');
          return 0;
        }
        throw error;
      }
      console.log(`✅ [Context] Generated ${data} recurring payments`);
      await fetchRecurringPayments();
      await fetchRecurringInvoices(); // Actualizar next_due_date
      if (data > 0) {
        toast.success(`Se generaron ${data} pagos recurrentes`);
      }
      return data || 0;
    } catch (error) {
      console.error('❌ [Context] Error generating recurring payments:', error);
      // No mostrar toast de error si es solo que la función no existe
      return 0;
    }
  };

  // Estadísticas específicas para proyectos
  const getProjectStats = () => {
    const totalAmount = projectPayments.reduce((total, payment) => total + (payment.amount || 0), 0);
    const paidAmount = projectPayments
      .filter(payment => payment.status === 'paid')
      .reduce((total, payment) => total + (payment.amount || 0), 0);
    const pendingAmount = projectPayments
      .filter(payment => payment.status === 'pending')
      .reduce((total, payment) => total + (payment.amount || 0), 0);
    
    return { totalAmount, paidAmount, pendingAmount };
  };

  // Estadísticas específicas para facturas recurrentes
  const getRecurringStats = () => {
    const totalAmount = recurringPayments.reduce((total, payment) => total + (payment.amount || 0), 0);
    const paidAmount = recurringPayments
      .filter(payment => payment.status === 'paid')
      .reduce((total, payment) => total + (payment.amount || 0), 0);
    const pendingAmount = recurringPayments
      .filter(payment => payment.status === 'pending')
      .reduce((total, payment) => total + (payment.amount || 0), 0);
    const overdueAmount = recurringPayments
      .filter(payment => payment.status === 'overdue')
      .reduce((total, payment) => total + (payment.amount || 0), 0);
    
    return { totalAmount, paidAmount, pendingAmount, overdueAmount };
  };

  const updateRecurringPaymentStatus = async (paymentId: string, status: 'paid' | 'pending', paymentDate?: string) => {
    console.log(`🔄 [Context] Updating recurring payment ${paymentId} to ${status}...`);
    try {
      // Intentar actualizar en la base de datos si las tablas existen
      const updateData: any = { status };
      if (status === 'paid') {
        updateData.payment_date = paymentDate || new Date().toISOString().split('T')[0];
      } else {
        updateData.payment_date = null;
      }

      const { error } = await supabase
        .from('recurring_payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) {
        if (error.code === '42P01') {
          // Las tablas no existen, actualizar solo localmente
          console.log('⚠️ [Context] Tables do not exist, updating locally only');
          setRecurringPayments(prevPayments => 
            prevPayments.map(payment => 
              payment.id === paymentId 
                ? { 
                    ...payment, 
                    status: status as any,
                    payment_date: status === 'paid' ? (paymentDate || new Date().toISOString().split('T')[0]) : null
                  }
                : payment
            )
          );
          toast.success(`Pago marcado como ${status === 'paid' ? 'pagado' : 'pendiente'} (solo localmente)`);
          return true;
        }
        throw error;
      }

      console.log(`✅ [Context] Payment ${paymentId} updated to ${status}`);
      await fetchRecurringPayments(); // Recargar datos
      toast.success(`Pago marcado como ${status === 'paid' ? 'pagado' : 'pendiente'}`);
      return true;
    } catch (error) {
      console.error('❌ [Context] Error updating recurring payment:', error);
      
      // Como fallback, actualizar solo localmente
      console.log('⚠️ [Context] Fallback: updating locally only');
      setRecurringPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === paymentId 
            ? { 
                ...payment, 
                status: status as any,
                payment_date: status === 'paid' ? (paymentDate || new Date().toISOString().split('T')[0]) : null
              }
            : payment
        )
      );
      toast.success(`Pago marcado como ${status === 'paid' ? 'pagado' : 'pendiente'} (solo localmente)`);
      return true;
    }
  };



  // Objeto con todos los valores y funciones para el contexto
  const value: IWorkDataContext = {
    isLoaded,
    workDays,
    clients,
    projectPayments,
    projects,
    recurringInvoices,
    recurringPayments,
    selectedMonth,
    setSelectedMonth,
    addOrUpdateClient,
    addOrUpdateWorkDays,
    addOrUpdateSecondWorkDay,
    removeWorkDay,
    getWorkDay,
    getSecondWorkDay,
    getMonthStats,
    getProjectStats,
    getRecurringStats,
    getMonthlyRevenue,
    getFinancialStatusDistribution,
    getRevenueByClient,
    getTotalPaid,
    getTotalAmount,
    addOrUpdateRecurringInvoice,
    generateRecurringPayments,
    updateRecurringPaymentStatus,
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
