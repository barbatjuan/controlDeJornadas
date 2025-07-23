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

-- Crear tabla de fases de proyecto
CREATE TABLE IF NOT EXISTS project_phases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    amount DECIMAL(10,2),
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
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de ejemplo (opcional)
INSERT INTO projects (name, description, total_amount, status, start_date, deadline) VALUES
('Sitio Web Corporativo', 'Desarrollo completo de sitio web con diseño moderno y funcionalidades avanzadas', 2500.00, 'active', '2024-01-15', '2024-03-15'),
('App Mobile E-commerce', 'Aplicación móvil para tienda online con carrito de compras y pagos', 4500.00, 'active', '2024-02-01', '2024-05-01'),
('Sistema de Gestión', 'Sistema interno para gestión de inventario y ventas', 3200.00, 'paused', '2024-01-10', '2024-04-10');

-- Insertar fases de ejemplo para el primer proyecto
INSERT INTO project_phases (project_id, name, description, order_index, status, amount) 
SELECT 
    p.id,
    phase_name,
    phase_desc,
    phase_order,
    phase_status,
    phase_amount
FROM projects p,
(VALUES 
    ('Análisis y Diseño', 'Análisis de requerimientos y diseño de la interfaz', 1, 'completed', 625.00),
    ('Desarrollo Frontend', 'Implementación de la interfaz de usuario', 2, 'in_progress', 875.00),
    ('Desarrollo Backend', 'Implementación de la lógica del servidor', 3, 'pending', 750.00),
    ('Testing y Deploy', 'Pruebas finales y puesta en producción', 4, 'pending', 250.00)
) AS phases(phase_name, phase_desc, phase_order, phase_status, phase_amount)
WHERE p.name = 'Sitio Web Corporativo';

-- Insertar pagos de ejemplo
INSERT INTO project_payments (project_id, phase_id, amount, payment_date, status, notes)
SELECT 
    p.id,
    ph.id,
    625.00,
    '2024-01-20',
    'paid',
    'Pago inicial por análisis y diseño completado'
FROM projects p
JOIN project_phases ph ON ph.project_id = p.id
WHERE p.name = 'Sitio Web Corporativo' 
AND ph.name = 'Análisis y Diseño';

COMMENT ON TABLE projects IS 'Tabla para gestionar proyectos puntuales fuera del calendario';
COMMENT ON TABLE project_phases IS 'Fases o etapas de cada proyecto';
COMMENT ON TABLE project_payments IS 'Pagos y entregas de dinero por proyecto o fase';
