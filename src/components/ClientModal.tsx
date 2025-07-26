import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, Trash2 } from 'lucide-react';
import DeleteConfirmDialog from './DeleteConfirmDialog';

interface ClientModalProps {
  onSave: (client: { id?: string; name: string; company?: string }) => Promise<void>;
  onClose: () => void;
  client?: { id: string; name: string; company?: string };
  onDelete?: (clientId: string) => Promise<void>;
}

const ClientModal: React.FC<ClientModalProps> = ({ onSave, onClose, client, onDelete }) => {
  const [name, setName] = useState(client?.name || '');
  const [company, setCompany] = useState(client?.company || '');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Actualizar los campos si el cliente cambia (para edición)
  useEffect(() => {
    if (client) {
      setName(client.name);
      setCompany(client.company || '');
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del cliente es obligatorio.');
      return;
    }
    setError('');
    await onSave({
      id: client?.id,
      name: name.trim(),
      company: company.trim() || undefined
    });
  };
  
  const handleDelete = async () => {
    if (!client?.id || !onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(client.id);
      // onClose se llamará en el componente padre después de eliminar
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      setIsDeleting(false);
    }
  };
  
  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    handleDelete();
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-tokyo-bg p-8 rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-tokyo-fg">{client ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <button onClick={onClose} className="text-tokyo-fgDark hover:text-tokyo-fg">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="client-name" className="block text-sm font-medium text-tokyo-fg mb-2">
              <User size={16} className="inline mr-2" />
              Nombre del Cliente
            </label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-tokyo-border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
              placeholder="Ej: Juan Pérez"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <div>
            <label htmlFor="client-company" className="block text-sm font-medium text-tokyo-fg mb-2">
              <Briefcase size={16} className="inline mr-2" />
              Empresa (Opcional)
            </label>
            <input
              id="client-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-2 border border-tokyo-border rounded-lg bg-tokyo-bgHighlight text-tokyo-fg focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
              placeholder="Ej: Acme Inc."
            />
          </div>
          <div className="flex justify-between pt-4 border-t border-tokyo-border">
            {client && onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={16} className="mr-2" />
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            ) : (
              <div></div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-tokyo-fgDark hover:bg-tokyo-bgHighlight rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-tokyo-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {client ? 'Actualizar' : 'Guardar Cliente'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* Dialog de confirmación de eliminación */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar Cliente"
        message="¿Estás seguro de que deseas eliminar este cliente?"
        itemName={client ? `${client.name}${client.company ? ` (${client.company})` : ''}` : ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default ClientModal;
