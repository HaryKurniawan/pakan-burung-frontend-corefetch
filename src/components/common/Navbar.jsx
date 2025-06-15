// components/common/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCartContext } from '../../context/CartContext'; // Import useCartContext
import './Navbar.css';

const Navbar = () => {
  const { currentUser } = useAuth();
  const { cartCount } = useCartContext(); // Menggunakan cartCount dari context (jumlah produk unik)
  const navigate = useNavigate();

  return (
    <nav className="nav">
      <h1>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          E-Commerce App
        </Link>
      </h1>
      <div>
        {!currentUser ? (
          <Link to="/login" className="button">
            Login / Register
          </Link>
        ) : (
          <>
            <span className="welcome-text">Welcome, {currentUser.nama}!</span>
            {currentUser.role !== 'ADMIN' && (
              <>
                <Link to="/" className="button">
                  Products
                </Link>
                <Link to="/cart" className="button">
                  Cart ({cartCount}) {/* Menampilkan jumlah produk unik, bukan total quantity */}
                </Link>
              </>
            )}
            {currentUser.role === 'ADMIN' && (
              <Link to="/admin" className="button">
                Admin Panel
              </Link>
            )}
            <Link to="/profile" className="button">
              Profile
            </Link>
            <Link to="/orders" className="button">
              Orders
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;