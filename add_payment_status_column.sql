-- Migración para agregar la columna payment_status a recurring_invoices
-- Ejecutar este script en Supabase SQL Editor

-- Agregar la columna payment_status si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recurring_invoices' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE recurring_invoices 
        ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid'));
        
        -- Agregar comentario a la columna
        COMMENT ON COLUMN recurring_invoices.payment_status IS 'Estado de pago de la factura recurrente: pending o paid';
        
        RAISE NOTICE 'Columna payment_status agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna payment_status ya existe';
    END IF;
END $$;

-- Actualizar facturas existentes para que tengan un estado de pago por defecto
UPDATE recurring_invoices 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;
