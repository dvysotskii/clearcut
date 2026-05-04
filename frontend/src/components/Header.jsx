import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';

export default function Header() {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const handleTry = () => navigate('/editor');

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            ClearCut
          </Link>

          <nav className="header-nav">
            <a href="/#features" className="nav-link">Возможности</a>
            <a href="/#pricing" className="nav-link">Цены</a>
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <button className="btn-ghost" onClick={logout}>Выйти</button>
              </>
            ) : (
              <>
                <button className="btn-ghost" onClick={() => setShowAuth(true)}>Войти</button>
                <button className="btn-primary" onClick={handleTry}>Попробовать</button>
              </>
            )}
          </div>
        </div>
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
