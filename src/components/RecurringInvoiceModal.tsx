import React, { useState, useEffect } from 'react';
import { useWorkData } from '../contexts/WorkDataContext';
import { RecurringInvoice, RecurrenceType, InvoiceStatus } from '../types';
import { X, Calendar, DollarSign, User, FileText, Clock, Settings } from 'lucide-react';

interface RecurringInvoiceModalProps {
  invoice: RecurringInvoice | null;
  onSave: (invoice: Partial<RecurringInvoice>) => void;
  onClose: () => void;
}

const RecurringInvoiceModal: React.FC<RecurringInvoiceModalProps> = ({
  invoice,
  onSave,
  onClose
}) => {
  const { clients } = useWorkData();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    amount: '',
    recurrence_type: 'monthly' as RecurrenceType,
    start_date: '',
    end_date: '',
    status: 'active' as InvoiceStatus,
    payment_status: 'pending' as 'pending' | 'paid',
    auto_generate: true
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (invoice) {
      setFormData({
        name: invoice.name || '',
        description: invoice.description || '',
        client_id: invoice.client_id || '',
        amount: invoice.amount?.toString() || '',
        recurrence_type: invoice.recurrence_type || 'monthly',
        start_date: invoice.start_date || '',
        end_date: invoice.end_date || '',
        status: invoice.status || 'active',
        payment_status: invoice.payment_status || 'pending',
        auto_generate: invoice.auto_generate ?? true
      });
    } else {
      // Para nuevas facturas, establecer fecha de inicio como hoy
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        start_date: today
      }));
    }
  }, [invoice]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es obligatoria';
    }

    if (formData.end_date && formData.start_date && new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateNextDueDate = (startDate: string, recurrenceType: RecurrenceType): string => {
    const date = new Date(startDate);
    
    switch (recurrenceType) {
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'biannual':
        date.setMonth(date.getMonth() + 6);
        break;
      case 'annual':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
    
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const invoiceData: Partial<RecurringInvoice> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      client_id: formData.client_id || undefined,
      amount: parseFloat(formData.amount),
      recurrence_type: formData.recurrence_type,
      start_date: formData.start_date,
      end_date: formData.end_date || undefined,
      status: formData.status,
      payment_status: formData.payment_status,
      auto_generate: formData.auto_generate,
      next_due_date: invoice?.next_due_date || calculateNextDueDate(formData.start_date, formData.recurrence_type)
    };

    if (invoice) {
      invoiceData.id = invoice.id;
    }

    onSave(invoiceData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const recurrenceOptions = [
    { value: 'monthly', label: 'Mensual' },
    { value: 'quarterly', label: 'Trimestral' },
    { value: 'biannual', label: 'Semestral' },
    { value: 'annual', label: 'Anual' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Activa', color: 'text-green-600' },
    { value: 'paused', label: 'Pausada', color: 'text-yellow-600' },
    { value: 'cancelled', label: 'Cancelada', color: 'text-red-600' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-tokyo-bg rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-tokyo-border">
          <h2 className="text-xl font-bold text-tokyo-fg">
            {invoice ? 'Editar Factura Recurrente' : 'Nueva Factura Recurrente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-tokyo-bgHighlight rounded-full transition-colors"
          >
            <X size={20} className="text-tokyo-fgDark" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-tokyo-fg flex items-center gap-2">
              <FileText size={18} />
              Información Básica
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-tokyo-fg mb-2">
                Nombre de la factura *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue ${
                  errors.name ? 'border-red-500' : 'border-tokyo-border'
                }`}
                placeholder="ej. Mantenimiento Web Mensual"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-tokyo-fg mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-tokyo-border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
                rows={3}
                placeholder="Descripción opcional del servicio..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-tokyo-fg mb-2 flex items-center gap-2">
                <User size={16} />
                Cliente
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => handleInputChange('client_id', e.target.value)}
                className="w-full px-3 py-2 border border-tokyo-border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
              >
                <option value="">Sin cliente específico</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-tokyo-fg flex items-center gap-2">
              <DollarSign size={18} />
              Información Financiera
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-tokyo-fg mb-2">
                Monto *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-tokyo-fgDark">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue ${
                    errors.amount ? 'border-red-500' : 'border-tokyo-border'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-tokyo-fg mb-2 flex items-center gap-2">
                <Clock size={16} />
                Frecuencia de facturación
              </label>
              <select
                value={formData.recurrence_type}
                onChange={(e) => handleInputChange('recurrence_type', e.target.value as RecurrenceType)}
                className="w-full px-3 py-2 border border-tokyo-border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
              >
                {recurrenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-tokyo-fg flex items-center gap-2">
              <Calendar size={18} />
              Fechas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-tokyo-fg mb-2">
                  Fecha de inicio *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue ${
                    errors.start_date ? 'border-red-500' : 'border-tokyo-border'
                  }`}
                />
                {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-tokyo-fg mb-2">
                  Fecha de fin (opcional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue ${
                    errors.end_date ? 'border-red-500' : 'border-tokyo-border'
                  }`}
                />
                {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-tokyo-fg flex items-center gap-2">
              <Settings size={18} />
              Configuración
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-tokyo-fg mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as InvoiceStatus)}
                className="w-full px-3 py-2 border border-tokyo-border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="auto_generate"
                checked={formData.auto_generate}
                onChange={(e) => handleInputChange('auto_generate', e.target.checked)}
                className="w-4 h-4 text-tokyo-blue bg-tokyo-bgHighlight border-tokyo-border rounded focus:ring-tokyo-blue focus:ring-2"
              />
              <label htmlFor="auto_generate" className="text-sm text-tokyo-fg">
                Generar pagos automáticamente
              </label>
            </div>
            <p className="text-xs text-tokyo-fgDark">
              Si está activado, se crearán automáticamente los pagos pendientes según la frecuencia configurada.
            </p>
          </div>

          {/* Payment Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-tokyo-fg flex items-center gap-2">
              <DollarSign size={18} />
              Estado de Pago
            </h3>
            
            <div className="flex rounded-lg overflow-hidden border border-tokyo-border">
              {(['pending', 'paid'] as const).map((status, index, array) => {
                const isSelected = formData.payment_status === status;
                const isFirst = index === 0;
                const isLast = index === array.length - 1;
                
                const baseClasses = 'flex-1 px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer';
                const selectedClasses = 'text-white shadow-sm';
                const unselectedClasses = 'text-tokyo-fgDark hover:bg-tokyo-bgHighlight';
                
                const colorClasses = {
                  pending: 'bg-yellow-500 hover:bg-yellow-600',
                  paid: 'bg-green-500 hover:bg-green-600'
                };
                
                const statusText = {
                  pending: 'Pendiente',
                  paid: 'Pagado'
                };
                
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleInputChange('payment_status', status)}
                    className={`${baseClasses} ${isSelected ? `${selectedClasses} ${colorClasses[status]}` : unselectedClasses}`}
                  >
                    {statusText[status]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-tokyo-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-tokyo-fgDark hover:bg-tokyo-bgHighlight rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-tokyo-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {invoice ? 'Actualizar' : 'Crear'} Factura
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringInvoiceModal;
