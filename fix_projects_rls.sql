-- Primero, eliminar la restricción CHECK existente para poder actualizar los datos
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Actualizar todos los datos existentes para que usen los valores correctos
UPDATE projects SET status = 'in_progress' WHERE status = 'active';
UPDATE projects SET status = 'pending' WHERE status = 'paused';
UPDATE projects SET status = 'completed' WHERE status = 'completed';
UPDATE projects SET status = 'cancelled' WHERE status = 'cancelled';

-- Ahora crear la nueva restricción CHECK con los valores correctos
ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));

-- Habilitar RLS en todas las tablas de proyectos
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;

-- También habilitar RLS en las otras tablas si no está habilitado
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso completo para proyectos (permitir todo por ahora)
CREATE POLICY "Enable all access for projects" ON projects FOR ALL USING (true);
CREATE POLICY "Enable all access for project_phases" ON project_phases FOR ALL USING (true);
CREATE POLICY "Enable all access for project_payments" ON project_payments FOR ALL USING (true);

-- Crear políticas de acceso completo para las otras tablas si no existen
DROP POLICY IF EXISTS "Enable all access for clients" ON clients;
CREATE POLICY "Enable all access for clients" ON clients FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for work_days" ON work_days;
CREATE POLICY "Enable all access for work_days" ON work_days FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for recurring_invoices" ON recurring_invoices;
CREATE POLICY "Enable all access for recurring_invoices" ON recurring_invoices FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all access for recurring_payments" ON recurring_payments;
CREATE POLICY "Enable all access for recurring_payments" ON recurring_payments FOR ALL USING (true);

-- Insertar algunos proyectos de ejemplo con diferentes estados
INSERT INTO projects (name, description, client_id, total_amount, status, start_date, deadline) 
SELECT 
    'Proyecto ' || generate_series,
    'Descripción del proyecto ' || generate_series,
    (SELECT id FROM clients LIMIT 1 OFFSET (generate_series % (SELECT COUNT(*) FROM clients))),
    (1000 + generate_series * 500)::decimal(10,2),
    CASE 
        WHEN generate_series % 3 = 0 THEN 'completed'
        WHEN generate_series % 3 = 1 THEN 'in_progress'
        ELSE 'pending'
    END,
    CURRENT_DATE - INTERVAL '30 days' * generate_series,
    CURRENT_DATE + INTERVAL '60 days' * generate_series
FROM generate_series(1, 6);

-- Actualizar el status de los proyectos para que coincida con el dashboard
UPDATE projects SET status = 'completed' WHERE name LIKE '%1' OR name LIKE '%4';
UPDATE projects SET status = 'in_progress' WHERE name LIKE '%2' OR name LIKE '%5';  
UPDATE projects SET status = 'pending' WHERE name LIKE '%3' OR name LIKE '%6';

-- Insertar algunos pagos de proyecto de ejemplo
INSERT INTO project_payments (project_id, amount, payment_date, status)
SELECT 
    p.id,
    (p.total_amount / 3)::decimal(10,2),
    p.start_date + INTERVAL '15 days',
    CASE 
        WHEN p.status = 'completed' THEN 'paid'
        ELSE 'pending'
    END
FROM projects p;
