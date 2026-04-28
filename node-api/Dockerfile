# ── Etapa 1: Build ────────────────────────────────────────────────────────────
# Usamos Node 20 Alpine (versión ligera) para compilar TypeScript a JavaScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json primero para aprovechar cache de Docker.
# Si no cambiaron dependencias, npm install no se re-ejecuta en cada build.
COPY package*.json ./
RUN npm ci

# Copiar tsconfig y el código fuente
COPY tsconfig.json ./
COPY src ./src

# Compilar TypeScript → JavaScript (output en /app/dist)
RUN npm run build

# ── Etapa 2: Runtime ──────────────────────────────────────────────────────────
# Nueva imagen limpia — solo copiamos lo necesario para correr
FROM node:20-alpine

WORKDIR /app

# Copiar package.json para instalar SOLO dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el JavaScript compilado desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Puerto que expone la aplicación
EXPOSE 3000

# Correr el JavaScript compilado directamente con Node
# En producción no usamos ts-node ni tsx — solo el JS compilado
CMD ["node", "dist/index.js"]
