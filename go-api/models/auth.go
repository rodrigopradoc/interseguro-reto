package models

// LoginInput es el body que recibe el endpoint de login
type LoginInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// LoginResponse es lo que devuelve el endpoint de login
// IMPORTANTE: nunca incluir el password ni el hash en la respuesta
type LoginResponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Token   string `json:"token"`
	User    struct {
		Username string `json:"username"`
		Role     string `json:"role"`
	} `json:"user"`
}

// User representa un usuario en la base de datos
type User struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"-"` // json:"-" evita que el hash aparezca en responses
	Role         string `json:"role"`
}