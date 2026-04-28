import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import matrixRoutes from './routes/matrix.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// ── Middlewares ────────────────────────────────────────────────────────────────

// Seguridad: añade headers HTTP recomendados (X-Content-Type-Options, etc.)
app.use(helmet());

// CORS: permite requests desde el frontend Angular y la Go API
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logger: registra cada request en consola con método, ruta y status
app.use(morgan('dev'));

// Parsear body JSON automáticamente
app.use(express.json());

// ── Rutas ──────────────────────────────────────────────────────────────────────

// Health check — para Docker y monitoreo
app.get('/health', (_req, res) => {
  res.json({
    status: 200,
    message: 'Node API funcionando correctamente',
    service: 'interseguro-node-api',
  });
});

// Rutas de matrices — prefijo /api
app.use('/api', matrixRoutes);

// Handler para rutas no encontradas
app.use((_req, res) => {
  res.status(404).json({
    status: 404,
    message: 'Ruta no encontrada',
  });
});

// ── Iniciar servidor ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Node API iniciando en puerto ${PORT}`);
});

export default app;