import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import DestinationCard from "../components/DestinationCard.jsx";
import BlogCard from "../components/BlogCard.jsx";
import Loader from "../components/Loader.jsx";
import Recommended from "../components/Recommended.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { DIVISIONS } from "../data/divisions.js";

export default function Home() {
  const [destinations, setDestinations] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([api.get("/destinations"), api.get("/blogs")])
      .then(([d, b]) => {
        setDestinations(d.data.destinations);
        setBlogs(b.data.blogs.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const goToDivision = (name) => navigate(`/destinations?division=${name}`);
  const heroDestinations = destinations.filter(
    (destination) => destination.image_url,
  );
  const activeHeroDestination = heroDestinations[heroIndex];
  const moveHero = (direction) => {
    if (!heroDestinations.length) return;
    setHeroIndex(
      (current) =>
        (current + direction + heroDestinations.length) %
        heroDestinations.length,
    );
  };

  return (
    <>
      <section
        className="hero"
        style={
          activeHeroDestination
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(20, 39, 32, 0.94) 0%, rgba(20, 39, 32, 0.7) 48%, rgba(20, 39, 32, 0.35) 100%), url(${activeHeroDestination.image_url})`,
              }
            : undefined
        }
      >
        <div className="hero-inner">
          <div>
            <div className="eyebrow-line">Eight divisions, one guide</div>
            <h1>Bangladesh, mapped for the way you actually travel.</h1>
            <p className="lead">
              TreXplore brings scattered tourism information together — beaches
              in Cox's Bazar, tea gardens in Sylhet, mangroves in the Sundarbans
              — so you can plan a trip instead of piecing one together.
            </p>
            <div className="hero-actions">
              <Link to="/destinations" className="btn btn-primary">
                Browse destinations
              </Link>
              <Link
                to="/blogs"
                className="btn btn-outline"
                style={{ borderColor: "#cfe0d6", color: "#cfe0d6" }}
              >
                Read traveler stories
              </Link>
            </div>
          </div>
          {activeHeroDestination && (
            <div
              className="hero-gallery"
              aria-label="Destination image controls"
            >
              <span className="hero-gallery-caption">
                {activeHeroDestination.name}
              </span>
              <button
                type="button"
                className="hero-gallery-arrow"
                onClick={() => moveHero(-1)}
                aria-label="Show previous destination image"
              >
                &#8592;
              </button>
              <button
                type="button"
                className="hero-gallery-arrow"
                onClick={() => moveHero(1)}
                aria-label="Show next destination image"
              >
                &#8594;
              </button>
            </div>
          )}
        </div>
      </section>

      <div className="division-strip">
        {DIVISIONS.map((d) => (
          <button
            key={d.name}
            className="division-chip"
            onClick={() => goToDivision(d.name)}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="container">
        {user && <Recommended limit={3} />}

        <section className="section">
          <div className="section-head">
            <div>
              <h2>Featured destinations</h2>
              <p>A first look at places travelers search for most.</p>
            </div>
            <Link to="/destinations" className="btn btn-ghost btn-sm">
              See all
            </Link>
          </div>
          {loading ? (
            <Loader />
          ) : destinations.length ? (
            <div className="grid">
              {destinations.slice(0, 6).map((d) => (
                <DestinationCard key={d.id} destination={d} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No destinations yet. Once the API and database are seeded, they'll
              show up here.
            </div>
          )}
        </section>

        {blogs.length > 0 && (
          <section className="section">
            <div className="section-head">
              <div>
                <h2>Latest stories</h2>
                <p>Trip notes from travelers who've been there.</p>
              </div>
              <Link to="/blogs" className="btn btn-ghost btn-sm">
                See all
              </Link>
            </div>
            <div>
              {blogs.map((b) => (
                <BlogCard key={b.id} blog={b} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
