-- Agregar campo de porcentaje a las fases de proyecto
ALTER TABLE project_phases 
ADD COLUMN IF NOT EXISTS percentage DECIMAL(5,2) DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100);

-- Comentario para explicar el campo
COMMENT ON COLUMN project_phases.percentage IS 'Porcentaje que representa esta fase del proyecto total (0-100)';

-- Crear índice para consultas por porcentaje
CREATE INDEX IF NOT EXISTS idx_project_phases_percentage ON project_phases(percentage);

-- Función para validar que los porcentajes de un proyecto sumen 100%
CREATE OR REPLACE FUNCTION validate_project_phases_percentage()
RETURNS TRIGGER AS $$
DECLARE
    total_percentage DECIMAL(5,2);
BEGIN
    -- Calcular el total de porcentajes para el proyecto
    SELECT COALESCE(SUM(percentage), 0) INTO total_percentage
    FROM project_phases 
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id);
    
    -- Solo mostrar advertencia si supera 100%, pero no bloquear
    IF total_percentage > 100 THEN
        RAISE NOTICE 'Advertencia: Los porcentajes del proyecto suman %.2f%%, que supera el 100%%', total_percentage;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar porcentajes (solo advertencia, no bloquea)
DROP TRIGGER IF EXISTS validate_percentage_trigger ON project_phases;
CREATE TRIGGER validate_percentage_trigger
    AFTER INSERT OR UPDATE OR DELETE ON project_phases
    FOR EACH ROW
    EXECUTE FUNCTION validate_project_phases_percentage();

-- Actualizar fases existentes con porcentajes por defecto
-- (Solo si hay datos, de lo contrario no hace nada)
UPDATE project_phases 
SET percentage = CASE 
    WHEN (SELECT COUNT(*) FROM project_phases p2 WHERE p2.project_id = project_phases.project_id) > 0 
    THEN 100.0 / (SELECT COUNT(*) FROM project_phases p2 WHERE p2.project_id = project_phases.project_id)
    ELSE 0
END
WHERE percentage = 0;
