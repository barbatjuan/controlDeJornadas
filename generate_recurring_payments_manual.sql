-- Script para generar pagos recurrentes manualmente
-- Ejecutar en Supabase SQL Editor

-- Llamar a la función para generar pagos recurrentes automáticamente
SELECT generate_recurring_payments() as pagos_generados;

-- Verificar los pagos generados
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

-- Si no se generaron pagos automáticamente, crear uno manualmente para la factura más reciente
INSERT INTO recurring_payments (
    recurring_invoice_id,
    amount,
    due_date,
    status
)
SELECT 
    ri.id,
    ri.amount,
    ri.next_due_date,
    'pending'
FROM recurring_invoices ri
WHERE ri.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM recurring_payments rp 
    WHERE rp.recurring_invoice_id = ri.id 
    AND rp.due_date = ri.next_due_date
)
LIMIT 1;

-- Verificar el resultado final
SELECT 
    'Facturas recurrentes' as tipo,
    COUNT(*) as cantidad
FROM recurring_invoices
UNION ALL
SELECT 
    'Pagos recurrentes' as tipo,
    COUNT(*) as cantidad
FROM recurring_payments;
