import React, { useState, useEffect } from 'react';
import { X, Calendar, Euro, User, FileText, Target } from 'lucide-react';
import { Project, Client, ProjectStatus } from '../types';

interface ProjectModalProps {
  project: Project | null;
  clients: Client[];
  onSave: (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ project, clients, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    client_id: '',
    total_amount: 0,
    status: 'active' as ProjectStatus,
    start_date: '',
    deadline: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        client_id: project.client_id || '',
        total_amount: project.total_amount,
        status: project.status,
        start_date: project.start_date,
        deadline: project.deadline || ''
      });
    } else {
      // Set default start date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, start_date: today }));
    }
  }, [project]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del proyecto es obligatorio';
    }

    if (formData.total_amount <= 0) {
      newErrors.total_amount = 'El monto total debe ser mayor a 0';
    }

    if (!formData.start_date) {
      newErrors.start_date = 'La fecha de inicio es obligatoria';
    }

    if (formData.deadline && formData.start_date && formData.deadline < formData.start_date) {
      newErrors.deadline = 'La fecha límite no puede ser anterior a la fecha de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const projectData = {
      ...formData,
      client_id: formData.client_id || null,
      deadline: formData.deadline || null
    };

    console.log('ProjectModal - formData:', formData);
    console.log('ProjectModal - projectData:', projectData);
    console.log('ProjectModal - status details:', {
      original: formData.status,
      final: projectData.status,
      type: typeof projectData.status,
      length: projectData.status?.length
    });

    onSave(projectData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-tokyo-bg border border-tokyo-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-tokyo-border">
          <h2 className="text-xl font-semibold text-tokyo-fg">
            {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h2>
          <button
            onClick={onClose}
            className="text-tokyo-fgDark hover:text-tokyo-fg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-tokyo-fg mb-2">
              <Target size={16} />
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 bg-tokyo-bgDark border rounded-lg text-tokyo-fg placeholder-tokyo-fgDark focus:outline-none focus:ring-2 focus:ring-tokyo-blue ${
                errors.name ? 'border-red-500' : 'border-tokyo-border'
              }`}
              placeholder="Ej: Desarrollo de sitio web corporativo"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-tokyo-fg mb-2">
              <FileText size={16} />
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-tokyo-bgDark border border-tokyo-border rounded-lg text-tokyo-fg placeholder-tokyo-fgDark focus:outline-none focus:ring-2 focus:ring-tokyo-blue resize-none"
              placeholder="Describe brevemente el proyecto..."
            />
          </div>

          {/* Client Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-tokyo-fg mb-2">
              <User size={16} />
              Cliente
            </label>
            <select
              value={formData.client_id}
              onChange={(e) => handleInputChange('client_id', e.target.value)}
              className="w-full px-3 py-2 bg-tokyo-bgDark border border-tokyo-border rounded-lg text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
            >
              <option value="">Sin cliente asignado</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Total Amount */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-tokyo-fg mb-2">
              <Euro size={16} />
              Monto Total *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.total_amount}
              onChange={(e) => handleInputChange('total_amount', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 bg-tokyo-bgDark border rounded-lg text-tokyo-fg placeholder-tokyo-fgDark focus:outline-none focus:ring-2 focus:ring-tokyo-blue ${
                errors.total_amount ? 'border-red-500' : 'border-tokyo-border'
              }`}
              placeholder="0.00"
            />
            {errors.total_amount && (
              <p className="text-red-400 text-sm mt-1">{errors.total_amount}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-tokyo-fg mb-2">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value as ProjectStatus)}
              className="w-full px-3 py-2 bg-tokyo-bgDark border border-tokyo-border rounded-lg text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
            >
              <option value="active">Activo</option>
              <option value="completed">Completado</option>
              <option value="paused">Pausado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-tokyo-fg mb-2">
                <Calendar size={16} />
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                className={`w-full px-3 py-2 bg-tokyo-bgDark border rounded-lg text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue ${
                  errors.start_date ? 'border-red-500' : 'border-tokyo-border'
                }`}
              />
              {errors.start_date && (
                <p className="text-red-400 text-sm mt-1">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-tokyo-fg mb-2">
                <Calendar size={16} />
                Fecha Límite
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange('deadline', e.target.value)}
                className={`w-full px-3 py-2 bg-tokyo-bgDark border rounded-lg text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue ${
                  errors.deadline ? 'border-red-500' : 'border-tokyo-border'
                }`}
              />
              {errors.deadline && (
                <p className="text-red-400 text-sm mt-1">{errors.deadline}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-tokyo-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-tokyo-fgDark hover:text-tokyo-fg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-tokyo-blue hover:bg-tokyo-blue/80 text-white rounded-lg transition-colors"
            >
              {project ? 'Actualizar' : 'Crear'} Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
