-- Script para verificar el estado de las tablas de facturas recurrentes
-- Ejecutar en Supabase SQL Editor

-- Verificar si las tablas existen
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_name IN ('recurring_invoices', 'recurring_payments')
ORDER BY table_name;

-- Verificar las columnas de recurring_invoices
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recurring_invoices'
ORDER BY ordinal_position;

-- Verificar las columnas de recurring_payments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recurring_payments'
ORDER BY ordinal_position;

-- Contar registros existentes
SELECT 
    'recurring_invoices' as tabla,
    COUNT(*) as total_registros
FROM recurring_invoices
UNION ALL
SELECT 
    'recurring_payments' as tabla,
    COUNT(*) as total_registros
FROM recurring_payments;

-- Mostrar todas las facturas recurrentes existentes
SELECT 
    ri.id,
    ri.name,
    ri.amount,
    ri.recurrence_type,
    ri.status,
    ri.client_id,
    c.name as cliente_nombre
FROM recurring_invoices ri
LEFT JOIN clients c ON ri.client_id = c.id
ORDER BY ri.created_at DESC;
