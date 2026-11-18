import { Router } from 'express';
import { getVisits, addVisit, removeVisit } from '../controllers/visitController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);
router.get('/', getVisits);
router.post('/:destinationId', addVisit);
router.delete('/:destinationId', removeVisit);

export default router;
