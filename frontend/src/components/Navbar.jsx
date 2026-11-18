import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          TreXplore<span className="dot">.</span>
        </Link>
        <nav className="nav-links">
          <NavLink to="/destinations">Destinations</NavLink>
          <NavLink to="/blogs">Stories</NavLink>
          {user && <NavLink to="/for-you">For You</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Manage</NavLink>}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/blogs/new" className="btn btn-outline btn-sm">Write a story</Link>
              <Link to="/profile" className="nav-user" title={user.name}>
                {user.name.charAt(0).toUpperCase()}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
