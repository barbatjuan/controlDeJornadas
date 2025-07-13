import React, { useEffect, useRef } from 'react';
import { Edit3, PlusCircle, Trash2 } from 'lucide-react';
import { useWorkData } from '../contexts/WorkDataContext';

interface WorkDayContextMenuProps {
  position: { x: number; y: number };
  date: Date;
  onEdit: (isSecondPayment?: boolean) => void;
  onAddSecondPayment: () => void;
  onDelete: (isSecondPayment?: boolean) => void;
  onClose: () => void;
}

const WorkDayContextMenu: React.FC<WorkDayContextMenuProps> = ({
  position,
  date,
  onEdit,
  onAddSecondPayment,
  onDelete,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { getWorkDay, getSecondWorkDay } = useWorkData();
  const formattedDate = date.toISOString().split('T')[0];
  const workDay = getWorkDay(formattedDate);
  const secondWorkDay = getSecondWorkDay(formattedDate);
  const hasSecondPayment = secondWorkDay !== undefined;

  // Cerrar el menú al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.context-menu')) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${position.y}px`,
    left: `${position.x}px`,
    zIndex: 100,
  };

  return (
    <div className="context-menu absolute" style={menuStyle}>
      <div className="bg-white dark:bg-tokyo-bgDark rounded-lg shadow-lg border dark:border-tokyo-border overflow-hidden w-48">
        <div className="flex flex-col p-1">
          <button
            onClick={() => onEdit(false)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-md text-sm text-gray-800 dark:text-gray-200"
          >
            <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Editar pago principal</span>
          </button>
          
          {/* Si ya existe un segundo pago, mostrar opción de editarlo */}
          {hasSecondPayment ? (
            <button
              onClick={() => onEdit(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-md text-sm text-gray-800 dark:text-gray-200"
            >
              <Edit3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Editar segundo pago</span>
            </button>
          ) : (
            <button
              onClick={onAddSecondPayment}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800/60 rounded-md text-sm text-gray-800 dark:text-gray-200"
            >
              <PlusCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>Añadir segundo pago</span>
            </button>
          )}
          
          <div className="my-1 border-t border-gray-200 dark:border-gray-700/70" />
          
          {/* Opciones de eliminación basadas en si hay un segundo pago */}
          {hasSecondPayment && (
            <button
              onClick={() => onDelete(true)}
              className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-sm text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar segundo pago</span>
            </button>
          )}
          <button
            onClick={() => onDelete(false)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-sm text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            <span>{hasSecondPayment ? 'Eliminar ambos pagos' : 'Eliminar pago'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkDayContextMenu;
