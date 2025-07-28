-- Verificar todas las restricciones CHECK en la tabla projects
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
    AND contype = 'c';

-- Verificar la estructura completa de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Verificar todos los valores únicos de status
SELECT DISTINCT status, LENGTH(status) as length, ASCII(status) as ascii_first_char
FROM projects;

-- Intentar insertar un registro de prueba simple
INSERT INTO projects (name, total_amount, status, start_date) 
VALUES ('Test Project', 100.00, 'active', '2025-07-28');

-- Si el INSERT falla, intentemos sin el campo status (para que use el DEFAULT)
-- INSERT INTO projects (name, total_amount, start_date) 
-- VALUES ('Test Project 2', 100.00, '2025-07-28');
