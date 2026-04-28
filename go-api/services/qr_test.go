package services

import (
	"math"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ── Helpers ────────────────────────────────────────────────────────────────────

// matricesEqual verifica que dos matrices sean iguales con tolerancia de error
func matricesEqual(t *testing.T, expected, actual [][]float64, tolerance float64) {
	t.Helper()
	require.Equal(t, len(expected), len(actual), "diferente número de filas")
	for i := range expected {
		require.Equal(t, len(expected[i]), len(actual[i]), "diferente número de columnas en fila %d", i)
		for j := range expected[i] {
			diff := math.Abs(expected[i][j] - actual[i][j])
			assert.LessOrEqual(t, diff, tolerance,
				"valor diferente en [%d][%d]: esperado %.6f, obtenido %.6f", i, j, expected[i][j], actual[i][j])
		}
	}
}

// multiplyMatrices multiplica dos matrices — usado para verificar A = Q * R
func multiplyMatrices(A, B [][]float64) [][]float64 {
	m := len(A)
	n := len(B[0])
	k := len(B)
	result := make([][]float64, m)
	for i := range result {
		result[i] = make([]float64, n)
		for j := 0; j < n; j++ {
			for l := 0; l < k; l++ {
				result[i][j] += A[i][l] * B[l][j]
			}
		}
	}
	return result
}

// ── Tests de QRDecomposition ───────────────────────────────────────────────────

// TestQR_BasicMatrix verifica la factorización de una matriz 3x2 básica
// y que la relación A = Q*R se cumpla
func TestQR_BasicMatrix(t *testing.T) {
	matrix := [][]float64{
		{1, 2},
		{3, 4},
		{5, 6},
	}

	Q, R, err := QRDecomposition(matrix)

	require.NoError(t, err, "no debe haber error con una matriz válida")
	require.NotNil(t, Q)
	require.NotNil(t, R)

	// Verificar dimensiones: Q debe ser 3x2, R debe ser 2x2
	assert.Equal(t, 3, len(Q), "Q debe tener 3 filas")
	assert.Equal(t, 2, len(Q[0]), "Q debe tener 2 columnas")
	assert.Equal(t, 2, len(R), "R debe tener 2 filas")
	assert.Equal(t, 2, len(R[0]), "R debe tener 2 columnas")

	// Verificar que A = Q * R (propiedad fundamental de la factorización QR)
	reconstructed := multiplyMatrices(Q, R)
	matricesEqual(t, matrix, reconstructed, 1e-6)
}

// TestQR_IdentityMatrix verifica que la factorización de la identidad
// produce Q=I y R=I
func TestQR_IdentityMatrix(t *testing.T) {
	matrix := [][]float64{
		{1, 0, 0},
		{0, 1, 0},
		{0, 0, 1},
	}

	Q, R, err := QRDecomposition(matrix)

	require.NoError(t, err)

	// Para la identidad Q = I y R = I
	matricesEqual(t, matrix, Q, 1e-6)
	matricesEqual(t, matrix, R, 1e-6)
}

// TestQR_SquareMatrix verifica la factorización de una matriz cuadrada 3x3
func TestQR_SquareMatrix(t *testing.T) {
	matrix := [][]float64{
		{1, 2, 0},
		{3, 1, 4},
		{1, 5, 9},
	}

	Q, R, err := QRDecomposition(matrix)

	require.NoError(t, err)

	// Verificar A = Q * R
	reconstructed := multiplyMatrices(Q, R)
	matricesEqual(t, matrix, reconstructed, 1e-6)

	// R debe ser triangular superior: elementos bajo la diagonal deben ser ~0
	for i := 1; i < len(R); i++ {
		for j := 0; j < i; j++ {
			assert.LessOrEqual(t, math.Abs(R[i][j]), 1e-6,
				"R[%d][%d] debe ser ~0 (triangular superior)", i, j)
		}
	}

	// Las columnas de Q deben ser ortonormales: Q^T * Q = I
	// Verificamos que cada columna tenga norma 1
	for j := 0; j < len(Q[0]); j++ {
		norm := 0.0
		for i := 0; i < len(Q); i++ {
			norm += Q[i][j] * Q[i][j]
		}
		assert.InDelta(t, 1.0, math.Sqrt(norm), 1e-6,
			"columna %d de Q debe tener norma 1", j)
	}
}

// TestQR_ErrorEmptyMatrix verifica que se retorna error con matriz vacía
func TestQR_ErrorEmptyMatrix(t *testing.T) {
	_, _, err := QRDecomposition([][]float64{})
	assert.Error(t, err, "debe retornar error con matriz vacía")
}

// TestQR_ErrorMoreColumnsThanRows verifica que m >= n es requerido
func TestQR_ErrorMoreColumnsThanRows(t *testing.T) {
	matrix := [][]float64{
		{1, 2, 3},
		{4, 5, 6},
	}
	_, _, err := QRDecomposition(matrix)
	assert.Error(t, err, "debe retornar error cuando n > m")
}

// TestQR_ErrorLinearlyDependentColumns verifica detección de rango deficiente
func TestQR_ErrorLinearlyDependentColumns(t *testing.T) {
	// Columnas linealmente dependientes
	matrix := [][]float64{
		{1, 2, 3},
		{4, 5, 6},
		{7, 8, 9},
		{10, 11, 12},
	}
	_, _, err := QRDecomposition(matrix)
	assert.Error(t, err, "debe retornar error con columnas linealmente dependientes")
}

// TestQR_ErrorInconsistentRowLengths verifica validación de filas con diferente largo
func TestQR_ErrorInconsistentRowLengths(t *testing.T) {
	matrix := [][]float64{
		{1, 2},
		{3, 4, 5}, // fila con diferente número de columnas
	}
	_, _, err := QRDecomposition(matrix)
	assert.Error(t, err, "debe retornar error con filas de diferente longitud")
}

// ── Tests de RoundMatrix ───────────────────────────────────────────────────────

// TestRoundMatrix verifica el redondeo de matrices
func TestRoundMatrix(t *testing.T) {
	matrix := [][]float64{
		{1.123456789, -2.987654321},
		{0.000000001, 3.141592653},
	}

	rounded := RoundMatrix(matrix, 4)

	assert.Equal(t, 1.1235, rounded[0][0])
	assert.Equal(t, -2.9877, rounded[0][1])
	assert.Equal(t, 0.0, rounded[1][0])
	assert.Equal(t, 3.1416, rounded[1][1])
}