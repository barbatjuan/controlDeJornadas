-- Script para corregir la estructura de la tabla work_days
-- y permitir múltiples registros por fecha (pagos múltiples)

-- Primero, eliminamos la restricción de clave primaria existente en la columna date
ALTER TABLE work_days DROP CONSTRAINT IF EXISTS work_days_pkey;

-- Asumiendo que la tabla ya tiene una columna id de tipo SERIAL o UUID
-- Si no existiera, la añadimos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_days' AND column_name = 'id') THEN
    ALTER TABLE work_days ADD COLUMN id SERIAL PRIMARY KEY;
  ELSE
    -- Si la columna ya existe, la convertimos en clave primaria
    ALTER TABLE work_days ADD PRIMARY KEY (id);
  END IF;
END
$$;

-- Creamos un índice compuesto para optimizar las búsquedas por date + is_second_entry
CREATE INDEX IF NOT EXISTS idx_work_days_date_second ON work_days(date, is_second_entry);

-- Creamos una restricción única para garantizar que solo haya un registro primario
-- y un registro secundario por fecha
ALTER TABLE work_days
  ADD CONSTRAINT uq_work_days_date_second
  UNIQUE (date, is_second_entry);

-- Verificamos y corregimos datos existentes para prevenir duplicados
DO $$
DECLARE
  duplicate_dates text[];
BEGIN
  SELECT ARRAY_AGG(date::text)
  INTO duplicate_dates
  FROM (
    SELECT date, COUNT(*) as cnt
    FROM work_days
    GROUP BY date
    HAVING COUNT(*) > 1
  ) subquery;

  IF duplicate_dates IS NOT NULL AND array_length(duplicate_dates, 1) > 0 THEN
    RAISE NOTICE 'Se encontraron fechas duplicadas: %', duplicate_dates;
    
    -- Para cada fecha duplicada, dejamos un registro como primario y otro como secundario
    FOR i IN 1..array_length(duplicate_dates, 1) LOOP
      UPDATE work_days 
      SET is_second_entry = true
      WHERE id IN (
        SELECT id FROM work_days 
        WHERE date = duplicate_dates[i]::date 
        ORDER BY id DESC 
        LIMIT 1
      );
    END LOOP;
  END IF;
END
$$;
