-- Actualizar las tablas para soportar el estado 'invoiced' en proyectos y recurrentes

-- 1. Actualizar la tabla project_payments para incluir 'invoiced'
ALTER TABLE project_payments 
DROP CONSTRAINT IF EXISTS project_payments_status_check;

ALTER TABLE project_payments 
ADD CONSTRAINT project_payments_status_check 
CHECK (status IN ('pending', 'invoiced', 'paid'));

-- 2. Actualizar la tabla recurring_payments para incluir 'invoiced'
ALTER TABLE recurring_payments 
DROP CONSTRAINT IF EXISTS recurring_payments_status_check;

ALTER TABLE recurring_payments 
ADD CONSTRAINT recurring_payments_status_check 
CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue'));

-- 3. Actualizar la función mark_overdue_payments para manejar el nuevo estado
DROP FUNCTION IF EXISTS mark_overdue_payments();

CREATE FUNCTION mark_overdue_payments()
RETURNS void AS $$
BEGIN
  -- Marcar pagos recurrentes vencidos (solo los que están pendientes o facturados)
  UPDATE recurring_payments 
  SET status = 'overdue'
  WHERE due_date < CURRENT_DATE 
    AND status IN ('pending', 'invoiced');
END;
$$ LANGUAGE plpgsql;

-- 4. Crear función auxiliar para obtener estadísticas de pagos por estado
CREATE OR REPLACE FUNCTION get_payment_stats_by_status()
RETURNS TABLE (
  source_type text,
  pending_count bigint,
  pending_amount numeric,
  invoiced_count bigint,
  invoiced_amount numeric,
  paid_count bigint,
  paid_amount numeric,
  overdue_count bigint,
  overdue_amount numeric
) AS $$
BEGIN
  -- Estadísticas de jornadas (work_days)
  RETURN QUERY
  SELECT 
    'work_days'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
    COUNT(*) FILTER (WHERE status = 'invoiced'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'invoiced'), 0),
    COUNT(*) FILTER (WHERE status = 'paid'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0),
    0::bigint, -- work_days no tiene overdue
    0::numeric
  FROM work_days;
  
  -- Estadísticas de pagos de proyectos
  RETURN QUERY
  SELECT 
    'project_payments'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
    COUNT(*) FILTER (WHERE status = 'invoiced'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'invoiced'), 0),
    COUNT(*) FILTER (WHERE status = 'paid'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0),
    0::bigint, -- project_payments no tiene overdue
    0::numeric
  FROM project_payments;
  
  -- Estadísticas de pagos recurrentes
  RETURN QUERY
  SELECT 
    'recurring_payments'::text,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
    COUNT(*) FILTER (WHERE status = 'invoiced'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'invoiced'), 0),
    COUNT(*) FILTER (WHERE status = 'paid'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0),
    COUNT(*) FILTER (WHERE status = 'overdue'),
    COALESCE(SUM(amount) FILTER (WHERE status = 'overdue'), 0)
  FROM recurring_payments;
END;
$$ LANGUAGE plpgsql;

-- 5. Crear índices para mejorar el rendimiento de consultas por estado
CREATE INDEX IF NOT EXISTS idx_project_payments_status ON project_payments(status);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_status ON recurring_payments(status);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_invoice_id ON recurring_payments(recurring_invoice_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_client_id ON recurring_invoices(client_id) WHERE client_id IS NOT NULL;

COMMENT ON FUNCTION get_payment_stats_by_status() IS 'Obtiene estadísticas de pagos agrupadas por tipo de fuente y estado';
COMMENT ON FUNCTION mark_overdue_payments() IS 'Marca como vencidos los pagos recurrentes que han pasado su fecha de vencimiento';
