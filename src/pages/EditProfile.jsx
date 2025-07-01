import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/authAPI';
import Header from '../components/common/Header'


const EditProfile = () => {
  const { currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nama: currentUser?.nama || '',
    email: currentUser?.email || '',
    noHp: currentUser?.no_hp || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.nama.trim() || !formData.email.trim()) {
        throw new Error('Name and email are required');
      }

      // Prepare update data
      const updateData = {
        nama: formData.nama.trim(),
        email: formData.email.trim(),
        no_hp: formData.noHp.trim()
      };

      // Update user profile
      await authAPI.updateProfile(currentUser.id, updateData);
      
      // Update current user state
      updateUser(updateData);
      
      navigate('/profile');
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Error updating profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="form">
       <Header title="Edit Profil" />

      <form onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          name="nama"
          placeholder="Full Name"
          value={formData.nama}
          onChange={handleChange}
          required
        />
        <input
          className="input"
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          className="input"
          type="tel"
          name="noHp"
          placeholder="Phone Number"
          value={formData.noHp}
          onChange={handleChange}
        />

        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
        <button 
          type="button"
          className="button secondary"
          onClick={() => navigate('/profile')}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default EditProfile;