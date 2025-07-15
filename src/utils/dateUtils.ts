export const formatDate = (date: Date): string => {
  // Create a new date in UTC using the local date's components to avoid timezone shifts.
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // Using UTC date functions to prevent the local timezone from affecting the output.
  const utcDate = new Date(Date.UTC(year, month, day));
  
  const formattedDate = utcDate.toISOString().split('T')[0];
  console.log(`📅 formatDate - Converting: ${date} to: ${formattedDate}`);
  return formattedDate;
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

export const getDaysInMonth = (year: number, month: number) => {
  const days: Date[] = [];
  const date = new Date(Date.UTC(year, month, 1));
  
  // Find the first day of the month (0 for Sunday, 1 for Monday, etc.)
  const firstDayOfWeek = date.getUTCDay();
  // Adjust to make Monday the first day of the week (0 for Monday, 6 for Sunday)
  const startOffset = (firstDayOfWeek === 0) ? 6 : firstDayOfWeek - 1;

  // Add days from the previous month
  for (let i = 0; i < startOffset; i++) {
    days.push(new Date(Date.UTC(year, month, 1 - startOffset + i)));
  }

  // Add all days from the current month
  while (date.getUTCMonth() === month) {
    days.push(new Date(date));
    date.setUTCDate(date.getUTCDate() + 1);
  }

  // Add days from the next month to fill the grid (usually 42 cells for 6 weeks)
  while (days.length < 42) {
    days.push(new Date(date));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  
  // Ensure we don't have more than 42 days if a month fits perfectly in 5 weeks
  return days.slice(0, 42);
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isSameMonth = (date: Date, referenceDate: Date): boolean => {
  return date.getMonth() === referenceDate.getMonth() && 
         date.getFullYear() === referenceDate.getFullYear();
};

/**
 * Genera un array de fechas entre dos fechas dadas (inclusivas)
 */
export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  
  // Asegurarse que startDate sea anterior a endDate
  let start = new Date(Math.min(startDate.getTime(), endDate.getTime()));
  const end = new Date(Math.max(startDate.getTime(), endDate.getTime()));
  
  // Clonar la fecha de inicio para no modificar la original
  const current = new Date(start);
  
  // Añadir cada fecha al array hasta llegar a la fecha final
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};