import { Destination } from '../models/Destination.js';
import { Activity } from '../models/Activity.js';
import { recommend, similarDestinations, describeTaste } from '../utils/recommender.js';

// Recommendation cards don't need the long text fields.
const slim = ({ description, how_to_reach, ...rest }) => rest;

const clampLimit = (value, fallback, max) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 1) return fallback;
  return Math.min(n, max);
};

// GET /api/recommendations?limit=6
// Personalised for signed-in users; falls back to popular places for anonymous
// visitors and brand-new accounts (stage === 'new').
export const getRecommendations = async (req, res, next) => {
  try {
    const limit = clampLimit(req.query.limit, 6, 24);
    const [destinations, events] = await Promise.all([Destination.findAll(), Activity.allEvents()]);
    const result = recommend({ destinations, events, userId: req.user?.id ?? null, limit });

    res.json({
      stage: result.stage,
      personalized: result.personalized,
      recommendations: result.recommendations.map((r) => ({
        ...slim(r.destination),
        reason: r.reason,
        discovery: r.discovery,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/recommendations/profile  (signed in)
// What the AI has learned about this traveler, so they can see (and trust) it.
export const getTasteProfile = async (req, res, next) => {
  try {
    const [destinations, events] = await Promise.all([Destination.findAll(), Activity.allEvents()]);
    res.json({ taste: describeTaste({ destinations, events, userId: req.user.id }) });
  } catch (err) {
    next(err);
  }
};

// GET /api/recommendations/similar/:id
// "You might also like" for a destination page. Works for anonymous visitors.
export const getSimilar = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const limit = clampLimit(req.query.limit, 4, 12);
    const [destinations, events] = await Promise.all([Destination.findAll(), Activity.allEvents()]);
    if (!destinations.some((d) => d.id === id)) {
      return res.status(404).json({ message: 'Destination not found' });
    }
    const similar = similarDestinations({ destinationId: id, destinations, events, limit });
    res.json({
      similar: similar.map((s) => ({ ...slim(s.destination), reason: s.reason })),
    });
  } catch (err) {
    next(err);
  }
};
