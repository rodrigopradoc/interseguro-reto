import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/jwt.js';


/**
 * Middleware JWT para Express.
 * Verifica el token del header Authorization antes de pasar al controller.
 * Si no hay token o es inválido, rechaza con 401.
 */
export function jwtProtected(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).json({
      status: 401,
      message: 'Se requiere token de autorización. Header: Authorization: Bearer <token>',
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
    res.status(401).json({
      status: 401,
      message: 'Formato inválido. Usa: Authorization: Bearer <token>',
    });
    return;
  }

  try {
    const payload = verifyToken(parts[1]!);
    // Guardar datos del usuario en el request para los controllers
    (req as Request & { user: typeof payload }).user = payload;
    next();
  } catch {
    res.status(401).json({
      status: 401,
      message: 'Token inválido o expirado',
    });
  }
}