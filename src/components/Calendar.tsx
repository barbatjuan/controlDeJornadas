import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar as CalendarIcon,
  PlusCircle,
  Plus,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import CalendarDay from './CalendarDay';
import { WorkDay } from '../types';
import WorkDayModal from './WorkDayModal';
import { useWorkData } from '../contexts/WorkDataContext';
import { formatDate, getDaysInMonth, isToday, isSameMonth } from '../utils/dateUtils';
import WorkDayContextMenu from './WorkDayContextMenu';
import ClientsModal from './ClientsModal';
import StatsCard from './StatsCard';
import { toast } from 'sonner';
import ConfirmDialog from './ConfirmDialog';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [firstSelectedDate, setFirstSelectedDate] = useState<Date | null>(null);
  
  // Estado para el menú contextual
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    date: Date | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, date: null });
  
  const [isAdditionalPayment, setIsAdditionalPayment] = useState(false);
  
  // Estado para el diálogo de confirmación de eliminación
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    dateStr: "",
    isSecondPayment: false,
    title: "",
    message: ""
  });
  
  const { 
    workDays, 
    isLoaded, 
    getMonthStats, 
    getTotalInvoiced, 
    getTotalPending, 
    getWorkDay, 
    removeWorkDay 
  } = useWorkData();

  // Stats Calculation
  const currentMonthStats = getMonthStats(currentDate.getFullYear(), currentDate.getMonth());

  const prevMonthDate = new Date(currentDate);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthStats = getMonthStats(prevMonthDate.getFullYear(), prevMonthDate.getMonth());
  
  // Utilizamos los valores del getMonthStats para mayor consistencia
  // Así mostramos solo los valores del mes actual, no de toda la historia
  const [totalMonthAmount, setTotalMonthAmount] = useState(currentMonthStats.totalAmount);
  const [totalInvoicedAmount, setTotalInvoicedAmount] = useState(currentMonthStats.invoicedAmount);
  const [totalPendingAmount, setTotalPendingAmount] = useState(currentMonthStats.pendingAmount);
  const [totalPaidAmount, setTotalPaidAmount] = useState(currentMonthStats.paidAmount);

  // Actualizamos los valores cuando cambia el mes o se cargan nuevos datos
  useEffect(() => {
    if (isLoaded) {
      const monthStats = getMonthStats(currentDate.getFullYear(), currentDate.getMonth());
      setTotalMonthAmount(monthStats.totalAmount);
      setTotalInvoicedAmount(monthStats.invoicedAmount);
      setTotalPendingAmount(monthStats.pendingAmount);
      setTotalPaidAmount(monthStats.paidAmount);
    }
  }, [currentDate, isLoaded, workDays, getMonthStats]);

  const StatsCard = ({ title, value, colorClass = 'text-tokyo-blue' }: { title: string, value: string, colorClass?: string }) => (
    <div className="bg-white dark:bg-tokyo-bgHighlight p-4 rounded-lg shadow-md text-center">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-tokyo-fgDark">{title}</h3>
      <p className={`text-2xl font-bold mt-1 ${colorClass}`}>{value}</p>
    </div>
  );

  const calendarDays = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const dayNamesShort = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleDayClick = (date: Date, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Si estamos en modo multi-selección, manejarlo
    if (isMultiSelectMode) {
      setSelectedDates(prev => {
        const dateString = date.toDateString();
        const isAlreadySelected = prev.some(d => d.toDateString() === dateString);
        
        if (isAlreadySelected) {
          return prev.filter(d => d.toDateString() !== dateString);
        } else {
          return [...prev, date];
        }
      });
      return;
    }

    const dateStr = formatDate(date);
    // Verificar primero si la función getWorkDay está disponible
    if (typeof getWorkDay === 'function') {
      const existingWorkDays = getWorkDay(dateStr);
      
      // Si hay un pago existente, mostramos el menú contextual
      if (existingWorkDays) {
        setContextMenu({
          isOpen: true,
          position: { x: event.clientX, y: event.clientY },
          date: date
        });
        return;
      }
    } else {
      // Si getWorkDay no está disponible, buscamos directamente en la lista de días de trabajo
      const existingWorkDay = workDays.find(w => w.date === dateStr);
      if (existingWorkDay) {
        setContextMenu({
          isOpen: true,
          position: { x: event.clientX, y: event.clientY },
          date: date
        });
        return;
      }
    }

    // Si no hay pago, abrimos el modal directamente
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleEditWorkDay = (isSecondPayment = false) => {
    if (contextMenu.date) {
      setSelectedDate(contextMenu.date);
      setIsAdditionalPayment(isSecondPayment);
      setIsModalOpen(true);
      // Cerrar el menú contextual
      setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, date: null });
    }
  };
  
  const handleAddSecondPayment = () => {
    if (contextMenu.date) {
      setSelectedDate(contextMenu.date);
      setIsAdditionalPayment(true);
      setIsModalOpen(true);
      // Cerrar el menú contextual
      setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, date: null });
    }
  };
  
  const handleDeleteWorkDay = (isSecondPayment = false) => {
    console.log('🗑️ Calendar - handleDeleteWorkDay called with isSecondPayment:', isSecondPayment);
    
    if (contextMenu.date) {
      const dateStr = formatDate(contextMenu.date);
      console.log('🗑️ Calendar - dateStr:', dateStr);
      
      // Verificar si getWorkDay está disponible
      let existingWorkDays;
      
      if (typeof getWorkDay === 'function') {
        existingWorkDays = getWorkDay(dateStr);
        console.log('🗑️ Calendar - existingWorkDays from getWorkDay:', existingWorkDays);
      } else {
        // Buscar directamente en workDays
        existingWorkDays = workDays.filter(w => w.date === dateStr);
        console.log('🗑️ Calendar - existingWorkDays from workDays:', existingWorkDays);
      }
      
      if (isSecondPayment) {
        // Eliminar solo el segundo pago
        console.log('🗑️ Calendar - Intentando eliminar solo el segundo pago');
        
        // Configurar el diálogo de confirmación para eliminar el segundo pago
        setDeleteConfirm({
          isOpen: true,
          dateStr: dateStr,
          isSecondPayment: true,
          title: "Confirmar Eliminación",
          message: `¿Eliminar el segundo pago para ${formatDate(contextMenu.date, true)}?`
        });
      } else {
        // Eliminar el día completo o el pago principal
        const confirmMessage = existingWorkDays.length > 1
          ? `¿Eliminar todos los pagos para ${formatDate(contextMenu.date, true)}?`
          : `¿Eliminar pago para ${formatDate(contextMenu.date, true)}?`;
        
        console.log('🗑️ Calendar - Intentando eliminar día completo, mensaje:', confirmMessage);
        
        // Configurar el diálogo de confirmación para eliminar el día completo
        setDeleteConfirm({
          isOpen: true,
          dateStr: dateStr,
          isSecondPayment: false,
          title: "Confirmar Eliminación",
          message: confirmMessage
        });
      }
      
      // Cerrar el menú contextual
      setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, date: null });
    }
  };
  
  // Función para confirmar la eliminación
  const confirmDeleteAction = () => {
    if (typeof removeWorkDay === 'function') {
      console.log('🗑️ Calendar - Llamando a removeWorkDay con isSecondPayment:', deleteConfirm.isSecondPayment);
      removeWorkDay(deleteConfirm.dateStr, deleteConfirm.isSecondPayment);
      toast.success(deleteConfirm.isSecondPayment ? 'Segundo pago eliminado correctamente' : 'Pago eliminado correctamente');
    } else {
      console.error('❌ Calendar - removeWorkDay no es una función');
      toast.error('Error al eliminar el pago');
    }
    
    // Cerrar el diálogo de confirmación
    setDeleteConfirm({
      isOpen: false,
      dateStr: "",
      isSecondPayment: false,
      title: "",
      message: ""
    });
  };
  
  // Función para cancelar la eliminación
  const cancelDeleteAction = () => {
    setDeleteConfirm({
      isOpen: false,
      dateStr: "",
      isSecondPayment: false,
      title: "",
      message: ""
    });
  };

  const handleAddMultipleDays = () => {
    console.log('🎯 Calendar - handleAddMultipleDays called with:', selectedDates.length, 'dates');
    console.log('📋 Calendar - Selected dates:', selectedDates.map(d => formatDate(d)));
    if (selectedDates.length > 0) {
      // Abrir modal para añadir múltiples días
      setIsModalOpen(true);
      // Resetear el indicador de pago adicional al añadir múltiples días
      setIsAdditionalPayment(false);
    }
  };

  const handleCloseModal = () => {
    console.log('🔒 Calendar - Closing modal and cleaning up state');
    console.log('🧹 Calendar - Clearing', selectedDates.length, 'selected dates');
    console.log('🔄 Calendar - Disabling multi-select mode:', isMultiSelectMode);
    
    setSelectedDates([]);
    setIsMultiSelectMode(false);
    setIsModalOpen(false);
    setSelectedDate(null);
    // Resetear el indicador de pago adicional
    setIsAdditionalPayment(false);
    // Si estaba en modo contextMenu, limpiar el estado
    if (contextMenu.isOpen) {
      setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, date: null });
    }
    console.log('✅ Calendar - State cleaned up');
  };

  const daysInMonth = useMemo(() => {
    const workDaysMap: { [key: string]: WorkDay[] } = {};
    
    // Agrupar todos los registros por fecha
    workDays.forEach(day => {
      if (!workDaysMap[day.date]) {
        workDaysMap[day.date] = [];
      }
      workDaysMap[day.date].push(day);
    });
    
    return workDaysMap;
  }, [workDays]);

  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4 lg:p-6">
      

      {/* Calendar Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1.5 sm:p-2 rounded-lg bg-tokyo-purple/10 hover:bg-tokyo-purple/20 text-tokyo-purple transition-colors"
          >
            <ChevronLeft size={16} />
          </button>      
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-tokyo-fg min-w-[120px] sm:min-w-[140px] lg:min-w-[180px] text-center">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-1.5 sm:p-2 rounded-lg bg-tokyo-purple/10 hover:bg-tokyo-purple/20 text-tokyo-purple transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setSelectedDate(new Date());
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-tokyo-green text-tokyo-bgDark font-bold rounded-lg hover:bg-tokyo-green/90 transition-colors text-xs sm:text-sm lg:text-base"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Añadir Día</span>
            <span className="sm:hidden">Añadir</span>
          </button>
          
          <button
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              setSelectedDates([]);
            }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm lg:text-base ${
              isMultiSelectMode
                ? 'bg-tokyo-orange text-white'
                : 'bg-tokyo-cyan/10 text-tokyo-cyan hover:bg-tokyo-cyan/20'
            }`}
          >
            <Users size={14} />
            <span className="hidden sm:inline">Selección múltiple</span>
            <span className="sm:hidden">Multi</span>
          </button>

          {isMultiSelectMode && selectedDates.length > 0 && (
            <button
              onClick={handleAddMultipleDays}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-tokyo-blue text-white rounded-lg hover:bg-tokyo-blue/90 transition-colors text-xs sm:text-sm lg:text-base"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Añadir {selectedDates.length} días</span>
              <span className="sm:hidden">+{selectedDates.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-tokyo-bg p-4 sm:p-6 rounded-2xl shadow-lg">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatsCard 
            title="Total Mes Actual" 
            value={`€${totalMonthAmount.toFixed(2)}`} 
            colorClass="text-tokyo-green"
          />
          <StatsCard 
            title="Por Facturar" 
            value={`€${totalPendingAmount.toFixed(2)}`} 
            colorClass="text-tokyo-orange"
          />
          <StatsCard 
            title="Pagado" 
            value={`€${totalPaidAmount.toFixed(2)}`} 
            colorClass="text-tokyo-blue"
          />
          <StatsCard 
            title="Total Mes Anterior" 
            value={`€${prevMonthStats.totalAmount.toFixed(2)}`} 
            colorClass="text-tokyo-fgDark"
          />
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-4">
          {dayNames.map((day, index) => (
            <div key={day} className="text-center font-medium text-gray-500 dark:text-tokyo-comment py-1 sm:py-2">
              <span className="hidden sm:inline text-xs sm:text-sm">{day}</span>
              <span className="sm:hidden text-xs">{dayNamesShort[index]}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarDays.map((date, index) => {
            const dateString = formatDate(date);
            const workDays = daysInMonth[dateString] || [];
            const isTodayDate = isToday(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isSelected = selectedDates.some(d => formatDate(d) === dateString);
            
            return (
              <CalendarDay
                key={index}
                date={date}
                workDays={workDays} /* Pasamos la lista completa de trabajos para este día */
                isCurrentMonth={isCurrentMonth}
                isToday={isTodayDate}
                isSelected={isSelected}
                isMultiSelectMode={isMultiSelectMode}
                isLoaded={isLoaded}
                onClick={(e) => handleDayClick(date, e)}
              />
            );
          })}
        </div>
      </div>

      {/* Work Day Modal */}
      {isModalOpen && (
        <WorkDayModal
          date={selectedDate}
          selectedDates={selectedDates}
          onClose={handleCloseModal}
          isAdditionalPayment={isAdditionalPayment}
        />
      )}
      
      {/* Context Menu */}
      {contextMenu.isOpen && contextMenu.date && (
        <WorkDayContextMenu
          position={contextMenu.position}
          date={contextMenu.date}
          onEdit={handleEditWorkDay}
          onAddSecondPayment={handleAddSecondPayment}
          onDelete={handleDeleteWorkDay}
          onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, date: null })}
        />
      )}
      
      {/* Diálogo de confirmación para eliminar pagos */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={cancelDeleteAction}
        onConfirm={confirmDeleteAction}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default Calendar;