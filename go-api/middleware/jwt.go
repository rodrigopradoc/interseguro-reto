package middleware

import (
	"interseguro-go-api/services"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// JWTProtected es un middleware que verifica el token JWT en el header Authorization.
// Si el token es válido, guarda los claims en el contexto para que los handlers los usen.
// Si no hay token o es inválido, rechaza con 401.
//
// Uso: app.Use("/api", middleware.JWTProtected())
func JWTProtected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Obtener el header Authorization
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status":  401,
				"message": "Se requiere token de autorización. Incluye el header: Authorization: Bearer <token>",
			})
		}

		// El header debe tener el formato "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status":  401,
				"message": "Formato inválido. Usa: Authorization: Bearer <token>",
			})
		}

		tokenStr := parts[1]

		// Validar el token
		claims, err := services.ValidateToken(tokenStr)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"status":  401,
				"message": "Token inválido o expirado: " + err.Error(),
			})
		}

		// Guardar los datos del usuario en el contexto para los handlers
		c.Locals("username", claims.Username)
		c.Locals("role", claims.Role)

		// Token válido — continuar al siguiente handler
		return c.Next()
	}
}