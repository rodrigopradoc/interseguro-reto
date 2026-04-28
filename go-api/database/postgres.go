package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq" // driver PostgreSQL para database/sql
)

// DB es la instancia global de la conexión a PostgreSQL.
// Se inicializa una sola vez al arrancar la aplicación (patrón singleton).
var DB *sql.DB

// Connect establece la conexión con PostgreSQL usando variables de entorno.
// Debe llamarse una sola vez desde main() antes de levantar el servidor.
func Connect() {
	host     := getEnv("DB_HOST", "localhost")
	port     := getEnv("DB_PORT", "5432")
	user     := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "postgres")
	dbname   := getEnv("DB_NAME", "interseguro")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname,
	)

	var err error
	DB, err = sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("Error abriendo conexión a PostgreSQL: %v", err)
	}

	// Verificar que la conexión realmente funciona
	if err = DB.Ping(); err != nil {
		log.Fatalf("Error conectando a PostgreSQL: %v", err)
	}

	log.Println("✅ Conectado a PostgreSQL exitosamente")

	// Crear tablas si no existen (útil para el primer arranque)
	migrate()
}

// migrate crea las tablas necesarias si no existen.
// En producción real se usaría una herramienta de migraciones como golang-migrate.
func migrate() {
	query := `
		CREATE TABLE IF NOT EXISTS users (
			id            SERIAL PRIMARY KEY,
			username      VARCHAR(50) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			role          VARCHAR(20) NOT NULL DEFAULT 'viewer',
			created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);
	`

	if _, err := DB.Exec(query); err != nil {
		log.Fatalf("Error creando tabla users: %v", err)
	}

	log.Println("✅ Migraciones ejecutadas correctamente")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}