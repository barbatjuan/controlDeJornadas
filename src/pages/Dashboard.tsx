import React, { useState, useEffect, useMemo } from 'react';
import { useWorkData } from '../contexts/WorkDataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Calendar, DollarSign, TrendingUp, Users, ArrowUp, ArrowDown, Clock, Filter } from 'lucide-react';

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

  // Set animation flag after component mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Calculate date filter based on selected time frame
  const dateFilter = useMemo(() => {
    const today = new Date();
    const result = new Date(today);

    switch (timeFilter) {
      case '30d':
        result.setDate(today.getDate() - 30);
        break;
      case '90d':
        result.setDate(today.getDate() - 90);
        break;
      case '6m':
        result.setMonth(today.getMonth() - 6);
        break;
      case '1y':
        result.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
        return null; // No filter
    }

    return result;
  }, [timeFilter]);

  // Filter workdays based on selected time frame
  const filteredWorkDays = useMemo(() => {
    if (!isLoaded || !workDays) return [];
    if (!dateFilter) return workDays;
    
    return workDays.filter(day => {
      const workDate = new Date(day.date);
      return workDate >= dateFilter;
    });
  }, [workDays, dateFilter, isLoaded]);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (!isLoaded || filteredWorkDays.length === 0) {
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

    const totalRevenue = filteredWorkDays.reduce((sum, day) => sum + day.amount, 0);
    const paidRevenue = filteredWorkDays.filter(day => day.status === 'paid').reduce((sum, day) => sum + day.amount, 0);
    const pendingRevenue = filteredWorkDays.filter(day => day.status === 'pending').reduce((sum, day) => sum + day.amount, 0);
    const invoicedRevenue = filteredWorkDays.filter(day => day.status === 'invoiced').reduce((sum, day) => sum + day.amount, 0);
    const totalDays = filteredWorkDays.length;
    
    // Count unique clients with work days
    const uniqueClientIds = new Set(filteredWorkDays.filter(day => day.client_id).map(day => day.client_id));

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      invoicedRevenue,
      totalDays,
      avgDailyRate: totalDays > 0 ? totalRevenue / totalDays : 0,
      clientCount: uniqueClientIds.size
    };
  }, [filteredWorkDays, isLoaded]);

  // Format currency amounts
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Prepare chart data based on filtered data
  const monthlyRevenueData = useMemo(() => {
    if (!isLoaded) return [];
    return getMonthlyRevenue(dateFilter);
  }, [getMonthlyRevenue, dateFilter, isLoaded]);

  const financialStatusData = useMemo(() => {
    if (!isLoaded) return [];
    return getFinancialStatusDistribution(dateFilter);
  }, [getFinancialStatusDistribution, dateFilter, isLoaded]);

  const revenueByClientData = useMemo(() => {
    if (!isLoaded) return [];
    return getRevenueByClient(dateFilter);
  }, [getRevenueByClient, dateFilter, isLoaded]);

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
              <p className="text-sm text-tokyo-fgDark mb-1 flex items-center gap-1">
                <DollarSign size={14} className="inline" />
                Ingresos Totales
              </p>
              <h3 className="text-2xl font-bold text-tokyo-fg">{formatCurrency(stats.totalRevenue)}</h3>
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
              <p className="text-sm text-tokyo-fgDark mb-1 flex items-center gap-1">
                <Calendar size={14} className="inline" />
                Días Trabajados
              </p>
              <h3 className="text-2xl font-bold text-tokyo-fg">{stats.totalDays}</h3>
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
              <p className="text-sm text-tokyo-fgDark mb-1 flex items-center gap-1">
                <Clock size={14} className="inline" />
                Pendiente de Cobro
              </p>
              <h3 className="text-2xl font-bold text-tokyo-fg">{formatCurrency(stats.pendingRevenue + stats.invoicedRevenue)}</h3>
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
              <p className="text-sm text-tokyo-fgDark mb-1 flex items-center gap-1">
                <Users size={14} className="inline" />
                Clientes Activos
              </p>
              <h3 className="text-2xl font-bold text-tokyo-fg">{stats.clientCount}</h3>
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
