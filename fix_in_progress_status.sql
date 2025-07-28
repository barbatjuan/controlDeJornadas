-- Corregir los proyectos con status 'in_progress' cambiándolos a 'active'
UPDATE projects 
SET status = 'active' 
WHERE status = 'in_progress';

-- Verificar que ya no hay valores inválidos
SELECT status, COUNT(*) as count
FROM projects 
GROUP BY status
ORDER BY count DESC;

-- Eliminar la restricción problemática
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Recrear la restricción con los valores correctos
ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('active', 'completed', 'paused', 'cancelled'));

-- Verificar que la nueva restricción se creó correctamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
    AND contype = 'c'
    AND conname = 'projects_status_check';
