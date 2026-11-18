import { Destination } from '../models/Destination.js';
import { Activity } from '../models/Activity.js';

export const getDestinations = async (req, res, next) => {
  try {
    const { division, district, category, q } = req.query;
    const destinations = await Destination.findAll({ division, district, category, q });
    // Learn from what the traveler is filtering for (category / division only)
    if (req.user && (category || division)) {
      Activity.track({ userId: req.user.id, category: category || null, division: division || null, type: 'filter' });
    }
    res.json({ count: destinations.length, destinations });
  } catch (err) {
    next(err);
  }
};

export const getDestinationBySlug = async (req, res, next) => {
  try {
    const destination = await Destination.findBySlug(req.params.slug);
    if (!destination) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    if (req.user) Activity.track({ userId: req.user.id, destinationId: destination.id, type: 'view' });
    res.json({ destination });
  } catch (err) {
    next(err);
  }
};

export const createDestination = async (req, res, next) => {
  try {
    const { name, division, district } = req.body;
    if (!name || !division || !district) {
      return res.status(400).json({ message: 'Name, division and district are required' });
    }
    const destination = await Destination.create(req.body, req.user.id);
    res.status(201).json({ destination });
  } catch (err) {
    next(err);
  }
};

export const updateDestination = async (req, res, next) => {
  try {
    const existing = await Destination.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    const destination = await Destination.update(req.params.id, req.body);
    res.json({ destination });
  } catch (err) {
    next(err);
  }
};

export const deleteDestination = async (req, res, next) => {
  try {
    const existing = await Destination.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    await Destination.remove(req.params.id);
    res.json({ message: 'Destination deleted' });
  } catch (err) {
    next(err);
  }
};
