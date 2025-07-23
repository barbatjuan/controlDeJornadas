-- Script para arreglar permisos y políticas de las tablas de proyectos
-- Esto permitirá eliminar fases, pagos y proyectos correctamente

-- Deshabilitar RLS temporalmente para configurar permisos
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments DISABLE ROW LEVEL SECURITY;

-- Otorgar permisos completos al usuario anónimo (para desarrollo)
-- En producción deberías usar políticas RLS más específicas
GRANT ALL ON projects TO anon;
GRANT ALL ON project_phases TO anon;
GRANT ALL ON project_payments TO anon;

GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_phases TO authenticated;
GRANT ALL ON project_payments TO authenticated;

-- Otorgar permisos de uso en las secuencias (para los UUIDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Si prefieres usar RLS (más seguro), descomenta las siguientes líneas:
/*
-- Habilitar RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (permitir todo para desarrollo)
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on project_phases" ON project_phases FOR ALL USING (true);
CREATE POLICY "Allow all operations on project_payments" ON project_payments FOR ALL USING (true);
*/

-- Verificar que las tablas existen y los permisos básicos
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%project%';

-- Verificar permisos específicos
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name LIKE '%project%'
ORDER BY table_name, grantee;
