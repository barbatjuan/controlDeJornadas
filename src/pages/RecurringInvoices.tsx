import React, { useState, useEffect, useCallback } from 'react';
import { useWorkData } from '../contexts/WorkDataContext';
import { RecurringInvoice, RecurringPayment } from '../types';
import { PlusCircle, Calendar, DollarSign, AlertCircle, Clock, CheckCircle, Users, Edit, Play, Trash2 } from 'lucide-react';
import RecurringInvoiceModal from '../components/RecurringInvoiceModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { toast } from 'sonner';

const RecurringInvoices: React.FC = () => {
  const { 
    recurringInvoices, 
    recurringPayments, 
    clients, 
    isLoaded, 
    addOrUpdateRecurringInvoice, 
    deleteRecurringInvoice,
    updateRecurringPaymentStatus
  } = useWorkData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<RecurringInvoice | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<RecurringInvoice | null>(null);

  // Verificar si las tablas están configuradas
  // Las tablas se consideran configuradas si los datos están cargados (aunque estén vacías)
  const tablesConfigured = isLoaded;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRecurrenceLabel = (type: string) => {
    const labels = {
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      biannual: 'Semestral',
      annual: 'Anual'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'text-green-500 bg-green-100',
      paused: 'text-yellow-500 bg-yellow-100',
      cancelled: 'text-red-500 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-500 bg-gray-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play size={14} />;
      case 'paused':
        return <Pause size={14} />;
      case 'cancelled':
        return <Trash2 size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  const handleAddNew = () => {
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (invoice: RecurringInvoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };



  const handleSaveInvoice = async (invoiceData: Partial<RecurringInvoice>) => {
    const invoiceToSave = selectedInvoice ? { ...selectedInvoice, ...invoiceData } : invoiceData;
    await addOrUpdateRecurringInvoice(invoiceToSave);
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleDelete = (invoice: RecurringInvoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (invoiceToDelete) {
      await deleteRecurringInvoice(invoiceToDelete.id);
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setInvoiceToDelete(null);
  };

  const getUpcomingPayments = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return recurringPayments.filter(payment => {
      const dueDate = new Date(payment.due_date);
      return payment.status === 'pending' && dueDate <= nextWeek;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  };

  const getOverduePayments = () => {
    const today = new Date();
    return recurringPayments.filter(payment => {
      const dueDate = new Date(payment.due_date);
      return payment.status === 'overdue' || (payment.status === 'pending' && dueDate < today);
    });
  };

  const upcomingPayments = getUpcomingPayments();
  const overduePayments = getOverduePayments();



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-tokyo-fg">Facturas Recurrentes</h2>
        <button
          onClick={handleAddNew}
          disabled={!tablesConfigured && recurringInvoices.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors shadow-md ${
            !tablesConfigured && recurringInvoices.length === 0
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-tokyo-blue text-white hover:bg-blue-700'
          }`}
          title={!tablesConfigured && recurringInvoices.length === 0 ? 'Primero configura las tablas ejecutando el script SQL' : ''}
        >
          <PlusCircle size={18} />
          Nueva Factura Recurrente
        </button>
      </div>

      {/* Alerts */}
      {overduePayments.length > 0 && (
        <div className="bg-tokyo-bg border border-red-400/30 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="text-red-500" size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-tokyo-fg mb-1">Pagos Vencidos</h3>
              <p className="text-tokyo-fg/70 text-sm">
                {overduePayments.length} pago{overduePayments.length > 1 ? 's' : ''} {overduePayments.length > 1 ? 'requieren' : 'requiere'} atención inmediata
              </p>
            </div>
          </div>
        </div>
      )}

      {upcomingPayments.length > 0 && (
        <div className="bg-tokyo-bg border border-yellow-400/30 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Clock className="text-yellow-500" size={22} />
            </div>
            <div>
              <h3 className="font-semibold text-tokyo-fg mb-1">Próximos Vencimientos</h3>
              <p className="text-tokyo-fg/70 text-sm">
                {upcomingPayments.length} pago{upcomingPayments.length > 1 ? 's' : ''} {upcomingPayments.length > 1 ? 'vencen' : 'vence'} en los próximos 7 días
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-tokyo-bg p-4 rounded-lg border border-tokyo-border">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-tokyo-blue" size={20} />
            <h3 className="font-semibold text-tokyo-fg">Total Facturas</h3>
          </div>
          <p className="text-2xl font-bold text-tokyo-blue">{recurringInvoices.length}</p>
        </div>
        
        <div className="bg-tokyo-bg p-4 rounded-lg border border-tokyo-border">
          <div className="flex items-center gap-2 mb-2">
            <Play className="text-green-500" size={20} />
            <h3 className="font-semibold text-tokyo-fg">Activas</h3>
          </div>
          <p className="text-2xl font-bold text-green-500">
            {recurringInvoices.filter(inv => inv.status === 'active').length}
          </p>
        </div>
        
        <div className="bg-tokyo-bg p-4 rounded-lg border border-tokyo-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-red-500" size={20} />
            <h3 className="font-semibold text-tokyo-fg">Vencidos</h3>
          </div>
          <p className="text-2xl font-bold text-red-500">{overduePayments.length}</p>
        </div>
        
        <div className="bg-tokyo-bg p-4 rounded-lg border border-tokyo-border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-tokyo-green" size={20} />
            <h3 className="font-semibold text-tokyo-fg">Ingresos Mensuales</h3>
          </div>
          <p className="text-2xl font-bold text-tokyo-green">
            {formatCurrency(
              recurringInvoices
                .filter(inv => inv.status === 'active' && inv.recurrence_type === 'monthly')
                .reduce((sum, inv) => sum + inv.amount, 0)
            )}
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-tokyo-bg rounded-lg border border-tokyo-border">
        {!isLoaded ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-tokyo-blue"></div>
          </div>
        ) : !tablesConfigured && recurringInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-yellow-500 mb-4" />
            <p className="text-tokyo-fg text-lg font-semibold mb-2">Configuración Requerida</p>
            <p className="text-tokyo-fgDark text-sm mb-4">
              Para usar las facturas recurrentes, necesitas ejecutar el script SQL en tu base de datos.
            </p>
            <div className="bg-tokyo-bgHighlight p-4 rounded-lg text-left text-sm text-tokyo-fgDark mb-4">
              <p className="font-semibold mb-2">Pasos para configurar:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Ve a tu dashboard de Supabase</li>
                <li>Abre el SQL Editor</li>
                <li>Copia y pega el contenido completo del archivo: <code className="bg-tokyo-border px-1 rounded">create_recurring_invoices_tables.sql</code></li>
                <li>Ejecuta el script (botón RUN)</li>
                <li>Verifica que no haya errores</li>
                <li>Recarga esta página</li>
              </ol>
            </div>
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-left text-sm">
              <p className="font-semibold text-red-800 mb-1">⚠️ Importante:</p>
              <p className="text-red-700">El script debe ejecutarse completamente sin errores para que funcionen las facturas recurrentes y la generación de pagos.</p>
            </div>
          </div>
        ) : recurringInvoices.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar size={48} className="mx-auto text-tokyo-fgDark mb-4" />
            <p className="text-tokyo-fgDark text-lg">No tienes facturas recurrentes todavía.</p>
            <p className="text-tokyo-fgDark text-sm mt-2">¡Crea la primera para automatizar tus ingresos!</p>
          </div>
        ) : (
          <div className="divide-y divide-tokyo-border">
            {recurringInvoices.map((invoice) => {
              const client = clients.find(c => c.id === invoice.client_id);
              const invoicePayments = recurringPayments.filter(p => p.recurring_invoice_id === invoice.id);
              const pendingPayments = invoicePayments.filter(p => p.status === 'pending' || p.status === 'overdue');
              
              return (
                <div key={invoice.id} className="p-6 hover:bg-tokyo-bgHighlight transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-tokyo-fg">{invoice.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-tokyo-fgDark">
                        <div>
                          <p><strong>Cliente:</strong> {client?.name || 'Sin cliente'}</p>
                          <p><strong>Monto:</strong> {formatCurrency(invoice.amount)}</p>
                        </div>
                        <div>
                          <p><strong>Frecuencia:</strong> {getRecurrenceLabel(invoice.recurrence_type)}</p>
                          <p><strong>Próximo vencimiento:</strong> {formatDate(invoice.next_due_date)}</p>
                        </div>
                        <div>
                          <p><strong>Estado:</strong> 
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                              invoice.payment_status === 'paid' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {invoice.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                            </span>
                          </p>
                          <p><strong>Monto:</strong> <span className="font-semibold">{formatCurrency(invoice.amount)}</span></p>
                        </div>
                      </div>
                      
                      {invoice.description && (
                        <p className="text-tokyo-fgDark text-sm mt-2">{invoice.description}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar factura"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar factura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <RecurringInvoiceModal
          invoice={selectedInvoice}
          onSave={handleSaveInvoice}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        title="Eliminar Factura Recurrente"
        message="¿Estás seguro de que quieres eliminar esta factura recurrente?"
        itemName={invoiceToDelete ? `${invoiceToDelete.name} - ${clients.find(c => c.id === invoiceToDelete.client_id)?.name || 'Sin cliente'}` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default RecurringInvoices;
