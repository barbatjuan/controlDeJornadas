import React, { useState } from 'react';
import { useWorkData } from '../contexts/WorkDataContext';
import ClientForm from '../components/ClientForm';
import ClientDetail from '../components/ClientDetail';
import { Client } from '../types';
import { PlusCircle, Eye, Edit } from 'lucide-react';

const Clients: React.FC = () => {
  const { clients, addOrUpdateClient, isLoaded } = useWorkData();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetail, setShowClientDetail] = useState(false);

  const handleSaveClient = async (clientData: Partial<Client>) => {
    const clientToSave = selectedClient ? { ...selectedClient, ...clientData } : clientData;
    await addOrUpdateClient(clientToSave);
    setIsFormVisible(false);
    setSelectedClient(null);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
    setIsFormVisible(true);
    setShowClientDetail(false);
  };

  const handleViewClientDetail = (client: Client) => {
    setSelectedClient(client);
    setShowClientDetail(true);
    setIsFormVisible(false);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormVisible(true);
    setShowClientDetail(false);
  };

  return (
    <div>
      {showClientDetail && selectedClient ? (
        <ClientDetail 
          client={selectedClient} 
          onBack={() => setShowClientDetail(false)}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-tokyo-fg">Clientes</h2>
            {!isFormVisible && (
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-tokyo-blue text-white rounded-lg hover:bg-blue-700 dark:hover:bg-tokyo-blue/80 transition-colors shadow-md"
              >
                <PlusCircle size={18} />
                Añadir Cliente
              </button>
            )}
          </div>

          {isFormVisible && (
            <div className="mb-6">
              <ClientForm
                client={selectedClient}
                onSave={handleSaveClient}
                onCancel={() => setIsFormVisible(false)}
              />
            </div>
          )}

          <div className="bg-tokyo-bg p-4 sm:p-6 rounded-lg border border-tokyo-border">
            {!isLoaded ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-tokyo-blue"></div>
              </div>
            ) : clients.length === 0 ? (
              <p className="text-tokyo-fgDark text-center py-8">No tienes clientes todavía. ¡Añade el primero!</p>
            ) : (
              <ul className="space-y-4">
                {clients.map((client) => (
                  <li key={client.id} className="bg-tokyo-bgHighlight p-4 rounded-md border border-tokyo-border hover:border-tokyo-border/80">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-tokyo-fg">{client.name}</h3>
                        <div className="space-y-1 mt-1">
                          {client.email && <p className="text-sm text-tokyo-fgDark">{client.email}</p>}
                          {client.phone && <p className="text-sm text-tokyo-fgDark">{client.phone}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewClientDetail(client)}
                          className="p-2 text-tokyo-blue hover:bg-tokyo-blue/10 rounded-full transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="p-2 text-tokyo-purple hover:bg-tokyo-purple/10 rounded-full transition-colors"
                          title="Editar cliente"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Clients;
