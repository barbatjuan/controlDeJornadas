import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Project, ProjectPhase, ProjectPayment } from '../types';

interface ProjectProgressProps {
  project: Project;
  phases: ProjectPhase[];
  payments: ProjectPayment[];
}

const ProjectProgress: React.FC<ProjectProgressProps> = ({ project, phases, payments }) => {
  // Calculate progress data using weighted percentages
  const completedPhases = phases.filter(p => p.status === 'completed').length;
  const inProgressPhases = phases.filter(p => p.status === 'in_progress').length;
  const pendingPhases = phases.filter(p => p.status === 'pending').length;
  
  // Calculate weighted progress based on phase percentages
  const completedPercentage = phases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.percentage || 0), 0);
  
  const inProgressPercentage = phases
    .filter(p => p.status === 'in_progress')
    .reduce((sum, p) => sum + (p.percentage || 0), 0);
    
  const pendingPercentage = phases
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + (p.percentage || 0), 0);
    
  const totalAssignedPercentage = completedPercentage + inProgressPercentage + pendingPercentage;
  
  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const remaining = project.total_amount - totalPaid - totalPending;

  // Phase progress data for pie chart (using weighted percentages)
  const phaseData = [
    { name: 'Completadas', value: completedPercentage, color: '#10b981', count: completedPhases },
    { name: 'En Progreso', value: inProgressPercentage, color: '#f59e0b', count: inProgressPhases },
    { name: 'Pendientes', value: pendingPercentage, color: '#6b7280', count: pendingPhases }
  ].filter(item => item.value > 0);

  // Financial data for bar chart
  const financialData = [
    { name: 'Pagado', amount: totalPaid, color: '#10b981' },
    { name: 'Pendiente', amount: totalPending, color: '#f59e0b' },
    { name: 'Restante', amount: Math.max(0, remaining), color: '#6b7280' }
  ].filter(item => item.amount > 0);

  // Use weighted progress if percentages are assigned, otherwise fall back to simple count
  const progressPercentage = totalAssignedPercentage > 0 
    ? Math.round(completedPercentage) 
    : phases.length > 0 
      ? Math.round((completedPhases / phases.length) * 100) 
      : 0;
  const paymentPercentage = project.total_amount > 0 ? Math.round((totalPaid / project.total_amount) * 100) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-tokyo-bg border border-tokyo-border rounded-lg p-3 shadow-lg">
          <p className="text-tokyo-fg font-medium">{`${payload[0].payload.name}`}</p>
          <p className="text-tokyo-cyan">
            {`€${payload[0].value.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-tokyo-bg border border-tokyo-border rounded-lg p-3 shadow-lg">
          <p className="text-tokyo-fg font-medium">{payload[0].name}</p>
          <p className="text-tokyo-cyan">
            {`${payload[0].value.toFixed(1)}% del proyecto`}
          </p>
          <p className="text-tokyo-fgDark text-sm">
            {`${data.count} fase${data.count !== 1 ? 's' : ''}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Project Summary */}
      <div className="bg-tokyo-bgDark border border-tokyo-border rounded-lg p-4">
        <h3 className="text-lg font-semibold text-tokyo-fg mb-4">Resumen del Proyecto</h3>
        
        {/* Overall Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-tokyo-fg">Progreso General</span>
            <span className="text-sm text-tokyo-fgDark">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-tokyo-bgHighlight rounded-full h-3">
            <div
              className="bg-gradient-to-r from-tokyo-blue to-tokyo-cyan h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Payment Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-tokyo-fg">Pagos Recibidos</span>
            <span className="text-sm text-tokyo-fgDark">{paymentPercentage}%</span>
          </div>
          <div className="w-full bg-tokyo-bgHighlight rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-green-400 h-3 rounded-full transition-all duration-500"
              style={{ width: `${paymentPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-tokyo-fgDark">Fases Totales</div>
            <div className="text-tokyo-fg font-medium">{phases.length}</div>
          </div>
          <div>
            <div className="text-tokyo-fgDark">Completadas</div>
            <div className="text-green-400 font-medium">{completedPhases}</div>
          </div>
          <div>
            <div className="text-tokyo-fgDark">% Asignado</div>
            <div className="text-tokyo-fg font-medium">{totalAssignedPercentage.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-tokyo-fgDark">% Completado</div>
            <div className="text-green-400 font-medium">{completedPercentage.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-tokyo-fgDark">Monto Total</div>
            <div className="text-tokyo-fg font-medium">€{project.total_amount.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-tokyo-fgDark">Pagado</div>
            <div className="text-green-400 font-medium">€{totalPaid.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Phase Distribution Chart */}
      {phases.length > 0 && (
        <div className="bg-tokyo-bgDark border border-tokyo-border rounded-lg p-4">
          <h4 className="text-md font-semibold text-tokyo-fg mb-4">Distribución de Fases</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phaseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {phaseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center gap-4 mt-2">
            {phaseData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-tokyo-fgDark">
                  {entry.name} ({entry.value.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Breakdown Chart */}
      {financialData.length > 0 && (
        <div className="bg-tokyo-bgDark border border-tokyo-border rounded-lg p-4">
          <h4 className="text-md font-semibold text-tokyo-fg mb-4">Desglose Financiero</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9ca3af"
                  fontSize={12}
                  tickFormatter={(value) => `€${value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="amount" 
                  radius={[4, 4, 0, 0]}
                  fill={(entry) => entry.color}
                >
                  {financialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Timeline Preview */}
      {phases.length > 0 && (
        <div className="bg-tokyo-bgDark border border-tokyo-border rounded-lg p-4">
          <h4 className="text-md font-semibold text-tokyo-fg mb-4">Timeline de Fases</h4>
          <div className="space-y-3">
            {phases.map((phase, index) => (
              <div key={phase.id} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className={`w-4 h-4 rounded-full ${
                    phase.status === 'completed' ? 'bg-green-500' :
                    phase.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-tokyo-fg truncate">
                      {phase.name}
                    </p>
                    <div className="flex items-center gap-2 ml-2">
                      {phase.percentage > 0 && (
                        <span className="text-xs bg-tokyo-blue/20 text-tokyo-blue px-1 py-0.5 rounded">
                          {phase.percentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  {phase.completed_at && (
                    <p className="text-xs text-tokyo-fgDark">
                      Completado: {new Date(phase.completed_at).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectProgress;
