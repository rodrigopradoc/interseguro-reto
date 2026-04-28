package services

import (
	"errors"
	"math"
)

// QRDecomposition realiza la factorización QR de una matriz usando
// el proceso de Gram-Schmidt modificado.
//
// Dada una matriz A (m x n), devuelve:
//   - Q: matriz ortogonal (m x n) donde las columnas son vectores ortonormales
//   - R: matriz triangular superior (n x n)
//
// La relación garantizada es: A = Q * R
//
// Se usa Gram-Schmidt modificado (en lugar del clásico) porque es
// numéricamente más estable — importante mencionarlo en la entrevista.
func QRDecomposition(matrix [][]float64) ([][]float64, [][]float64, error) {
	m := len(matrix) // filas
	if m == 0 {
		return nil, nil, errors.New("la matriz no puede estar vacía")
	}
	n := len(matrix[0]) // columnas

	// Validar que todas las filas tengan el mismo número de columnas
	for i, row := range matrix {
		if len(row) != n {
			return nil, nil, errors.New("todas las filas deben tener el mismo número de columnas")
		}
		_ = i
	}

	if m < n {
		return nil, nil, errors.New("la matriz debe tener al menos tantas filas como columnas (m >= n)")
	}

	// Copiar la matriz original para no modificarla (trabajamos sobre A)
	A := make([][]float64, m)
	for i := range A {
		A[i] = make([]float64, n)
		copy(A[i], matrix[i])
	}

	// Inicializar Q (m x n) y R (n x n) con ceros
	Q := makeMatrix(m, n)
	R := makeMatrix(n, n)

	// Gram-Schmidt modificado
	for j := 0; j < n; j++ {
		// Extraer la columna j de A como vector
		v := extractColumn(A, m, j)

		// Ortogonalizar contra los vectores anteriores de Q
		for i := 0; i < j; i++ {
			qi := extractColumn(Q, m, i)
			// R[i][j] = Q[:,i] · A[:,j]
			R[i][j] = dotProduct(qi, v)
			// v = v - R[i][j] * Q[:,i]
			v = subtractScaled(v, qi, R[i][j])
		}

		// R[j][j] = norma del vector v
		norm := vectorNorm(v)
		if norm < 1e-10 {
			return nil, nil, errors.New("la matriz tiene columnas linealmente dependientes (rango deficiente)")
		}

		R[j][j] = norm

		// Q[:,j] = v / ||v||  (normalizar)
		for i := 0; i < m; i++ {
			Q[i][j] = v[i] / norm
		}
	}

	return Q, R, nil
}

// --- Funciones auxiliares del servicio ---

// makeMatrix crea una matriz de ceros de dimensión rows x cols
func makeMatrix(rows, cols int) [][]float64 {
	m := make([][]float64, rows)
	for i := range m {
		m[i] = make([]float64, cols)
	}
	return m
}

// extractColumn extrae la columna col de una matriz como un slice
func extractColumn(matrix [][]float64, rows, col int) []float64 {
	v := make([]float64, rows)
	for i := 0; i < rows; i++ {
		v[i] = matrix[i][col]
	}
	return v
}

// dotProduct calcula el producto punto de dos vectores
func dotProduct(a, b []float64) float64 {
	sum := 0.0
	for i := range a {
		sum += a[i] * b[i]
	}
	return sum
}

// vectorNorm calcula la norma euclidiana (L2) de un vector
func vectorNorm(v []float64) float64 {
	return math.Sqrt(dotProduct(v, v))
}

// subtractScaled devuelve v - scalar * u (sin modificar los originales)
func subtractScaled(v, u []float64, scalar float64) []float64 {
	result := make([]float64, len(v))
	for i := range v {
		result[i] = v[i] - scalar*u[i]
	}
	return result
}

// RoundMatrix redondea todos los valores de una matriz a 'decimals' decimales.
// Se usa para limpiar errores de punto flotante antes de enviar la respuesta.
func RoundMatrix(matrix [][]float64, decimals int) [][]float64 {
	factor := math.Pow(10, float64(decimals))
	result := makeMatrix(len(matrix), len(matrix[0]))
	for i, row := range matrix {
		for j, val := range row {
			result[i][j] = math.Round(val*factor) / factor
		}
	}
	return result
}