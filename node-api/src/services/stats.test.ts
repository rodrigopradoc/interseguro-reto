import { calculateStats } from '../services/stats.js';

describe('calculateStats - pruebas unitarias', () => {

  // ── Valores básicos ────────────────────────────────────────────────────────

  test('calcula correctamente max, min, promedio y suma', () => {
    const Q = [[1, 0], [0, 1]];
    const R = [[2, 3], [0, 4]];

    const stats = calculateStats(Q, R);

    expect(stats.max).toBe(4);
    expect(stats.min).toBe(0);
    expect(stats.sum).toBe(11);
    expect(stats.average).toBeCloseTo(11 / 8, 5);
  });

  test('detecta valores negativos correctamente', () => {
    const Q = [[-1, 2], [3, -4]];
    const R = [[5, 0], [0, 6]];

    const stats = calculateStats(Q, R);

    expect(stats.min).toBe(-4);
    expect(stats.max).toBe(6);
  });

  test('calcula suma total correctamente', () => {
    const Q = [[1, 1], [1, 1]];
    const R = [[1, 1], [1, 1]];

    const stats = calculateStats(Q, R);

    expect(stats.sum).toBe(8);
    expect(stats.average).toBe(1);
  });

  // ── Matriz diagonal ────────────────────────────────────────────────────────

  test('detecta correctamente que la identidad es diagonal', () => {
    const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

    const stats = calculateStats(I, I);

    expect(stats.q_is_diagonal).toBe(true);
    expect(stats.r_is_diagonal).toBe(true);
  });

  test('detecta correctamente que una matriz no es diagonal', () => {
    const Q = [[0.169, 0.897], [0.507, 0.276], [0.845, -0.345]];
    const R = [[5.916, 7.437], [0, 0.828]];

    const stats = calculateStats(Q, R);

    expect(stats.q_is_diagonal).toBe(false);
    // R triangular superior NO es diagonal porque tiene elementos fuera de diagonal
    expect(stats.r_is_diagonal).toBe(false);
  });

  test('matriz diagonal con valores distintos de 1 es detectada', () => {
    const D = [[5, 0], [0, 3]];
    const I = [[1, 0], [0, 1]];

    const stats = calculateStats(D, I);

    expect(stats.q_is_diagonal).toBe(true);
    expect(stats.r_is_diagonal).toBe(true);
  });

  test('matriz no cuadrada nunca es diagonal', () => {
    const Q = [[1, 0], [0, 1], [0, 0]]; // 3x2 no es cuadrada
    const R = [[1, 0], [0, 1]];

    const stats = calculateStats(Q, R);

    expect(stats.q_is_diagonal).toBe(false);
  });

  // ── Casos borde ────────────────────────────────────────────────────────────

  test('maneja matrices con un solo elemento', () => {
    const Q = [[5]];
    const R = [[3]];

    const stats = calculateStats(Q, R);

    expect(stats.max).toBe(5);
    expect(stats.min).toBe(3);
    expect(stats.sum).toBe(8);
    expect(stats.average).toBe(4);
    expect(stats.q_is_diagonal).toBe(true);
    expect(stats.r_is_diagonal).toBe(true);
  });

  test('maneja matrices con todos ceros', () => {
    const Q = [[0, 0], [0, 0]];
    const R = [[0, 0], [0, 0]];

    const stats = calculateStats(Q, R);

    expect(stats.max).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.sum).toBe(0);
    expect(stats.average).toBe(0);
  });

  test('maneja valores de punto flotante con precisión', () => {
    const Q = [[0.169031, 0.897085], [0.507093, 0.276026]];
    const R = [[5.91608, 7.437357], [0, 0.828079]];

    const stats = calculateStats(Q, R);

    expect(stats.max).toBeCloseTo(7.437357, 4);
    expect(stats.min).toBeCloseTo(0, 4);
  });
});