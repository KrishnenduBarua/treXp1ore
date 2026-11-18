import { User } from '../models/User.js';

export const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar_url } = req.body;
    const user = await User.updateProfile(req.user.id, { name, bio, avatar_url });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
