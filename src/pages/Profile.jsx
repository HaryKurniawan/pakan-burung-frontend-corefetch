import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Profile.css'; // Import CSS baru

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="form">
      <h2>Profile</h2>

      <div className="profile-info">
        <p><strong>Name:</strong> {currentUser.nama}</p>
        <p><strong>Username:</strong> {currentUser.username}</p>
        <p><strong>Email:</strong> {currentUser.email}</p>
        <p><strong>Phone:</strong> {currentUser.no_hp || 'Not provided'}</p>
      </div>

      <div className="actions">
        <Link to="/edit-profile" className="button">Edit Profile</Link>
        <Link to="/address" className="button">Kelola Alamat</Link>
        <button className="button danger" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default Profile;
