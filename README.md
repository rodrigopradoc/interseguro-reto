# Interseguro – Coding Challenge

Solución al reto técnico Full Stack de Interseguro / Talsory.  
Implementación de factorización QR matricial con arquitectura de microservicios.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| API principal | Go 1.25 + Fiber v2 |
| API estadísticas | Node.js 20 + Express 5 + TypeScript |
| Frontend | Angular 17 (standalone components) |
| Base de datos | PostgreSQL 16 |
| Autenticación | JWT + bcrypt |
| Contenedores | Docker + Docker Compose |
| Testing | Go testing + testify · Jest + Supertest |

---

## Arquitectura

```
Angular (4200)
     │
     │  POST /auth/login
     │  POST /api/matrix/qr  [JWT]
     ▼
Go API (8080) ──────────────── PostgreSQL (5432)
     │          users table
     │  POST /api/stats  [JWT propagado]
     ▼
Node API (3000)
```

**Flujo completo:**
1. El usuario se autentica en la Go API — las credenciales se validan contra PostgreSQL con bcrypt
2. La Go API devuelve un JWT firmado
3. El frontend incluye el JWT en cada request
4. La Go API calcula la factorización QR usando Gram-Schmidt modificado
5. La Go API llama a la Node API propagando el JWT
6. La Node API valida el JWT y calcula estadísticas sobre las matrices Q y R
7. La respuesta completa (QR + estadísticas) llega al frontend

---

## Funcionalidad implementada

### Go API — Factorización QR
- Recibe una matriz rectangular `m × n` (con `m ≥ n`)
- Calcula la factorización QR usando **Gram-Schmidt modificado** (numéricamente más estable que el clásico)
- Devuelve `Q` (matriz ortogonal) y `R` (matriz triangular superior) tal que `A = Q · R`

### Node API — Estadísticas
Recibe las matrices Q y R y calcula:
- Valor máximo
- Valor mínimo
- Promedio
- Suma total
- Si Q es diagonal
- Si R es diagonal

### Seguridad
- Autenticación con JWT (HS256, expira en 24h)
- Contraseñas hasheadas con **bcrypt** (cost 12)
- Token propagado entre Go API y Node API
- CORS restringido al origen del frontend
- Mensajes de error genéricos para prevenir enumeración de usuarios

---

## Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Git

---

## Instalación y ejecución

### Con Docker

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/interseguro-challenge.git
cd interseguro-challenge

# 2. Crear el archivo de variables de entorno
cp .env.example .env
# Edita .env con tus valores si es necesario

# 3. Levantar todo el stack
docker compose up --build
```

Servicios disponibles:
- Frontend: http://localhost:4200
- Go API: http://localhost:8080
- Node API: http://localhost:3000
- PostgreSQL: localhost:5432

### Desarrollo local (sin Docker)

**Go API:**
```bash
cd go-api
go mod tidy
go run main.go
```

**Node API:**
```bash
cd node-api
npm install
npm run dev
```

**Frontend:**
```bash
cd web
npm install
ng serve
```

---

## Credenciales de prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | admin |
| user | user123 | viewer |

---

## Endpoints

### Go API (puerto 8080)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Estado del servicio |
| POST | `/auth/login` | No | Login — devuelve JWT |
| GET | `/auth/me` | JWT | Datos del usuario autenticado |
| POST | `/api/matrix/qr` | JWT | Factorización QR + estadísticas |
| POST | `/api/matrix/qr/only` | JWT | Solo factorización QR |

### Node API (puerto 3000)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Estado del servicio |
| POST | `/api/stats` | JWT | Estadísticas sobre matrices Q y R |

---

## Ejemplo de uso

**Login:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**Calcular QR:**
```bash
curl -X POST http://localhost:8080/api/matrix/qr \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"matrix": [[1,2],[3,4],[5,6]]}'
```

**Respuesta:**
```json
{
  "status": 200,
  "message": "Factorización QR y estadísticas calculadas exitosamente",
  "qr": {
    "Q": [[0.169031, 0.897085], [0.507093, 0.276026], [0.845154, -0.345033]],
    "R": [[5.91608, 7.437357], [0, 0.828079]]
  },
  "stats": {
    "max": 7.437357,
    "min": -0.345033,
    "average": 1.653087,
    "sum": 16.530872,
    "q_is_diagonal": false,
    "r_is_diagonal": false
  }
}
```

---

## Pruebas

**Go:**
```bash
cd go-api
go test ./... -v
```

**Node:**
```bash
cd node-api
npm test
```

| Suite | Pruebas | Estado |
|-------|---------|--------|
| Go — servicios QR | 8 unitarias | ✅ |
| Go — servicios JWT | 5 unitarias | ✅ |
| Go — handlers HTTP | 5 integración | ✅ |
| Node — estadísticas | 10 unitarias | ✅ |
| Node — endpoint /api/stats | 8 integración | ✅ |
| **Total** | **36** | **✅ 36/36** |

---

## Estructura del proyecto

```
interseguro-challenge/
├── go-api/                    # API en Go con Fiber
│   ├── database/              # Conexión y migraciones PostgreSQL
│   ├── handlers/              # Controllers HTTP
│   ├── middleware/            # JWT middleware
│   ├── models/                # Tipos de datos
│   ├── services/              # Lógica de negocio (QR, JWT)
│   └── main.go
├── node-api/                  # API en Node.js con Express
│   └── src/
│       ├── controllers/       # Manejo de requests
│       ├── middleware/        # JWT middleware
│       ├── models/            # Tipos TypeScript
│       ├── routes/            # Definición de rutas
│       └── services/         # Lógica y pruebas
├── web/                       # Frontend Angular 17
│   └── src/app/
│       └── app.component.ts   # Componente principal (standalone)
├── docker-compose.yml
├── .env.example
└── README.md
```