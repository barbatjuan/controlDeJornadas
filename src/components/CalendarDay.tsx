import React from 'react';
import { Check, Clock, DollarSign } from 'lucide-react';
import { WorkDay } from '../types';

interface CalendarDayProps {
  date: Date;
  workDay?: WorkDay;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected?: boolean;
  isMultiSelectMode?: boolean;
  isLoaded?: boolean;
  onClick: () => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({
  date,
  workDay,
  isCurrentMonth,
  isToday,
  isSelected = false,
  isMultiSelectMode = false,
  isLoaded = true,
  onClick,
}) => {
  const getStatusColor = () => {
    // Multi-select mode
    if (isSelected && isMultiSelectMode) {
      return 'bg-blue-200 dark:bg-tokyo-blue/30 border-2 border-blue-500 dark:border-tokyo-blue hover:bg-blue-300 dark:hover:bg-tokyo-blue/40';
    }
    
    // Has work day data
    if (workDay && isLoaded) {
      if (workDay.isPaid) {
        return 'bg-green-200 dark:bg-tokyo-green/30 border-2 border-green-500 dark:border-tokyo-green hover:bg-green-300 dark:hover:bg-tokyo-green/40';
      } else {
        return 'bg-orange-200 dark:bg-tokyo-orange/30 border-2 border-orange-500 dark:border-tokyo-orange hover:bg-orange-300 dark:hover:bg-tokyo-orange/40';
      }
    }
    
    // Default state
    return 'bg-white dark:bg-tokyo-bg border border-gray-200 dark:border-tokyo-border hover:bg-gray-50 dark:hover:bg-tokyo-bgHighlight';
  };

  const getStatusIcon = () => {
    if (!workDay || !isLoaded) return null;
    return workDay.isPaid ? (
      <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-tokyo-green" />
    ) : (
      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 dark:text-tokyo-orange" />
    );
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative p-1 sm:p-2 min-h-[50px] sm:min-h-[80px] lg:min-h-[100px] rounded-md sm:rounded-lg cursor-pointer transition-all duration-200
        ${getStatusColor()}
        ${isCurrentMonth ? '' : 'opacity-40'}
        ${isToday ? 'ring-2 ring-blue-500 dark:ring-tokyo-cyan animate-glow' : ''}
        ${isSelected && isMultiSelectMode ? 'ring-2 ring-blue-400 dark:ring-tokyo-blue' : ''}
      `}
    >
      {/* Date */}
      <div className={`
        text-xs sm:text-sm font-semibold mb-1 sm:mb-2
        ${isCurrentMonth ? 'text-gray-800 dark:text-tokyo-fg' : 'text-gray-400 dark:text-tokyo-comment'}
        ${isToday ? 'text-blue-600 dark:text-tokyo-cyan' : ''}
      `}>
        {date.getDate()}
      </div>

      {/* Work day info */}
      {workDay && isLoaded && (
        <div className="space-y-0.5 sm:space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <DollarSign className="w-2 h-2 sm:w-3 sm:h-3 text-gray-700 dark:text-tokyo-yellow" />
              <span className="text-xs font-bold text-gray-800 dark:text-tokyo-fg">
                €{workDay.amount.toFixed(0)}
              </span>
            </div>
            {getStatusIcon()}
          </div>
          
          {workDay.account && (
            <div className="text-xs text-gray-700 dark:text-tokyo-fgDark truncate font-medium hidden sm:block">
              {workDay.account}
            </div>
          )}
          
          {workDay.notes && (
            <div className="text-xs text-gray-500 dark:text-tokyo-comment truncate hidden sm:block">
              {workDay.notes}
            </div>
          )}
        </div>
      )}

      {/* Today indicator */}
      {isToday && (
        <div className="absolute top-1 right-1 sm:top-2 sm:right-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 dark:bg-tokyo-cyan rounded-full animate-pulse-slow"></div>
      )}

      {/* Multi-select indicator */}
      {isSelected && isMultiSelectMode && (
        <div className="absolute top-0.5 left-0.5 sm:top-1 sm:left-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 dark:bg-tokyo-blue rounded-full flex items-center justify-center">
          <Check className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
        </div>
      )}

      {/* Work day status indicator - bottom right corner */}
      {workDay && isLoaded && (
        <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white dark:border-tokyo-bg ${
          workDay.isPaid ? 'bg-green-500 dark:bg-tokyo-green' : 'bg-orange-500 dark:bg-tokyo-orange'
        }`}></div>
      )}
    </div>
  );
};
export default CalendarDay;
// Force git to recognize changes