-- Paso 1: Investigar qué valores de status existen actualmente
SELECT status, COUNT(*) as count
FROM projects 
GROUP BY status
ORDER BY count DESC;

-- Paso 2: Mostrar las filas con valores de status problemáticos
SELECT id, name, status, created_at
FROM projects 
WHERE status NOT IN ('active', 'completed', 'paused', 'cancelled')
ORDER BY created_at DESC;

-- Paso 3: Corregir los valores inválidos (ajusta según lo que encuentres)
-- Ejemplo: si hay valores como 'in_progress', cambiarlos a 'active'
UPDATE projects 
SET status = 'active' 
WHERE status NOT IN ('active', 'completed', 'paused', 'cancelled');

-- Paso 4: Verificar que ya no hay valores inválidos
SELECT status, COUNT(*) as count
FROM projects 
GROUP BY status
ORDER BY count DESC;

-- Paso 5: Ahora eliminar la restricción problemática
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Paso 6: Recrear la restricción con los valores correctos
ALTER TABLE projects 
ADD CONSTRAINT projects_status_check 
CHECK (status IN ('active', 'completed', 'paused', 'cancelled'));

-- Paso 7: Verificar que la nueva restricción se creó correctamente
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
    AND contype = 'c'
    AND conname = 'projects_status_check';
