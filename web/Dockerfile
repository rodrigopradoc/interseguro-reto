# ── Etapa 1: Build ────────────────────────────────────────────────────────────
# Compilamos la app Angular en archivos estáticos optimizados
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar dependencias primero para aprovechar cache de Docker
COPY package*.json ./
RUN npm ci

# Copiar el resto del código y compilar en modo producción
COPY . .
RUN npm run build

# ── Etapa 2: Runtime ──────────────────────────────────────────────────────────
# Usamos nginx para servir los archivos estáticos.
# Nginx es mucho más eficiente que Node para servir contenido estático.
FROM nginx:alpine

# Copiar los archivos compilados al directorio de nginx
# Angular 17 por defecto compila en dist/web/browser
COPY --from=builder /app/dist/web/browser /usr/share/nginx/html

# Copiar configuración personalizada de nginx
# Necesaria para que el routing de Angular (SPA) funcione correctamente
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
