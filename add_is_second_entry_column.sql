-- Script para añadir la columna is_second_entry a la tabla work_days
ALTER TABLE work_days ADD COLUMN is_second_entry BOOLEAN DEFAULT false;

-- Actualizar registros existentes para asegurar que el valor por defecto es false
UPDATE work_days SET is_second_entry = false WHERE is_second_entry IS NULL;
