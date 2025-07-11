export const formatDate = (date: Date): string => {
  const formatted = date.toISOString().split('T')[0];
  console.log('📅 formatDate - Converting:', date, 'to:', formatted);
  return formatted;
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

export const getDaysInMonth = (year: number, month: number): Date[] => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  // Add empty days for the beginning of the month
  const firstDayOfWeek = firstDay.getDay();
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  for (let i = 0; i < adjustedFirstDay; i++) {
    days.push(new Date(year, month, 1 - adjustedFirstDay + i));
  }
  
  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isSameMonth = (date: Date, referenceDate: Date): boolean => {
  return date.getMonth() === referenceDate.getMonth() && 
         date.getFullYear() === referenceDate.getFullYear();
};