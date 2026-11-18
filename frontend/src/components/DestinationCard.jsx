import { Link } from "react-router-dom";

// `reason` / `discovery` are only passed for AI recommendations: the card then
// tells the traveler *why* it was suggested.
export default function DestinationCard({ destination, reason, discovery }) {
  const cat = destination.category || "General";
  const description =
    destination.short_description ||
    destination.description ||
    "Explore this destination in Bangladesh.";
  return (
    <Link to={`/destinations/${destination.slug}`} className="dest-card">
      <div className={`dest-thumb thumb-${cat}`}>
        {destination.image_url && (
          <img src={destination.image_url} alt={destination.name} />
        )}
        <span className="division-tag">{destination.division}</span>
      </div>
      <div className="dest-body">
        <h3>{destination.name}</h3>
        <div className="dest-meta">
          {destination.district} · {cat}
        </div>
        {reason && (
          <div className={`reason-chip${discovery ? " reason-discovery" : ""}`}>
            <span aria-hidden="true">✦</span> {reason}
          </div>
        )}
        <p>{description}</p>
        <span className="btn btn-outline btn-sm">View details</span>
      </div>
    </Link>
  );
}
