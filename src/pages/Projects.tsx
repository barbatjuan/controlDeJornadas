import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Project, Client, ProjectStatus } from '../types';
import { supabase } from '../utils/supabase';
import ProjectCard from '../components/ProjectCard';
import ProjectModal from '../components/ProjectModal';
import ProjectDetail from '../components/ProjectDetail';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects();
    loadClients();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleOpenDetail = (project: Project) => {
    setDetailProject(project);
  };

  const handleCloseDetail = () => {
    setDetailProject(null);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    setDetailProject(updatedProject);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      setProjects(projects.filter(p => p.id !== projectId));
      toast.success('Proyecto eliminado correctamente');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(`Error al eliminar el proyecto: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (selectedProject) {
        // Actualizar proyecto existente
        const { data, error } = await supabase
          .from('projects')
          .update({ ...projectData, updated_at: new Date().toISOString() })
          .eq('id', selectedProject.id)
          .select()
          .single();

        if (error) throw error;
        
        setProjects(projects.map(p => p.id === selectedProject.id ? data : p));
        toast.success('Proyecto actualizado correctamente');
      } else {
        // Crear nuevo proyecto
        const { data, error } = await supabase
          .from('projects')
          .insert([{
            ...projectData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        
        setProjects([data, ...projects]);
        toast.success('Proyecto creado correctamente');
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Error al guardar el proyecto');
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'completed': return 'text-blue-400';
      case 'paused': return 'text-yellow-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'completed': return 'Completado';
      case 'paused': return 'Pausado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tokyo-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-tokyo-fg">Proyectos</h1>
          <p className="text-tokyo-fgDark">Gestiona tus proyectos puntuales y su progreso</p>
        </div>
        <button
          onClick={handleCreateProject}
          className="flex items-center gap-2 bg-tokyo-blue hover:bg-tokyo-blue/80 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} />
          Nuevo Proyecto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tokyo-fgDark" size={18} />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-tokyo-bg border border-tokyo-border rounded-lg text-tokyo-fg placeholder-tokyo-fgDark focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tokyo-fgDark" size={18} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
            className="pl-10 pr-8 py-2 bg-tokyo-bg border border-tokyo-border rounded-lg text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue appearance-none"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="completed">Completado</option>
            <option value="paused">Pausado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-tokyo-fgDark text-lg mb-2">
            {projects.length === 0 ? 'No hay proyectos creados' : 'No se encontraron proyectos'}
          </div>
          <p className="text-tokyo-fgDark">
            {projects.length === 0 
              ? 'Crea tu primer proyecto para comenzar a gestionar tus trabajos puntuales'
              : 'Intenta ajustar los filtros de búsqueda'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              client={clients.find(c => c.id === project.client_id)}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
              onOpenDetail={handleOpenDetail}
            />
          ))}
        </div>
      )}

      {/* Project Modal */}
      {isModalOpen && (
        <ProjectModal
          project={selectedProject}
          clients={clients}
          onSave={handleSaveProject}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Project Detail */}
      {detailProject && (
        <ProjectDetail
          project={detailProject}
          client={clients.find(c => c.id === detailProject.client_id)}
          onClose={handleCloseDetail}
          onProjectUpdate={handleProjectUpdate}
        />
      )}
    </div>
  );
};

export default Projects;
