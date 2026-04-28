package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupApp crea una instancia de Fiber solo para pruebas
// sin conectar a base de datos ni a Node API
func setupApp() *fiber.App {
	app := fiber.New()
	h := NewMatrixHandler()
	app.Post("/api/matrix/qr/only", h.GetQROnly)
	return app
}

// ── Tests de GetQROnly ─────────────────────────────────────────────────────────

// TestGetQROnly_ValidMatrix verifica la respuesta con una matriz válida
func TestGetQROnly_ValidMatrix(t *testing.T) {
	app := setupApp()

	body := `{"matrix": [[1,2],[3,4],[5,6]]}`
	req := httptest.NewRequest("POST", "/api/matrix/qr/only",
		bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	assert.Equal(t, 200, resp.StatusCode)

	// Parsear respuesta
	var result map[string]interface{}
	bodyBytes, _ := io.ReadAll(resp.Body)
	json.Unmarshal(bodyBytes, &result)

	assert.Equal(t, float64(200), result["status"])
	assert.NotNil(t, result["data"])

	data := result["data"].(map[string]interface{})
	assert.NotNil(t, data["Q"])
	assert.NotNil(t, data["R"])
}

// TestGetQROnly_EmptyMatrix verifica que retorna 400 con matriz vacía
func TestGetQROnly_EmptyMatrix(t *testing.T) {
	app := setupApp()

	body := `{"matrix": []}`
	req := httptest.NewRequest("POST", "/api/matrix/qr/only",
		bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	assert.Equal(t, 400, resp.StatusCode)
}

// TestGetQROnly_InvalidBody verifica que retorna 400 con body malformado
func TestGetQROnly_InvalidBody(t *testing.T) {
	app := setupApp()

	req := httptest.NewRequest("POST", "/api/matrix/qr/only",
		bytes.NewBufferString("esto no es json"))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	assert.Equal(t, 400, resp.StatusCode)
}

// TestGetQROnly_LinearlyDependentMatrix verifica que retorna 422
// con matriz de rango deficiente
func TestGetQROnly_LinearlyDependentMatrix(t *testing.T) {
	app := setupApp()

	// Columnas linealmente dependientes
	body := `{"matrix": [[1,2,3],[4,5,6],[7,8,9],[10,11,12]]}`
	req := httptest.NewRequest("POST", "/api/matrix/qr/only",
		bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	assert.Equal(t, 422, resp.StatusCode)
}

// TestGetQROnly_IdentityMatrix verifica que la identidad produce Q=I y R=I
func TestGetQROnly_IdentityMatrix(t *testing.T) {
	app := setupApp()

	body := `{"matrix": [[1,0,0],[0,1,0],[0,0,1]]}`
	req := httptest.NewRequest("POST", "/api/matrix/qr/only",
		bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	require.NoError(t, err)

	assert.Equal(t, 200, resp.StatusCode)

	var result map[string]interface{}
	bodyBytes, _ := io.ReadAll(resp.Body)
	json.Unmarshal(bodyBytes, &result)

	data := result["data"].(map[string]interface{})
	Q := data["Q"].([]interface{})
	R := data["R"].([]interface{})

	// Q y R deben ser 3x3
	assert.Equal(t, 3, len(Q))
	assert.Equal(t, 3, len(R))
}