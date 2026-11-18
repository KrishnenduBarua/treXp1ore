import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import DestinationCard from '../components/DestinationCard.jsx';
import Loader from '../components/Loader.jsx';
import { DIVISIONS, CATEGORIES } from '../data/divisions.js';

export default function Destinations() {
  const [params, setParams] = useSearchParams();
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get('q') || '');

  const division = params.get('division') || '';
  const category = params.get('category') || '';

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (division) query.division = division;
    if (category) query.category = category;
    if (params.get('q')) query.q = params.get('q');

    api.get('/destinations', { params: query })
      .then((res) => setDestinations(res.data.destinations))
      .catch(() => setDestinations([]))
      .finally(() => setLoading(false));
  }, [division, category, params]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('q', q);
  };

  return (
    <div className="container">
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Destinations</h2>
            <p>Search across all eight divisions, or filter by district and category.</p>
          </div>
        </div>

        <form className="filters-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by name or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ minWidth: 240 }}
          />
          <select value={division} onChange={(e) => updateParam('division', e.target.value)}>
            <option value="">All divisions</option>
            {DIVISIONS.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
          <select value={category} onChange={(e) => updateParam('category', e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
          {(division || category || params.get('q')) && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQ(''); setParams({}); }}>
              Clear filters
            </button>
          )}
        </form>

        {loading ? (
          <Loader />
        ) : destinations.length ? (
          <div className="grid">
            {destinations.map((d) => <DestinationCard key={d.id} destination={d} />)}
          </div>
        ) : (
          <div className="empty-state">No destinations match those filters yet. Try broadening your search.</div>
        )}
      </section>
    </div>
  );
}
