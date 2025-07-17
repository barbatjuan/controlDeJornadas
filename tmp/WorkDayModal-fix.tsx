import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, Calendar, DollarSign, CreditCard, FileText, Save, Users } from 'lucide-react';
import { WorkDay } from '../types';
import { useWorkData } from '../contexts/WorkDataContext';
import { formatDate } from '../utils/dateUtils';

interface WorkDayModalProps {
  date: Date | null;
  selectedDates: Date[];
  onClose: () => void;
  isAdditionalPayment?: boolean; // Indica si estamos añadiendo un pago adicional
}

const ACCOUNTS = [
  'Cuenta Principal',
  'Santander',
  'Wise',
  'Cuenta Ahorros',
  'PayPal',
];

type WorkDayStatus = 'pending' | 'invoiced' | 'paid';

type FormData = {
  amount: string;
  status: WorkDayStatus;
  account: string;
  notes: string;
  client_id: string | null;
};

export const WorkDayModal: React.FC<WorkDayModalProps> = ({ date, selectedDates, onClose, isAdditionalPayment = false }) => {
  const { clients, addOrUpdateWorkDays, getWorkDay, removeWorkDay } = useWorkData();
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  
  // Estado del formulario para un pago
  const [formData, setFormData] = useState<FormData>({
    amount: '',
    status: 'pending',
    account: 'Cuenta Principal',
    notes: '',
    client_id: ''
  });

  const currentDate = date || new Date();
  const formattedDate = formatDate(currentDate);
  const existingWorkDay = getWorkDay ? getWorkDay(formattedDate) : undefined;
  const isMultipleSelection = selectedDates.length > 1;

  // Cargar datos existentes
  useEffect(() => {
    if (existingWorkDay) {
      // Si es un pago adicional y existe, cargar los datos del segundo pago
      if (isAdditionalPayment && existingWorkDay.amount2) {
        setFormData({
          amount: existingWorkDay.amount2.toString(),
          status: existingWorkDay.status2 || 'pending',
          account: existingWorkDay.account || 'Cuenta Principal', // Usar la misma cuenta del pago principal
          notes: existingWorkDay.notes || '',
          client_id: existingWorkDay.client_id2 || ''
        });
      } else {
        // Cargar datos del pago principal
        setFormData({
          amount: existingWorkDay.amount.toString(),
          status: existingWorkDay.status || 'pending',
          account: existingWorkDay.account || 'Cuenta Principal',
          notes: existingWorkDay.notes || '',
          client_id: existingWorkDay.client_id || ''
        });
      }
    } else {
      // Valores por defecto
      setFormData({
        amount: '',
        status: 'pending',
        account: 'Cuenta Principal',
        notes: '',
        client_id: ''
      });
    }
  }, [existingWorkDay]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);

    // Validación del pago
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      toast.error('Por favor, ingresa un monto válido.');
      return;
    }
    if (!formData.account) {
      toast.error('Por favor, selecciona una cuenta.');
      return;
    }

    // Preparar los días para guardar
    const daysToSave: WorkDay[] = (isMultipleSelection ? selectedDates : [currentDate]).map(d => {
      const workDay: WorkDay = {
        date: formatDate(d),
        amount: amount,
        status: formData.status,
        account: formData.account,
        notes: formData.notes.trim() || undefined,
        client_id: formData.client_id || null,
      };
      
      // Si es un pago adicional, mantener el primer pago y actualizar solo el segundo
      if (isAdditionalPayment) {
        const existingDay = getWorkDay(formatDate(d));
        if (existingDay) {
          // Mantener el primer pago intacto
          workDay.amount = existingDay.amount;
          workDay.status = existingDay.status;
          workDay.account = existingDay.account;
          workDay.client_id = existingDay.client_id;
          
          // Actualizar solo el segundo pago
          workDay.amount2 = amount;
          workDay.status2 = formData.status;
          workDay.client_id2 = formData.client_id || null;
        }
      }

      return workDay;
    });

    addOrUpdateWorkDays(daysToSave);
    toast.success(isMultipleSelection ? 'Días guardados correctamente' : 'Día guardado correctamente');
    onClose();
  };

  const handleDelete = () => {
    if (!existingWorkDay) return;
    setIsDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    if (isMultipleSelection) return;
    
    const dateStr = formatDate(currentDate);
    
    if (isAdditionalPayment) {
      // Solo eliminar el segundo pago
      const updatedWorkDay: WorkDay = {
        ...existingWorkDay,
        amount2: undefined,
        status2: undefined,
        client_id2: undefined
      };
      addOrUpdateWorkDays([updatedWorkDay]);
    } else {
      // Eliminar día completo
      removeWorkDay(dateStr);
    }
    
    toast.success(isAdditionalPayment ? 'Segundo pago eliminado correctamente' : 'Día eliminado correctamente');
    setIsDeleteConfirmVisible(false);
    onClose();
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
                ? 'Añadir varias jornadas'
                : existingWorkDay
                ? isAdditionalPayment
                  ? 'Añadir segundo pago'
                  : 'Editar jornada'
                : 'Añadir jornada'}
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
          {/* Importe del pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-tokyo-fgDark mb-1 sm:mb-2">
              <DollarSign className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 text-tokyo-blue" />
              {isAdditionalPayment ? 'Importe del segundo pago' : 'Importe'} *
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
              <CreditCard className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 text-tokyo-blue" />
              Cuenta/Método de pago *
            </label>
            <select
              value={formData.account}
              name="account"
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-tokyo-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-tokyo-cyan focus:border-transparent bg-white dark:bg-tokyo-bg text-gray-800 dark:text-tokyo-fg text-sm sm:text-base"
            >
              {ACCOUNTS.map(account => (
                <option key={account} value={account}>{account}</option>
              ))}
            </select>
          </div>

          {/* Cliente primer pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-tokyo-fgDark mb-1 sm:mb-2">
              <Users className="inline w-3 h-3 sm:w-4 sm:h-4 mr-1 text-tokyo-blue" />
              Cliente
            </label>
            <select
              value={formData.client_id || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value || null }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-tokyo-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-tokyo-cyan focus:border-transparent bg-white dark:bg-tokyo-bg text-gray-800 dark:text-tokyo-fg text-sm sm:text-base"
            >
              <option value="">-- Sin Cliente --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {/* Sin sección adicional de segundo pago, ahora todo está en ventanas separadas */}

          {/* Status */}
          <div className="mt-4">
            <label className="block font-semibold text-gray-700 dark:text-tokyo-fgDark mb-2">
              Estado
            </label>
            <div className="flex rounded-lg shadow-sm">
              {(['pending', 'invoiced', 'paid'] as WorkDayStatus[]).map((status, index) => {
                const statusText: { [key in WorkDayStatus]: string } = {
                  pending: 'Pendiente',
                  invoiced: 'Facturado',
                  paid: 'Pagado',
                };
                const baseClasses = 'flex-1 py-2 text-sm font-semibold text-center cursor-pointer transition-colors duration-200';
                const selectedClasses = 'text-white';
                const unselectedClasses = 'bg-gray-200 dark:bg-tokyo-bgHighlight text-gray-700 dark:text-tokyo-fgDark hover:bg-gray-300 dark:hover:bg-tokyo-border';
                const colorClasses: { [key in WorkDayStatus]: string } = {
                  pending: 'bg-orange-500 dark:bg-tokyo-orange',
                  invoiced: 'bg-blue-500 dark:bg-tokyo-blue',
                  paid: 'bg-green-500 dark:bg-tokyo-green',
                };
                const first = index === 0 ? 'rounded-l-lg' : '';
                const last = index === 2 ? 'rounded-r-lg' : '';

                return (
                  <button
                    type="button"
                    key={status}
                    onClick={() => setFormData(prev => ({ ...prev, status }))}
                    className={`${baseClasses} ${first} ${last} ${formData.status === status ? `${selectedClasses} ${colorClasses[status]}` : unselectedClasses}`}
                  >
                    {statusText[status]}
                  </button>
                );
              })}
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
              onChange={(e) =>
                setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
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
                  : existingWorkDay ? 'Actualizar' : 'Guardar'}
              </span>
              <span className="sm:hidden">
                {isMultipleSelection
                  ? `+${selectedDates.length}`
                  : existingWorkDay ? 'Editar' : 'Guardar'}
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

        {/* Delete Confirmation Modal */}
        {isDeleteConfirmVisible && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-xl sm:rounded-2xl z-10">
            <div className="bg-tokyo-bgDark p-6 rounded-lg shadow-xl border border-tokyo-border w-full max-w-sm">
              <h3 className="text-lg font-bold text-tokyo-fg mb-4">¿Confirmar Eliminación?</h3>
              <p className="text-tokyo-fgDark mb-6">Esta acción no se puede deshacer. ¿Estás seguro de que quieres continuar?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsDeleteConfirmVisible(false)}
                  className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg bg-tokyo-red text-white hover:bg-red-700 transition-colors font-semibold"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default WorkDayModal;
