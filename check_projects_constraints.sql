-- Verificar las restricciones de la tabla projects
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
    AND contype = 'c';

-- Verificar la estructura de la tabla projects
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Verificar si hay datos existentes en la tabla
SELECT status, COUNT(*) 
FROM projects 
GROUP BY status;
