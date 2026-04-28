import type { Request, Response } from 'express';
import { calculateStats } from '../services/stats.js';
import type { StatsRequest } from '../models/matrix.js';

/**
 * POST /api/stats
 *
 * Recibe las matrices Q y R desde la Go API,
 * calcula estadísticas sobre sus valores y las devuelve.
 *
 * Body esperado: { Q: number[][], R: number[][] }
 */
export async function computeStats(req: Request, res: Response): Promise<void> {
  const { Q, R } = req.body as StatsRequest;

  // Validar que Q y R existan y sean arrays no vacíos
  if (!Q || !R || !Array.isArray(Q) || !Array.isArray(R)) {
    res.status(400).json({
      status: 400,
      message: "Se deben enviar las matrices 'Q' y 'R' en el body",
      data: null,
    });
    return;
  }

  if (Q.length === 0 || R.length === 0) {
    res.status(400).json({
      status: 400,
      message: "Las matrices 'Q' y 'R' no pueden estar vacías",
      data: null,
    });
    return;
  }

  const stats = calculateStats(Q, R);

  res.status(200).json({
    status: 200,
    message: 'Estadísticas calculadas exitosamente',
    data: stats,
  });
}