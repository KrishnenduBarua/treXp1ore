// Run with: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend, similarDestinations, describeTaste } from '../utils/recommender.js';

const NOW = new Date('2026-11-05T12:00:00Z').getTime();
const daysAgo = (n) => new Date(NOW - n * 24 * 60 * 60 * 1000);

const destinations = [
  { id: 1, name: "Cox's Bazar Beach", division: 'Chattogram', district: "Cox's Bazar", category: 'Beach', short_description: "The world's longest natural sea beach, stretching over 120km." },
  { id: 2, name: 'Sajek Valley', division: 'Chattogram', district: 'Rangamati', category: 'Hill', short_description: 'A hill valley known for its sea of clouds.' },
  { id: 3, name: 'Sundarbans', division: 'Khulna', district: 'Bagerhat', category: 'Forest', short_description: 'The largest mangrove forest in the world, home to the Royal Bengal Tiger.' },
  { id: 4, name: 'Ratargul Swamp Forest', division: 'Sylhet', district: 'Sylhet', category: 'Forest', short_description: 'One of the few freshwater swamp forests in the world.' },
  { id: 5, name: 'Srimangal Tea Gardens', division: 'Sylhet', district: 'Moulvibazar', category: 'Nature', short_description: 'Rolling tea estates known as the tea capital of Bangladesh.' },
  { id: 6, name: 'Paharpur Buddhist Vihara', division: 'Rajshahi', district: 'Naogaon', category: 'Heritage', short_description: 'A UNESCO World Heritage archaeological site from the 8th century.' },
  { id: 7, name: 'Sixty Dome Mosque', division: 'Khulna', district: 'Bagerhat', category: 'Heritage', short_description: 'A 15th-century UNESCO-listed mosque with sixty stone pillars.' },
  { id: 8, name: 'Kuakata Sea Beach', division: 'Barishal', district: 'Patuakhali', category: 'Beach', short_description: 'One of the few beaches to view both sunrise and sunset over the sea.' },
  { id: 9, name: 'Ahsan Manzil', division: 'Dhaka', district: 'Dhaka', category: 'Heritage', short_description: 'The Pink Palace, former residence of the Nawab of Dhaka.' },
  { id: 10, name: 'Vinnojagat Prangon', division: 'Rangpur', district: 'Rangpur', category: 'Park', short_description: 'A themed leisure park mixing local craft and greenery.' },
  { id: 11, name: 'Madhutila Eco Park', division: 'Mymensingh', district: 'Sherpur', category: 'Nature', short_description: 'A forested eco park at the foothills of the Garo Hills.' },
];

const ev = (user_id, event_type, destination_id, age = 1, extra = {}) => ({
  user_id, event_type, destination_id, created_at: daysAgo(age), category: null, division: null, ...extra,
});

const names = (res) => res.recommendations.map((r) => r.destination.name);
const cats = (res) => res.recommendations.map((r) => r.destination.category);

test('brand-new user gets popular places, flagged as not personalized', () => {
  const events = [ev(2, 'favorite', 9), ev(2, 'view', 9), ev(3, 'view', 9), ev(3, 'view', 1)];
  const res = recommend({ destinations, events, userId: 99, limit: 3, now: NOW });
  assert.equal(res.stage, 'new');
  assert.equal(res.personalized, false);
  assert.equal(res.recommendations[0].destination.name, 'Ahsan Manzil');
  assert.match(res.recommendations[0].reason, /Trending/);
});

test('a beach lover is mostly recommended beaches they have not saved', () => {
  const events = [
    ev(1, 'favorite', 1, 2), ev(1, 'view', 1, 2), ev(1, 'view', 8, 3),
    ev(1, 'filter', null, 1, { category: 'Beach' }), ev(1, 'filter', null, 2, { category: 'Beach' }),
  ];
  const res = recommend({ destinations, events, userId: 1, limit: 4, now: NOW });
  assert.equal(res.stage, 'personalized');
  assert.ok(!names(res).includes("Cox's Bazar Beach"), 'saved place must not be re-recommended');
  assert.equal(names(res)[0], 'Kuakata Sea Beach');
});

test('different users get different recommendations', () => {
  const events = [
    ev(1, 'favorite', 1, 1), ev(1, 'favorite', 8, 2), ev(1, 'view', 1, 1),
    ev(2, 'favorite', 6, 1), ev(2, 'favorite', 7, 2), ev(2, 'view', 9, 1),
  ];
  const beach = recommend({ destinations, events, userId: 1, limit: 4, now: NOW });
  const heritage = recommend({ destinations, events, userId: 2, limit: 4, now: NOW });
  assert.notDeepEqual(names(beach), names(heritage));
  assert.ok(cats(heritage).slice(0, 2).includes('Heritage'));
});

test('taste drifts: recent interest outweighs old interest (time decay)', () => {
  const events = [
    // 200 days ago: loved beaches. Last week: switched to forests.
    ev(1, 'favorite', 1, 200), ev(1, 'favorite', 8, 200),
    ev(1, 'favorite', 3, 3), ev(1, 'view', 3, 3), ev(1, 'view', 4, 2),
  ];
  const res = recommend({ destinations, events, userId: 1, limit: 3, now: NOW });
  assert.equal(res.recommendations[0].destination.category, 'Forest');
});

test('collaborative filtering: peers with overlapping taste surface unseen places', () => {
  const events = [
    // user 1 and user 2 both love Sajek + Sundarbans; user 2 also saved Madhutila
    ev(1, 'favorite', 2, 2), ev(1, 'favorite', 3, 2),
    ev(2, 'favorite', 2, 2), ev(2, 'favorite', 3, 2), ev(2, 'favorite', 11, 1), ev(2, 'view', 11, 1),
  ];
  const res = recommend({ destinations, events, userId: 1, limit: 4, now: NOW });
  assert.ok(res.peers >= 1);
  const madhutila = res.recommendations.find((r) => r.destination.id === 11);
  assert.ok(madhutila, 'peer-favoured place should be recommended');
  assert.ok(madhutila.signals.collaborative > 0);
});

test('list is diverse and includes one discovery pick outside the usual categories', () => {
  const events = [
    ev(1, 'favorite', 1, 1), ev(1, 'favorite', 8, 1), ev(1, 'view', 1, 1), ev(1, 'view', 8, 1),
    ev(1, 'filter', null, 1, { category: 'Beach' }),
  ];
  const res = recommend({ destinations, events, userId: 1, limit: 5, now: NOW });
  const discovery = res.recommendations.filter((r) => r.discovery);
  assert.equal(discovery.length, 1);
  assert.notEqual(discovery[0].destination.category, 'Beach');
  assert.match(discovery[0].reason, /Something different/);
  assert.equal(new Set(names(res)).size, names(res).length, 'no duplicates');
});

test('every recommendation carries a human-readable reason', () => {
  const events = [ev(1, 'favorite', 6, 1), ev(1, 'view', 7, 1)];
  const res = recommend({ destinations, events, userId: 1, limit: 5, now: NOW });
  for (const r of res.recommendations) assert.ok(r.reason && r.reason.length > 5);
});

test('similarDestinations ranks same-category places first and excludes itself', () => {
  const sims = similarDestinations({ destinationId: 6, destinations, events: [], limit: 3, now: NOW });
  assert.ok(!sims.some((s) => s.destination.id === 6));
  assert.equal(sims[0].destination.category, 'Heritage');
});

test('describeTaste reports category shares that sum to ~100% and counts signals', () => {
  const events = [
    ev(1, 'favorite', 1, 1), ev(1, 'view', 8, 1), ev(1, 'view', 6, 1),
    ev(1, 'filter', null, 1, { category: 'Beach' }), ev(1, 'blog_write', 8, 1),
  ];
  const t = describeTaste({ destinations, events, userId: 1, now: NOW });
  assert.equal(t.categories[0].name, 'Beach');
  const sum = t.categories.reduce((a, c) => a + c.percent, 0);
  assert.ok(sum >= 98 && sum <= 102);
  assert.deepEqual(t.counts, { views: 2, saves: 1, stories: 1, visited: 0, searches: 1 });
});

test('handles events that point at deleted destinations without crashing', () => {
  const events = [ev(1, 'favorite', 999, 1), ev(1, 'view', 2, 1)];
  const res = recommend({ destinations, events, userId: 1, limit: 3, now: NOW });
  assert.ok(res.recommendations.length > 0);
});

test('works with zero events and with an empty destination list', () => {
  assert.equal(recommend({ destinations, events: [], userId: 1, limit: 3, now: NOW }).recommendations.length, 3);
  assert.deepEqual(recommend({ destinations: [], events: [], userId: 1, limit: 3, now: NOW }).recommendations, []);
});
