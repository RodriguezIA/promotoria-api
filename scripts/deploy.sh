#!/bin/bash
# Script de deploy manual para tu VPS
# Uso: ./scripts/deploy.sh

set -e

echo "🚀 Iniciando deploy de RetaiLink API..."

# 1. Actualizar código
echo "⬇️  Pull de cambios..."
git pull origin main

# 2. Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci

# 3. Generar Prisma client
echo "🗃️  Generando Prisma client..."
npx prisma generate

# 4. Build
echo "🔨 Compilando..."
npm run build

# 5. Reiniciar servicio
# Descomenta la opción que uses:

# Opción A: PM2
# pm2 restart retailink-api || pm2 start dist/index.js --name retailink-api

# Opción B: Systemd
# sudo systemctl restart retailink-api

# Opción C: Screen / tmux (más manual)
# echo "Recuerda reiniciar el proceso manualmente si usas screen/tmux"

echo "✅ Deploy completado"
