import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get(`/blogs/${slug}`)
      .then((res) => setBlog(res.data.blog))
      .catch(() => setError('This story could not be found.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this story? This cannot be undone.')) return;
    await api.delete(`/blogs/${blog.id}`);
    navigate('/blogs');
  };

  if (loading) return <Loader />;
  if (error || !blog) return <div className="container section"><div className="empty-state">{error}</div></div>;

  const canManage = user && (user.id === blog.user_id || user.role === 'admin');
  const date = new Date(blog.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="container">
      <section className="section" style={{ maxWidth: 720, margin: '0 auto' }}>
        {blog.destination_name && (
          <span className="division-tag" style={{ background: 'var(--teal)', color: 'var(--paper)' }}>
            {blog.destination_name}
          </span>
        )}
        <h1 style={{ marginTop: 14 }}>{blog.title}</h1>
        <div className="blog-meta" style={{ marginBottom: 30 }}>
          <span className="author-badge">{blog.author_name.charAt(0).toUpperCase()}</span>
          <span>{blog.author_name}</span>
          <span>·</span>
          <span>{date}</span>
        </div>

        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>{blog.content}</div>

        {canManage && (
          <div style={{ display: 'flex', gap: 10, marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete story</button>
          </div>
        )}

        <div style={{ marginTop: 30 }}>
          <Link to="/blogs" className="btn btn-ghost btn-sm">← Back to stories</Link>
        </div>
      </section>
    </div>
  );
}
