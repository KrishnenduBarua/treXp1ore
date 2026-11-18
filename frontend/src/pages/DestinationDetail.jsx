import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import DestinationCard from "../components/DestinationCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DestinationDetail() {
  const { slug } = useParams();
  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [visited, setVisited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [similar, setSimilar] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get(`/destinations/${slug}`)
      .then((res) => setDestination(res.data.destination))
      .catch(() => setError("This destination could not be found."))
      .finally(() => setLoading(false));
  }, [slug]);

  // Has this traveler already saved / visited this place?
  useEffect(() => {
    if (!user || !destination) {
      setSaved(false);
      setVisited(false);
      return;
    }
    api
      .get("/favorites")
      .then((res) => setSaved(res.data.ids.includes(destination.id)))
      .catch(() => {});
    api
      .get("/visits")
      .then((res) => setVisited(res.data.ids.includes(destination.id)))
      .catch(() => {});
  }, [user, destination]);

  // "You might also like"
  useEffect(() => {
    if (!destination) return;
    api
      .get(`/recommendations/similar/${destination.id}`)
      .then((res) => setSimilar(res.data.similar))
      .catch(() => setSimilar([]));
  }, [destination]);

  // Turns a flag on/off through the matching endpoint (/favorites or /visits)
  const toggle = async (endpoint, current, setter) => {
    setBusy(true);
    setActionError("");
    try {
      if (current) {
        await api.delete(`/${endpoint}/${destination.id}`);
        setter(false);
      } else {
        await api.post(`/${endpoint}/${destination.id}`);
        setter(true);
      }
    } catch (err) {
      setActionError(err.response?.data?.message || "That didn't work. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;
  if (error || !destination) {
    return (
      <div className="container section">
        <div className="empty-state">{error}</div>
      </div>
    );
  }

  return (
    <>
      <section
        className="detail-hero"
        style={
          destination.image_url
            ? {
                backgroundImage: `linear-gradient(rgba(20, 39, 32, 0.72), rgba(20, 39, 32, 0.82)), url(${destination.image_url})`,
              }
            : undefined
        }
      >
        <div className="container">
          <span className="division-tag">
            {destination.division} · {destination.district}
          </span>
          <h1>{destination.name}</h1>
          <p style={{ color: "#cfe0d6", maxWidth: "60ch" }}>
            {destination.short_description ||
              destination.description ||
              "Explore this destination in Bangladesh."}
          </p>
        </div>
      </section>

      <div className="container">
        <div className="detail-grid">
          <div>
            <h2>About this place</h2>
            <p>
              {destination.description ||
                destination.short_description ||
                "A detailed description for this destination hasn't been added yet."}
            </p>

            {destination.how_to_reach && (
              <>
                <h2>How to reach</h2>
                <p>{destination.how_to_reach}</p>
              </>
            )}

            <Link
              to={`/blogs?destination=${destination.id}`}
              className="btn btn-outline"
            >
              Read traveler stories about {destination.name}
            </Link>
          </div>

          <aside>
            <div className="info-panel place-actions">
              <h3>Your trip</h3>
              {user ? (
                <>
                  <button
                    type="button"
                    className={`btn btn-block ${saved ? "btn-primary" : "btn-outline"}`}
                    onClick={() => toggle("favorites", saved, setSaved)}
                    disabled={busy}
                    aria-pressed={saved}
                  >
                    {saved ? "♥ Saved to your list" : "♡ Save this place"}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-block ${visited ? "btn-primary" : "btn-outline"}`}
                    onClick={() => toggle("visits", visited, setVisited)}
                    disabled={busy}
                    aria-pressed={visited}
                  >
                    {visited ? "✓ You've been here" : "I've visited this place"}
                  </button>
                  <p className="muted place-actions-hint">
                    Saving and visiting teach TreXplore what you like, so your
                    suggestions get better.
                  </p>
                  {actionError && <div className="form-error">{actionError}</div>}
                </>
              ) : (
                <>
                  <p className="muted" style={{ marginBottom: 12 }}>
                    Log in to save places and mark the ones you've visited.
                  </p>
                  <Link to="/login" className="btn btn-primary btn-block">
                    Log in
                  </Link>
                </>
              )}
            </div>

            <div className="info-panel" style={{ marginTop: 18 }}>
              <h3 style={{ marginBottom: 14 }}>Trip details</h3>
              <div className="info-row">
                <span>Division</span>
                <span>{destination.division}</span>
              </div>
              <div className="info-row">
                <span>District</span>
                <span>{destination.district}</span>
              </div>
              <div className="info-row">
                <span>Category</span>
                <span>{destination.category}</span>
              </div>
              <div className="info-row">
                <span>Best time to visit</span>
                <span>{destination.best_time_to_visit || "Year-round"}</span>
              </div>
              <div className="info-row">
                <span>Entry fee</span>
                <span>{destination.entry_fee || "Free"}</span>
              </div>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="section" style={{ paddingTop: 10 }}>
            <div className="section-head">
              <div>
                <h2>You might also like</h2>
                <p>Places similar to {destination.name}.</p>
              </div>
            </div>
            <div className="grid">
              {similar.map((d) => (
                <DestinationCard key={d.id} destination={d} reason={d.reason} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
