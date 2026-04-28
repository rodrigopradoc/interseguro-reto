import { Router } from 'express';
import { computeStats } from '../controllers/matrix.js';
import { jwtProtected } from '../middleware/jwt.js';

const router = Router();

// POST /api/stats — protegido con JWT
// El token viene propagado desde la Go API
router.post('/stats', jwtProtected, computeStats);

export default router;