import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Address from './pages/Address';
import Cart from './pages/Cart';
import AdminPanel from './pages/admin/AdminPanel';
import ProtectedRoute from './components/common/ProtectedRoute';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

function AppRoutes() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <div className="container">
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          {/* Route home - admin tidak boleh akses */}
          <Route path="/" element={<ProtectedRoute adminOnly={false}><Home /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Route user biasa - admin tidak boleh akses */}
          <Route path="/profile" element={<ProtectedRoute adminOnly={false}><Profile /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute adminOnly={false}><EditProfile /></ProtectedRoute>} />
          <Route path="/address" element={<ProtectedRoute adminOnly={false}><Address /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute adminOnly={false}><Cart /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute adminOnly={false}><Orders /></ProtectedRoute>} />
          <Route path="/order-detail" element={<ProtectedRoute adminOnly={false}><OrderDetail /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute adminOnly={false}><Checkout /></ProtectedRoute>} />
          
          {/* Route admin - hanya admin yang boleh akses */}
          <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPanel /></ProtectedRoute>} />
          
          {/* Route publik - bisa diakses siapa saja */}
          <Route path="/produk/:id" element={<ProductDetail />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default AppRoutes;