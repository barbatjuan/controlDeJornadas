-- Script para crear las tablas del sistema de facturación recurrente
-- Ejecutar en Supabase SQL Editor

-- Tabla para facturas recurrentes
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    recurrence_type VARCHAR(20) NOT NULL CHECK (recurrence_type IN ('monthly', 'quarterly', 'biannual', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE, -- Opcional, para facturas con fecha de finalización
    next_due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    auto_generate BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para pagos de facturas recurrentes
CREATE TABLE IF NOT EXISTS recurring_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recurring_invoice_id UUID NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_client_id ON recurring_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_status ON recurring_invoices(status);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_due_date ON recurring_invoices(next_due_date);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_invoice_id ON recurring_payments(recurring_invoice_id);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_due_date ON recurring_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_recurring_payments_status ON recurring_payments(status);

-- Trigger para actualizar updated_at en recurring_invoices
CREATE OR REPLACE FUNCTION update_recurring_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recurring_invoices_updated_at
    BEFORE UPDATE ON recurring_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_recurring_invoices_updated_at();

-- Función para calcular la próxima fecha de vencimiento
CREATE OR REPLACE FUNCTION calculate_next_due_date(
    input_date DATE,
    recurrence_type VARCHAR(20)
) RETURNS DATE AS $$
BEGIN
    CASE recurrence_type
        WHEN 'monthly' THEN
            RETURN input_date + INTERVAL '1 month';
        WHEN 'quarterly' THEN
            RETURN input_date + INTERVAL '3 months';
        WHEN 'biannual' THEN
            RETURN input_date + INTERVAL '6 months';
        WHEN 'annual' THEN
            RETURN input_date + INTERVAL '1 year';
        ELSE
            RAISE EXCEPTION 'Invalid recurrence_type: %', recurrence_type;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Función para generar automáticamente pagos pendientes
CREATE OR REPLACE FUNCTION generate_recurring_payments()
RETURNS INTEGER AS $$
DECLARE
    invoice_record RECORD;
    payments_generated INTEGER := 0;
BEGIN
    -- Buscar facturas activas cuya fecha de vencimiento sea hoy o anterior
    FOR invoice_record IN
        SELECT * FROM recurring_invoices 
        WHERE status = 'active' 
        AND auto_generate = true
        AND next_due_date <= CURRENT_DATE
        AND (end_date IS NULL OR next_due_date <= end_date)
    LOOP
        -- Verificar si ya existe un pago para esta fecha
        IF NOT EXISTS (
            SELECT 1 FROM recurring_payments 
            WHERE recurring_invoice_id = invoice_record.id 
            AND due_date = invoice_record.next_due_date
        ) THEN
            -- Crear el pago pendiente
            INSERT INTO recurring_payments (
                recurring_invoice_id,
                amount,
                due_date,
                status
            ) VALUES (
                invoice_record.id,
                invoice_record.amount,
                invoice_record.next_due_date,
                'pending'
            );
            
            payments_generated := payments_generated + 1;
        END IF;
        
        -- Actualizar la próxima fecha de vencimiento
        UPDATE recurring_invoices 
        SET next_due_date = calculate_next_due_date(next_due_date, recurrence_type),
            updated_at = NOW()
        WHERE id = invoice_record.id;
    END LOOP;
    
    RETURN payments_generated;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar pagos como vencidos
CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE recurring_payments 
    SET status = 'overdue'
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- Datos de ejemplo (opcional)
-- INSERT INTO recurring_invoices (client_id, name, description, amount, recurrence_type, start_date, next_due_date) 
-- VALUES 
-- (NULL, 'Mantenimiento Web Mensual', 'Mantenimiento y actualizaciones del sitio web', 150.00, 'monthly', '2024-01-01', '2024-01-01'),
-- (NULL, 'Hosting Anual', 'Servicio de hosting y dominio', 200.00, 'annual', '2024-01-01', '2024-01-01');

COMMENT ON TABLE recurring_invoices IS 'Facturas recurrentes para servicios como mantenimiento y hosting';
COMMENT ON TABLE recurring_payments IS 'Pagos generados automáticamente desde las facturas recurrentes';
COMMENT ON FUNCTION generate_recurring_payments() IS 'Genera automáticamente los pagos pendientes para facturas recurrentes activas';
COMMENT ON FUNCTION mark_overdue_payments() IS 'Marca como vencidos los pagos pendientes que han pasado su fecha de vencimiento';
