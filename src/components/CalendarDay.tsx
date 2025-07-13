import React from 'react';
import { Check, Clock, Euro, FileText, Layers } from 'lucide-react';
import { WorkDay } from '../types';
import { useWorkData } from '../contexts/WorkDataContext';
import { formatDate } from '../utils/dateUtils';

interface CalendarDayProps {
  date: Date;
  workDays?: WorkDay[]; // Cambiado a array de WorkDays
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected?: boolean;
  isMultiSelectMode?: boolean;
  isLoaded?: boolean;
  onClick: (event: React.MouseEvent) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  workDays = [],
  isCurrentMonth,
  isToday,
  isSelected = false,
  isMultiSelectMode = false,
  isLoaded = true,
  onClick,
}) => {
  // Con el nuevo enfoque, puede haber varios registros por día
  const { getWorkDay, getSecondWorkDay, clients } = useWorkData();
  const dateString = formatDate(date);
  
  // Si no recibimos workDays, intentamos obtenerlos del contexto
  const dayWorkDays = workDays.length > 0 ? workDays : [];
  
  // Determinar si hay múltiples registros para este día
  const hasMultipleEntries = dayWorkDays.length > 1;
  
  // Obtener el registro principal (el que no es second_entry)
  const primaryWorkDay = dayWorkDays.find(day => !day.is_second_entry);
  const getStatusColor = () => {
    // Multi-select mode
    if (isSelected && isMultiSelectMode) {
      return 'bg-blue-200 dark:bg-tokyo-blue/30 border-2 border-blue-500 dark:border-tokyo-blue hover:bg-blue-300 dark:hover:bg-tokyo-blue/40';
    }
    
    // Has work day data
    if (primaryWorkDay && isLoaded) {
      switch (primaryWorkDay.status) {
        case 'paid':
          return 'bg-green-200 dark:bg-tokyo-green/30 border-2 border-green-500 dark:border-tokyo-green hover:bg-green-300 dark:hover:bg-tokyo-green/40';
        case 'invoiced':
          return 'bg-blue-200 dark:bg-tokyo-blue/30 border-2 border-blue-500 dark:border-tokyo-blue hover:bg-blue-300 dark:hover:bg-tokyo-blue/40';
        case 'pending':
        default:
          return 'bg-orange-200 dark:bg-tokyo-orange/30 border-2 border-orange-500 dark:border-tokyo-orange hover:bg-orange-300 dark:hover:bg-tokyo-orange/40';
      }
    }
    
    // Default state
    return 'bg-white dark:bg-tokyo-bg border border-gray-200 dark:border-tokyo-border hover:bg-gray-50 dark:hover:bg-tokyo-bgHighlight';
  };

  const getStatusIcon = () => {
    if (!primaryWorkDay || !isLoaded) return null;
    switch (primaryWorkDay.status) {
      case 'paid':
        return <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-tokyo-green" />;
      case 'invoiced':
        return <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-tokyo-blue" />;
      case 'pending':
      default:
        return <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 dark:text-tokyo-orange" />;
    }
  };

  return (
    <div
      onClick={(e) => onClick(e)}
      className={`
        relative p-1 sm:p-2 min-h-[50px] sm:min-h-[80px] lg:min-h-[100px] rounded-md sm:rounded-lg cursor-pointer transition-all duration-200
        ${getStatusColor()}
        ${isCurrentMonth ? '' : 'opacity-40'}
        ${isToday ? 'ring-2 ring-blue-500 dark:ring-tokyo-cyan animate-glow' : ''}
        ${isSelected && isMultiSelectMode ? 'ring-2 ring-blue-400 dark:ring-tokyo-blue' : ''}
      `}
    >
      {/* Date and Status Icons Row */}
      <div className={`
        flex justify-between items-center mb-1 sm:mb-2
      `}>
        {/* Date */}
        <div className={`
          text-xs sm:text-sm font-semibold
          ${isCurrentMonth ? 'text-gray-800 dark:text-tokyo-fg' : 'text-gray-400 dark:text-tokyo-comment'}
          ${isToday ? 'text-blue-600 dark:text-tokyo-cyan' : ''}
        `}>
          {date.getDate()}
        </div>

        {/* Icons container - aligned to the right */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {/* Status icon */}
          {primaryWorkDay && isLoaded && getStatusIcon()}

          {/* Today indicator */}
          {isToday && (
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 dark:bg-tokyo-cyan rounded-full animate-pulse-slow"></div>
          )}
          
          {/* Multi-select indicator */}
          {isSelected && isMultiSelectMode && (
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 dark:bg-tokyo-blue rounded-full flex items-center justify-center">
              <Check className="w-1 h-1 sm:w-1.5 sm:h-1.5 text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Work day info */}
      {dayWorkDays.length > 0 && isLoaded && (
        <div className="space-y-0.5 sm:space-y-1">
          {/* Badge para indicar que hay trabajos múltiples */}
          {hasMultipleEntries && (
            <div className="absolute top-1 left-1 flex items-center justify-center h-5 w-5 bg-purple-500 text-white rounded-full">
              <Layers className="h-3 w-3" />
            </div>
          )}
          
          {/* Icono especial para trabajos múltiples */}
          {hasMultipleEntries && (
            <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
              <Layers className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                Múltiple
              </span>
            </div>
          )}
          
          {/* Mostrar todos los trabajos */}
          <div className="flex flex-row gap-2 flex-wrap">
            {dayWorkDays.map((workDay, index) => (
              <div key={workDay.id || index} className="flex items-center gap-1">
                <Euro className="w-2 h-2 sm:w-3 sm:h-3 text-orange-500 dark:text-tokyo-orange" />
                <span className="text-xs font-bold text-gray-800 dark:text-tokyo-fg">
                  {workDay.amount.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
          
          {/* Cuenta y notas solo del trabajo principal */}
          {primaryWorkDay && (
            <>
              {/* Cuenta */}
              {primaryWorkDay.account && (
                <div className="text-xs text-gray-700 dark:text-tokyo-fgDark truncate font-medium hidden sm:block">
                  {primaryWorkDay.account}
                </div>
              )}
              
              {/* Notas */}
              {primaryWorkDay.notes && (
                <div className="text-xs text-gray-500 dark:text-tokyo-comment truncate hidden sm:block">
                  {primaryWorkDay.notes}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Work day status indicator - bottom right corner */}
      {dayWorkDays.length > 0 && isLoaded && (
        <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white dark:border-tokyo-bg ${
          // Usar el color del estado para el indicador, o púrpura si tiene trabajos múltiples
          hasMultipleEntries
            ? 'bg-purple-500 dark:bg-tokyo-purple'
            : (primaryWorkDay?.status === 'paid' ? 'bg-green-500 dark:bg-tokyo-green' : primaryWorkDay?.status === 'invoiced' ? 'bg-blue-500 dark:bg-tokyo-blue' : 'bg-orange-500 dark:bg-tokyo-orange')
        }`}></div>
      )}
    </div>
  );
};
export default CalendarDay;
// Force git to recognize changes