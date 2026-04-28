package services

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestGenerateToken_ValidToken verifica que se genera un token válido
func TestGenerateToken_ValidToken(t *testing.T) {
	token, err := GenerateToken("admin", "admin")

	require.NoError(t, err)
	assert.NotEmpty(t, token)

	// Un JWT tiene 3 partes separadas por puntos
	parts := 0
	for _, c := range token {
		if c == '.' {
			parts++
		}
	}
	assert.Equal(t, 2, parts, "un JWT debe tener exactamente 2 puntos (3 partes)")
}

// TestValidateToken_ValidToken verifica que un token válido es aceptado
func TestValidateToken_ValidToken(t *testing.T) {
	token, err := GenerateToken("testuser", "viewer")
	require.NoError(t, err)

	claims, err := ValidateToken(token)

	require.NoError(t, err)
	assert.Equal(t, "testuser", claims.Username)
	assert.Equal(t, "viewer", claims.Role)
	assert.Equal(t, "interseguro-go-api", claims.Issuer)
}

// TestValidateToken_InvalidToken verifica que un token falso es rechazado
func TestValidateToken_InvalidToken(t *testing.T) {
	_, err := ValidateToken("esto.no.es.un.token.valido")
	assert.Error(t, err, "debe retornar error con token inválido")
}

// TestValidateToken_ExpiredToken verifica que un token expirado es rechazado
func TestValidateToken_ExpiredToken(t *testing.T) {
	// Crear token con expiración en el pasado
	claims := Claims{
		Username: "admin",
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			Issuer:    "interseguro-go-api",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString(getSecret())

	_, err := ValidateToken(tokenStr)
	assert.Error(t, err, "debe retornar error con token expirado")
}

// TestValidateToken_WrongSecret verifica que un token firmado con otro secret es rechazado
func TestValidateToken_WrongSecret(t *testing.T) {
	claims := Claims{
		Username: "admin",
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// Firmar con un secret diferente
	tokenStr, _ := token.SignedString([]byte("secret-diferente"))

	_, err := ValidateToken(tokenStr)
	assert.Error(t, err, "debe retornar error con token firmado con secret diferente")
}