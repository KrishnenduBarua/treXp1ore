import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import BlogCard from "../components/BlogCard.jsx";
import Loader from "../components/Loader.jsx";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [myBlogs, setMyBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/blogs", { params: { userId: user.id } })
      .then((res) => setMyBlogs(res.data.blogs))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.put("/users/me", { name, bio });
      updateUser(res.data.user);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Your profile</h2>
            <p>Manage how you appear on the stories you publish.</p>
          </div>
        </div>

        <div className="profile-layout">
          <form onSubmit={handleSave}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A line about how you travel."
                style={{ minHeight: 100 }}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input value={user.email} disabled />
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <span className="muted" style={{ marginLeft: 12 }}>
                Saved.
              </span>
            )}
          </form>

          <div>
            <h3 style={{ marginBottom: 16 }}>Your stories</h3>
            {loading ? (
              <Loader />
            ) : myBlogs.length ? (
              myBlogs.map((b) => <BlogCard key={b.id} blog={b} />)
            ) : (
              <div className="empty-state">
                You haven't published a story yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
