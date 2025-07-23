#!/bin/bash

# Script para ejecutar el SQL en Supabase
# Reemplaza estas variables con tus datos de conexión de Supabase

# Obtener la cadena de conexión desde Supabase Dashboard > Settings > Database
# Ejemplo: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

echo "Para ejecutar el SQL en Supabase:"
echo "1. Ve a tu proyecto en supabase.com"
echo "2. Settings > Database > Connection string"
echo "3. Copia la cadena de conexión"
echo "4. Ejecuta: psql 'tu-cadena-de-conexion' -f create_projects_tables.sql"
echo ""
echo "O usa el SQL Editor en el dashboard de Supabase (más fácil)"
