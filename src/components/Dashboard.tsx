import React from 'react';
import { TrendingUp, Calendar, DollarSign, Clock, CreditCard, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useWorkData } from '../hooks/useWorkData';
import { formatDate } from '../utils/dateUtils';

interface DashboardProps {
  currentDate: Date;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentDate }) => {
  const { getMonthStats, workDays, isLoaded } = useWorkData();
  const stats = getMonthStats(currentDate.getFullYear(), currentDate.getMonth());
  
  console.log('📊 Dashboard rendering with stats:', stats);
  console.log('📊 All work days:', workDays);
  
  // Get work days for current month
  const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthWorkDays = workDays
    .filter(w => w.date.startsWith(monthKey))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const paidDays = monthWorkDays.filter(w => w.isPaid);
  const pendingDays = monthWorkDays.filter(w => !w.isPaid);

  // Group by account
  const accountStats = monthWorkDays.reduce((acc, workDay) => {
    if (!acc[workDay.account]) {
      acc[workDay.account] = { total: 0, paid: 0, pending: 0, count: 0 };
    }
    acc[workDay.account].total += workDay.amount;
    acc[workDay.account].count += 1;
    if (workDay.isPaid) {
      acc[workDay.account].paid += workDay.amount;
    } else {
      acc[workDay.account].pending += workDay.amount;
    }
    return acc;
  }, {} as Record<string, { total: number; paid: number; pending: number; count: number }>);

  return (
    <div className="space-y-6">
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="text-center py-4 sm:py-8">
          <div className="text-gray-500 dark:text-tokyo-comment">Cargando datos...</div>
        </div>
      )}
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-tokyo-blue/20 dark:to-tokyo-blue/10 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-blue-200 dark:border-tokyo-blue/30 shadow-lg dark:shadow-tokyo-blue/10">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-blue-600 dark:bg-tokyo-blue rounded-md sm:rounded-lg shadow-lg dark:shadow-tokyo-blue/20">
              <TrendingUp className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-tokyo-cyan bg-blue-200 dark:bg-tokyo-blue/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              TOTAL
            </span>
          </div>
          <div className="text-lg sm:text-3xl font-bold text-blue-700 dark:text-tokyo-cyan mb-1">
            €{stats.totalAmount.toFixed(2)}
          </div>
          <div className="text-xs sm:text-sm text-blue-600 dark:text-tokyo-blue">
            <span className="hidden sm:inline">{stats.totalDays} días trabajados</span>
            <span className="sm:hidden">{stats.totalDays} días</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-tokyo-green/20 dark:to-tokyo-green/10 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-green-200 dark:border-tokyo-green/30 shadow-lg dark:shadow-tokyo-green/10">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-green-600 dark:bg-tokyo-green rounded-md sm:rounded-lg shadow-lg dark:shadow-tokyo-green/20">
              <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-tokyo-green bg-green-200 dark:bg-tokyo-green/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              PAGADO
            </span>
          </div>
          <div className="text-lg sm:text-3xl font-bold text-green-700 dark:text-tokyo-green mb-1">
            €{stats.paidAmount.toFixed(2)}
          </div>
          <div className="text-xs sm:text-sm text-green-600 dark:text-tokyo-green/80">
            {stats.paidDays} días ({stats.totalDays > 0 ? ((stats.paidDays / stats.totalDays) * 100).toFixed(1) : 0}%)
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-tokyo-orange/20 dark:to-tokyo-orange/10 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-orange-200 dark:border-tokyo-orange/30 shadow-lg dark:shadow-tokyo-orange/10">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-orange-600 dark:bg-tokyo-orange rounded-md sm:rounded-lg shadow-lg dark:shadow-tokyo-orange/20">
              <AlertCircle className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-orange-600 dark:text-tokyo-orange bg-orange-200 dark:bg-tokyo-orange/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              PENDIENTE
            </span>
          </div>
          <div className="text-lg sm:text-3xl font-bold text-orange-700 dark:text-tokyo-orange mb-1">
            €{stats.pendingAmount.toFixed(2)}
          </div>
          <div className="text-xs sm:text-sm text-orange-600 dark:text-tokyo-orange/80">
            {stats.pendingDays} días ({stats.totalDays > 0 ? ((stats.pendingDays / stats.totalDays) * 100).toFixed(1) : 0}%)
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-tokyo-purple/20 dark:to-tokyo-purple/10 p-3 sm:p-6 rounded-lg sm:rounded-xl border border-purple-200 dark:border-tokyo-purple/30 shadow-lg dark:shadow-tokyo-purple/10">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-purple-600 dark:bg-tokyo-purple rounded-md sm:rounded-lg shadow-lg dark:shadow-tokyo-purple/20">
              <Calendar className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-purple-600 dark:text-tokyo-purple bg-purple-200 dark:bg-tokyo-purple/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              PROMEDIO
            </span>
          </div>
          <div className="text-lg sm:text-3xl font-bold text-purple-700 dark:text-tokyo-purple mb-1">
            €{stats.totalDays > 0 ? (stats.totalAmount / stats.totalDays).toFixed(2) : '0.00'}
          </div>
          <div className="text-xs sm:text-sm text-purple-600 dark:text-tokyo-purple/80">
            <span className="hidden sm:inline">por día trabajado</span>
            <span className="sm:hidden">por día</span>
          </div>
        </div>
      </div>

      {/* Account Breakdown */}
      {Object.keys(accountStats).length > 0 && (
        <div className="bg-white dark:bg-tokyo-bgDark p-3 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-tokyo-border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-tokyo-fg mb-3 sm:mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-tokyo-cyan" />
            Desglose por Cuenta
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(accountStats).map(([account, data]) => (
              <div key={account} className="p-3 sm:p-4 bg-gray-50 dark:bg-tokyo-bg rounded-lg border dark:border-tokyo-border">
                <div className="font-medium text-gray-800 dark:text-tokyo-fg mb-2 text-sm sm:text-base">{account}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-tokyo-fgDark">Total:</span>
                    <span className="font-medium text-gray-800 dark:text-tokyo-fg">€{data.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-tokyo-green">Pagado:</span>
                    <span className="font-medium text-green-700 dark:text-tokyo-green">€{data.paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600 dark:text-tokyo-orange">Pendiente:</span>
                    <span className="font-medium text-orange-700 dark:text-tokyo-orange">€{data.pending.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t dark:border-tokyo-border">
                    <span className="text-gray-600 dark:text-tokyo-fgDark">Días:</span>
                    <span className="font-medium text-gray-800 dark:text-tokyo-fg">{data.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Work Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Paid Days */}
        <div className="bg-white dark:bg-tokyo-bgDark p-3 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-tokyo-border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-tokyo-fg mb-3 sm:mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-tokyo-green" />
            Días Pagados ({paidDays.length})
          </h3>
          <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
            {paidDays.length === 0 ? (
              <p className="text-gray-500 dark:text-tokyo-comment text-center py-2 sm:py-4 text-sm">No hay días pagados este mes</p>
            ) : (
              paidDays.map((workDay) => (
                <div key={workDay.date} className="flex items-center justify-between p-2 sm:p-3 bg-green-50 dark:bg-tokyo-green/10 rounded-lg border border-green-200 dark:border-tokyo-green/30">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-tokyo-fg text-sm sm:text-base">
                      {new Date(workDay.date).toLocaleDateString('es-ES', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-tokyo-fgDark">{workDay.account}</div>
                    {workDay.notes && (
                      <div className="text-xs text-gray-500 dark:text-tokyo-comment mt-1 hidden sm:block">{workDay.notes}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-700 dark:text-tokyo-green text-sm sm:text-base">€{workDay.amount.toFixed(2)}</div>
                    <div className="text-xs text-green-600 dark:text-tokyo-green/80">Pagado</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Days */}
        <div className="bg-white dark:bg-tokyo-bgDark p-3 sm:p-6 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-tokyo-border">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-tokyo-fg mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-tokyo-orange" />
            Días Pendientes ({pendingDays.length})
          </h3>
          <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
            {pendingDays.length === 0 ? (
              <p className="text-gray-500 dark:text-tokyo-comment text-center py-2 sm:py-4 text-sm">No hay días pendientes este mes</p>
            ) : (
              pendingDays.map((workDay) => (
                <div key={workDay.date} className="flex items-center justify-between p-2 sm:p-3 bg-orange-50 dark:bg-tokyo-orange/10 rounded-lg border border-orange-200 dark:border-tokyo-orange/30">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-tokyo-fg text-sm sm:text-base">
                      {new Date(workDay.date).toLocaleDateString('es-ES', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-tokyo-fgDark">{workDay.account}</div>
                    {workDay.notes && (
                      <div className="text-xs text-gray-500 dark:text-tokyo-comment mt-1 hidden sm:block">{workDay.notes}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-orange-700 dark:text-tokyo-orange text-sm sm:text-base">€{workDay.amount.toFixed(2)}</div>
                    <div className="text-xs text-orange-600 dark:text-tokyo-orange/80">Pendiente</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;