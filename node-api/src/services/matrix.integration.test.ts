import request from 'supertest';
import express from 'express';
import { json } from 'express';
import matrixRoutes from '../routes/matrix.js';
import { generateTestToken } from './test-helpers.js';

// Crear app de prueba sin helmet ni morgan para simplificar
function createTestApp() {
  const app = express();
  app.use(json());
  app.use('/api', matrixRoutes);
  return app;
}

describe('POST /api/stats - pruebas de integración', () => {
  let app: express.Express;
  let validToken: string;

  beforeAll(() => {
    app = createTestApp();
    validToken = generateTestToken();
  });

  // ── Autenticación ──────────────────────────────────────────────────────────

  test('retorna 401 sin token de autorización', async () => {
    const res = await request(app)
      .post('/api/stats')
      .send({ Q: [[1, 0], [0, 1]], R: [[1, 0], [0, 1]] });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe(401);
  });

  test('retorna 401 con token inválido', async () => {
    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', 'Bearer token.invalido.aqui')
      .send({ Q: [[1, 0], [0, 1]], R: [[1, 0], [0, 1]] });

    expect(res.status).toBe(401);
  });

  test('retorna 401 con formato de header incorrecto', async () => {
    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', validToken) // sin "Bearer "
      .send({ Q: [[1, 0], [0, 1]], R: [[1, 0], [0, 1]] });

    expect(res.status).toBe(401);
  });

  // ── Requests válidas ───────────────────────────────────────────────────────

  test('retorna 200 con matrices válidas y token correcto', async () => {
    const Q = [[1, 0], [0, 1]];
    const R = [[2, 3], [0, 4]];

    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ Q, R });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.max).toBe(4);
    expect(res.body.data.min).toBe(0);
    expect(res.body.data.sum).toBe(11);
  });

  test('retorna estadísticas correctas para la identidad', async () => {
    const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ Q: I, R: I });

    expect(res.status).toBe(200);
    expect(res.body.data.q_is_diagonal).toBe(true);
    expect(res.body.data.r_is_diagonal).toBe(true);
    expect(res.body.data.max).toBe(1);
    expect(res.body.data.min).toBe(0);
  });

  // ── Validación de entrada ──────────────────────────────────────────────────

  test('retorna 400 sin campo Q', async () => {
    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ R: [[1, 0], [0, 1]] });

    expect(res.status).toBe(400);
  });

  test('retorna 400 sin campo R', async () => {
    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ Q: [[1, 0], [0, 1]] });

    expect(res.status).toBe(400);
  });

  test('retorna 400 con matrices vacías', async () => {
    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ Q: [], R: [] });

    expect(res.status).toBe(400);
  });

  test('retorna 400 con body vacío', async () => {
    const res = await request(app)
      .post('/api/stats')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(res.status).toBe(400);
  });
});