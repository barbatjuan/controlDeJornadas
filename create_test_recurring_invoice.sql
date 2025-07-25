-- Script para crear una factura recurrente de prueba
-- Ejecutar en Supabase SQL Editor después del script principal

-- Insertar una factura recurrente de prueba
INSERT INTO recurring_invoices (
    name, 
    description, 
    amount, 
    recurrence_type, 
    start_date, 
    next_due_date, 
    status, 
    auto_generate
) VALUES (
    'Factura de Prueba', 
    'Factura creada para verificar que el sistema funciona correctamente', 
    100.00, 
    'monthly', 
    CURRENT_DATE, 
    CURRENT_DATE, 
    'active', 
    true
);

-- Verificar que se creó correctamente
SELECT * FROM recurring_invoices WHERE name = 'Factura de Prueba';
