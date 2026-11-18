import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";

export default function BlogCreate() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/destinations")
      .then((res) => setDestinations(res.data.destinations))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!title.trim() || !content.trim()) {
      setError("Please add both a title and your story.");
      return;
    }
    setSubmitting(true);
    try {
      let coverImageUrl;
      if (coverImage) {
        const upload = new FormData();
        upload.append("file", coverImage);
        const uploaded = await api.post("/uploads/blog", upload);
        coverImageUrl = uploaded.data.url;
      }
      const res = await api.post("/blogs", {
        title,
        content,
        destinationId: destinationId || undefined,
        coverImageUrl,
      });
      navigate(`/blogs/${res.data.blog.slug}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not publish your story. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <section className="section" style={{ maxWidth: 640, margin: "0 auto" }}>
        <h2>Write a story</h2>
        <p className="muted">
          Share what a place was actually like — the good parts and the
          practical tips.
        </p>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Three days in Sajek Valley"
            />
          </div>

          <div className="field">
            <label htmlFor="destination">Related destination (optional)</label>
            <select
              id="destination"
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
            >
              <option value="">None</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="content">Your story</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="How you got there, what surprised you, what you'd tell a friend..."
            />
          </div>

          <div className="field">
            <label htmlFor="cover-image">Cover image (optional)</label>
            <input
              id="cover-image"
              type="file"
              accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? "Publishing…" : "Publish story"}
          </button>
        </form>
      </section>
    </div>
  );
}
