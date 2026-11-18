import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import BlogCard from '../components/BlogCard.jsx';
import Loader from '../components/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Blogs() {
  const [params] = useSearchParams();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const destinationId = params.get('destination');

  useEffect(() => {
    setLoading(true);
    const query = destinationId ? { destinationId } : {};
    api.get('/blogs', { params: query })
      .then((res) => setBlogs(res.data.blogs))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, [destinationId]);

  return (
    <div className="container">
      <section className="section">
        <div className="section-head">
          <div>
            <h2>Traveler stories</h2>
            <p>Real trip notes from the TreXplore community.</p>
          </div>
          {user && <Link to="/blogs/new" className="btn btn-primary btn-sm">Write a story</Link>}
        </div>

        {loading ? (
          <Loader />
        ) : blogs.length ? (
          <div>{blogs.map((b) => <BlogCard key={b.id} blog={b} />)}</div>
        ) : (
          <div className="empty-state">
            No stories here yet. {user ? <Link to="/blogs/new">Be the first to write one.</Link> : 'Log in to write the first one.'}
          </div>
        )}
      </section>
    </div>
  );
}
