import { Blog } from '../models/Blog.js';
import { Activity } from '../models/Activity.js';

export const getBlogs = async (req, res, next) => {
  try {
    const { userId, destinationId } = req.query;
    const blogs = await Blog.findAll({ userId, destinationId });
    res.json({ count: blogs.length, blogs });
  } catch (err) {
    next(err);
  }
};

export const getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findBySlug(req.params.slug);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (req.user && blog.destination_id) {
      Activity.track({ userId: req.user.id, destinationId: blog.destination_id, type: 'blog_read' });
    }
    res.json({ blog });
  } catch (err) {
    next(err);
  }
};

export const createBlog = async (req, res, next) => {
  try {
    const { title, content, destinationId, coverImageUrl } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    const blog = await Blog.create({ userId: req.user.id, title, content, destinationId, coverImageUrl });
    // Writing about a place means the traveler has been there: strong signal
    if (destinationId) Activity.track({ userId: req.user.id, destinationId: Number(destinationId), type: 'blog_write' });
    res.status(201).json({ blog });
  } catch (err) {
    next(err);
  }
};

export const updateBlog = async (req, res, next) => {
  try {
    const existing = await Blog.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only edit your own blogs' });
    }
    const blog = await Blog.update(req.params.id, req.body);
    res.json({ blog });
  } catch (err) {
    next(err);
  }
};

export const deleteBlog = async (req, res, next) => {
  try {
    const existing = await Blog.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    if (existing.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own blogs' });
    }
    await Blog.remove(req.params.id);
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    next(err);
  }
};
