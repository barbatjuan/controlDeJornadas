import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react';
import CalendarDay from './CalendarDay';
import WorkDayModal from './WorkDayModal';
import { useWorkData } from '../hooks/useWorkData';

import { formatDate } from '../utils/dateUtils';
import { getDaysInMonth, isToday, isSameMonth } from '../utils/dateUtils';

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  
  const { workDays, isLoaded, getMonthStats } = useWorkData();

  // Stats Calculation
  const currentMonthStats = getMonthStats(currentDate.getFullYear(), currentDate.getMonth());

  const prevMonthDate = new Date(currentDate);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthStats = getMonthStats(prevMonthDate.getFullYear(), prevMonthDate.getMonth());

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

  const handleDayClick = (date: Date) => {
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
    } else {
      setSelectedDate(date);
      setIsModalOpen(true);
    }
  };

  const handleAddMultipleDays = () => {
    console.log('🎯 Calendar - handleAddMultipleDays called with:', selectedDates.length, 'dates');
    console.log('📋 Calendar - Selected dates:', selectedDates.map(d => formatDate(d)));
    if (selectedDates.length > 0) {
      setSelectedDate(null); // No necesitamos selectedDate para múltiples
      setIsModalOpen(true);
      console.log('🔓 Calendar - Opening modal for multiple selection');
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
    
    console.log('✅ Calendar - State cleaned up');
  };


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
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-tokyo-green text-white rounded-lg hover:bg-tokyo-green/90 transition-colors text-xs sm:text-sm lg:text-base"
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
            value={`€${currentMonthStats.totalAmount.toFixed(2)}`} 
            colorClass="text-tokyo-green"
          />
          <StatsCard 
            title="Pendiente" 
            value={`€${currentMonthStats.pendingAmount.toFixed(2)}`} 
            colorClass="text-tokyo-orange"
          />
          <StatsCard 
            title="Facturado" 
            value={`€${currentMonthStats.invoicedAmount.toFixed(2)}`} 
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
            const workDay = workDays.find(w => w.date === dateString);
            const isTodayDate = isToday(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isSelected = selectedDates.some(d => formatDate(d) === dateString);
            
            return (
              <CalendarDay
                key={index}
                date={date}
                workDay={workDay}
                isCurrentMonth={isCurrentMonth}
                isToday={isTodayDate}
                isSelected={isSelected}
                isMultiSelectMode={isMultiSelectMode}
                isLoaded={isLoaded}
                onClick={() => handleDayClick(date)}
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
        />
      )}
    </div>
  );
};

export default Calendar;