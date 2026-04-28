package models

// MatrixInput representa la entrada de la API: una matriz rectangular de números
type MatrixInput struct {
	Matrix [][]float64 `json:"matrix"`
}

// QRResult representa el resultado de la factorización QR
// Q: matriz ortogonal, R: matriz triangular superior
type QRResult struct {
	Q [][]float64 `json:"Q"`
	R [][]float64 `json:"R"`
}

// QRResponse es la respuesta completa de la Go API
type QRResponse struct {
	Status  int      `json:"status"`
	Message string   `json:"message"`
	Data    QRResult `json:"data"`
}

// StatsRequest es lo que la Go API envía a la Node API
// contiene las matrices Q y R para que Node calcule estadísticas
type StatsRequest struct {
	Q [][]float64 `json:"Q"`
	R [][]float64 `json:"R"`
}

// StatsResponse es lo que la Node API devuelve a la Go API
type StatsResponse struct {
	Status int        `json:"status"`
	Data   StatsData  `json:"data"`
}

// StatsData contiene todas las estadísticas calculadas por la Node API
type StatsData struct {
	Max          float64 `json:"max"`
	Min          float64 `json:"min"`
	Average      float64 `json:"average"`
	Sum          float64 `json:"sum"`
	QIsDiagonal  bool    `json:"q_is_diagonal"`
	RIsDiagonal  bool    `json:"r_is_diagonal"`
}

// FullResponse es la respuesta final que se entrega al cliente
// incluye QR + estadísticas en un solo objeto
type FullResponse struct {
	Status int       `json:"status"`
	Message string   `json:"message"`
	QR     QRResult  `json:"qr"`
	Stats  StatsData `json:"stats"`
}