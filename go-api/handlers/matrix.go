package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"interseguro-go-api/models"
	"interseguro-go-api/services"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
)

// MatrixHandler agrupa los handlers relacionados con operaciones de matrices
type MatrixHandler struct{}

// NewMatrixHandler crea una nueva instancia de MatrixHandler
func NewMatrixHandler() *MatrixHandler {
	return &MatrixHandler{}
}

// ComputeQR recibe una matriz, calcula QR, llama a Node API y devuelve todo.
// Requiere token JWT válido (aplicado por el middleware en main.go).
//
// POST /api/matrix/qr
// Header: Authorization: Bearer <token>
func (h *MatrixHandler) ComputeQR(c *fiber.Ctx) error {
	var input models.MatrixInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  400,
			"message": "Body inválido: " + err.Error(),
		})
	}

	if len(input.Matrix) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  400,
			"message": "Se debe enviar una matriz no vacía en el campo 'matrix'",
		})
	}

	Q, R, err := services.QRDecomposition(input.Matrix)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{
			"status":  422,
			"message": "Error al calcular la factorización QR: " + err.Error(),
		})
	}

	Q = services.RoundMatrix(Q, 6)
	R = services.RoundMatrix(R, 6)

	// Propagar el token JWT a la Node API
	// El token ya fue validado por el middleware — lo extraemos del header
	authHeader := c.Get("Authorization")

	stats, err := h.fetchStatsFromNodeAPI(Q, R, authHeader)
	if err != nil {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"status":  200,
			"message": "QR exitoso. Advertencia: no se pudieron obtener estadísticas: " + err.Error(),
			"qr":      models.QRResult{Q: Q, R: R},
			"stats":   nil,
		})
	}

	return c.Status(fiber.StatusOK).JSON(models.FullResponse{
		Status:  200,
		Message: "Factorización QR y estadísticas calculadas exitosamente",
		QR:      models.QRResult{Q: Q, R: R},
		Stats:   stats,
	})
}

// GetQROnly calcula solo la factorización QR sin llamar a Node API.
//
// POST /api/matrix/qr/only
// Header: Authorization: Bearer <token>
func (h *MatrixHandler) GetQROnly(c *fiber.Ctx) error {
	var input models.MatrixInput
	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  400,
			"message": "Body inválido: " + err.Error(),
		})
	}

	if len(input.Matrix) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  400,
			"message": "Se debe enviar una matriz no vacía",
		})
	}

	Q, R, err := services.QRDecomposition(input.Matrix)
	if err != nil {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{
			"status":  422,
			"message": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(models.QRResponse{
		Status:  200,
		Message: "Factorización QR calculada exitosamente",
		Data:    models.QRResult{Q: services.RoundMatrix(Q, 6), R: services.RoundMatrix(R, 6)},
	})
}

// fetchStatsFromNodeAPI llama a la Node API enviando el token JWT en el header.
// Así Node también puede validar que la request viene de una fuente autorizada.
func (h *MatrixHandler) fetchStatsFromNodeAPI(Q, R [][]float64, authHeader string) (models.StatsData, error) {
	nodeAPIURL := os.Getenv("NODE_API_URL")
	if nodeAPIURL == "" {
		nodeAPIURL = "http://localhost:3000"
	}

	payload := models.StatsRequest{Q: Q, R: R}
	body, err := json.Marshal(payload)
	if err != nil {
		return models.StatsData{}, fmt.Errorf("error serializando payload: %w", err)
	}

	req, err := http.NewRequest("POST", nodeAPIURL+"/api/stats", bytes.NewBuffer(body))
	if err != nil {
		return models.StatsData{}, fmt.Errorf("error creando request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	// Propagar el token JWT al servicio Node
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return models.StatsData{}, fmt.Errorf("error contactando Node API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == 401 {
		return models.StatsData{}, fmt.Errorf("Node API rechazó el token (401)")
	}

	var statsResponse models.StatsResponse
	if err := json.NewDecoder(resp.Body).Decode(&statsResponse); err != nil {
		return models.StatsData{}, fmt.Errorf("error parseando respuesta de Node API: %w", err)
	}

	return statsResponse.Data, nil
}