-- Script para depurar problemas de eliminación
-- Ejecuta esto para verificar qué está pasando exactamente

-- 1. Verificar que las tablas existen y tienen datos
SELECT 'projects' as tabla, COUNT(*) as total FROM projects;
SELECT 'project_phases' as tabla, COUNT(*) as total FROM project_phases;
SELECT 'project_payments' as tabla, COUNT(*) as total FROM project_payments;

-- 2. Ver algunos IDs de ejemplo para probar eliminación manual
SELECT 'Proyectos existentes:' as info;
SELECT id, name FROM projects LIMIT 3;

SELECT 'Fases existentes:' as info;
SELECT id, name, project_id FROM project_phases LIMIT 3;

-- 3. Probar eliminación manual de una fase (reemplaza el ID)
-- DELETE FROM project_phases WHERE id = 'REEMPLAZA_CON_ID_REAL';

-- 4. Verificar permisos actuales
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'project_phases', 'project_payments')
AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 5. Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%project%';

-- 6. Ver políticas RLS si existen
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE '%project%';
