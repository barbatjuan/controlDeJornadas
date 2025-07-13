import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWorkData } from '../contexts/WorkDataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Calendar, DollarSign, TrendingUp, Users, ArrowUp, ArrowDown, Clock, Filter } from 'lucide-react';
import { WorkDay } from '../types';

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

// Define time filter options
type TimeFilter = '30d' | '90d' | '6m' | '1y' | 'all';

const Dashboard: React.FC = () => {
  const { isLoaded, workDays, clients, getMonthlyRevenue, getFinancialStatusDistribution, getRevenueByClient } = useWorkData();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('6m');
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  // Convertir a useMemo para mantener la reactividad con workDays y timeFilter
  const revenues = useMemo(() => {
    const filteredDays = filterWorkDays(workDays, timeFilter);
    
    let paid = 0;
    let pending = 0;
    let invoiced = 0;
    
    filteredDays.forEach(day => {
      if (day.status === 'paid') {
        paid += day.amount;
      } else if (day.status === 'invoiced') {
        invoiced += day.amount;
      } else if (day.status === 'pending') {
        pending += day.amount;
      }
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
  }, [workDays, timeFilter]);

  const stats = useMemo(() => {
    if (!isLoaded || workDays.length === 0) {
      return {
        totalRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        invoicedRevenue: 0,
        totalDays: 0,
        avgDailyRate: 0,
        clientCount: 0
      };
    }

    // Ya no necesitamos llamar a calculateRevenues porque revenues ahora es el resultado directo del useMemo
    const totalDays = workDays.length;
    
    const uniqueClientIds = new Set(workDays.filter(day => day.client_id).map(day => day.client_id));

    return {
      totalRevenue: revenues.totalRevenue,
      paidRevenue: revenues.paid,
      pendingRevenue: revenues.pending,
      invoicedRevenue: revenues.invoiced,
      totalDays,
      avgDailyRate: totalDays > 0 ? revenues.totalRevenue / totalDays : 0,
      clientCount: uniqueClientIds.size
    };
  }, [workDays, isLoaded, revenues]);

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
  
  // Prepare chart data based on filtered data
  const monthlyRevenueData = useMemo(() => {
    if (!isLoaded) return [];
    const dateFilter = getDateFilterFromTimeFilter(timeFilter);
    return getMonthlyRevenue(dateFilter);
  }, [getMonthlyRevenue, timeFilter, isLoaded]);

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

  const revenueTrend = useMemo(() => calculateTrend(monthlyRevenueData), [monthlyRevenueData]);

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
          {['30d', '90d', '6m', '1y', 'all'].map((filter) => {
            const isActive = timeFilter === filter;
            const filterLabels: Record<string, string> = {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                {stats.totalDays}
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

        {/* Clients */}
        <div 
          className={`bg-tokyo-bg p-5 rounded-xl border border-tokyo-border shadow-sm hover:shadow-md transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '300ms', transitionDuration: '500ms' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-tokyo-fgDark mb-1">
                Clientes Activos
              </p>
              <h3 className="text-2xl font-bold text-tokyo-fg">
                {stats.clientCount}
              </h3>
              <p className="mt-2 text-xs text-tokyo-fgDark">
                Total de clientes: {clients.length}
              </p>
            </div>
            <div className="bg-tokyo-cyan/10 p-2.5 rounded-lg">
              <Users size={20} className="text-tokyo-cyan" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div 
        className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: '400ms', transitionDuration: '500ms' }}
      >
        <h3 className="text-xl font-bold text-tokyo-fg mb-4">Evolución Mensual de Ingresos</h3>
        <div className="h-[350px]">
          {monthlyRevenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.paid} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.paid} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#414868" vertical={false} />
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
                  contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid #414868', borderRadius: '8px' }} 
                  itemStyle={{ color: '#a9b1d6' }}
                  labelStyle={{ color: '#a9b1d6', fontWeight: 'bold', marginBottom: '5px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Pagado" 
                  stroke={COLORS.paid} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPaid)" 
                  activeDot={{ r: 6 }}
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

      <div className="grid md:grid-cols-2 gap-8">
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
                    innerRadius={70}
                    outerRadius={110} 
                    paddingAngle={5}
                    animationDuration={1500}
                    fill="#8884d8" // Color base por defecto
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
                    {/* Forzamos los colores con Cell explícitos */}
                    <Cell key="cell-0" fill="#9ece6a" name="Pagado" /> {/* Verde para Pagado */}
                    <Cell key="cell-1" fill="#7aa2f7" name="Facturado" /> {/* Azul para Facturado */}
                    <Cell key="cell-2" fill="#ff9e64" name="Pendiente" /> {/* Naranja para Pendiente */}
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
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => (
                      <span style={{ color: '#ffffff', fontWeight: 'bold', padding: '0 10px' }}>
                        {value}
                      </span>
                    )}
                    iconType="circle"
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

        {/* Revenue by Client */}
        <div 
          className={`bg-tokyo-bg p-6 rounded-xl border border-tokyo-border shadow-sm transition-all ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '600ms', transitionDuration: '500ms' }}
        >
          <h3 className="text-xl font-bold text-tokyo-fg mb-4">Ingresos por Cliente</h3>
          <div className="h-[350px]">
            {revenueByClientData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={revenueByClientData.slice(0, 10)} // Limit to top 10 clients for readability
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
      </div>
    </div>
  );
};

export default Dashboard;
