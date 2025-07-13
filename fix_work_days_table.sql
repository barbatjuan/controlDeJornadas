-- Script para añadir un ID único a la tabla work_days y permitir múltiples registros por fecha

-- Primero, eliminamos la restricción de clave primaria existente en la columna date
ALTER TABLE work_days DROP CONSTRAINT IF EXISTS work_days_pkey;

-- Añadimos una columna id que se autogenere si no existe ya
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_days' AND column_name = 'id') THEN
    ALTER TABLE work_days ADD COLUMN id SERIAL PRIMARY KEY;
  ELSE
    -- Si la columna ya existe, nos aseguramos de que sea la clave primaria
    ALTER TABLE work_days ADD PRIMARY KEY (id);
  END IF;
END
$$;

-- Creamos un índice para optimizar las búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_work_days_date ON work_days(date);

-- Verificamos y asignamos is_second_entry para registros duplicados existentes
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
    
    -- Para cada fecha duplicada, marcamos uno como registro secundario
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
