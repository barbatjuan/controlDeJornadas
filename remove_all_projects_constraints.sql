-- Eliminar TODAS las restricciones CHECK de la tabla projects temporalmente
DO $$ 
DECLARE 
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'projects'::regclass 
            AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE projects DROP CONSTRAINT IF EXISTS ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Verificar que no quedan restricciones CHECK
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
    AND contype = 'c';
