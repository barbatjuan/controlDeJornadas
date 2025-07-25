-- Script para corregir la factura recurrente de Ana
-- Debe ser €70 anual, no €69.94 mensual

-- 1. Primero verificar los datos actuales
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
WHERE ri.name ILIKE '%hosting%' OR ri.name ILIKE '%ana%' OR c.name ILIKE '%ana%'
ORDER BY ri.created_at DESC;

-- 2. Verificar pagos existentes para esta factura
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
WHERE ri.name ILIKE '%hosting%' OR ri.name ILIKE '%ana%' OR c.name ILIKE '%ana%'
ORDER BY rp.due_date DESC;

-- 3. Obtener el ID del cliente Ana (Anastasia Leonova)
SELECT id, name FROM clients WHERE name ILIKE '%anastasia%' OR name ILIKE '%leonova%';

-- 4. Actualizar la factura recurrente para que sea €70 anual
-- Primero necesitamos el ID correcto, así que vamos a buscar por el nombre del hosting
UPDATE recurring_invoices 
SET 
    amount = 70.00,
    recurrence_type = 'annual',
    next_due_date = start_date + INTERVAL '1 year'
WHERE name ILIKE '%hosting%' AND amount = 69.94;

-- 5. Actualizar los pagos existentes para que reflejen el monto correcto
UPDATE recurring_payments 
SET amount = 70.00
WHERE recurring_invoice_id IN (
    SELECT id FROM recurring_invoices 
    WHERE name ILIKE '%hosting%' AND amount = 70.00
);

-- 6. Verificar los cambios
SELECT 
    ri.id,
    ri.name,
    ri.amount,
    ri.recurrence_type,
    ri.status,
    c.name as cliente_nombre,
    ri.start_date,
    ri.next_due_date
FROM recurring_invoices ri
LEFT JOIN clients c ON ri.client_id = c.id
WHERE ri.name ILIKE '%hosting%' OR c.name ILIKE '%ana%'
ORDER BY ri.created_at DESC;

-- 7. Verificar pagos actualizados
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
WHERE ri.name ILIKE '%hosting%' OR c.name ILIKE '%ana%'
ORDER BY rp.due_date DESC;
