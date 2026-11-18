import { Link } from 'react-router-dom';
import { DIVISIONS } from '../data/divisions.js';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand">TreXplore<span className="dot">.</span></div>
          <p style={{ maxWidth: '32ch', marginTop: 10, color: '#9daea3' }}>
            An independent guide to travel across Bangladesh's eight divisions.
          </p>
        </div>
        <div>
          <h3 style={{ color: '#e8e2d0', fontSize: '0.95rem' }}>Divisions</h3>
          {DIVISIONS.slice(0, 4).map((d) => (
            <div key={d.name} style={{ margin: '6px 0' }}>
              <Link to={`/destinations?division=${d.name}`}>{d.name}</Link>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ color: '#e8e2d0', fontSize: '0.95rem' }}>&nbsp;</h3>
          {DIVISIONS.slice(4).map((d) => (
            <div key={d.name} style={{ margin: '6px 0' }}>
              <Link to={`/destinations?division=${d.name}`}>{d.name}</Link>
            </div>
          ))}
        </div>
        <div>
          <h3 style={{ color: '#e8e2d0', fontSize: '0.95rem' }}>Explore</h3>
          <div style={{ margin: '6px 0' }}><Link to="/destinations">All destinations</Link></div>
          <div style={{ margin: '6px 0' }}><Link to="/blogs">Traveler stories</Link></div>
        </div>
      </div>
      <div className="container">
        <small>Built for CSE-356 Software Engineering — CUET.</small>
      </div>
    </footer>
  );
}
