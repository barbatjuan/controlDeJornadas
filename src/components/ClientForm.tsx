import React, { useState, useEffect } from 'react';
import { Client } from '../types';

interface ClientFormProps {
  client?: Client | null;
  onSave: (client: Partial<Client>) => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ client, onSave, onCancel }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
      });
    } else {
      setFormData({ name: '', email: '', phone: '', address: '' });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('El nombre del cliente es obligatorio.');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-tokyo-bgHighlight rounded-lg">
      <input
        type="text"
        placeholder="Nombre del Cliente"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        className="w-full p-2 bg-tokyo-bg border border-tokyo-border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
      />
      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full p-2 bg-tokyo-bg border border-tokyo-border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
      />
      <input
        type="text"
        placeholder="Teléfono"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="w-full p-2 bg-tokyo-bg border border-tokyo-border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
      />
      <textarea
        placeholder="Dirección"
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        className="w-full p-2 bg-tokyo-bg border border-tokyo-border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tokyo-blue"
        rows={3}
      />
      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-gray-600 text-white">Cancelar</button>
        <button type="submit" className="px-4 py-2 rounded-md bg-tokyo-blue text-white">Guardar Cliente</button>
      </div>
    </form>
  );
};

export default ClientForm;
