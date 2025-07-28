-- Limpiar los proyectos con status 'in_progress' cambiándolos a 'active'
UPDATE projects 
SET status = 'active' 
WHERE status = 'in_progress';

-- Verificar que se actualizaron correctamente
SELECT status, COUNT(*) as count
FROM projects 
GROUP BY status
ORDER BY count DESC;

-- Mostrar los proyectos actualizados
SELECT id, name, status, start_date
FROM projects 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;
