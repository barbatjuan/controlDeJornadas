import React, { useState } from 'react';
import { useWorkData } from '../contexts/WorkDataContext';
import { RecurringInvoice, RecurringPayment } from '../types';
import { ArrowLeft, Calendar, DollarSign, Check, Clock, AlertTriangle, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface RecurringPaymentsListProps {
  invoice: RecurringInvoice;
  onBack: () => void;
}

const RecurringPaymentsList: React.FC<RecurringPaymentsListProps> = ({
  invoice,
  onBack
}) => {
  const { recurringPayments, clients, updateRecurringPaymentStatus } = useWorkData();
  const [updatingPayments, setUpdatingPayments] = useState<Set<string>>(new Set());

  const invoicePayments = recurringPayments
    .filter(payment => payment.recurring_invoice_id === invoice.id)
    .sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());

  const client = clients.find(c => c.id === invoice.client_id);

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

  const getStatusColor = (payment: RecurringPayment) => {
    const today = new Date();
    const dueDate = new Date(payment.due_date);
    
    if (payment.status === 'paid') {
      return 'text-green-600 bg-green-100';
    } else if (payment.status === 'overdue' || (payment.status === 'pending' && dueDate < today)) {
      return 'text-red-600 bg-red-100';
    } else {
      return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (payment: RecurringPayment) => {
    const today = new Date();
    const dueDate = new Date(payment.due_date);
    
    if (payment.status === 'paid') {
      return <Check size={16} />;
    } else if (payment.status === 'overdue' || (payment.status === 'pending' && dueDate < today)) {
      return <AlertTriangle size={16} />;
    } else {
      return <Clock size={16} />;
    }
  };

  const getStatusLabel = (payment: RecurringPayment) => {
    const today = new Date();
    const dueDate = new Date(payment.due_date);
    
    if (payment.status === 'paid') {
      return 'Pagado';
    } else if (payment.status === 'overdue' || (payment.status === 'pending' && dueDate < today)) {
      return 'Vencido';
    } else {
      return 'Pendiente';
    }
  };

  const handleMarkAsPaid = async (payment: RecurringPayment) => {
    if (updatingPayments.has(payment.id)) return;
    
    setUpdatingPayments(prev => new Set(prev).add(payment.id));

    try {
      const success = await updateRecurringPaymentStatus(payment.id, 'paid');
      if (!success) {
        // El error ya se mostró en el contexto
        return;
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      setUpdatingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(payment.id);
        return newSet;
      });
    }
  };

  const handleMarkAsPending = async (payment: RecurringPayment) => {
    if (updatingPayments.has(payment.id)) return;
    
    setUpdatingPayments(prev => new Set(prev).add(payment.id));

    try {
      const success = await updateRecurringPaymentStatus(payment.id, 'pending');
      if (!success) {
        // El error ya se mostró en el contexto
        return;
      }
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      setUpdatingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(payment.id);
        return newSet;
      });
    }
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

  const totalAmount = invoicePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidAmount = invoicePayments
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => sum + payment.amount, 0);
  const pendingAmount = totalAmount - paidAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-tokyo-bgHighlight rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-tokyo-fgDark" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-tokyo-fg">{invoice.name}</h2>
          <p className="text-tokyo-fgDark">
            {client?.name || 'Sin cliente'} • {getRecurrenceLabel(invoice.recurrence_type)} • {formatCurrency(invoice.amount)}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-tokyo-bg p-4 rounded-lg border border-tokyo-border">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-tokyo-blue" size={20} />
            <h3 className="font-semibold text-tokyo-fg">Total Pagos</h3>
          </div>
          <p className="text-2xl font-bold text-tokyo-blue">{invoicePayments.length}</p>
        </div>
        
        <div className="bg-tokyo-bg p-4 rounded-lg border border-tokyo-border">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-tokyo-green" size={20} />
            <h3 className="font-semibold text-tokyo-fg">Total Facturado</h3>
          </div>
          <p className="text-2xl font-bold text-tokyo-green">{formatCurrency(totalAmount)}</p>
        </div>
        
        <div className="bg-tokyo-bg p-4 rounded-lg border border-tokyo-border">
          <div className="flex items-center gap-2 mb-2">
            <Check className="text-green-500" size={20} />
            <h3 className="font-semibold text-tokyo-fg">Pagado</h3>
          </div>
          <p className="text-2xl font-bold text-green-500">{formatCurrency(paidAmount)}</p>
        </div>
        
        <div className="bg-tokyo-bg p-4 rounded-lg border border-tokyo-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-yellow-500" size={20} />
            <h3 className="font-semibold text-tokyo-fg">Pendiente</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-500">{formatCurrency(pendingAmount)}</p>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-tokyo-bg rounded-lg border border-tokyo-border">
        {invoicePayments.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar size={48} className="mx-auto text-tokyo-fgDark mb-4" />
            <p className="text-tokyo-fgDark text-lg">No hay pagos generados todavía.</p>
            <p className="text-tokyo-fgDark text-sm mt-2">Los pagos se generarán automáticamente según la configuración.</p>
          </div>
        ) : (
          <div className="divide-y divide-tokyo-border">
            {invoicePayments.map((payment) => {
              const isUpdating = updatingPayments.has(payment.id);
              
              return (
                <div key={payment.id} className="p-4 hover:bg-tokyo-bgHighlight transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor(payment)}`}>
                          {getStatusIcon(payment)}
                          {getStatusLabel(payment)}
                        </span>
                        <span className="text-lg font-semibold text-tokyo-fg">
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-tokyo-fgDark">
                        <div>
                          <p><strong>Fecha de vencimiento:</strong> {formatDate(payment.due_date)}</p>
                        </div>
                        <div>
                          {payment.payment_date && (
                            <p><strong>Fecha de pago:</strong> {formatDate(payment.payment_date)}</p>
                          )}
                        </div>
                        <div>
                          {payment.notes && (
                            <p><strong>Notas:</strong> {payment.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {payment.status === 'paid' ? (
                        <button
                          onClick={() => handleMarkAsPending(payment)}
                          disabled={isUpdating}
                          className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? 'Actualizando...' : 'Marcar Pendiente'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsPaid(payment)}
                          disabled={isUpdating}
                          className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                        >
                          {isUpdating ? 'Actualizando...' : 'Marcar Pagado'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecurringPaymentsList;
