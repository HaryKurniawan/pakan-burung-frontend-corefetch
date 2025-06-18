import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCartContext } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser } = useAuth();
  const { cartCount } = useCartContext(); 
  const navigate = useNavigate();

  return (
    <nav className="nav">
       <h3>Haii, {currentUser ? currentUser.nama : 'User'}</h3>

      <div>
        {!currentUser ? (
          <Link to="/login" className="button">
            Login / Register
          </Link>
        ) : (
          <>
            {currentUser.role !== 'ADMIN' && (
              <>
                <Link to="/" className="button">
                  Products
                </Link>
                <Link to="/cart" className="button">
                  Cart ({cartCount}) 
                </Link>
              </>
            )}
            {currentUser.role === 'ADMIN' && (
              <Link to="/admin" className="button">
                Admin Panel
              </Link>
            )}
            <Link to="/orders" className="button">
              Orders
            </Link>
            <Link to="/profile" className="button">
              Profile
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;