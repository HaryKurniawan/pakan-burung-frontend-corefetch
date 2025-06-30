// src/components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    // Belum login
    return <Navigate to="/login" replace />;
  }

  if (adminOnly) {
    // Route khusus admin - hanya admin yang boleh akses
    if (currentUser.role !== 'ADMIN') {
      return <Navigate to="/" replace />;
    }
  } else {
    // Route biasa - admin tidak boleh akses, redirect ke /admin
    if (currentUser.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;