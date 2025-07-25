-- Script para corregir la conexión de proyectos con clientes y estados de pago

-- 1. Actualizar constraint de project_payments para incluir 'invoiced'
ALTER TABLE project_payments DROP CONSTRAINT IF EXISTS project_payments_status_check;
ALTER TABLE project_payments ADD CONSTRAINT project_payments_status_check 
    CHECK (status IN ('pending', 'invoiced', 'paid'));

-- 2. Asignar clientes a los proyectos existentes que no tienen client_id
-- Primero, obtener el primer cliente disponible para asignar a proyectos sin cliente
DO $$
DECLARE
    first_client_id UUID;
BEGIN
    -- Obtener el primer cliente disponible
    SELECT id INTO first_client_id FROM clients LIMIT 1;
    
    -- Si existe al menos un cliente, asignar proyectos sin cliente a ese cliente
    IF first_client_id IS NOT NULL THEN
        UPDATE projects 
        SET client_id = first_client_id 
        WHERE client_id IS NULL;
        
        RAISE NOTICE 'Proyectos sin cliente asignados al cliente ID: %', first_client_id;
    ELSE
        RAISE NOTICE 'No hay clientes disponibles para asignar a los proyectos';
    END IF;
END $$;

-- 3. Verificar los resultados
SELECT 
    p.name as project_name,
    c.name as client_name,
    p.client_id
FROM projects p
LEFT JOIN clients c ON c.id = p.client_id
ORDER BY p.name;

-- 4. Mostrar estadísticas de pagos de proyectos por cliente
SELECT 
    c.name as client_name,
    COUNT(pp.*) as total_payments,
    SUM(CASE WHEN pp.status = 'pending' THEN pp.amount ELSE 0 END) as pending_amount,
    SUM(CASE WHEN pp.status = 'invoiced' THEN pp.amount ELSE 0 END) as invoiced_amount,
    SUM(CASE WHEN pp.status = 'paid' THEN pp.amount ELSE 0 END) as paid_amount
FROM clients c
LEFT JOIN projects p ON p.client_id = c.id
LEFT JOIN project_payments pp ON pp.project_id = p.id
GROUP BY c.id, c.name
ORDER BY c.name;
