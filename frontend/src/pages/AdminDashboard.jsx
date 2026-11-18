import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import { DIVISIONS, CATEGORIES } from "../data/divisions.js";

const emptyForm = {
  name: "",
  division: "Dhaka",
  district: "",
  category: "General",
  short_description: "",
  description: "",
  how_to_reach: "",
  best_time_to_visit: "",
  entry_fee: "Free",
  image_url: "",
};

export default function AdminDashboard() {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/destinations")
      .then((res) => setDestinations(res.data.destinations))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const startEdit = (d) => {
    setEditingId(d.id);
    setForm({
      name: d.name,
      division: d.division,
      district: d.district,
      category: d.category,
      short_description: d.short_description || "",
      description: d.description || "",
      how_to_reach: d.how_to_reach || "",
      best_time_to_visit: d.best_time_to_visit || "",
      entry_fee: d.entry_fee || "Free",
      image_url: d.image_url || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.district.trim()) {
      setError("Name and district are required.");
      return;
    }
    setSubmitting(true);
    try {
      let payload = form;
      if (imageFile) {
        const upload = new FormData();
        upload.append("file", imageFile);
        const result = await api.post("/uploads/destination", upload);
        payload = { ...form, image_url: result.data.url };
      }
      if (editingId) {
        await api.put(`/destinations/${editingId}`, payload);
      } else {
        await api.post("/destinations", payload);
      }
      cancelEdit();
      load();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not save this destination.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this destination? This cannot be undone."))
      return;
    await api.delete(`/destinations/${id}`);
    load();
  };

  return (
    <div className="container">
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Manage destinations</h2>
            <p>
              Add, edit, and organize tourism content by division and district.
            </p>
          </div>
        </div>

        <div className="admin-layout">
          <form onSubmit={handleSubmit} className="info-panel">
            <h3 style={{ marginBottom: 14 }}>
              {editingId ? "Edit destination" : "Add a destination"}
            </h3>
            {error && <div className="form-error">{error}</div>}

            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={handleChange("name")} />
            </div>
            <div className="field">
              <label>Division</label>
              <select value={form.division} onChange={handleChange("division")}>
                {DIVISIONS.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>District</label>
              <input
                value={form.district}
                onChange={handleChange("district")}
              />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={handleChange("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Short description</label>
              <input
                value={form.short_description}
                onChange={handleChange("short_description")}
              />
            </div>
            <div className="field">
              <label>Full description</label>
              <textarea
                value={form.description}
                onChange={handleChange("description")}
              />
            </div>
            <div className="field">
              <label>How to reach</label>
              <textarea
                value={form.how_to_reach}
                onChange={handleChange("how_to_reach")}
                style={{ minHeight: 80 }}
              />
            </div>
            <div className="field">
              <label>Best time to visit</label>
              <input
                value={form.best_time_to_visit}
                onChange={handleChange("best_time_to_visit")}
              />
            </div>
            <div className="field">
              <label>Entry fee</label>
              <input
                value={form.entry_fee}
                onChange={handleChange("entry_fee")}
              />
            </div>

            <div className="field">
              <label htmlFor="destination-image">Destination image</label>
              <input
                id="destination-image"
                type="file"
                accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              />
              {form.image_url && !imageFile && <span className="muted">Current image is saved.</span>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-primary" disabled={submitting}>
                {submitting
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Add destination"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div>
            {loading ? (
              <Loader />
            ) : (
              <div
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 6,
                  overflow: "hidden",
                }}
              >
                {destinations.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 18px",
                      borderBottom: "1px solid var(--line)",
                    }}
                  >
                    <div>
                      <strong>{d.name}</strong>
                      <div className="muted" style={{ fontSize: "0.85rem" }}>
                        {d.division} · {d.district} · {d.category}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => startEdit(d)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(d.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {!destinations.length && (
                  <div className="empty-state">
                    No destinations yet — add the first one.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
