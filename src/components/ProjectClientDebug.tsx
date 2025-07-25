import React from 'react';
import { useWorkData } from '../contexts/WorkDataContext';

const ProjectClientDebug: React.FC = () => {
  const { projects, projectPayments, clients } = useWorkData();

  console.log('=== PROJECT CLIENT DEBUG ===');
  console.log('Projects:', projects);
  console.log('Project Payments:', projectPayments);
  console.log('Clients:', clients);

  // Verificar conexiones
  projects.forEach(project => {
    const client = clients.find(c => c.id === project.client_id);
    const payments = projectPayments.filter(p => p.project_id === project.id);
    console.log(`Project "${project.name}":`, {
      client_id: project.client_id,
      client_name: client?.name || 'NO CLIENT FOUND',
      payments_count: payments.length,
      payments: payments
    });
  });

  // Verificar pagos por cliente
  clients.forEach(client => {
    const clientProjects = projects.filter(p => p.client_id === client.id);
    const clientProjectPayments = projectPayments.filter(payment => {
      const project = projects.find(p => p.id === payment.project_id);
      return project && project.client_id === client.id;
    });
    
    console.log(`Client "${client.name}":`, {
      projects_count: clientProjects.length,
      projects: clientProjects.map(p => p.name),
      payments_count: clientProjectPayments.length,
      payments: clientProjectPayments
    });
  });

  return (
    <div className="p-4 bg-red-100 border border-red-300 rounded">
      <h3 className="font-bold text-red-800">Project Client Debug</h3>
      <p className="text-red-700">Check console for debug information</p>
      <div className="mt-2 text-sm">
        <p>Projects: {projects.length}</p>
        <p>Project Payments: {projectPayments.length}</p>
        <p>Clients: {clients.length}</p>
      </div>
    </div>
  );
};

export default ProjectClientDebug;
