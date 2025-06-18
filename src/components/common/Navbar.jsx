// components/Navbar/Navbar.js
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCartContext } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser } = useAuth();
  const { cartCount } = useCartContext();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  // Halaman tanpa Navbar sama sekali
  const hideNavbar = ['/login', '/register'].includes(location.pathname);

  // Halaman yang menampilkan mobile bottom nav
  const showMobileBottom = ['/', '/orders', '/profile'].includes(location.pathname);

  // Menentukan apakah tombol back ditampilkan di mobile top
  const showBackButtonMobileTop = !showMobileBottom;

  if (hideNavbar) return null; // Jangan tampilkan navbar sama sekali

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="nav desktop-nav">
        <h3>Haii, {currentUser ? currentUser.nama : 'User'}</h3>
        <div className="nav-right">
          {!currentUser ? (
            <Link to="/login" className="button">Login / Register</Link>
          ) : (
            <>
              {currentUser.role !== 'ADMIN' && (
                <>
                  <Link to="/" className="button">Products</Link>
                  <Link to="/cart" className="button">Cart ({cartCount})</Link>
                </>
              )}
              {currentUser.role === 'ADMIN' && (
                <Link to="/admin" className="button">Admin Panel</Link>
              )}
              <Link to="/orders" className="button">Orders</Link>
              <Link to="/profile" className="button">Profile</Link>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="mobile-top">
        <div className="mobile-left">
          {showBackButtonMobileTop ? (
            <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
          ) : (
            <span className="mobile-user">Haii, {currentUser ? currentUser.nama : 'User'}</span>
          )}
        </div>
        <Link to="/cart" className="mobile-cart">🛒 ({cartCount})</Link>
      </div>

      {/* Mobile Bottom Navigation */}
      {showMobileBottom && (
        <div className="mobile-bottom">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>Home</Link>
          <Link to="/orders" className={`nav-item ${isActive('/orders') ? 'active' : ''}`}>Orders</Link>
          <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>Profile</Link>
        </div>
      )}
    </>
  );
};

export default Navbar;
