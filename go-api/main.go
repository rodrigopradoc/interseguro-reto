package main

import (
	"interseguro-go-api/database"
	"interseguro-go-api/handlers"
	"interseguro-go-api/middleware"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// ── Conectar a PostgreSQL ──────────────────────────────────────────────────
	database.Connect()
	database.Seed()

	// ── Inicializar Fiber ──────────────────────────────────────────────────────
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"status":  500,
				"message": "Error interno del servidor",
			})
		},
	})

	// ── Middlewares globales ───────────────────────────────────────────────────
	app.Use(logger.New(logger.Config{
		// No loggear el body — podría contener contraseñas
		Format: "[${time}] ${status} - ${method} ${path} (${latency})\n",
	}))

	app.Use(cors.New(cors.Config{
		AllowOrigins: os.Getenv("ALLOWED_ORIGINS"),
		AllowMethods: "GET,POST,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))

	// ── Rutas públicas ─────────────────────────────────────────────────────────
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  200,
			"message": "Go API funcionando correctamente",
			"service": "interseguro-go-api",
		})
	})

	authHandler := handlers.NewAuthHandler()
	auth := app.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Get("/me", middleware.JWTProtected(), authHandler.Me)

	// ── Rutas protegidas con JWT ───────────────────────────────────────────────
	api := app.Group("/api", middleware.JWTProtected())
	matrixHandler := handlers.NewMatrixHandler()
	matrix := api.Group("/matrix")
	matrix.Post("/qr", matrixHandler.ComputeQR)
	matrix.Post("/qr/only", matrixHandler.GetQROnly)

	// ── Iniciar servidor ──────────────────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Go API iniciando en puerto %s", port)
	log.Fatal(app.Listen(":" + port))
}