import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import DestinationCard from "./DestinationCard.jsx";
import Loader from "./Loader.jsx";

// AI-picked destinations for the signed-in traveler. Used on the home page.
export default function Recommended({ limit = 3 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/recommendations", { params: { limit } })
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [limit]);

  if (!loading && (!data || !data.recommendations.length)) return null;

  const subtitle =
    data?.stage === "personalized"
      ? "Chosen from the kinds of places you explore and save."
      : data?.stage === "learning"
        ? "We're still learning your taste — browse and save places to sharpen this."
        : "Popular right now. Browse and save places and these will become yours.";

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>{data?.personalized ? "Picked for you" : "Start exploring"}</h2>
          <p>{subtitle}</p>
        </div>
        <Link to="/for-you" className="btn btn-ghost btn-sm">
          Your travel taste
        </Link>
      </div>
      {loading ? (
        <Loader />
      ) : (
        <div className="grid">
          {data.recommendations.map((d) => (
            <DestinationCard
              key={d.id}
              destination={d}
              reason={d.reason}
              discovery={d.discovery}
            />
          ))}
        </div>
      )}
    </section>
  );
}
