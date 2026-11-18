import { Router } from 'express';
import { getPublicProfile, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:id', getPublicProfile);
router.put('/me', protect, updateProfile);

export default router;
