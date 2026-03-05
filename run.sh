#!/bin/bash

# --- Configuración de colores para la terminal ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando el ecosistema de SeatMapBuilder...${NC}"

# Función para limpiar procesos al salir (CTRL+C)
cleanup() {
    echo -e "\n${BLUE}🛑 Apagando servicios...${NC}"
    kill $BACKEND_PID $FRONTEND_PID
    sleep 5
    exit
}

# Trap para capturar la interrupción de la terminal
trap cleanup SIGINT

# 1. Iniciar el Backend
echo -e "${GREEN}📡 Levantando Backend en carpeta /backend...${NC}"
cd backend
npm run dev & 
BACKEND_PID=$!
cd ..

# 2. Iniciar el Frontend
echo -e "${GREEN}💻 Levantando Frontend en la raíz...${NC}"
cd frontend
npm run dev &
FRONTEND_PID=$!

echo -e "${BLUE}✅ Ambos servicios están corriendo.${NC}"
echo -e "Backend PID: $BACKEND_PID"
echo -e "Frontend PID: $FRONTEND_PID"
echo -e "Presioná ${GREEN}CTRL+C${NC} para detener todo."

# Mantener el script vivo para que el trap funcione
wait