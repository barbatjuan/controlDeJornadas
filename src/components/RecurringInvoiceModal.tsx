import React, { useState, useEffect } from 'react';
import { useWorkData } from '../contexts/WorkDataContext';
import { RecurringInvoice, RecurrenceType, InvoiceStatus, Client } from '../types';
import { X, Calendar, User, FileText, Clock, Settings, PlusCircle } from 'lucide-react';
import ClientModal from './ClientModal';

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
  const { clients, addOrUpdateClient } = useWorkData();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  
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

  const handleSaveNewClient = async (clientData: { name: string; company?: string }) => {
    const newClient = await addOrUpdateClient(clientData);
    if (newClient) {
      setFormData(prev => ({ ...prev, client_id: newClient.id }));
      setIsClientModalOpen(false);
    }
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre de factura */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-tokyo-fgDark">
              Nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FileText size={18} className="text-tokyo-fgDark" />
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="pl-10 w-full p-2 border border-tokyo-border bg-tokyo-bg text-tokyo-fg rounded-lg focus:ring-1 focus:ring-tokyo-blue focus:border-tokyo-blue"
                placeholder="Ej: Mantenimiento Web"
              />
            </div>
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Cliente */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-tokyo-fgDark">Cliente</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User size={18} className="text-tokyo-fgDark" />
              </div>
              <select
                value={formData.client_id}
                onChange={(e) => handleInputChange('client_id', e.target.value)}
                className="pl-10 w-full p-2 border border-tokyo-border bg-tokyo-bg text-tokyo-fg rounded-lg appearance-none focus:ring-1 focus:ring-tokyo-blue focus:border-tokyo-blue"
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.company ? `(${client.company})` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  className="text-tokyo-blue hover:text-blue-700"
                >
                  <PlusCircle size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-tokyo-fgDark">Descripción</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FileText size={18} className="text-tokyo-fgDark" />
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="pl-10 w-full p-2 border border-tokyo-border bg-tokyo-bg text-tokyo-fg rounded-lg focus:ring-1 focus:ring-tokyo-blue focus:border-tokyo-blue resize-none"
                rows={3}
                placeholder="Descripción del servicio recurrente..."
              />
            </div>
          </div>

          {/* Monto */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-tokyo-fgDark">
              Monto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-tokyo-fgDark font-semibold">€</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="pl-8 pr-8 w-full p-2 border border-tokyo-border bg-tokyo-bg text-tokyo-fg rounded-lg focus:ring-1 focus:ring-tokyo-blue focus:border-tokyo-blue"
                placeholder="0.00"
              />

            </div>
            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
          </div>

          {/* Tipo de recurrencia */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-tokyo-fgDark">Frecuencia</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Clock size={18} className="text-tokyo-fgDark" />
              </div>
              <select
                value={formData.recurrence_type}
                onChange={(e) => handleInputChange('recurrence_type', e.target.value)}
                className="pl-10 w-full p-2 border border-tokyo-border bg-tokyo-bg text-tokyo-fg rounded-lg appearance-none focus:ring-1 focus:ring-tokyo-blue focus:border-tokyo-blue"
              >
                {recurrenceOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-tokyo-fgDark">
                Fecha de inicio <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                  className="w-full p-2 border border-tokyo-border bg-tokyo-bg text-tokyo-fg rounded-lg focus:ring-1 focus:ring-tokyo-blue focus:border-tokyo-blue"
                  placeholder="dd/mm/aaaa"
                  required
                />
              </div>
              {errors.start_date && <p className="text-sm text-red-500">{errors.start_date}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-tokyo-fgDark">Vencimiento (opcional)</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                  className="w-full p-2 border border-tokyo-border bg-tokyo-bg text-tokyo-fg rounded-lg focus:ring-1 focus:ring-tokyo-blue focus:border-tokyo-blue"
                  placeholder="dd/mm/aaaa"
                />
              </div>
              {errors.end_date && <p className="text-sm text-red-500">{errors.end_date}</p>}
            </div>
          </div>

          {/* Estado de la factura */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-tokyo-fgDark">Estado de la factura</label>
            <div className="flex gap-2">
              {statusOptions.map(status => {
                const isSelected = formData.status === status.value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleInputChange('status', status.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-tokyo-blue text-white'
                        : 'bg-tokyo-bgHighlight text-tokyo-fgDark hover:bg-tokyo-border'
                    }`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estado de pago por defecto */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-tokyo-fgDark">Estado de pago por defecto</label>
            <div className="flex gap-2">
              {[{ value: 'pending', label: 'Pendiente' }, { value: 'paid', label: 'Pagado' }].map(status => {
                const isSelected = formData.payment_status === status.value;
                return (
                  <button
                    key={status.value}
                    type="button"
                    onClick={() => handleInputChange('payment_status', status.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-tokyo-blue text-white'
                        : 'bg-tokyo-bgHighlight text-tokyo-fgDark hover:bg-tokyo-border'
                    }`}
                  >
                    {status.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generar pagos automáticamente */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="auto_generate"
              checked={formData.auto_generate}
              onChange={(e) => handleInputChange('auto_generate', e.target.checked)}
              className="w-4 h-4 text-tokyo-blue bg-tokyo-bg border-tokyo-border rounded focus:ring-tokyo-blue focus:ring-2"
            />
            <label htmlFor="auto_generate" className="text-sm text-tokyo-fgDark">
              Generar pagos automáticamente según la frecuencia
            </label>
          </div>

          {/* Botones de acción */}
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

      {isClientModalOpen && (
        <ClientModal 
          onSave={handleSaveNewClient}
          onClose={() => setIsClientModalOpen(false)}
        />
      )}
    </div>
  );
};

export default RecurringInvoiceModal;
