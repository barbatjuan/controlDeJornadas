import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-tokyo-bg border border-tokyo-border rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-tokyo-border">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="text-red-500" size={24} />
            </div>
            <h3 className="text-lg font-semibold text-tokyo-fg">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-tokyo-fgDark hover:text-tokyo-fg hover:bg-tokyo-bgHighlight rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-tokyo-fg mb-4">{message}</p>
          
          <div className="bg-tokyo-bgHighlight border border-red-200/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="text-red-500" size={16} />
              <span className="font-medium text-tokyo-fg">Elemento a eliminar:</span>
            </div>
            <p className="text-tokyo-fg font-semibold">{itemName}</p>
          </div>

          <div className="bg-red-50/50 border border-red-200/50 rounded-lg p-3 mb-6">
            <p className="text-sm text-tokyo-fg">
              <strong>⚠️ Advertencia:</strong> Esta acción eliminará permanentemente el elemento y todos los datos asociados. No se puede deshacer.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-tokyo-bg border border-tokyo-border text-tokyo-fg rounded-lg hover:bg-tokyo-bgHighlight transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;
