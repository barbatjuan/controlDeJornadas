import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, DollarSign, FileText, BarChart2 } from 'lucide-react';
import { Client, WorkDay } from '../types';
import { useWorkData } from '../contexts/WorkDataContext';

interface ClientDetailProps {
  client: Client;
  onBack: () => void;
}

interface ClientStats {
  totalWorkDays: number;
  totalAmount: number;
  averageDailyRate: number;
  monthlyStats: {
    [key: string]: { // Formato: YYYY-MM
      totalDays: number;
      totalAmount: number;
      averageAmount: number;
    }
  };
  statusBreakdown: {
    pending: number;
    invoiced: number;
    paid: number;
  };
}

const ClientDetail: React.FC<ClientDetailProps> = ({ client, onBack }) => {
  const { workDays } = useWorkData();
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!client || !workDays) {
      setIsLoading(false);
      return;
    }

    // Filtrar días de trabajo por cliente
    const clientWorkDays = workDays.filter(day => day.client_id === client.id);
    
    if (clientWorkDays.length === 0) {
      setClientStats({
        totalWorkDays: 0,
        totalAmount: 0,
        averageDailyRate: 0,
        monthlyStats: {},
        statusBreakdown: { pending: 0, invoiced: 0, paid: 0 }
      });
      setIsLoading(false);
      return;
    }

    // Calcular estadísticas
    const totalAmount = clientWorkDays.reduce((sum, day) => sum + day.amount, 0);
    const averageDailyRate = totalAmount / clientWorkDays.length;
    
    // Calcular desglose por estado
    const statusBreakdown = {
      pending: clientWorkDays.filter(day => day.status === 'pending').reduce((sum, day) => sum + day.amount, 0),
      invoiced: clientWorkDays.filter(day => day.status === 'invoiced').reduce((sum, day) => sum + day.amount, 0),
      paid: clientWorkDays.filter(day => day.status === 'paid').reduce((sum, day) => sum + day.amount, 0)
    };

    // Calcular estadísticas mensuales
    const monthlyStats: ClientStats['monthlyStats'] = {};
    
    clientWorkDays.forEach(day => {
      // Extraer año y mes de la fecha (formato YYYY-MM-DD)
      const yearMonth = day.date.substring(0, 7); // YYYY-MM
      
      if (!monthlyStats[yearMonth]) {
        monthlyStats[yearMonth] = {
          totalDays: 0,
          totalAmount: 0,
          averageAmount: 0
        };
      }
      
      monthlyStats[yearMonth].totalDays += 1;
      monthlyStats[yearMonth].totalAmount += day.amount;
    });
    
    // Calcular promedios mensuales
    Object.keys(monthlyStats).forEach(month => {
      const stats = monthlyStats[month];
      stats.averageAmount = stats.totalAmount / stats.totalDays;
    });

    setClientStats({
      totalWorkDays: clientWorkDays.length,
      totalAmount,
      averageDailyRate,
      monthlyStats,
      statusBreakdown
    });
    
    setIsLoading(false);
  }, [client, workDays]);

  // Función para formatear montos en euros
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Función para formatear meses
  const formatMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-tokyo-blue"></div>
      </div>
    );
  }

  return (
    <div className="bg-tokyo-bg p-5 rounded-lg border border-tokyo-border">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-3 p-2 hover:bg-tokyo-bgHighlight rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-tokyo-blue" />
        </button>
        <h2 className="text-2xl font-bold text-tokyo-fg">Detalle del cliente</h2>
      </div>
      
      <div className="mb-6">
        <h3 className="text-xl font-bold text-tokyo-fg mb-2">{client.name}</h3>
        <div className="space-y-1 text-sm text-tokyo-fgDark">
          {client.email && <p>Email: {client.email}</p>}
          {client.phone && <p>Teléfono: {client.phone}</p>}
          {client.address && <p>Dirección: {client.address}</p>}
        </div>
      </div>

      {clientStats && (
        <>
          {/* Resumen general */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-tokyo-bgHighlight p-4 rounded-lg border border-tokyo-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={18} className="text-tokyo-blue" />
                <h4 className="font-semibold text-tokyo-fg">Total jornadas</h4>
              </div>
              <p className="text-2xl font-bold text-tokyo-fg">{clientStats.totalWorkDays}</p>
            </div>
            
            <div className="bg-tokyo-bgHighlight p-4 rounded-lg border border-tokyo-border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={18} className="text-tokyo-green" />
                <h4 className="font-semibold text-tokyo-fg">Total facturado</h4>
              </div>
              <p className="text-2xl font-bold text-tokyo-fg">
                {formatCurrency(clientStats.totalAmount)}
              </p>
            </div>
            
            <div className="bg-tokyo-bgHighlight p-4 rounded-lg border border-tokyo-border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 size={18} className="text-tokyo-purple" />
                <h4 className="font-semibold text-tokyo-fg">Precio medio</h4>
              </div>
              <p className="text-2xl font-bold text-tokyo-fg">
                {formatCurrency(clientStats.averageDailyRate)}
              </p>
            </div>
          </div>

          {/* Estado de pagos */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-tokyo-fg mb-3">Estado de pagos</h3>
            <div className="bg-tokyo-bgHighlight p-4 rounded-lg border border-tokyo-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm text-tokyo-fgDark mb-1">Pendiente</h4>
                  <p className="font-bold text-orange-500">{formatCurrency(clientStats.statusBreakdown.pending)}</p>
                </div>
                <div>
                  <h4 className="text-sm text-tokyo-fgDark mb-1">Facturado</h4>
                  <p className="font-bold text-blue-500">{formatCurrency(clientStats.statusBreakdown.invoiced)}</p>
                </div>
                <div>
                  <h4 className="text-sm text-tokyo-fgDark mb-1">Pagado</h4>
                  <p className="font-bold text-green-500">{formatCurrency(clientStats.statusBreakdown.paid)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Desglose mensual */}
          {Object.keys(clientStats.monthlyStats).length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-tokyo-fg mb-3">Desglose mensual</h3>
              <div className="bg-tokyo-bgHighlight overflow-hidden rounded-lg border border-tokyo-border">
                <table className="w-full">
                  <thead className="bg-tokyo-border/20">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-tokyo-fg">Mes</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-tokyo-fg">Jornadas</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-tokyo-fg">Total</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-tokyo-fg">Promedio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tokyo-border/20">
                    {Object.keys(clientStats.monthlyStats)
                      .sort((a, b) => b.localeCompare(a)) // Ordenar de más reciente a más antiguo
                      .map(month => {
                        const stats = clientStats.monthlyStats[month];
                        return (
                          <tr key={month} className="hover:bg-tokyo-border/10">
                            <td className="px-4 py-3 text-sm text-tokyo-fg">{formatMonth(month)}</td>
                            <td className="px-4 py-3 text-sm text-tokyo-fg">{stats.totalDays}</td>
                            <td className="px-4 py-3 text-sm text-tokyo-fg">{formatCurrency(stats.totalAmount)}</td>
                            <td className="px-4 py-3 text-sm text-tokyo-fg">{formatCurrency(stats.averageAmount)}</td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-tokyo-fgDark">
              No hay jornadas registradas para este cliente.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientDetail;
