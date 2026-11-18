import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container section center" style={{ padding: '100px 24px' }}>
      <h1 style={{ fontSize: '3rem' }}>Page not found</h1>
      <p className="muted">The page you're looking for doesn't exist or may have moved.</p>
      <Link to="/" className="btn btn-primary">Back to TreXplore</Link>
    </div>
  );
}
