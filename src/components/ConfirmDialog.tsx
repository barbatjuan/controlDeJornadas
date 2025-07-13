import React, { useEffect } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar"
}) => {
  // Cuando se abre el diálogo, impide el desplazamiento en el cuerpo de la página
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Consola para depuración
  console.log('Mostrando diálogo de confirmación:', { title, message });
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]" style={{pointerEvents: 'auto'}}>
      <div className="bg-white dark:bg-tokyo-bgDark p-6 rounded-xl shadow-2xl border-2 border-gray-300 dark:border-tokyo-border w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-800 dark:text-tokyo-fg mb-4">{title}</h3>
        <p className="text-gray-600 dark:text-tokyo-fgDark mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition-colors font-semibold"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-600 dark:bg-tokyo-red text-white hover:bg-red-700 transition-colors font-semibold"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
