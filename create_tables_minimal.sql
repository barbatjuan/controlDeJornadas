-- Script mínimo para crear solo las tablas básicas
-- Ejecutar en Supabase SQL Editor

-- Eliminar tablas si existen (para empezar limpio)
DROP TABLE IF EXISTS recurring_payments CASCADE;
DROP TABLE IF EXISTS recurring_invoices CASCADE;

-- Tabla para facturas recurrentes
CREATE TABLE recurring_invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    recurrence_type VARCHAR(20) NOT NULL CHECK (recurrence_type IN ('monthly', 'quarterly', 'biannual', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    auto_generate BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para pagos de facturas recurrentes
CREATE TABLE recurring_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recurring_invoice_id UUID NOT NULL REFERENCES recurring_invoices(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    due_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices básicos
CREATE INDEX idx_recurring_invoices_client_id ON recurring_invoices(client_id);
CREATE INDEX idx_recurring_invoices_status ON recurring_invoices(status);
CREATE INDEX idx_recurring_payments_invoice_id ON recurring_payments(recurring_invoice_id);
CREATE INDEX idx_recurring_payments_status ON recurring_payments(status);

-- Verificar que las tablas se crearon
SELECT 'recurring_invoices' as table_name, COUNT(*) as row_count FROM recurring_invoices
UNION ALL
SELECT 'recurring_payments' as table_name, COUNT(*) as row_count FROM recurring_payments;
