package handlers

import (
	"database/sql"
	"interseguro-go-api/database"
	"interseguro-go-api/models"
	"interseguro-go-api/services"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler agrupa los handlers de autenticación
type AuthHandler struct{}

// NewAuthHandler crea una nueva instancia de AuthHandler
func NewAuthHandler() *AuthHandler {
	return &AuthHandler{}
}

// Login valida credenciales contra PostgreSQL y devuelve un JWT si son correctas.
//
// POST /auth/login
// Body: { "username": "admin", "password": "admin123" }
//
// Seguridad:
//   - La contraseña nunca se compara en texto plano
//   - Se usa bcrypt.CompareHashAndPassword para la comparación
//   - El hash nunca aparece en la respuesta (json:"-" en el modelo)
//   - El mensaje de error es genérico para no revelar si el usuario existe
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var input models.LoginInput

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  400,
			"message": "Body inválido",
		})
	}

	if input.Username == "" || input.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"status":  400,
			"message": "Se requieren username y password",
		})
	}

	// Buscar usuario en PostgreSQL
	var user models.User
	err := database.DB.QueryRow(
		"SELECT id, username, password_hash, role FROM users WHERE username = $1",
		input.Username,
	).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role)

	if err == sql.ErrNoRows {
		// Mensaje genérico — no revelar que el usuario no existe
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status":  401,
			"message": "Credenciales incorrectas",
		})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  500,
			"message": "Error interno del servidor",
		})
	}

	// Comparar contraseña con el hash almacenado usando bcrypt
	// bcrypt.CompareHashAndPassword es tiempo-constante (previene timing attacks)
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"status":  401,
			"message": "Credenciales incorrectas",
		})
	}

	// Credenciales válidas — generar JWT
	token, err := services.GenerateToken(user.Username, user.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"status":  500,
			"message": "Error generando el token",
		})
	}

	response := models.LoginResponse{
		Status:  200,
		Message: "Login exitoso",
		Token:   token,
	}
	response.User.Username = user.Username
	response.User.Role = user.Role

	return c.Status(fiber.StatusOK).JSON(response)
}

// Me devuelve la información del usuario autenticado desde el contexto JWT.
//
// GET /auth/me
// Header: Authorization: Bearer <token>
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	username := c.Locals("username")
	role := c.Locals("role")

	return c.JSON(fiber.Map{
		"status": 200,
		"user": fiber.Map{
			"username": username,
			"role":     role,
		},
	})
}