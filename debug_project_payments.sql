-- Debug script para verificar datos de pagos de proyectos
-- Verificar si la tabla existe y tiene datos

-- 1. Verificar estructura de la tabla project_payments
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'project_payments'
ORDER BY ordinal_position;

-- 2. Contar registros en project_payments
SELECT COUNT(*) as total_project_payments FROM project_payments;

-- 3. Ver todos los pagos de proyectos
SELECT * FROM project_payments ORDER BY payment_date DESC;

-- 4. Ver proyectos existentes
SELECT id, name, client_id, status, total_amount FROM projects ORDER BY created_at DESC;

-- 5. Ver si hay proyectos con pagos
SELECT 
    p.name as project_name,
    p.status,
    p.total_amount,
    COUNT(pp.id) as payment_count,
    SUM(pp.amount) as total_payments
FROM projects p
LEFT JOIN project_payments pp ON p.id = pp.project_id
GROUP BY p.id, p.name, p.status, p.total_amount
ORDER BY p.created_at DESC;
