# ── Etapa 1: Build ────────────────────────────────────────────────────────────
# Usamos la imagen oficial de Go para compilar el binario.
# "builder" es un alias que usaremos en la siguiente etapa.
FROM golang:alpine AS builder

# Instalar git (necesario para go mod download en algunos casos)
RUN apk add --no-cache git

# Definir el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar primero solo go.mod y go.sum para aprovechar el cache de Docker.
# Si no cambiaron las dependencias, Docker no las re-descarga en cada build.
COPY go.mod go.sum ./
RUN go mod download

# Copiar el resto del código fuente
COPY . .

# Compilar el binario. Flags de optimización:
# CGO_ENABLED=0  → binario estático, sin dependencias del sistema
# GOOS=linux     → compilar para Linux (el contenedor final)
# -ldflags="-s -w" → eliminar símbolos de debug para reducir tamaño
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o main .

# ── Etapa 2: Runtime ──────────────────────────────────────────────────────────
# Usamos una imagen mínima (alpine) para correr el binario.
# El resultado final es mucho más pequeño que si usáramos la imagen de Go completa.
FROM alpine:3.19

# Certificados SSL necesarios para que Go pueda hacer llamadas HTTPS
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copiar SOLO el binario compilado desde la etapa anterior
# Esto es un "multi-stage build" — la imagen final no tiene Go instalado
COPY --from=builder /app/main .

# Puerto que expone la aplicación
EXPOSE 8080

# Comando que se ejecuta al iniciar el contenedor
CMD ["./main"]
