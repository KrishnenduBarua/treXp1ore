import { Favorite } from '../models/Favorite.js';
import { Destination } from '../models/Destination.js';

export const getFavorites = async (req, res, next) => {
  try {
    const destinations = await Favorite.listDestinations(req.user.id);
    res.json({ count: destinations.length, ids: destinations.map((d) => d.id), destinations });
  } catch (err) {
    next(err);
  }
};

export const addFavorite = async (req, res, next) => {
  try {
    const id = Number(req.params.destinationId);
    if (!(await Destination.findById(id))) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    await Favorite.add(req.user.id, id);
    res.status(201).json({ saved: true, destinationId: id });
  } catch (err) {
    next(err);
  }
};

export const removeFavorite = async (req, res, next) => {
  try {
    const id = Number(req.params.destinationId);
    await Favorite.remove(req.user.id, id);
    res.json({ saved: false, destinationId: id });
  } catch (err) {
    next(err);
  }
};
