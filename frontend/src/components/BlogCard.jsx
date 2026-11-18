import { Link } from 'react-router-dom';

const excerpt = (text, len = 160) =>
  text.length > len ? text.slice(0, len).trim() + '…' : text;

export default function BlogCard({ blog }) {
  const initials = blog.author_name?.charAt(0).toUpperCase();
  const date = new Date(blog.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <article className="blog-card">
      <div className="blog-meta">
        <span className="author-badge">{initials}</span>
        <span>{blog.author_name}</span>
        <span>·</span>
        <span>{date}</span>
        {blog.destination_name && (
          <>
            <span>·</span>
            <span>{blog.destination_name}</span>
          </>
        )}
      </div>
      <Link to={`/blogs/${blog.slug}`}>
        <h3>{blog.title}</h3>
      </Link>
      <p className="blog-excerpt">{excerpt(blog.content)}</p>
      <Link to={`/blogs/${blog.slug}`} className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
        Read story
      </Link>
    </article>
  );
}
