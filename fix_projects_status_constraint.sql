-- Verificar la restricción actual de status en la tabla projects
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
    AND contype = 'c'
    AND conname LIKE '%status%';

-- Eliminar la restricción problemática si existe
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
