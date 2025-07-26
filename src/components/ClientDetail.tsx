import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, DollarSign, FileText, BarChart2, RefreshCw } from 'lucide-react';
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
  const { workDays, projectPayments, projects, recurringInvoices, recurringPayments } = useWorkData();
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
    
    // 3. Filtrar pagos recurrentes por cliente
    const clientRecurringInvoices = recurringInvoices.filter(inv => inv.client_id === client.id);
    const clientRecurringPayments = recurringPayments.filter(payment => {
      const invoice = recurringInvoices.find(inv => inv.id === payment.recurring_invoice_id);
      return invoice && invoice.client_id === client.id;
    });

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
      processPayment(payment.amount || 0, payment.status, payment.due_date);
    });
    
    // Si no hay pagos de proyectos registrados, considerar el total del proyecto como pendiente
    const clientProjects = projects.filter(project => project.client_id === client.id);
    clientProjects.forEach(project => {
      const projectPaymentsForThisProject = clientProjectPayments.filter(p => p.project_id === project.id);
      const totalPaidForProject = projectPaymentsForThisProject.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const remainingAmount = project.total_amount - totalPaidForProject;
      
      if (remainingAmount > 0) {
        // Añadir el monto restante como pendiente
        processPayment(remainingAmount, 'pending', project.start_date);
      }
    });
    
    // Procesar pagos recurrentes
    clientRecurringPayments.forEach(payment => {
      processPayment(payment.amount || 0, payment.status, payment.due_date);
    });
    
    // Procesar facturas recurrentes activas sin pagos generados
    clientRecurringInvoices.forEach(invoice => {
      const invoicePayments = recurringPayments.filter(payment => payment.recurring_invoice_id === invoice.id);
      
      // Si no hay pagos generados y la factura está activa, incluir el monto como pendiente
      if (invoicePayments.length === 0 && invoice.status === 'active') {
        processPayment(invoice.amount, 'pending', invoice.start_date);
      }
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
  }, [client, workDays, projectPayments, projects, recurringInvoices, recurringPayments]);

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              
              {/* Lista de pagos individuales */}
              <div className="border-t border-tokyo-border/50 pt-4">
                <h4 className="text-sm font-semibold text-tokyo-fg mb-3">Detalle de pagos</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(() => {
                    const allPayments = [];
                    
                    // Añadir jornadas como pagos
                    const clientWorkDays = workDays.filter(day => day.client_id === client.id);
                    clientWorkDays.forEach(day => {
                      allPayments.push({
                        id: `workday-${day.id}`,
                        type: 'Jornada',
                        description: day.description || 'Trabajo realizado',
                        amount: day.amount,
                        status: day.status,
                        date: day.date,
                        icon: '📅'
                      });
                    });
                    
                    // Añadir pagos de proyectos
                    const clientProjectPayments = projectPayments.filter(payment => {
                      const project = projects.find(p => p.id === payment.project_id);
                      return project && project.client_id === client.id;
                    });
                    clientProjectPayments.forEach(payment => {
                      const project = projects.find(p => p.id === payment.project_id);
                      allPayments.push({
                        id: `project-${payment.id}`,
                        type: 'Proyecto',
                        description: project?.name || 'Proyecto',
                        amount: payment.amount,
                        status: payment.status,
                        date: payment.due_date,
                        icon: '🚀'
                      });
                    });
                    
                    // Añadir pagos recurrentes
                    const clientRecurringPayments = recurringPayments.filter(payment => {
                      const invoice = recurringInvoices.find(inv => inv.id === payment.recurring_invoice_id);
                      return invoice && invoice.client_id === client.id;
                    });
                    clientRecurringPayments.forEach(payment => {
                      const invoice = recurringInvoices.find(inv => inv.id === payment.recurring_invoice_id);
                      allPayments.push({
                        id: `recurring-${payment.id}`,
                        type: 'Recurrente',
                        description: invoice?.name || 'Factura recurrente',
                        amount: payment.amount,
                        status: payment.status,
                        date: payment.due_date,
                        icon: '🔄'
                      });
                    });
                    
                    // Ordenar por fecha (más reciente primero)
                    allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    return allPayments.length > 0 ? allPayments.map(payment => (
                      <div key={payment.id} className="flex items-center justify-between py-2 px-3 bg-tokyo-bg rounded border border-tokyo-border/30">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{payment.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-tokyo-border/20 rounded text-tokyo-fgDark">
                                {payment.type}
                              </span>
                              <span className="text-sm text-tokyo-fg font-medium">
                                {payment.description}
                              </span>
                            </div>
                            <p className="text-xs text-tokyo-fgDark mt-1">
                              {new Date(payment.date).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-tokyo-fg">
                            {formatCurrency(payment.amount)}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-700' :
                            payment.status === 'invoiced' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {payment.status === 'paid' ? 'Pagado' :
                             payment.status === 'invoiced' ? 'Facturado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-tokyo-fgDark text-center py-4">
                        No hay pagos registrados para este cliente
                      </p>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Proyectos del cliente */}
          {(() => {
            const clientProjects = projects.filter(project => project.client_id === client.id);
            return clientProjects.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-tokyo-fg mb-3">Proyectos</h3>
                <div className="space-y-3">
                  {clientProjects.map(project => {
                    const projectPaymentsForProject = projectPayments.filter(payment => payment.project_id === project.id);
                    const totalPaid = projectPaymentsForProject.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
                    const totalPending = project.total_amount - totalPaid;
                    
                    return (
                      <div key={project.id} className="bg-tokyo-bgHighlight p-4 rounded-lg border border-tokyo-border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-tokyo-fg">{project.name}</h4>
                            {project.description && (
                              <p className="text-sm text-tokyo-fgDark mt-1">{project.description}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${
                            project.status === 'completed' ? 'bg-green-500' :
                            project.status === 'active' ? 'bg-blue-500' :
                            project.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {project.status === 'completed' ? 'Completado' :
                             project.status === 'active' ? 'Activo' :
                             project.status === 'paused' ? 'Pausado' : 'Cancelado'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-tokyo-fgDark">Total proyecto</p>
                            <p className="font-semibold text-tokyo-fg">{formatCurrency(project.total_amount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-tokyo-fgDark">Pagado</p>
                            <p className="font-semibold text-green-500">{formatCurrency(totalPaid)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-tokyo-fgDark">Pendiente</p>
                            <p className="font-semibold text-orange-500">{formatCurrency(totalPending)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-tokyo-fgDark">Fecha inicio</p>
                            <p className="text-sm text-tokyo-fg">{new Date(project.start_date).toLocaleDateString('es-ES')}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null;
          })()}

          {/* Facturas recurrentes del cliente */}
          {(() => {
            const clientRecurringInvoices = recurringInvoices.filter(invoice => invoice.client_id === client.id);
            return clientRecurringInvoices.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-tokyo-fg mb-3">Facturas Recurrentes</h3>
                <div className="space-y-3">
                  {clientRecurringInvoices.map(invoice => {
                    const invoicePayments = recurringPayments.filter(payment => payment.recurring_invoice_id === invoice.id);
                    const totalPaid = invoicePayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
                    const totalPending = invoicePayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
                    const totalOverdue = invoicePayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
                    
                    // Debug logs
                    console.log('Invoice:', invoice.name, {
                      id: invoice.id,
                      amount: invoice.amount,
                      status: invoice.status,
                      paymentsCount: invoicePayments.length,
                      totalPending,
                      totalPaid,
                      totalOverdue
                    });
                    
                    // Si no hay pagos generados y la factura está activa, mostrar el monto como pendiente
                    const displayPending = invoicePayments.length === 0 && invoice.status === 'active' 
                      ? invoice.amount 
                      : totalPending;
                    const displayOverdue = invoicePayments.length === 0 ? 0 : totalOverdue;
                    
                    console.log('Display values:', {
                      displayPending,
                      displayOverdue,
                      condition: invoicePayments.length === 0 && invoice.status === 'active'
                    });
                    
                    
                    const getRecurrenceLabel = (type: string) => {
                      switch (type) {
                        case 'monthly': return 'Mensual';
                        case 'quarterly': return 'Trimestral';
                        case 'biannual': return 'Semestral';
                        case 'annual': return 'Anual';
                        default: return type;
                      }
                    };
                    
                    return (
                      <div key={invoice.id} className="bg-tokyo-bgHighlight p-4 rounded-lg border border-tokyo-border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <RefreshCw size={16} className="text-tokyo-blue" />
                              <h4 className="font-semibold text-tokyo-fg">{invoice.name}</h4>
                            </div>
                            {invoice.description && (
                              <p className="text-sm text-tokyo-fgDark mt-1">{invoice.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-tokyo-fgDark">
                              <span>Frecuencia: {getRecurrenceLabel(invoice.recurrence_type)}</span>
                              <span>Monto: {formatCurrency(invoice.amount)}</span>
                            </div>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${
                            invoice.status === 'active' ? 'bg-green-500' :
                            invoice.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>
                            {invoice.status === 'active' ? 'Activa' :
                             invoice.status === 'paused' ? 'Pausada' : 'Cancelada'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-tokyo-fgDark">Pagos generados</p>
                            <p className="font-semibold text-tokyo-fg">{invoicePayments.length}</p>
                          </div>
                          <div>
                            <p className="text-xs text-tokyo-fgDark">Pagado</p>
                            <p className="font-semibold text-green-500">{formatCurrency(totalPaid)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-tokyo-fgDark">Pendiente</p>
                            <p className="font-semibold text-orange-500">{(() => {
                              console.log('Formatting displayPending:', displayPending, typeof displayPending);
                              const formatted = formatCurrency(displayPending);
                              console.log('Formatted result:', formatted);
                              return formatted;
                            })()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-tokyo-fgDark">Vencido</p>
                            <p className="font-semibold text-red-500">{formatCurrency(displayOverdue)}</p>
                          </div>
                        </div>
                        
                        {/* Mostrar próximo vencimiento si está activa */}
                        {invoice.status === 'active' && invoice.next_due_date && (
                          <div className="mt-3 pt-3 border-t border-tokyo-border">
                            <p className="text-xs text-tokyo-fgDark">Próximo vencimiento:</p>
                            <p className="text-sm font-medium text-tokyo-fg">
                              {new Date(invoice.next_due_date).toLocaleDateString('es-ES')}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null;
          })()}

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
