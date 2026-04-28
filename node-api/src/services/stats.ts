import type { StatsData } from '../models/matrix.js';

/**
 * Aplana una lista de matrices en un solo array de números.
 * Ej: [[[1,2],[3,4]], [[5,6],[7,8]]] → [1,2,3,4,5,6,7,8]
 */
function flattenMatrices(matrices: number[][][]): number[] {
  return matrices.flat(2);
}

/**
 * Verifica si una matriz es diagonal.
 * Una matriz es diagonal si todos los elementos fuera de la diagonal principal son cero.
 * Solo aplica a matrices cuadradas — las no cuadradas se consideran no diagonales.
 */
function isDiagonal(matrix: number[][]): boolean {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;

  // Una matriz no cuadrada no puede ser diagonal
  if (rows !== cols) return false;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Si el elemento no está en la diagonal principal y no es cero → no es diagonal
      if (i !== j && Math.abs(matrix[i]![j]!) > 1e-10) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Calcula todas las estadísticas requeridas sobre las matrices Q y R:
 * - Valor máximo
 * - Valor mínimo
 * - Promedio
 * - Suma total
 * - Si Q es diagonal
 * - Si R es diagonal
 */
export function calculateStats(Q: number[][], R: number[][]): StatsData {
  const allValues = flattenMatrices([Q, R]);

  if (allValues.length === 0) {
    return { max: 0, min: 0, average: 0, sum: 0, q_is_diagonal: false, r_is_diagonal: false };
  }

  const sum = allValues.reduce((acc, val) => acc + val, 0);

  return {
    max: Math.max(...allValues),
    min: Math.min(...allValues),
    average: sum / allValues.length,
    sum,
    q_is_diagonal: isDiagonal(Q),
    r_is_diagonal: isDiagonal(R),
  };
}