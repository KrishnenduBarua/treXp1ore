import { Router } from 'express';
import {
  getBlogs,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
} from '../controllers/blogController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getBlogs);
router.get('/:slug', optionalAuth, getBlogBySlug);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

export default router;
