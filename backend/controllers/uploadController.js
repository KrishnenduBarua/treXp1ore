import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const extensions = {
  'image/avif': 'avif',
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const uploadImage = async (req, res, next) => {
  try {
    const { kind } = req.params;
    if (!['avatar', 'blog', 'destination'].includes(kind)) {
      return res.status(400).json({ message: 'Unsupported image type' });
    }
    if (kind === 'destination' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Choose an image to upload' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(503).json({ message: 'Image storage is not configured' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'trexplore-media';
    const path = `${kind}/${req.user.id}/${randomUUID()}.${extensions[req.file.mimetype]}`;
    const { error } = await supabase.storage.from(bucket).upload(path, req.file.buffer, {
      cacheControl: '3600',
      contentType: req.file.mimetype,
      upsert: false,
    });
    if (error) {
      const uploadError = new Error(error.message);
      uploadError.statusCode = 502;
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    res.status(201).json({ url: data.publicUrl });
  } catch (err) {
    next(err);
  }
};