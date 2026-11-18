import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import DestinationCard from "../components/DestinationCard.jsx";
import Loader from "../components/Loader.jsx";

const STAGE_COPY = {
  new: {
    label: "Just getting started",
    text: "I haven't seen you explore yet. Open a few destinations, filter by what you like, or save places — I learn from each of them.",
  },
  learning: {
    label: "Learning your taste",
    text: "I'm starting to see a pattern. A few more places explored or saved and these suggestions will get much sharper.",
  },
  personalized: {
    label: "Personalised for you",
    text: "These suggestions are based on what you've viewed, filtered, saved and written about — recent activity counts most.",
  },
};

export default function ForYou() {
  const [taste, setTaste] = useState(null);
  const [recs, setRecs] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/recommendations/profile"),
      api.get("/recommendations", { params: { limit: 9 } }),
      api.get("/favorites"),
    ])
      .then(([t, r, f]) => {
        setTaste(t.data.taste);
        setRecs(r.data.recommendations);
        setSaved(f.data.destinations);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const copy = STAGE_COPY[taste?.stage || "new"];
    const counts = taste?.counts || { views: 0, saves: 0, stories: 0, visited: 0, searches: 0 };

  return (
    <div className="container">
      <section className="section">
        <div className="section-head">
          <div>
            <h2>For you</h2>
            <p>Destinations picked by learning how you explore Bangladesh.</p>
          </div>
        </div>

        <div className="taste-panel info-panel">
          <div className="taste-head">
            <span className={`stage-badge stage-${taste?.stage || "new"}`}>{copy.label}</span>
            <p className="muted">{copy.text}</p>
            <div className="taste-progress" aria-label={`Profile ${taste?.progress || 0}% learned`}>
              <div style={{ width: `${taste?.progress || 0}%` }} />
            </div>
          </div>

          {taste?.categories?.length > 0 && (
            <div className="taste-col">
              <h3>Types of places you like</h3>
              {taste.categories.map((c) => (
                <div key={c.name} className="taste-row">
                  <span>{c.name}</span>
                  <div className="taste-bar"><div style={{ width: `${c.percent}%` }} /></div>
                  <span className="muted">{c.percent}%</span>
                </div>
              ))}
            </div>
          )}

          {(taste?.divisions?.length > 0 || taste?.keywords?.length > 0) && (
            <div className="taste-col">
              {taste.divisions.length > 0 && (
                <>
                  <h3>Regions you lean towards</h3>
                  <div className="chip-row">
                    {taste.divisions.map((d) => (
                      <span key={d.name} className="taste-chip">{d.name} · {d.percent}%</span>
                    ))}
                  </div>
                </>
              )}
              {taste.keywords.length > 0 && (
                <>
                  <h3 style={{ marginTop: 16 }}>Themes</h3>
                  <div className="chip-row">
                    {taste.keywords.map((k) => (
                      <span key={k} className="taste-chip">{k}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="taste-col taste-counts">
            <h3>What I've observed</h3>
            <div className="info-row"><span>Places viewed</span><span>{counts.views}</span></div>
                        <div className="info-row"><span>Places saved</span><span>{counts.saves}</span></div>
            <div className="info-row"><span>Places visited</span><span>{counts.visited}</span></div>
            <div className="info-row"><span>Stories written</span><span>{counts.stories}</span></div>
            <div className="info-row"><span>Searches by type or region</span><span>{counts.searches}</span></div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div>
            <h2>{taste?.stage === "new" ? "Popular right now" : "Suggested places"}</h2>
            <p>Each card says why it was suggested.</p>
          </div>
        </div>
        {recs.length ? (
          <div className="grid">
            {recs.map((d) => (
              <DestinationCard key={d.id} destination={d} reason={d.reason} discovery={d.discovery} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            Nothing to suggest yet. <Link to="/destinations">Browse destinations</Link> to get started.
          </div>
        )}
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div>
            <h2>Saved places</h2>
            <p>Saving a place is the strongest hint you can give.</p>
          </div>
        </div>
        {saved.length ? (
          <div className="grid">
            {saved.map((d) => <DestinationCard key={d.id} destination={d} />)}
          </div>
        ) : (
          <div className="empty-state">
            You haven't saved any places yet. Open a destination and tap “Save”.
          </div>
        )}
      </section>
    </div>
  );
}
