import pkg from 'jsonwebtoken';
const { sign } = pkg;

const TEST_SECRET = process.env.JWT_SECRET ?? 'interseguro-super-secret-2024';

export function generateTestToken(username = 'test-user', role = 'admin'): string {
  return sign({ username, role }, TEST_SECRET, { expiresIn: '1h' });
}