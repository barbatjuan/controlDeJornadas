import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWorkData } from '../contexts/WorkDataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Calendar, DollarSign, TrendingUp, Users, ArrowUp, ArrowDown, Clock, Filter } from 'lucide-react';
import { WorkDay } from '../types';

type TimeFilter = 'current_month' | '30d' | '90d' | '6m' | '1y' | 'all';

const COLORS = { 
  paid: '#9ece6a', // tokyo-green
  invoiced: '#7aa2f7', // tokyo-blue
  pending: '#ff9e64' // tokyo-orange
};

// Colores para clientes (más brillantes y variados)
const CLIENT_COLORS = [
  '#ff7a93', // rojo-rosa
  '#7aa2f7', // azul
  '#9ece6a', // verde
  '#e0af68', // amarillo
  '#bb9af7', // morado
  '#7dcfff', // celeste
  '#f7768e', // rosa
  '#2ac3de', // turquesa
  '#ff9e64', // naranja
  '#41a6b5', // azul verdoso
  '#d19a66', // marrón
  '#73daca', // verde claro
];

const Dashboard: React.FC = () => {
  const { 
    isLoaded, 
    workDays, 
    clients, 
    projects,
    projectPayments,
    projectPhases,
    recurringInvoices,
    recurringPayments,
    getMonthlyRevenue, 
    getFinancialStatusDistribution, 
    getRevenueByClient 
  } = useWorkData();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('current_month'); // Mes actual por defecto
  const [isAnimated, setIsAnimated] = useState(false);

  // Get current date for default filtering
  const currentDate = new Date();

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Helper function to filter data by time
  const filterByTime = (date: Date, filter: TimeFilter): boolean => {
    const now = new Date();
    
    switch (filter) {
      case 'current_month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return date >= startOfMonth && date <= now;
      }
      case '30d': {
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
      case '90d': {
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 90;
      }
      case '6m': {
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 180;
      }
      case '1y': {
        const diffTime = now.getTime() - date.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 365;
      }
      case 'all':
      default:
        return true;
    }
  };

  // Reemplazando useCallback con una función normal
  const filterWorkDays = (days: WorkDay[], filter: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return days.filter(day => {
      const workDayDate = new Date(day.date);
      
      switch(filter) {
        case 'all':
          return true;
        case 'current_month':
          return workDayDate.getMonth() === currentMonth && workDayDate.getFullYear() === currentYear;
        case 'last_month': {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
          return workDayDate.getMonth() === lastMonth && workDayDate.getFullYear() === yearOfLastMonth;
        }
        case 'current_year':
          return workDayDate.getFullYear() === currentYear;
        case 'last_year':
          return workDayDate.getFullYear() === currentYear - 1;
        default:
          return true;
      }
    });
  };

  // Función para filtrar datos por fecha según el timeFilter
  const filterDataByTimeFilter = (data: any[], dateField: string, timeFilter: string) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      
      switch(timeFilter) {
        case 'all':
          return true;
        case 'current_month':
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        case 'last_month': {
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;
          return itemDate.getMonth() === lastMonth && itemDate.getFullYear() === yearOfLastMonth;
        }
        case 'current_year':
          return itemDate.getFullYear() === currentYear;
        case 'last_year':
          return itemDate.getFullYear() === currentYear - 1;
        default:
          return true;
      }
    });
  };

  // Cálculo completo de ingresos incluyendo todos los tipos de datos
  const revenues = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let invoiced = 0;
    
    // 1. Procesar workDays (jornadas de trabajo)
    const filteredWorkDays = filterWorkDays(workDays, timeFilter);
    filteredWorkDays.forEach(day => {
      const amount = day.amount || 0;
      if (day.status === 'paid') {
        paid += amount;
      } else if (day.status === 'invoiced') {
        invoiced += amount;
      } else if (day.status === 'pending') {
        pending += amount;
      }
    });
    
    // 2. Procesar projectPayments (pagos de proyectos)
    const filteredProjectPayments = filterDataByTimeFilter(projectPayments, 'payment_date', timeFilter);
    filteredProjectPayments.forEach(payment => {
      const amount = payment.amount || 0;
      if (payment.status === 'paid') {
        paid += amount;
      } else if (payment.status === 'pending') {
        pending += amount;
      }
    });
    
    // 3. Procesar recurringPayments (pagos recurrentes existentes)
    const filteredRecurringPayments = recurringPayments.filter(payment => {
      if (!payment.due_date) return false;
      return filterDataByTimeFilter([payment], 'due_date', timeFilter).length > 0;
    });
    
    filteredRecurringPayments.forEach(payment => {
      const amount = payment.amount || 0;
      if (payment.status === 'paid') {
        paid += amount;
      } else if (payment.status === 'pending' || payment.status === 'overdue') {
        pending += amount;
      }
    });
    
    // 4. Procesar recurringInvoices activas sin pagos generados (mostrar como pendiente)
    const activeRecurringInvoices = recurringInvoices.filter(invoice => 
      invoice.status === 'active' && 
      !recurringPayments.some(payment => payment.recurring_invoice_id === invoice.id)
    );
    
    activeRecurringInvoices.forEach(invoice => {
      const amount = invoice.amount || 0;
      pending += amount; // Las facturas recurrentes sin pagos se consideran pendientes
    });

    const totalRevenue = paid + pending + invoiced;
    const pendingPercentage = totalRevenue > 0 ? (pending / totalRevenue * 100).toFixed(0) : "0";
    const invoicedPercentage = totalRevenue > 0 ? (invoiced / totalRevenue * 100).toFixed(0) : "0";
    const paidPercentage = totalRevenue > 0 ? (paid / totalRevenue * 100).toFixed(0) : "0";

    return {
      totalRevenue,
      paid,
      pending,
      invoiced,
      pendingPercentage,
      invoicedPercentage,
      paidPercentage
    };
  }, [workDays, projectPayments, recurringPayments, recurringInvoices, timeFilter]);

  const stats = useMemo(() => {
    if (!isLoaded) {
      return {
        totalRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        invoicedRevenue: 0,
        totalWorkDays: 0,
        totalProjects: 0,
        totalRecurringInvoices: 0,
        avgDailyRate: 0,
        clientCount: 0
      };
    }

    // Calcular totales de todos los tipos de datos
    const totalWorkDays = workDays.length;
    const totalProjects = projects.length;
    const totalRecurringInvoices = recurringInvoices.filter(inv => inv.status === 'active').length;
    
    // Obtener clientes únicos de todas las fuentes
    const uniqueClientIds = new Set([
      ...workDays.filter(day => day.client_id).map(day => day.client_id),
      ...projects.filter(project => project.client_id).map(project => project.client_id),
      ...recurringInvoices.filter(invoice => invoice.client_id).map(invoice => invoice.client_id)
    ]);

    return {
      totalRevenue: revenues.totalRevenue,
      paidRevenue: revenues.paid,
      pendingRevenue: revenues.pending,
      invoicedRevenue: revenues.invoiced,
      totalWorkDays,
      totalProjects,
      totalRecurringInvoices,
      avgDailyRate: totalWorkDays > 0 ? revenues.paid / totalWorkDays : 0, // Solo días pagados para promedio diario
      clientCount: uniqueClientIds.size
    };
  }, [workDays, projects, recurringInvoices, isLoaded, revenues]);

  // Format currency amounts
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Convertir el filtro de tiempo en una fecha específica para las gráficas
  const getDateFilterFromTimeFilter = (filter: TimeFilter): Date | null => {
    const now = new Date();
    
    switch(filter) {
      case '30d':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return thirtyDaysAgo;
      case '90d':
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return ninetyDaysAgo;
      case '6m':
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        return sixMonthsAgo;
      case '1y':
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(now.getFullYear() - 1);
        return oneYearAgo;
      case 'all':
        return null; // Null indica que no hay filtro
      default:
        return null;
    }
  };
  
  // Prepare daily revenue data for more dynamic visualization
  const dailyRevenueData = useMemo(() => {
    if (!isLoaded) return [];
    
    const dailyData: { [key: string]: { date: string, workdays: number, projects: number, recurring: number, total: number } } = {};
    
    // Process workdays
    workDays
      .filter(day => filterByTime(new Date(day.date), timeFilter))
      .forEach(day => {
        const dateKey = new Date(day.date).toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { date: dateKey, workdays: 0, projects: 0, recurring: 0, total: 0 };
        }
        dailyData[dateKey].workdays += day.amount || 0;
        dailyData[dateKey].total += day.amount || 0;
      });
    
    // Process project payments
    projectPayments
      .filter(payment => filterByTime(new Date(payment.payment_date), timeFilter))
      .forEach(payment => {
        const dateKey = new Date(payment.payment_date).toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { date: dateKey, workdays: 0, projects: 0, recurring: 0, total: 0 };
        }
        dailyData[dateKey].projects += payment.amount || 0;
        dailyData[dateKey].total += payment.amount || 0;
      });
    
    // Process recurring payments
    recurringPayments
      .filter(payment => payment.due_date && filterByTime(new Date(payment.due_date), timeFilter))
      .forEach(payment => {
        const dateKey = new Date(payment.due_date).toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { date: dateKey, workdays: 0, projects: 0, recurring: 0, total: 0 };
        }
        dailyData[dateKey].recurring += payment.amount || 0;
        dailyData[dateKey].total += payment.amount || 0;
      });
    
    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('es-ES', { 
          day: '2-digit', 
          month: '2-digit' 
        })
      }));
  }, [workDays, projectPayments, recurringPayments, timeFilter, isLoaded]);

  const financialStatusData = useMemo(() => {
    if (!isLoaded) return [];
    const dateFilter = getDateFilterFromTimeFilter(timeFilter);
    return getFinancialStatusDistribution(dateFilter);
  }, [getFinancialStatusDistribution, timeFilter, isLoaded]);

  const revenueByClientData = useMemo(() => {
    if (!isLoaded) return [];
    const dateFilter = getDateFilterFromTimeFilter(timeFilter);
    return getRevenueByClient(dateFilter);
  }, [getRevenueByClient, timeFilter, isLoaded]);

  // Calculate trends
  const calculateTrend = (data: {name: string, [key: string]: any}[]) => {
    if (data.length < 2) return 0;
    
    // Get the last two data points
    const lastMonthIndex = data.length - 1;
    const previousMonthIndex = data.length - 2;
    
    if (lastMonthIndex < 0 || previousMonthIndex < 0) return 0;
    
    const lastMonth = data[lastMonthIndex];
    const previousMonth = data[previousMonthIndex];
    
    // Compare 'Pagado' values or use the first non-name property if 'Pagado' doesn't exist
    const lastValue = lastMonth['Pagado'] || Object.values(lastMonth).find(v => typeof v === 'number' && v !== undefined);
    const previousValue = previousMonth['Pagado'] || Object.values(previousMonth).find(v => typeof v === 'number' && v !== undefined);
    
    if (!lastValue || !previousValue) return 0;
    
    // Calculate percentage change
    if (previousValue === 0) return lastValue > 0 ? 100 : 0;
    return ((lastValue - previousValue) / previousValue) * 100;
  };

  const revenueTrend = useMemo(() => calculateTrend(dailyRevenueData.map(d => ({ name: d.date, total: d.total }))), [dailyRevenueData]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-t-2 border-b-2 border-tokyo-cyan rounded-full animate-spin mb-4"></div>
          <p className="text-tokyo-fgDark">Cargando panel de control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Time filter controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-tokyo-fg">Panel de Control</h2>
        
        <div className="flex items-center gap-2 bg-tokyo-bgHighlight rounded-lg p-1">
          <Filter size={16} className="text-tokyo-fgDark ml-2" />
          {['current_month', '30d', '90d', '6m', '1y', 'all'].map((filter) => {
            const isActive = timeFilter === filter;
            const filterLabels: Record<string, string> = {
              'current_month': 'Mes actual',
              '30d': '30 días',
              '90d': '90 días',
              '6m': '6 meses',
              '1y': '1 año',
              'all': 'Todo'
            };
            
            return (
              <button 
                key={filter}
                onClick={() => setTimeFilter(filter as TimeFilter)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${isActive 
                  ? 'bg-tokyo-blue text-white shadow-md' 
                  : 'hover:bg-tokyo-bg text-tokyo-fgDark'}`}
              >
                {filterLabels[filter]}
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total revenue */}
        <div 
          className={`bg-tokyo-bg p-5 rounded-xl border border-tokyo-border shadow-sm hover:shadow-md transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '0ms', transitionDuration: '500ms' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-tokyo-fgDark mb-1">
                Ingresos Totales
              </p>
              <h3 className="text-2xl font-bold text-tokyo-fg">
                {formatCurrency(stats.totalRevenue)}
              </h3>
              <div className="mt-2 text-xs flex items-center">
                <span className={revenueTrend > 0 ? 'text-tokyo-green' : revenueTrend < 0 ? 'text-tokyo-red' : 'text-tokyo-fgDark'}>
                  {revenueTrend > 0 ? <ArrowUp size={12} className="inline mr-1" /> : revenueTrend < 0 ? <ArrowDown size={12} className="inline mr-1" /> : null}
                  {Math.abs(revenueTrend).toFixed(1)}%
                </span>
                <span className="text-tokyo-fgDark ml-1">vs periodo anterior</span>
              </div>
            </div>
            <div className="bg-tokyo-blue/10 p-2.5 rounded-lg">
              <DollarSign size={20} className="text-tokyo-blue" />
            </div>
          </div>
        </div>

        {/* Work days */}
        <div 
          className={`bg-tokyo-bg p-5 rounded-xl border border-tokyo-border shadow-sm hover:shadow-md transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '100ms', transitionDuration: '500ms' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-tokyo-fgDark mb-1">
                Días Trabajados
              </p>
              <h3 className="text-2xl font-bold text-tokyo-fg">
                {stats.totalWorkDays}
              </h3>
              <p className="mt-2 text-xs text-tokyo-fgDark">
                Media diaria: {formatCurrency(stats.avgDailyRate)}
              </p>
            </div>
            <div className="bg-tokyo-purple/10 p-2.5 rounded-lg">
              <Calendar size={20} className="text-tokyo-purple" />
            </div>
          </div>
        </div>

        {/* Pending payments */}
        <div 
          className={`bg-tokyo-bg p-5 rounded-xl border border-tokyo-border shadow-sm hover:shadow-md transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '200ms', transitionDuration: '500ms' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-tokyo-fgDark mb-1">
                Pendiente de Cobro
              </p>
              <h3 className="text-2xl font-bold text-tokyo-fg">
                {formatCurrency(stats.pendingRevenue + stats.invoicedRevenue)}
              </h3>
              <div className="flex gap-2 mt-2">
                <p className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-500">
                  Pendiente: {formatCurrency(stats.pendingRevenue)}
                </p>
                <p className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-500">
                  Facturado: {formatCurrency(stats.invoicedRevenue)}
                </p>
              </div>
            </div>
            <div className="bg-tokyo-orange/10 p-2.5 rounded-lg">
              <Clock size={20} className="text-tokyo-orange" />
            </div>
          </div>
        </div>

        {/* Projects */}
        <div 
          className={`bg-tokyo-bg p-5 rounded-xl border border-tokyo-border shadow-sm hover:shadow-md transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '400ms', transitionDuration: '500ms' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-tokyo-fgDark mb-1">
                Proyectos
              </p>
              <h3 className="text-2xl font-bold text-tokyo-fg">
                {stats.totalProjects}
              </h3>
              <p className="mt-2 text-xs text-tokyo-fgDark">
                Proyectos activos
              </p>
            </div>
            <div className="bg-tokyo-green/10 p-2.5 rounded-lg">
              <TrendingUp size={20} className="text-tokyo-green" />
            </div>
          </div>
        </div>


      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        {/* Monthly Revenue Evolution - Full width */}
        <div 
          className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '500ms', transitionDuration: '500ms' }}
        >
          <h3 className="text-xl font-bold text-tokyo-fg mb-4">Evolución Diaria de Ingresos</h3>
          <div className="h-[350px]">
            {dailyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorWorkdays" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9ece6a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#9ece6a" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7aa2f7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7aa2f7" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRecurring" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#bb9af7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#bb9af7" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#414868" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#a9b1d6" 
                    fontSize={11}
                    tick={{ fill: '#a9b1d6' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="#a9b1d6" 
                    fontSize={12}
                    tick={{ fill: '#a9b1d6' }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      const nameMap: { [key: string]: string } = {
                        'workdays': 'Jornadas',
                        'projects': 'Proyectos', 
                        'recurring': 'Recurrentes',
                        'total': 'Total'
                      };
                      return [formatCurrency(value as number), nameMap[name as string] || name];
                    }}
                    contentStyle={{ 
                      backgroundColor: '#1a1b26', 
                      border: '1px solid #414868', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
                    }}
                    itemStyle={{ color: '#a9b1d6', fontWeight: 'bold' }}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend 
                    wrapperStyle={{ color: '#a9b1d6' }}
                    formatter={(value) => {
                      const nameMap: { [key: string]: string } = {
                        'workdays': 'Jornadas',
                        'projects': 'Proyectos', 
                        'recurring': 'Recurrentes'
                      };
                      return nameMap[value] || value;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="workdays" 
                    stackId="1" 
                    stroke="#9ece6a" 
                    fill="url(#colorWorkdays)"
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="projects" 
                    stackId="1" 
                    stroke="#7aa2f7" 
                    fill="url(#colorProjects)"
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="recurring" 
                    stackId="1" 
                    stroke="#bb9af7" 
                    fill="url(#colorRecurring)"
                    strokeWidth={2}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-tokyo-fgDark">No hay datos disponibles para el período seleccionado</p>
              </div>
            )}
          </div>
        </div>


      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income Distribution by Type */}
        <div 
          className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '650ms', transitionDuration: '500ms' }}
        >
          <h3 className="text-xl font-bold text-tokyo-fg mb-4">Distribución de Ingresos por Tipo</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={(() => {
                    const jornadasValue = workDays
                      .filter(day => filterByTime(new Date(day.date), timeFilter))
                      .reduce((sum, day) => sum + (day.amount || 0), 0);
                    
                    const proyectosValue = projectPayments
                      .filter(payment => filterByTime(new Date(payment.payment_date), timeFilter))
                      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
                    
                    const recurrentesValue = recurringPayments
                      .filter(payment => payment.due_date && filterByTime(new Date(payment.due_date), timeFilter))
                      .reduce((sum, payment) => sum + (payment.amount || 0), 0) +
                      recurringInvoices
                        .filter(inv => inv.status === 'active' && !recurringPayments.some(p => p.recurring_invoice_id === inv.id))
                        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
                    
                    // Debug logs
                    console.log('🔍 [Dashboard] Income Distribution Debug:');
                    console.log('📊 Total projectPayments:', projectPayments.length);
                    console.log('📊 Filtered projectPayments:', projectPayments.filter(payment => filterByTime(new Date(payment.payment_date), timeFilter)).length);
                    console.log('💰 Jornadas value:', jornadasValue);
                    console.log('💰 Proyectos value:', proyectosValue);
                    console.log('💰 Recurrentes value:', recurrentesValue);
                    console.log('🎯 Time filter:', timeFilter);
                    
                    return [
                      {
                        name: 'Jornadas',
                        value: jornadasValue,
                        color: '#f7768e'
                      },
                      {
                        name: 'Proyectos',
                        value: proyectosValue,
                        color: '#e0af68'
                      },
                      {
                        name: 'Recurrentes',
                        value: recurrentesValue,
                        color: '#9d7cd8'
                      }
                    ].filter(item => item.value > 0);
                  })()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {[
                    '#f7768e', // Jornadas - Rosado
                    '#e0af68', // Proyectos - Amarillo
                    '#9d7cd8'  // Recurrentes - Púrpura
                  ].map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [formatCurrency(value as number), name]}
                  contentStyle={{ 
                    backgroundColor: '#1a1b26', 
                    border: '1px solid #414868', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
                  }}
                  itemStyle={{ color: '#a9b1d6', fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ color: '#a9b1d6', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Facturas Recurrentes */}
        <div 
          className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '700ms', transitionDuration: '500ms' }}
        >
          <h3 className="text-xl font-bold text-tokyo-fg mb-4">Facturas Recurrentes</h3>
          <div className="h-[350px]">
            {recurringPayments.length > 0 || recurringInvoices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'Pagadas',
                        value: recurringPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
                        color: '#9ece6a'
                      },
                      {
                        name: 'Pendientes',
                        value: recurringPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0),
                        color: '#ff9e64'
                      },
                      {
                        name: 'Vencidas',
                        value: recurringPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0),
                        color: '#f7768e'
                      },
                      {
                        name: 'Sin Pagos',
                        value: recurringInvoices
                          .filter(inv => inv.status === 'active' && !recurringPayments.some(p => p.recurring_invoice_id === inv.id))
                          .reduce((sum, inv) => sum + (inv.amount || 0), 0),
                        color: '#bb9af7'
                      }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    animationDuration={1500}
                  >
                    {[
                      '#9ece6a', // Pagadas
                      '#ff9e64', // Pendientes  
                      '#f7768e', // Vencidas
                      '#bb9af7'  // Sin Pagos
                    ].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value as number), name]}
                    contentStyle={{ 
                      backgroundColor: '#1a1b26', 
                      border: '1px solid #414868', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
                    }}
                    itemStyle={{ color: '#a9b1d6', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ color: '#a9b1d6', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-tokyo-fgDark">
                <p>No hay datos de facturas recurrentes para mostrar</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Status Distribution */}
        <div 
          className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '500ms', transitionDuration: '500ms' }}
        >
          <h3 className="text-xl font-bold text-tokyo-fg mb-4">Distribución Financiera</h3>
          <div className="h-[350px]">
            {financialStatusData.length > 0 && financialStatusData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/* Definimos colores fijos para cada categoría */}
                  <Pie 
                    data={financialStatusData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60}
                    outerRadius={120} 
                    paddingAngle={5}
                    animationDuration={1500}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                      return percent > 0.05 ? (
                        <text 
                          x={x} 
                          y={y} 
                          fill="#ffffff"
                          fontSize={14}
                          fontWeight="bold"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      ) : null;
                    }}
                  >
                    {/* Colores consistentes con el resto del dashboard */}
                    <Cell key="cell-0" fill="#9ece6a" name="Pagado" /> {/* Verde para Pagado */}
                    <Cell key="cell-1" fill="#7aa2f7" name="Facturado" /> {/* Azul para Facturado */}
                    <Cell key="cell-2" fill="#f7768e" name="Pendiente" /> {/* Rosado para Pendiente */}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value as number), name]}
                    contentStyle={{ 
                      backgroundColor: '#1a1b26', 
                      border: '1px solid #414868', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
                    }}
                    itemStyle={{ color: '#a9b1d6', fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ color: '#a9b1d6', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-tokyo-fgDark">No hay datos disponibles para el período seleccionado</p>
              </div>
            )}
          </div>
        </div>

        {/* Income Distribution by Type */}
        <div 
          className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '650ms', transitionDuration: '500ms' }}
        >
          <h3 className="text-xl font-bold text-tokyo-fg mb-4">Ingresos por Tipo y Cliente</h3>
          <div className="h-[350px] overflow-y-auto">
            {(() => {
              // Crear listado detallado de ingresos por cliente y tipo
              const incomeList: Array<{
                clientName: string;
                type: 'Jornadas' | 'Proyectos' | 'Recurrentes';
                amount: number;
                color: string;
                details?: string;
              }> = [];

              // Función para asignar colores únicos por cliente
              const getClientColor = (clientName: string, type: string): string => {
                const clientColors: Record<string, string> = {
                  'Adrian FactuPro': '#9ece6a', // Verde para Adrian
                  'Ana Henao': '#f7768e',       // Rosado para Ana
                  'Anastasia Leonova': '#7aa2f7', // Azul para Anastasia
                };
                
                // Si el cliente tiene un color asignado, usarlo
                if (clientColors[clientName]) {
                  return clientColors[clientName];
                }
                
                // Para otros clientes, usar colores por tipo
                const typeColors: Record<string, string> = {
                  'Jornadas': '#f7768e',
                  'Proyectos': '#e0af68',
                  'Recurrentes': '#9d7cd8'
                };
                
                return typeColors[type] || '#a9b1d6';
              };

              // 1. Procesar jornadas por cliente
              const filteredWorkDays = workDays.filter(day => filterByTime(new Date(day.date), timeFilter));
              const workDaysByClient = filteredWorkDays.reduce((acc, day) => {
                const clientName = clients.find(c => c.id === day.client_id)?.name || 'Cliente desconocido';
                if (!acc[clientName]) acc[clientName] = 0;
                acc[clientName] += day.amount || 0;
                return acc;
              }, {} as Record<string, number>);

              Object.entries(workDaysByClient).forEach(([clientName, amount]) => {
                if (amount > 0) {
                  incomeList.push({
                    clientName,
                    type: 'Jornadas',
                    amount,
                    color: getClientColor(clientName, 'Jornadas'),
                    details: `${filteredWorkDays.filter(d => clients.find(c => c.id === d.client_id)?.name === clientName).length} jornadas`
                  });
                }
              });

              // 2. Procesar pagos de proyectos por cliente
              const filteredProjectPayments = projectPayments.filter(payment => 
                filterByTime(new Date(payment.payment_date), timeFilter)
              );
              const projectPaymentsByClient = filteredProjectPayments.reduce((acc, payment) => {
                const project = projects.find(p => p.id === payment.project_id);
                const clientName = clients.find(c => c.id === project?.client_id)?.name || 'Cliente desconocido';
                if (!acc[clientName]) acc[clientName] = 0;
                acc[clientName] += payment.amount || 0;
                return acc;
              }, {} as Record<string, number>);

              Object.entries(projectPaymentsByClient).forEach(([clientName, amount]) => {
                if (amount > 0) {
                  const clientProjects = filteredProjectPayments.filter(p => {
                    const project = projects.find(pr => pr.id === p.project_id);
                    return clients.find(c => c.id === project?.client_id)?.name === clientName;
                  });
                  incomeList.push({
                    clientName,
                    type: 'Proyectos',
                    amount,
                    color: getClientColor(clientName, 'Proyectos'),
                    details: `${clientProjects.length} pagos de proyectos`
                  });
                }
              });

              // 3. Procesar pagos recurrentes por cliente
              const filteredRecurringPayments = recurringPayments.filter(payment => {
                const date = payment.payment_date || payment.due_date;
                return date && filterByTime(new Date(date), timeFilter);
              });
              const recurringPaymentsByClient = filteredRecurringPayments.reduce((acc, payment) => {
                const invoice = recurringInvoices.find(inv => inv.id === payment.recurring_invoice_id);
                const clientName = clients.find(c => c.id === invoice?.client_id)?.name || 'Cliente desconocido';
                if (!acc[clientName]) acc[clientName] = 0;
                acc[clientName] += payment.amount || 0;
                return acc;
              }, {} as Record<string, number>);

              Object.entries(recurringPaymentsByClient).forEach(([clientName, amount]) => {
                if (amount > 0) {
                  const clientRecurring = filteredRecurringPayments.filter(p => {
                    const invoice = recurringInvoices.find(inv => inv.id === p.recurring_invoice_id);
                    return clients.find(c => c.id === invoice?.client_id)?.name === clientName;
                  });
                  incomeList.push({
                    clientName,
                    type: 'Recurrentes',
                    amount,
                    color: getClientColor(clientName, 'Recurrentes'),
                    details: `${clientRecurring.length} pagos recurrentes`
                  });
                }
              });

              // Ordenar por monto descendente
              incomeList.sort((a, b) => b.amount - a.amount);

              return incomeList.length > 0 ? (
                <div className="space-y-3">
                  {incomeList.map((item, index) => (
                    <div 
                      key={`${item.clientName}-${item.type}-${index}`}
                      className="flex items-center justify-between p-3 bg-tokyo-bgLight rounded-lg border border-tokyo-border hover:bg-tokyo-border transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <div className="font-medium text-tokyo-fg">{item.clientName}</div>
                          <div className="text-sm text-tokyo-fgDark flex items-center space-x-2">
                            <span className="px-2 py-1 bg-tokyo-bg rounded text-xs" style={{ color: item.color }}>
                              {item.type}
                            </span>
                            {item.details && <span>{item.details}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-tokyo-fg">{formatCurrency(item.amount)}</div>
                        <div className="text-xs text-tokyo-fgDark">
                          {((item.amount / incomeList.reduce((sum, i) => sum + i.amount, 0)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Resumen total */}
                  <div className="mt-4 pt-3 border-t border-tokyo-border">
                    <div className="flex justify-between items-center font-bold text-tokyo-fg">
                      <span>Total General</span>
                      <span>{formatCurrency(incomeList.reduce((sum, item) => sum + item.amount, 0))}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-tokyo-fgDark">
                  <p>No hay datos de ingresos para mostrar</p>
                </div>
              );
            })()} 
          </div>
        </div>

        {/* Revenue by Client */}
        <div 
          className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '600ms', transitionDuration: '500ms' }}
        >
          <h3 className="text-xl font-bold text-tokyo-fg mb-4">Ingresos por Cliente (Todos)</h3>
          <div className="h-[350px]">
            {revenueByClientData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={revenueByClientData} // Show all clients
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#414868" horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke="#a9b1d6" 
                    tick={{ fill: '#a9b1d6', fontSize: 12 }}
                    axisLine={{ stroke: '#414868' }}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#a9b1d6" 
                    tick={{ fill: '#a9b1d6', fontSize: 12, fontWeight: 'bold' }} 
                    width={120}
                    tickMargin={5}
                    axisLine={{ stroke: '#414868' }}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [formatCurrency(value as number), props.payload.name]} 
                    contentStyle={{ 
                      backgroundColor: '#1a1b26', 
                      border: '1px solid #414868', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    cursor={{ fill: 'rgba(170, 170, 170, 0.1)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Ingresos" 
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                  >
                    {revenueByClientData.slice(0, 10).map((entry, index) => (
                      <Cell 
                        key={`cell-${entry.name}`}
                        fill={CLIENT_COLORS[index % CLIENT_COLORS.length]}
                      />
                    ))}
                  </Bar>
                  <Legend formatter={(value, entry) => {
                    const { dataKey, payload, color } = entry as any;
                    return <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{payload?.name || 'Cliente'}</span>;
                  }}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-tokyo-fgDark">No hay datos disponibles para el período seleccionado</p>
              </div>
            )}
          </div>
        </div>





        {/* Recurring Invoices Status Chart */}
        <div 
          className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '800ms', transitionDuration: '500ms' }}
        >
          <h3 className="text-xl font-bold text-tokyo-fg mb-4">Facturas Recurrentes</h3>
          <div className="h-[300px]">
            {recurringPayments.length > 0 || recurringInvoices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: 'Pagadas',
                      value: recurringPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0),
                      color: '#9ece6a'
                    },
                    {
                      name: 'Pendientes',
                      value: recurringPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0),
                      color: '#ff9e64'
                    },
                    {
                      name: 'Vencidas',
                      value: recurringPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0),
                      color: '#f7768e'
                    },
                    {
                      name: 'Sin Pagos',
                      value: recurringInvoices
                        .filter(inv => inv.status === 'active' && !recurringPayments.some(p => p.recurring_invoice_id === inv.id))
                        .reduce((sum, inv) => sum + (inv.amount || 0), 0),
                      color: '#bb9af7'
                    }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#414868" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#a9b1d6" 
                    tick={{ fill: '#a9b1d6', fontSize: 12 }}
                    axisLine={{ stroke: '#414868' }}
                  />
                  <YAxis 
                    stroke="#a9b1d6" 
                    tick={{ fill: '#a9b1d6', fontSize: 12 }}
                    axisLine={{ stroke: '#414868' }}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Monto']}
                    contentStyle={{ 
                      backgroundColor: '#1a1b26', 
                      border: '1px solid #414868', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
                    }}
                    itemStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={1500}
                  >
                    {[
                      '#9ece6a', // Pagadas
                      '#ff9e64', // Pendientes  
                      '#f7768e', // Vencidas
                      '#bb9af7'  // Sin Pagos
                    ].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-tokyo-fgDark">No hay facturas recurrentes disponibles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progreso Real de Proyectos */}
      <div 
        className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: '1000ms', transitionDuration: '500ms' }}
      >
        <h3 className="text-xl font-bold text-tokyo-fg mb-4">Progreso Real de Proyectos</h3>
        <div className="h-[400px]">
          {(() => {
            // Calcular progreso real basado en fases completadas
            const calculateRealProjectProgress = () => {
              if (projects.length === 0) {
                return { totalProgress: 0, completedProgress: 0, pendingProgress: 100 };
              }

              let totalWeightedProgress = 0;
              const projectWeight = 100 / projects.length; // Cada proyecto vale igual porcentaje

              projects.forEach(project => {
                const currentProjectPhases = projectPhases.filter(phase => phase.project_id === project.id);
                
                if (currentProjectPhases.length === 0) {
                  // Si no hay fases, usar el estado del proyecto
                  switch (project.status) {
                    case 'completed':
                      totalWeightedProgress += projectWeight;
                      break;
                    case 'in_progress':
                      totalWeightedProgress += projectWeight * 0.5; // 50% por defecto
                      break;
                    case 'pending':
                    case 'cancelled':
                      // No suma nada (0%)
                      break;
                  }
                } else {
                  // Calcular progreso basado en fases completadas
                  const totalPhasePercentage = currentProjectPhases.reduce((sum, phase) => sum + (phase.percentage || 0), 0);
                  const completedPhasePercentage = currentProjectPhases
                    .filter(phase => phase.status === 'completed')
                    .reduce((sum, phase) => sum + (phase.percentage || 0), 0);
                  
                  if (totalPhasePercentage > 0) {
                    // Usar porcentajes de fases
                    const projectProgress = (completedPhasePercentage / totalPhasePercentage) * 100;
                    totalWeightedProgress += (projectProgress / 100) * projectWeight;
                  } else {
                    // Fallback: usar cantidad de fases completadas
                    const completedPhases = currentProjectPhases.filter(phase => phase.status === 'completed').length;
                    const projectProgress = (completedPhases / currentProjectPhases.length) * 100;
                    totalWeightedProgress += (projectProgress / 100) * projectWeight;
                  }
                }
              });

              const completedProgress = Math.round(totalWeightedProgress * 100) / 100;
              const pendingProgress = Math.round((100 - totalWeightedProgress) * 100) / 100;

              return {
                totalProgress: completedProgress,
                completedProgress,
                pendingProgress
              };
            };

            const progressData = calculateRealProjectProgress();
            
            const chartData = [];
            
            if (progressData.completedProgress > 0) {
              chartData.push({
                name: 'Completado',
                value: progressData.completedProgress,
                color: '#9ece6a'
              });
            }
            
            if (progressData.pendingProgress > 0) {
              chartData.push({
                name: 'Pendiente',
                value: progressData.pendingProgress,
                color: '#ff9e64'
              });
            }
            
            // Si no hay datos, mostrar 100% pendiente para que se vea la gráfica
            if (chartData.length === 0) {
              chartData.push({
                name: 'Sin Datos',
                value: 100,
                color: '#6b7280'
              });
            }

            return chartData.length > 0 ? (
              <div className="grid grid-cols-2 gap-6 h-full">
                {/* Gráfica circular */}
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1500}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}% del progreso total`, '']}
                        contentStyle={{ 
                          backgroundColor: '#1a1b26', 
                          border: '1px solid #414868', 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)' 
                        }}
                        itemStyle={{ color: '#a9b1d6', fontWeight: 'bold' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{ color: '#a9b1d6', fontSize: '12px' }}
                        formatter={(value, entry) => {
                          const item = chartData.find(d => d.name === value);
                          return `${value} (${item?.value}%)`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Información detallada */}
                <div className="flex flex-col justify-center">
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-tokyo-green mb-2">
                        {progressData.completedProgress.toFixed(1)}%
                      </div>
                      <div className="text-sm text-tokyo-fgDark">
                        Progreso Total
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-tokyo-fg">Total de Proyectos:</span>
                        <span className="text-sm font-semibold text-tokyo-fg">{projects.length}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-tokyo-fg">Completados:</span>
                        <span className="text-sm font-semibold text-tokyo-green">
                          {projects.filter(p => p.status === 'completed').length}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-tokyo-fg">En Progreso:</span>
                        <span className="text-sm font-semibold text-tokyo-blue">
                          {projects.filter(p => p.status === 'in_progress').length}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-tokyo-fg">Pendientes:</span>
                        <span className="text-sm font-semibold text-tokyo-orange">
                          {projects.filter(p => p.status === 'pending').length}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-tokyo-fg">Total Fases:</span>
                        <span className="text-sm font-semibold text-tokyo-fg">{projectPhases.length}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-tokyo-fg">Fases Completadas:</span>
                        <span className="text-sm font-semibold text-tokyo-green">
                          {projectPhases.filter(phase => phase.status === 'completed').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-tokyo-fgDark text-center">
                  {projects.length === 0 
                    ? 'No hay proyectos disponibles' 
                    : 'No hay datos de progreso para mostrar'
                  }
                </p>
              </div>
            );
          })()
          }
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
