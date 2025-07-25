-- Script para verificar facturas recurrentes y generar pagos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar qué facturas recurrentes existen
SELECT 
    ri.id,
    ri.name,
    ri.amount,
    ri.recurrence_type,
    ri.status,
    ri.client_id,
    c.name as cliente_nombre,
    ri.start_date,
    ri.next_due_date
FROM recurring_invoices ri
LEFT JOIN clients c ON ri.client_id = c.id
ORDER BY ri.created_at DESC;

-- 2. Verificar qué pagos recurrentes existen
SELECT 
    rp.id,
    rp.amount,
    rp.due_date,
    rp.status,
    ri.name as factura_nombre,
    c.name as cliente_nombre
FROM recurring_payments rp
JOIN recurring_invoices ri ON rp.recurring_invoice_id = ri.id
LEFT JOIN clients c ON ri.client_id = c.id
ORDER BY rp.due_date DESC;

-- 3. Generar pagos recurrentes automáticamente
SELECT generate_recurring_payments();

-- 4. Si no se generan pagos automáticamente, crear manualmente para facturas activas
-- Insertar pagos para facturas que no tienen pagos generados
INSERT INTO recurring_payments (
    recurring_invoice_id,
    amount,
    due_date,
    status
)
SELECT 
    ri.id,
    ri.amount,
    CASE 
        WHEN ri.recurrence_type = 'monthly' THEN ri.start_date
        WHEN ri.recurrence_type = 'quarterly' THEN ri.start_date
        WHEN ri.recurrence_type = 'semiannual' THEN ri.start_date
        WHEN ri.recurrence_type = 'annual' THEN ri.start_date
        ELSE ri.start_date
    END as due_date,
    'pending' as status
FROM recurring_invoices ri
WHERE ri.status = 'active'
AND NOT EXISTS (
    SELECT 1 
    FROM recurring_payments rp 
    WHERE rp.recurring_invoice_id = ri.id
);

-- 5. Verificar los pagos después de la generación
SELECT 
    rp.id,
    rp.amount,
    rp.due_date,
    rp.status,
    ri.name as factura_nombre,
    c.name as cliente_nombre
FROM recurring_payments rp
JOIN recurring_invoices ri ON rp.recurring_invoice_id = ri.id
LEFT JOIN clients c ON ri.client_id = c.id
ORDER BY rp.due_date DESC;
