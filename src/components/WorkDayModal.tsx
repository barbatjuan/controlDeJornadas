import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, CreditCard, FileText, Save } from 'lucide-react';
import { WorkDay } from '../types';
import { useWorkData } from '../hooks/useWorkData';
import { formatDate } from '../utils/dateUtils';

interface WorkDayModalProps {
  date?: Date | null;
  selectedDates?: Date[];
  onClose: () => void;
}

const ACCOUNTS = [
  'Cuenta Principal',
  'Santander',
  'Wise',
  'Cuenta Ahorros',
  'PayPal',
  'Revolut',
  'Bizum',
  'Transferencia',
  'Efectivo',
];

export const WorkDayModal: React.FC<WorkDayModalProps> = ({ date, selectedDates = [], onClose }) => {
  const { getWorkDay, addOrUpdateWorkDays, removeWorkDay } = useWorkData();
  const [formData, setFormData] = useState({
    amount: '',
    isPaid: false, // Default to false (pending)
    account: 'Cuenta Principal', // Default account
    notes: '',
  });

  const currentDate = date || new Date();
  const isMultipleSelection = selectedDates.length > 1;
  const dateString = date ? formatDate(currentDate) : '';
  const existingWorkDay = date ? getWorkDay(dateString) : undefined;

  useEffect(() => {
    if (existingWorkDay) {
      setFormData({
        amount: existingWorkDay.amount.toString(),
        isPaid: existingWorkDay.isPaid,
        account: existingWorkDay.account,
        notes: existingWorkDay.notes || '',
      });
    } else {
      setFormData({
        amount: '',
        isPaid: false,
        account: 'Cuenta Principal',
        notes: '',
      });
    }
  }, [existingWorkDay]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      alert('Por favor, ingresa un monto válido');
      return;
    }

    if (!formData.account) {
      alert('Por favor, selecciona una cuenta');
      return;
    }

    console.log('🚀 WorkDayModal - Submitting form data:', formData);
    console.log('📅 WorkDayModal - Is multiple selection:', isMultipleSelection);
    console.log('📅 WorkDayModal - Selected dates:', selectedDates.map(d => formatDate(d)));

    const daysToSave: WorkDay[] = [];

    if (isMultipleSelection) {
      console.log('🔄 WorkDayModal - Preparing multiple dates for saving...');
      selectedDates.forEach(selectedDate => {
        daysToSave.push({
          date: formatDate(selectedDate),
          amount: amount,
          isPaid: formData.isPaid,
          account: formData.account,
          notes: formData.notes.trim() || undefined,
        });
      });
    } else {
      daysToSave.push({
        date: dateString,
        amount: amount,
        isPaid: formData.isPaid,
        account: formData.account,
        notes: formData.notes.trim() || undefined,
      });
    }

    console.log(`💾 WorkDayModal - Saving ${daysToSave.length} day(s)...`, daysToSave);
    addOrUpdateWorkDays(daysToSave);

    console.log('✅ WorkDayModal - Form submitted, closing modal');
    onClose();
  };

  const handleDelete = () => {
    if (existingWorkDay && confirm('¿Estás seguro de que quieres eliminar este día de trabajo?')) {
      removeWorkDay(dateString);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-tokyo-bgDark rounded-xl sm:rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-2xl border dark:border-tokyo-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-tokyo-cyan" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-tokyo-fg">
              {isMultipleSelection 
                ? `Añadir ${selectedDates.length} Días` 
                : existingWorkDay ? 'Editar Día' : 'Nuevo Día'
              }
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-tokyo-bgHighlight rounded-full transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-tokyo-fg" />
          </button>
        </div>

        {/* Date */}
        <div className="mb-4 sm:mb-6 p-3 bg-gray-50 dark:bg-tokyo-bg rounded-lg border dark:border-tokyo-border">
          <div className="text-sm text-gray-600 dark:text-tokyo-comment">Fecha seleccionada</div>
          {isMultipleSelection ? (
            <div className="space-y-1">
              <div className="text-lg font-semibold text-gray-800 dark:text-tokyo-fg">
                {selectedDates.length} días seleccionados
              </div>
              <div className="text-sm text-gray-600 dark:text-tokyo-fgDark max-h-20 overflow-y-auto">
                {selectedDates.map(d => (
                  <div key={formatDate(d)}>
                    {d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-lg font-semibold text-gray-800 dark:text-tokyo-fg">
              {currentDate.toLocaleDateString('es-ES', {
                weekday: window.innerWidth < 640 ? 'short' : 'long',
                year: 'numeric',
                month: window.innerWidth < 640 ? 'short' : 'long',
                day: 'numeric',
              })}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-tokyo-fgDark mb-1 sm:mb-2">
              <DollarSign className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 text-tokyo-yellow" />
              Monto (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="9999"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-tokyo-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-tokyo-cyan focus:border-transparent bg-white dark:bg-tokyo-bg text-gray-800 dark:text-tokyo-fg text-sm sm:text-base"
              placeholder="0.00"
              autoFocus
              required
            />
          </div>

          {/* Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-tokyo-fgDark mb-1 sm:mb-2">
              <CreditCard className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 text-tokyo-purple" />
              Cuenta/Método de pago *
            </label>
            <select
              value={formData.account}
              onChange={(e) => setFormData(prev => ({ ...prev, account: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-tokyo-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-tokyo-cyan focus:border-transparent bg-white dark:bg-tokyo-bg text-gray-800 dark:text-tokyo-fg text-sm sm:text-base"
              required
            >
              {ACCOUNTS.map(account => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div className="p-3 bg-gray-50 dark:bg-tokyo-bg rounded-lg border dark:border-tokyo-border">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPaid}
                onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                className="w-4 h-4 text-blue-600 dark:text-tokyo-cyan rounded focus:ring-blue-500 dark:focus:ring-tokyo-cyan"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-tokyo-fgDark">
                ¿Ya ha sido pagado?
              </span>
            </label>
            <div className="text-xs text-gray-500 dark:text-tokyo-comment mt-1">
              {formData.isPaid ? 'Marcado como pagado' : 'Marcado como pendiente'}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-tokyo-fgDark mb-1 sm:mb-2">
              <FileText className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 text-tokyo-blue" />
              Notas (opcional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-tokyo-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-tokyo-cyan focus:border-transparent bg-white dark:bg-tokyo-bg text-gray-800 dark:text-tokyo-fg text-sm sm:text-base"
              rows={2}
              placeholder="Añade notas sobre este día de trabajo..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1 sm:gap-2 bg-blue-600 dark:bg-tokyo-blue text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-tokyo-blue/80 transition-all duration-200 shadow-lg dark:shadow-tokyo-blue/20 text-sm sm:text-base"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {isMultipleSelection 
                  ? `Guardar ${selectedDates.length} días` 
                  : existingWorkDay ? 'Actualizar' : 'Guardar'
                }
              </span>
              <span className="sm:hidden">
                {isMultipleSelection 
                  ? `+${selectedDates.length}` 
                  : existingWorkDay ? 'Editar' : 'Guardar'
                }
              </span>
            </button>
            
            {existingWorkDay && !isMultipleSelection && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 sm:px-4 py-2 text-red-600 dark:text-tokyo-red border border-red-300 dark:border-tokyo-red/30 rounded-lg hover:bg-red-50 dark:hover:bg-tokyo-red/10 transition-colors text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Eliminar</span>
                <span className="sm:hidden">Del</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
export default WorkDayModal;