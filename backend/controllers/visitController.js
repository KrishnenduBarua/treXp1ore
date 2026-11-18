import { Visit } from '../models/Visit.js';
import { Destination } from '../models/Destination.js';

export const getVisits = async (req, res, next) => {
  try {
    const ids = await Visit.ids(req.user.id);
    res.json({ count: ids.length, ids });
  } catch (err) {
    next(err);
  }
};

export const addVisit = async (req, res, next) => {
  try {
    const id = Number(req.params.destinationId);
    if (!(await Destination.findById(id))) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    await Visit.add(req.user.id, id);
    res.status(201).json({ visited: true, destinationId: id });
  } catch (err) {
    next(err);
  }
};

export const removeVisit = async (req, res, next) => {
  try {
    const id = Number(req.params.destinationId);
    await Visit.remove(req.user.id, id);
    res.json({ visited: false, destinationId: id });
  } catch (err) {
    next(err);
  }
};
