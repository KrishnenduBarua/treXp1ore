import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const allowedTypes = new Set(['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    if (allowedTypes.has(file.mimetype)) return callback(null, true);
    const error = new Error('Use a JPG, PNG, GIF, WebP, or AVIF image');
    error.statusCode = 400;
    return callback(error);
  },
});

const router = Router();
router.post('/:kind', protect, upload.single('file'), uploadImage);

export default router;