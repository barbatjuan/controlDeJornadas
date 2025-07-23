-- Script para limpiar SOLO los datos de ejemplo de proyectos
-- NO afecta los datos reales del calendario, clientes, ni work_days

-- Eliminar pagos de ejemplo
DELETE FROM project_payments 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE name IN ('Sitio Web Corporativo', 'App Mobile E-commerce', 'Sistema de Gestión')
);

-- Eliminar fases de ejemplo  
DELETE FROM project_phases 
WHERE project_id IN (
    SELECT id FROM projects 
    WHERE name IN ('Sitio Web Corporativo', 'App Mobile E-commerce', 'Sistema de Gestión')
);

-- Eliminar proyectos de ejemplo
DELETE FROM projects 
WHERE name IN ('Sitio Web Corporativo', 'App Mobile E-commerce', 'Sistema de Gestión');

-- Verificar que las tablas están vacías pero existen
SELECT 'projects' as tabla, COUNT(*) as registros FROM projects
UNION ALL
SELECT 'project_phases' as tabla, COUNT(*) as registros FROM project_phases  
UNION ALL
SELECT 'project_payments' as tabla, COUNT(*) as registros FROM project_payments;
