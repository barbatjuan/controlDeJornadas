import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, DollarSign, FileText, BarChart2 } from 'lucide-react';
import { Client, WorkDay, ProjectPayment, RecurringPayment } from '../types';
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
  const { workDays, projectPayments, projects, recurringInvoices } = useWorkData();
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!client) {
      setIsLoading(false);
      return;
    }

    // 1. Filtrar días de trabajo por cliente
    const clientWorkDays = workDays.filter(day => day.client_id === client.id);
    
    // 2. Filtrar pagos de proyectos por cliente
    const clientProjectPayments = projectPayments.filter(payment => {
      const project = projects.find(p => p.id === payment.project_id);
      return project && project.client_id === client.id;
    });
    
    // 3. Filtrar facturas recurrentes por cliente
    const clientRecurringInvoices = recurringInvoices.filter(invoice => 
      invoice.client_id === client.id
    );

    // Calcular estadísticas unificadas
    let totalAmount = 0;
    let pendingAmount = 0;
    let invoicedAmount = 0;
    let paidAmount = 0;
    const monthlyStats: { [key: string]: { totalDays: number; totalAmount: number; averageAmount: number } } = {};
    
    // Función auxiliar para procesar un pago
    const processPayment = (amount: number, status: string, date: string, isWorkDay = false) => {
      totalAmount += amount;
      
      // Calcular montos por estado
      if (status === 'paid') {
        paidAmount += amount;
      } else if (status === 'invoiced') {
        invoicedAmount += amount;
      } else if (status === 'pending') {
        pendingAmount += amount;
      }
      
      // Estadísticas mensuales
      const dateObj = new Date(date);
      const monthYear = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthYear]) {
        monthlyStats[monthYear] = {
          totalDays: 0,
          totalAmount: 0,
          averageAmount: 0
        };
      }
      
      if (isWorkDay) {
        monthlyStats[monthYear].totalDays += 1;
      }
      monthlyStats[monthYear].totalAmount += amount;
    };
    
    // Procesar jornadas de trabajo
    clientWorkDays.forEach(day => {
      processPayment(day.amount || 0, day.status, day.date, true);
    });
    
    // Procesar pagos de proyectos
    clientProjectPayments.forEach(payment => {
      processPayment(payment.amount || 0, payment.status, payment.date);
    });
    
    // Procesar facturas recurrentes
    clientRecurringInvoices.forEach(invoice => {
      processPayment(invoice.amount || 0, invoice.payment_status, invoice.next_due_date);
    });
    
    // Calcular promedios mensuales
    Object.keys(monthlyStats).forEach(month => {
      const stats = monthlyStats[month];
      stats.averageAmount = stats.totalAmount / stats.totalDays;
    });
    
    const averageDailyRate = clientWorkDays.length > 0 ? totalAmount / clientWorkDays.length : 0;
    
    const statusBreakdown = {
      pending: pendingAmount,
      invoiced: invoicedAmount,
      paid: paidAmount
    };

    setClientStats({
      totalWorkDays: clientWorkDays.length,
      totalAmount,
      averageDailyRate,
      monthlyStats,
      statusBreakdown
    });
    
    setIsLoading(false);
  }, [client, workDays, projectPayments, projects, recurringInvoices]);

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
        
        {/* Información de contacto */}
        <div className="space-y-1 text-sm text-tokyo-fgDark mb-3">
          {client.email && <p>Email: {client.email}</p>}
          {client.phone && <p>Teléfono: {client.phone}</p>}
          {client.address && <p>Dirección: {client.address}</p>}
        </div>
        
        {/* Información de facturación */}
        {(client.nif || client.company_name) && (
          <div className="mt-4 p-3 bg-tokyo-bgHighlight rounded-md border border-tokyo-border">
            <h4 className="font-semibold text-sm text-tokyo-blue mb-2">Datos de facturación</h4>
            <div className="space-y-1 text-sm">
              {client.nif && <p><span className="text-tokyo-fgDark">NIF/CIF:</span> <span className="text-tokyo-fg">{client.nif}</span></p>}
              {client.company_name && <p><span className="text-tokyo-fgDark">Empresa:</span> <span className="text-tokyo-fg">{client.company_name}</span></p>}
            </div>
          </div>
        )}
        
        {/* Notas */}
        {client.notes && (
          <div className="mt-3 p-3 bg-tokyo-bgHighlight rounded-md border border-tokyo-border">
            <h4 className="font-semibold text-sm text-tokyo-blue mb-1">Notas</h4>
            <p className="text-sm text-tokyo-fg">{client.notes}</p>
          </div>
        )}
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
