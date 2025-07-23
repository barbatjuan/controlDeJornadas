import React, { useState, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Calendar, User, Euro, Clock } from 'lucide-react';
import { Project, Client, ProjectPhase, ProjectPayment } from '../types';
import { supabase } from '../utils/supabase';
import ConfirmDialog from './ConfirmDialog';

interface ProjectCardProps {
  project: Project;
  client?: Client;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onOpenDetail: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, client, onEdit, onDelete, onOpenDetail }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectData();
  }, [project.id]);

  const loadProjectData = async () => {
    try {
      const [phasesResult, paymentsResult] = await Promise.all([
        supabase
          .from('project_phases')
          .select('*')
          .eq('project_id', project.id)
          .order('order_index'),
        supabase
          .from('project_payments')
          .select('*')
          .eq('project_id', project.id)
          .order('payment_date')
      ]);

      if (phasesResult.error) throw phasesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setPhases(phasesResult.data || []);
      setPayments(paymentsResult.data || []);
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'paused': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'paused': return 'Pausado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const calculateProgress = () => {
    if (phases.length === 0) return 0;
    
    // Calculate weighted progress based on phase percentages
    const completedPercentage = phases
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.percentage || 0), 0);
    
    const totalAssignedPercentage = phases
      .reduce((sum, p) => sum + (p.percentage || 0), 0);
    
    // Use weighted progress if percentages are assigned, otherwise fall back to simple count
    if (totalAssignedPercentage > 0) {
      return Math.round(completedPercentage);
    } else {
      const completedPhases = phases.filter(phase => phase.status === 'completed').length;
      return Math.round((completedPhases / phases.length) * 100);
    }
  };

  const calculatePaidAmount = () => {
    return payments
      .filter(payment => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const progress = calculateProgress();
  const paidAmount = calculatePaidAmount();
  const remainingAmount = project.total_amount - paidAmount;

  return (
    <>
      <div 
        className="bg-tokyo-bg border border-tokyo-border rounded-lg p-6 hover:border-tokyo-blue/50 transition-colors relative cursor-pointer"
        onClick={() => onOpenDetail(project)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-tokyo-fg mb-1 line-clamp-2">
              {project.name}
            </h3>
            {client && (
              <div className="flex items-center gap-1 text-sm text-tokyo-fgDark mb-2">
                <User size={14} />
                {client.name}
              </div>
            )}
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(project.status)}`}>
              {getStatusLabel(project.status)}
            </span>
            
            {/* Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1 hover:bg-tokyo-bgHighlight rounded text-tokyo-fgDark"
              >
                <MoreVertical size={16} />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 bg-tokyo-bg border border-tokyo-border rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(project);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-tokyo-fg hover:bg-tokyo-bgHighlight"
                  >
                    <Edit size={14} />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-tokyo-bgHighlight"
                  >
                    <Trash2 size={14} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="text-sm text-tokyo-fgDark mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-tokyo-fg">Progreso</span>
            <span className="text-sm text-tokyo-fgDark">{progress}%</span>
          </div>
          <div className="w-full bg-tokyo-bgHighlight rounded-full h-2">
            <div
              className="bg-gradient-to-r from-tokyo-blue to-tokyo-cyan h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Phases Summary */}
        {!loading && phases.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-tokyo-fgDark mb-2">
              Fases: {phases.filter(p => p.status === 'completed').length} de {phases.length} completadas
            </div>
            <div className="flex gap-1">
              {phases.map((phase) => (
                <div
                  key={phase.id}
                  className={`h-1 flex-1 rounded ${
                    phase.status === 'completed' 
                      ? 'bg-green-500' 
                      : phase.status === 'in_progress'
                      ? 'bg-yellow-500'
                      : 'bg-tokyo-bgHighlight'
                  }`}
                  title={phase.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Financial Info */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1 text-xs text-tokyo-fgDark mb-1">
              <Euro size={12} />
              Pagado
            </div>
            <div className="text-sm font-medium text-green-400">
              €{paidAmount.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs text-tokyo-fgDark mb-1">
              <Euro size={12} />
              Pendiente
            </div>
            <div className="text-sm font-medium text-yellow-400">
              €{remainingAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="flex justify-between items-center text-xs text-tokyo-fgDark">
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            Inicio: {formatDate(project.start_date)}
          </div>
          {project.deadline && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              Fin: {formatDate(project.deadline)}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Eliminar Proyecto"
        message={`¿Estás seguro de que quieres eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          onDelete(project.id);
          setShowDeleteDialog(false);
        }}
        onClose={() => setShowDeleteDialog(false)}
      />

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </>
  );
};

export default ProjectCard;
