import pool from '../config/db.js';

// Minutes during which an identical action by the same user is not logged again
// (stops a page refresh from counting as extra interest).
const DEDUPE_MINUTES = { view: 30, blog_read: 30, filter: 10, blog_write: 0 };

// Only recent behaviour is used for learning; older rows are ignored.
const LOOKBACK_DAYS = 180;

export const Activity = {
  async record({ userId, destinationId = null, category = null, division = null, type }) {
    const minutes = DEDUPE_MINUTES[type] ?? 30;
    await pool.query(
      `INSERT INTO user_events (user_id, destination_id, category, division, event_type)
       SELECT $1, $2, $3, $4, $5
       WHERE NOT EXISTS (
         SELECT 1 FROM user_events
         WHERE user_id = $6 AND event_type = $7
           AND destination_id IS NOT DISTINCT FROM $8
           AND category IS NOT DISTINCT FROM $9
           AND division IS NOT DISTINCT FROM $10
           AND created_at > NOW() - ($11 * INTERVAL '1 minute')
       )`,
      [userId, destinationId, category, division, type, userId, type, destinationId, category, division, minutes]
    );
  },

  // Fire-and-forget: learning from behaviour must never slow down or break a
  // normal request, so errors are logged and swallowed.
  track(args) {
    this.record(args).catch((err) => console.error('[activity] could not record event:', err.message));
  },

  // Everything the recommender learns from: logged events, saved places
  // (as 'favorite') and places marked "I've been here" (as 'visited').
  async allEvents() {
    const result = await pool.query(
      `SELECT user_id, destination_id, category, division, event_type, created_at
         FROM user_events
        WHERE created_at > NOW() - INTERVAL '${LOOKBACK_DAYS} days'
       UNION ALL
       SELECT user_id, destination_id, NULL AS category, NULL AS division, 'favorite' AS event_type, created_at
         FROM favorites
       UNION ALL
       SELECT user_id, destination_id, NULL AS category, NULL AS division, 'visited' AS event_type, created_at
         FROM visited_places`
    );
    return result.rows;
  },
};
