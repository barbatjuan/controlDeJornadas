import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Check, Play, Pause, Euro, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { Project, Client, ProjectPhase, ProjectPayment, PhaseStatus } from '../types';
import { supabase } from '../utils/supabase';
import ConfirmDialog from './ConfirmDialog';
import ProjectProgress from './ProjectProgress';

interface ProjectDetailProps {
  project: Project;
  client?: Client;
  onClose: () => void;
  onProjectUpdate: (project: Project) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, client, onClose, onProjectUpdate }) => {
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [payments, setPayments] = useState<ProjectPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'phase' | 'payment'; id: string } | null>(null);
  
  const [newPhase, setNewPhase] = useState({
    name: '',
    description: '',
    percentage: 0
  });
  
  const [newPayment, setNewPayment] = useState({
    phase_id: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    status: 'pending' as const,
    notes: ''
  });

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
          .order('payment_date', { ascending: false })
      ]);

      if (phasesResult.error) throw phasesResult.error;
      if (paymentsResult.error) throw paymentsResult.error;

      setPhases(phasesResult.data || []);
      setPayments(paymentsResult.data || []);
    } catch (error) {
      console.error('Error loading project data:', error);
      toast.error('Error al cargar los datos del proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhase = async () => {
    if (!newPhase.name.trim()) {
      toast.error('El nombre de la fase es obligatorio');
      return;
    }

    try {
      const maxOrder = Math.max(...phases.map(p => p.order_index), 0);
      
      const { data, error } = await supabase
        .from('project_phases')
        .insert([{
          project_id: project.id,
          name: newPhase.name,
          description: newPhase.description || null,
          order_index: maxOrder + 1,
          percentage: newPhase.percentage || 0,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      setPhases([...phases, data]);
      setNewPhase({ name: '', description: '', percentage: 0 });
      setShowPhaseForm(false);
      toast.success('Fase agregada correctamente');
    } catch (error) {
      console.error('Error adding phase:', error);
      toast.error('Error al agregar la fase');
    }
  };

  const handleUpdatePhaseStatus = async (phaseId: string, newStatus: PhaseStatus) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (newStatus === 'pending') {
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from('project_phases')
        .update(updateData)
        .eq('id', phaseId)
        .select()
        .single();

      if (error) throw error;

      setPhases(phases.map(p => p.id === phaseId ? data : p));
      toast.success('Estado de la fase actualizado');
    } catch (error) {
      console.error('Error updating phase status:', error);
      toast.error('Error al actualizar el estado de la fase');
    }
  };

  const handleDeletePhase = async (phaseId: string) => {
    try {
      const { error } = await supabase
        .from('project_phases')
        .delete()
        .eq('id', phaseId);

      if (error) throw error;

      setPhases(phases.filter(p => p.id !== phaseId));
      toast.success('Fase eliminada correctamente');
    } catch (error: any) {
      console.error('Error deleting phase:', error);
      toast.error(`Error al eliminar la fase: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleAddPayment = async () => {
    if (newPayment.amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('project_payments')
        .insert([{
          project_id: project.id,
          phase_id: newPayment.phase_id || null,
          amount: newPayment.amount,
          payment_date: newPayment.payment_date,
          status: newPayment.status,
          notes: newPayment.notes || null
        }])
        .select()
        .single();

      if (error) throw error;

      setPayments([data, ...payments]);
      setNewPayment({
        phase_id: '',
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: ''
      });
      setShowPaymentForm(false);
      toast.success('Pago agregado correctamente');
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Error al agregar el pago');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('project_payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;

      setPayments(payments.filter(p => p.id !== paymentId));
      toast.success('Pago eliminado correctamente');
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast.error(`Error al eliminar el pago: ${error.message || 'Error desconocido'}`);
    }
  };

  const getPhaseStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case 'completed': return <Check className="text-green-400" size={16} />;
      case 'in_progress': return <Play className="text-yellow-400" size={16} />;
      case 'pending': return <Pause className="text-gray-400" size={16} />;
    }
  };

  const getPhaseStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tokyo-blue"></div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-tokyo-bg border border-tokyo-border rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start p-6 border-b border-tokyo-border">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-tokyo-fg mb-2">{project.name}</h2>
              {client && (
                <div className="flex items-center gap-2 text-tokyo-fgDark mb-2">
                  <User size={16} />
                  {client.name}
                </div>
              )}
              {project.description && (
                <p className="text-tokyo-fgDark">{project.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-tokyo-fgDark hover:text-tokyo-fg transition-colors ml-4"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Progress Chart */}
            <div className="lg:col-span-1">
              <ProjectProgress project={project} phases={phases} payments={payments} />
            </div>

            {/* Phases Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Phases */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-tokyo-fg">Fases del Proyecto</h3>
                  <button
                    onClick={() => setShowPhaseForm(true)}
                    className="flex items-center gap-2 bg-tokyo-blue hover:bg-tokyo-blue/80 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    <Plus size={16} />
                    Agregar Fase
                  </button>
                </div>

                {/* Add Phase Form */}
                {showPhaseForm && (
                  <div className="bg-tokyo-bgDark border border-tokyo-border rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        placeholder="Nombre de la fase"
                        value={newPhase.name}
                        onChange={(e) => setNewPhase({ ...newPhase, name: e.target.value })}
                        className="px-3 py-2 bg-tokyo-bg border border-tokyo-border rounded text-tokyo-fg placeholder-tokyo-fgDark focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="% del proyecto"
                        value={newPhase.percentage}
                        onChange={(e) => setNewPhase({ ...newPhase, percentage: parseFloat(e.target.value) || 0 })}
                        className="px-3 py-2 bg-tokyo-bg border border-tokyo-border rounded text-tokyo-fg placeholder-tokyo-fgDark focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
                      />
                    </div>
                    <textarea
                      placeholder="Descripción (opcional)"
                      value={newPhase.description}
                      onChange={(e) => setNewPhase({ ...newPhase, description: e.target.value })}
                      className="w-full px-3 py-2 bg-tokyo-bg border border-tokyo-border rounded text-tokyo-fg placeholder-tokyo-fgDark focus:outline-none focus:ring-2 focus:ring-tokyo-blue mb-4 resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowPhaseForm(false)}
                        className="px-3 py-1 text-tokyo-fgDark hover:text-tokyo-fg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddPhase}
                        className="px-4 py-1 bg-tokyo-blue hover:bg-tokyo-blue/80 text-white rounded transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}

                {/* Phases List */}
                <div className="space-y-3">
                  {phases.map((phase) => (
                    <div key={phase.id} className="bg-tokyo-bgDark border border-tokyo-border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getPhaseStatusIcon(phase.status)}
                            <h4 className="font-medium text-tokyo-fg">{phase.name}</h4>
                            {phase.percentage > 0 && (
                              <span className="text-sm bg-tokyo-blue/20 text-tokyo-blue px-2 py-1 rounded">
                                {phase.percentage}%
                              </span>
                            )}
                          </div>
                          {phase.description && (
                            <p className="text-sm text-tokyo-fgDark">{phase.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={phase.status}
                            onChange={(e) => handleUpdatePhaseStatus(phase.id, e.target.value as PhaseStatus)}
                            className="text-xs bg-tokyo-bg border border-tokyo-border rounded px-2 py-1 text-tokyo-fg"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="in_progress">En Progreso</option>
                            <option value="completed">Completado</option>
                          </select>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ type: 'phase', id: phase.id });
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {phase.completed_at && (
                        <div className="text-xs text-tokyo-fgDark">
                          Completado: {formatDate(phase.completed_at)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-tokyo-fg">Pagos</h3>
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="flex items-center gap-2 bg-tokyo-cyan hover:bg-tokyo-cyan/80 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    <Plus size={16} />
                    Agregar Pago
                  </button>
                </div>

                {/* Add Payment Form */}
                {showPaymentForm && (
                  <div className="bg-tokyo-bgDark border border-tokyo-border rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <input
                        type="number"
                        placeholder="Monto"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: parseFloat(e.target.value) || 0 })}
                        className="px-3 py-2 bg-tokyo-bg border border-tokyo-border rounded text-tokyo-fg placeholder-tokyo-fgDark focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
                      />
                      <input
                        type="date"
                        value={newPayment.payment_date}
                        onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                        className="px-3 py-2 bg-tokyo-bg border border-tokyo-border rounded text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
                      />
                      <select
                        value={newPayment.status}
                        onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value as 'pending' | 'invoiced' | 'paid' })}
                        className="px-3 py-2 bg-tokyo-bg border border-tokyo-border rounded text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="invoiced">Facturado</option>
                        <option value="paid">Pagado</option>
                      </select>
                    </div>
                    <select
                      value={newPayment.phase_id}
                      onChange={(e) => setNewPayment({ ...newPayment, phase_id: e.target.value })}
                      className="w-full px-3 py-2 bg-tokyo-bg border border-tokyo-border rounded text-tokyo-fg mb-4 focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
                    >
                      <option value="">Sin fase específica</option>
                      {phases.map((phase) => (
                        <option key={phase.id} value={phase.id}>{phase.name}</option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Notas (opcional)"
                      value={newPayment.notes}
                      onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-tokyo-bg border border-tokyo-border rounded text-tokyo-fg placeholder-tokyo-fgDark focus:outline-none focus:ring-2 focus:ring-tokyo-blue mb-4 resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowPaymentForm(false)}
                        className="px-3 py-1 text-tokyo-fgDark hover:text-tokyo-fg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleAddPayment}
                        className="px-4 py-1 bg-tokyo-cyan hover:bg-tokyo-cyan/80 text-white rounded transition-colors"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                )}

                {/* Payments List */}
                <div className="space-y-3">
                  {payments.map((payment) => {
                    const relatedPhase = phases.find(p => p.id === payment.phase_id);
                    return (
                      <div key={payment.id} className="bg-tokyo-bgDark border border-tokyo-border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Euro className="text-tokyo-cyan" size={16} />
                              <span className="font-medium text-tokyo-fg">€{payment.amount.toFixed(2)}</span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                payment.status === 'paid' 
                                  ? 'bg-green-500 text-white' 
                                  : payment.status === 'invoiced'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-yellow-500 text-black'
                              }`}>
                                {payment.status === 'paid' 
                                  ? 'Pagado' 
                                  : payment.status === 'invoiced'
                                  ? 'Facturado'
                                  : 'Pendiente'}
                              </span>
                            </div>
                            <div className="text-sm text-tokyo-fgDark">
                              <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                {formatDate(payment.payment_date)}
                                {relatedPhase && (
                                  <>
                                    <span>•</span>
                                    <span>Fase: {relatedPhase.name}</span>
                                  </>
                                )}
                              </div>
                              {payment.notes && (
                                <p className="mt-1">{payment.notes}</p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ type: 'payment', id: payment.id });
                            }}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title={`Eliminar ${deleteConfirm?.type === 'phase' ? 'Fase' : 'Pago'}`}
        message={`¿Estás seguro de que quieres eliminar este ${deleteConfirm?.type === 'phase' ? 'fase' : 'pago'}? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (deleteConfirm) {
            if (deleteConfirm.type === 'phase') {
              handleDeletePhase(deleteConfirm.id);
            } else {
              handleDeletePayment(deleteConfirm.id);
            }
            setDeleteConfirm(null);
          }
        }}
        onClose={() => setDeleteConfirm(null)}
      />
    </>
  );
};

export default ProjectDetail;
