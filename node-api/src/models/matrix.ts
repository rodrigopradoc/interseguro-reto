// Tipos de datos que maneja la Node API

// Entrada que recibe desde la Go API
export interface StatsRequest {
  Q: number[][];
  R: number[][];
}

// Estadísticas calculadas sobre las matrices
export interface StatsData {
  max: number;
  min: number;
  average: number;
  sum: number;
  q_is_diagonal: boolean;
  r_is_diagonal: boolean;
}

// Respuesta estándar de la API
export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}