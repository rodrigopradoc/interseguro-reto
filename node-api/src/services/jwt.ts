import { createVerify } from 'crypto';
import pkg from 'jsonwebtoken';
const { verify, sign } = pkg;

const SECRET = process.env.JWT_SECRET ?? 'interseguro-super-secret-2024';

export function verifyToken(token: string): pkg.JwtPayload {
  return verify(token, SECRET) as pkg.JwtPayload;
}

export function signToken(payload: object): string {
  return sign(payload, SECRET, { expiresIn: '1h' });
}