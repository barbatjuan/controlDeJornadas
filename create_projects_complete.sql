-- Script completo para crear tablas de proyectos con campo de porcentaje incluido
-- Este script es seguro de ejecutar múltiples veces (usa IF NOT EXISTS)

-- Crear tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    start_date DATE NOT NULL,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de fases de proyecto (YA INCLUYE EL CAMPO PERCENTAGE)
CREATE TABLE IF NOT EXISTS project_phases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    amount DECIMAL(10,2),
    percentage DECIMAL(5,2) DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de pagos de proyecto
CREATE TABLE IF NOT EXISTS project_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);

CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_order ON project_phases(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON project_phases(status);
CREATE INDEX IF NOT EXISTS idx_project_phases_percentage ON project_phases(percentage);

CREATE INDEX IF NOT EXISTS idx_project_payments_project_id ON project_payments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_phase_id ON project_payments(phase_id);
CREATE INDEX IF NOT EXISTS idx_project_payments_status ON project_payments(status);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

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

-- Comentarios para documentar las tablas
COMMENT ON TABLE projects IS 'Tabla para gestionar proyectos puntuales fuera del calendario';
COMMENT ON TABLE project_phases IS 'Fases o etapas de cada proyecto';
COMMENT ON TABLE project_payments IS 'Pagos y entregas de dinero por proyecto o fase';
COMMENT ON COLUMN project_phases.percentage IS 'Porcentaje que representa esta fase del proyecto total (0-100)';

-- Verificar que las tablas se crearon correctamente
SELECT 'projects' as tabla, COUNT(*) as registros FROM projects
UNION ALL
SELECT 'project_phases' as tabla, COUNT(*) as registros FROM project_phases  
UNION ALL
SELECT 'project_payments' as tabla, COUNT(*) as registros FROM project_payments;
