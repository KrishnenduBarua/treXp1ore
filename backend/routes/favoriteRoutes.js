import { Router } from 'express';
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.get('/', getFavorites);
router.post('/:destinationId', addFavorite);
router.delete('/:destinationId', removeFavorite);

export default router;
