// TreXplore recommendation engine.
//
// A hybrid recommender that learns each traveler's taste from what they do on
// the site and suggests destinations accordingly. It is deliberately pure
// (no database or HTTP access) so it is easy to test and to tune.
//
//   1. CONTENT   – every destination becomes a feature vector (category,
//                  division, keywords from its description). A user's taste
//                  profile is the decayed, weighted sum of the vectors of the
//                  places they interacted with. Score = cosine similarity.
//   2. COLLAB    – users whose behaviour overlaps with yours "vote" for places
//                  you have not seen yet (user-based collaborative filtering).
//   3. POPULARITY– decayed global interest. Dominates for brand-new users
//                  (cold start) and fades as the profile fills up.
//   4. RE-RANK   – Maximal Marginal Relevance keeps the list diverse, and one
//                  slot is reserved for a "discovery" pick outside the user's
//                  usual categories so the model keeps exploring.

export const CONFIG = {
  halfLifeDays: 30, // an interaction loses half its influence every 30 days
  eventWeights: {
    view: 1, // opened a destination page
    blog_read: 1.5, // read a story about a destination
    filter: 1.2, // filtered the destination list by category / division
    blog_write: 4, // wrote a story about a destination (has been there)
    favorite: 5, // saved a destination — strongest explicit signal
    visited: 4, // marked "I've been here" // saved a destination — strongest explicit signal
  },
  divisionFactor: 0.5, // division matters, but less than category
  tokenNorm: 0.8, // total influence of description keywords
  topTokensPerDestination: 12,
  warmupWeight: 8, // decayed weight at which the profile counts as "learned"
  mmrLambda: 0.25, // diversity penalty strength
  minPeerSimilarity: 0.05,
};

const STOP_WORDS = new Set(
  (
    'about above after again along also among around been before being between both bangladesh ' +
    'bangladeshi came could does each even every famous from further have having here into its ' +
    'just known large largest like located many more most much near only other over place places ' +
    'popular same several should since some such than that their them then there these they this ' +
    'those through under until very visit visitors visitor were what when where which while will ' +
    'with within without would year round your area areas country district division best time ' +
    'travelers tourists tourist tourism site sites'
  ).split(' ')
);

const DAY_MS = 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------- utilities

export function tokenize(text) {
  if (!text) return [];
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t) && !/^\d+$/.test(t));
}

function add(map, key, value) {
  map.set(key, (map.get(key) || 0) + value);
}

function norm(map) {
  let s = 0;
  for (const v of map.values()) s += v * v;
  return Math.sqrt(s);
}

export function cosine(a, b, aNorm = norm(a), bNorm = norm(b)) {
  if (!aNorm || !bNorm) return 0;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [k, v] of small) {
    const o = large.get(k);
    if (o) dot += v * o;
  }
  return dot / (aNorm * bNorm);
}

function decay(createdAt, now, halfLifeDays = CONFIG.halfLifeDays) {
  const t = createdAt ? new Date(createdAt).getTime() : now;
  const ageDays = Math.max(0, (now - t) / DAY_MS);
  return Math.pow(0.5, ageDays / halfLifeDays);
}

// --------------------------------------------------- destination vectorizing

export function buildDestinationVectors(destinations) {
  const docs = new Map(); // id -> Map(token -> tf)
  const df = new Map();
  for (const d of destinations) {
    const tf = new Map();
    const text = [d.name, d.short_description, d.description, d.category].join(' ');
    for (const t of tokenize(text)) add(tf, t, 1);
    docs.set(d.id, tf);
    for (const t of tf.keys()) add(df, t, 1);
  }

  const n = destinations.length;
  const vectors = new Map();
  for (const d of destinations) {
    const tf = docs.get(d.id);
    let tokens = [...tf.entries()].map(([t, c]) => [t, c * (Math.log((n + 1) / (df.get(t) + 1)) + 1)]);
    tokens.sort((a, b) => b[1] - a[1]);
    tokens = tokens.slice(0, CONFIG.topTokensPerDestination);
    const tokenNorm = Math.sqrt(tokens.reduce((s, [, w]) => s + w * w, 0)) || 1;

    const vec = new Map();
    vec.set(`cat:${d.category || 'General'}`, 1);
    vec.set(`div:${d.division}`, CONFIG.divisionFactor);
    for (const [t, w] of tokens) vec.set(`tok:${t}`, (w / tokenNorm) * CONFIG.tokenNorm);
    vectors.set(d.id, { vec, norm: norm(vec) });
  }
  return vectors;
}

// ------------------------------------------------------------ user modelling

// Turns a user's raw events into a taste profile.
export function buildUserProfile(userEvents, destById, destVecs, now = Date.now()) {
  const vec = new Map();
  const destWeights = new Map(); // destination id -> decayed weight
  const strong = new Map(); // destination id -> 'favorite' | 'blog_write'
  const catWeights = new Map();
  const divWeights = new Map();
  const counts = { views: 0, saves: 0, stories: 0, visited: 0, searches: 0 };
  let totalWeight = 0;

  for (const e of userEvents) {
    const base = CONFIG.eventWeights[e.event_type];
    if (!base) continue;
    const w = base * decay(e.created_at, now);
    const dest = e.destination_id != null ? destById.get(e.destination_id) : null;

    if (dest) {
      const dv = destVecs.get(dest.id);
      for (const [k, v] of dv.vec) add(vec, k, v * w);
      add(destWeights, dest.id, w);
      add(catWeights, dest.category || 'General', w);
      add(divWeights, dest.division, w);
      if (e.event_type === 'favorite') strong.set(dest.id, 'favorite');
            else if ((e.event_type === 'blog_write' || e.event_type === 'visited') && !strong.has(dest.id)) {
        strong.set(dest.id, e.event_type);
      }
    } else if (e.event_type === 'filter') {
      if (e.category) {
        add(vec, `cat:${e.category}`, w);
        add(catWeights, e.category, w);
      }
      if (e.division) {
        add(vec, `div:${e.division}`, w * CONFIG.divisionFactor);
        add(divWeights, e.division, w);
      }
    } else {
      continue; // event refers to a destination that no longer exists
    }

    totalWeight += w;
    if (e.event_type === 'view' || e.event_type === 'blog_read') counts.views += 1;
    else if (e.event_type === 'favorite') counts.saves += 1;
    else if (e.event_type === 'blog_write') counts.stories += 1;
    else if (e.event_type === 'visited') counts.visited += 1;
    else if (e.event_type === 'filter') counts.searches += 1;
  }

  return { vec, norm: norm(vec), destWeights, strong, catWeights, divWeights, counts, totalWeight };
}

function stageFor(totalWeight) {
  if (totalWeight <= 0) return 'new';
  if (totalWeight < CONFIG.warmupWeight) return 'learning';
  return 'personalized';
}

function topEntries(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function groupEventsByUser(events) {
  const byUser = new Map();
  for (const e of events) {
    if (!byUser.has(e.user_id)) byUser.set(e.user_id, []);
    byUser.get(e.user_id).push(e);
  }
  return byUser;
}

// user id -> Map(destination id -> sublinear decayed weight)
function buildInteractionMatrix(events, destById, now) {
  const raw = new Map();
  for (const e of events) {
    if (e.destination_id == null || !destById.has(e.destination_id)) continue;
    const base = CONFIG.eventWeights[e.event_type];
    if (!base) continue;
    if (!raw.has(e.user_id)) raw.set(e.user_id, new Map());
    add(raw.get(e.user_id), e.destination_id, base * decay(e.created_at, now));
  }
  const matrix = new Map();
  for (const [u, m] of raw) {
    const smooth = new Map();
    for (const [d, w] of m) smooth.set(d, Math.log1p(w));
    matrix.set(u, smooth);
  }
  return matrix;
}

function collaborativeScores(userId, matrix) {
  const mine = matrix.get(userId);
  const scores = new Map();
  let peers = 0;
  if (!mine) return { scores, peers };

  const myNorm = norm(mine);
  let simSum = 0;
  for (const [other, theirs] of matrix) {
    if (other === userId) continue;
    const sim = cosine(mine, theirs, myNorm);
    if (sim < CONFIG.minPeerSimilarity) continue;
    peers += 1;
    simSum += sim;
    for (const [d, w] of theirs) add(scores, d, sim * w);
  }
  if (!simSum) return { scores: new Map(), peers: 0 };

  let max = 0;
  for (const [d, v] of scores) {
    const s = v / simSum;
    scores.set(d, s);
    if (s > max) max = s;
  }
  for (const [d, v] of scores) scores.set(d, max ? v / max : 0);
  return { scores, peers };
}

function popularityScores(events, destById, now) {
  const raw = new Map();
  for (const e of events) {
    if (e.destination_id == null || !destById.has(e.destination_id)) continue;
    const base = CONFIG.eventWeights[e.event_type];
    if (!base) continue;
    add(raw, e.destination_id, base * decay(e.created_at, now));
  }
  let max = 0;
  const out = new Map();
  for (const [d, v] of raw) {
    const s = Math.log1p(v);
    out.set(d, s);
    if (s > max) max = s;
  }
  for (const [d, v] of out) out.set(d, max ? v / max : 0);
  return out;
}

// ---------------------------------------------------------------- explaining

function explain({ dest, destVecs, profile, destById, signals, contentPart, cfPart, popPart, catShare, divShare, discovery }) {
  if (discovery) {
    return `Something different: a ${dest.category || 'General'} spot in ${dest.division} outside your usual picks`;
  }
  if (cfPart >= contentPart && cfPart >= popPart && signals.collaborative > 0.25) {
    return 'Travelers with a similar taste to yours loved this';
  }
  if (contentPart >= popPart && contentPart > 0) {
    const cat = dest.category || 'General';
    const share = catShare.get(cat) || 0;
    if (share >= 0.35) return `You keep exploring ${cat.toLowerCase()} destinations`;

    // closest place the user clearly cares about
    let best = null;
    const dv = destVecs.get(dest.id);
    for (const [id, kind] of profile.strong) {
      const sim = cosine(dv.vec, destVecs.get(id).vec, dv.norm, destVecs.get(id).norm);
      if (!best || sim > best.sim) best = { id, kind, sim };
    }
    if (best && best.sim >= 0.45) {
      const verb = best.kind === 'favorite' ? 'saved' : best.kind === 'visited' ? 'visited' : 'wrote about';
      return `Because you ${verb} ${destById.get(best.id).name}`;
    }
    if (share > 0) return `Matches your interest in ${cat.toLowerCase()} places`;
    if ((divShare.get(dest.division) || 0) >= 0.35) return `You have been exploring ${dest.division}`;
    return 'Matches the kind of places you look at';
  }
  if (signals.popularity > 0) return 'Trending with travelers on TreXplore';
  return 'A place worth exploring';
}

// ------------------------------------------------------------------- public

export function recommend({ destinations, events, userId = null, limit = 6, now = Date.now() }) {
  const destById = new Map(destinations.map((d) => [d.id, d]));
  const destVecs = buildDestinationVectors(destinations);
  const byUser = groupEventsByUser(events);
  const profile = buildUserProfile(userId != null ? byUser.get(userId) || [] : [], destById, destVecs, now);
  const stage = stageFor(profile.totalWeight);

  const matrix = buildInteractionMatrix(events, destById, now);
  const { scores: cf, peers } = userId != null ? collaborativeScores(userId, matrix) : { scores: new Map(), peers: 0 };
  const pop = popularityScores(events, destById, now);

  // how far along the user is: 0 = brand new, 1 = fully learned
  const confidence = Math.min(1, profile.totalWeight / CONFIG.warmupWeight);

  const catTotal = [...profile.catWeights.values()].reduce((a, b) => a + b, 0) || 1;
  const divTotal = [...profile.divWeights.values()].reduce((a, b) => a + b, 0) || 1;
  const catShare = new Map([...profile.catWeights].map(([k, v]) => [k, v / catTotal]));
  const divShare = new Map([...profile.divWeights].map(([k, v]) => [k, v / divTotal]));

  const candidates = [];
  for (const d of destinations) {
    // do not recommend what they already saved or wrote about
    if (profile.strong.has(d.id)) continue;

    const dv = destVecs.get(d.id);
    const content = profile.norm ? cosine(profile.vec, dv.vec, profile.norm, dv.norm) : 0;
    const collab = cf.get(d.id) || 0;
    const popular = pop.get(d.id) || 0;

    const contentPart = confidence * 0.6 * content;
    const cfPart = confidence * 0.3 * collab;
    const popPart = (0.1 + 0.6 * (1 - confidence)) * popular;

    // places they only glanced at are a little less novel
    const seen = profile.destWeights.get(d.id) || 0;
    const novelty = 1 / (1 + 0.15 * seen);

    candidates.push({
      dest: d,
      score: (contentPart + cfPart + popPart) * novelty,
      contentPart,
      cfPart,
      popPart,
      signals: { content, collaborative: collab, popularity: popular },
    });
  }
  // stable, deterministic order
  candidates.sort((a, b) => b.score - a.score || a.dest.id - b.dest.id);

  const selected = [];
  const remaining = [...candidates];
  const wantDiscovery = limit >= 4 && stage !== 'new';
  const mainSlots = wantDiscovery ? limit - 1 : limit;

  const pickMmr = () => {
    let bestIdx = -1;
    let bestVal = -Infinity;
    remaining.forEach((c, i) => {
      let maxSim = 0;
      const cv = destVecs.get(c.dest.id);
      for (const s of selected) {
        const sv = destVecs.get(s.dest.id);
        maxSim = Math.max(maxSim, cosine(cv.vec, sv.vec, cv.norm, sv.norm));
      }
      const val = c.score - CONFIG.mmrLambda * maxSim;
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    });
    return bestIdx >= 0 ? remaining.splice(bestIdx, 1)[0] : null;
  };

  while (selected.length < mainSlots && remaining.length) selected.push(pickMmr());

  if (wantDiscovery && remaining.length) {
    const usual = new Set(topEntries(profile.catWeights, 2).map(([c]) => c));
    const used = new Set(selected.map((s) => s.dest.category));
    let idx = remaining.findIndex((c) => !usual.has(c.dest.category) && !used.has(c.dest.category));
    if (idx < 0) idx = remaining.findIndex((c) => !usual.has(c.dest.category));
    if (idx >= 0) {
      const pick = remaining.splice(idx, 1)[0];
      pick.discovery = true;
      selected.push(pick);
    }
  }
  while (selected.length < limit && remaining.length) selected.push(pickMmr());

  const recommendations = selected.map((c) => ({
    destination: c.dest,
    score: Number(c.score.toFixed(4)),
    discovery: !!c.discovery,
    signals: {
      content: Number(c.signals.content.toFixed(3)),
      collaborative: Number(c.signals.collaborative.toFixed(3)),
      popularity: Number(c.signals.popularity.toFixed(3)),
    },
    reason: explain({
      dest: c.dest,
      destVecs,
      profile,
      destById,
      signals: c.signals,
      contentPart: c.contentPart,
      cfPart: c.cfPart,
      popPart: c.popPart,
      catShare,
      divShare,
      discovery: c.discovery,
    }),
  }));

  return { stage, personalized: stage !== 'new', peers, recommendations };
}

// Destinations similar to a given one (used on the destination detail page).
export function similarDestinations({ destinationId, destinations, events, limit = 4, now = Date.now() }) {
  const destById = new Map(destinations.map((d) => [d.id, d]));
  const target = destById.get(destinationId);
  if (!target) return [];
  const destVecs = buildDestinationVectors(destinations);
  const tv = destVecs.get(destinationId);

  // item-based collaborative signal: who else interacted with this place also liked…
  const matrix = buildInteractionMatrix(events, destById, now);
  const co = new Map();
  for (const m of matrix.values()) {
    if (!m.has(destinationId)) continue;
    for (const [d, w] of m) if (d !== destinationId) add(co, d, w);
  }
  const coMax = Math.max(0, ...co.values());

  return destinations
    .filter((d) => d.id !== destinationId)
    .map((d) => {
      const dv = destVecs.get(d.id);
      const content = cosine(tv.vec, dv.vec, tv.norm, dv.norm);
      const collab = coMax ? (co.get(d.id) || 0) / coMax : 0;
      let reason = 'Similar to this place';
      if (d.category === target.category) reason = `Another ${(d.category || 'General').toLowerCase()} destination`;
      else if (d.division === target.division) reason = `Also in ${d.division}`;
      if (collab > 0.5) reason = 'Travelers who looked at this also looked at this';
      return { destination: d, score: 0.7 * content + 0.3 * collab, reason };
    })
    .sort((a, b) => b.score - a.score || a.destination.id - b.destination.id)
    .slice(0, limit);
}

// A human-readable summary of what the model has learned about a user.
export function describeTaste({ destinations, events, userId, now = Date.now() }) {
  const destById = new Map(destinations.map((d) => [d.id, d]));
  const destVecs = buildDestinationVectors(destinations);
  const mine = events.filter((e) => e.user_id === userId);
  const profile = buildUserProfile(mine, destById, destVecs, now);

  const pct = (map, n) => {
    const total = [...map.values()].reduce((a, b) => a + b, 0);
    if (!total) return [];
    return topEntries(map, n).map(([name, v]) => ({ name, percent: Math.round((v / total) * 100) }));
  };

  // Only keywords shared by 2+ destinations describe a *theme*; a word that
  // appears in a single place is just that place's name, not a taste.
  const tokenDf = new Map();
  for (const { vec } of destVecs.values()) {
    for (const k of vec.keys()) if (k.startsWith('tok:')) add(tokenDf, k, 1);
  }
  const keywords = [...profile.vec.entries()]
    .filter(([k]) => k.startsWith('tok:') && (tokenDf.get(k) || 0) >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k]) => k.slice(4));

  return {
    stage: stageFor(profile.totalWeight),
    progress: Math.min(100, Math.round((profile.totalWeight / CONFIG.warmupWeight) * 100)),
    counts: profile.counts,
    categories: pct(profile.catWeights, 5),
    divisions: pct(profile.divWeights, 3),
    keywords,
  };
}
