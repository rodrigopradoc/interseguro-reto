package database

import (
	"log"

	"golang.org/x/crypto/bcrypt"
)

// Seed inserta los usuarios iniciales si la tabla está vacía.
// Esto garantiza que siempre haya al menos un admin al arrancar.
// Las contraseñas se hashean con bcrypt antes de guardarse.
func Seed() {
	var count int
	DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)

	// Solo insertar si no hay usuarios
	if count > 0 {
		log.Println("✅ Usuarios ya existen, omitiendo seed")
		return
	}

	users := []struct {
		Username string
		Password string
		Role     string
	}{
		{"admin", "admin123", "admin"},
		{"user",  "user123",  "viewer"},
	}

	for _, u := range users {
		// bcrypt convierte la contraseña en un hash irreversible.
		// Cost 12 es el estándar recomendado en producción (balance seguridad/velocidad).
		hash, err := bcrypt.GenerateFromPassword([]byte(u.Password), 12)
		if err != nil {
			log.Printf("Error hasheando password para %s: %v", u.Username, err)
			continue
		}

		_, err = DB.Exec(
			"INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
			u.Username, string(hash), u.Role,
		)
		if err != nil {
			log.Printf("Error insertando usuario %s: %v", u.Username, err)
			continue
		}

		log.Printf("✅ Usuario '%s' creado con rol '%s'", u.Username, u.Role)
	}
}