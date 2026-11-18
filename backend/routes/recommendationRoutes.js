import { Router } from 'express';
import { getRecommendations, getTasteProfile, getSimilar } from '../controllers/recommendationController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalAuth, getRecommendations);
router.get('/profile', protect, getTasteProfile);
router.get('/similar/:id', getSimilar);

export default router;
