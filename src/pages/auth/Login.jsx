import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'ADMIN' ? '/admin' : '/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = await authAPI.login(formData);
      login(userData);
      navigate(userData.role === 'ADMIN' ? '/admin' : '/');
      alert('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      alert('Error: ' + (error.response?.data?.message || error.message));
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const showForgotPasswordModal = () => {
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="login-form-container">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          className="login-input-field"
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <div className="login-password-wrapper">
          <input
            className="login-input-field login-password-field"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="login-password-visibility-toggle"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.45703 12C3.73128 7.94291 7.52159 5 12 5C16.4784 5 20.2687 7.94291 21.543 12C20.2687 16.0571 16.4784 19 12 19C7.52159 19 3.73128 16.0571 2.45703 12Z" stroke="#666" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#666" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
        
        <a 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            showForgotPasswordModal();
          }}
          className="login-forgot-password-link"
        >
          Lupa password?
        </a>

        <button className="login-submit-btn" type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
      </form>
      
      <div className="login-register-prompt">
        Belum punya akun? <Link to="/register" className="login-register-link">Daftar</Link>
      </div>

      <Modal
        title="Lupa Password"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        centered
        width={400}
      >
        <div className="login-modal-content">
          <div className="login-modal-illustration-wrapper">
            <svg 
              width="120" 
              height="120" 
              viewBox="0 0 120 120" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="login-modal-svg-icon"
            >
              {/* Background circle */}
              <circle cx="60" cy="60" r="60" fill="#f0f8ff" />
              
              {/* Lock icon */}
              <rect x="40" y="50" width="40" height="30" rx="4" fill="#d1d5db" stroke="#9ca3af" strokeWidth="2"/>
              <rect x="45" y="55" width="30" height="20" rx="2" fill="#6b7280"/>
              
              {/* Lock shackle */}
              <path d="M50 50V40C50 34.48 54.48 30 60 30C65.52 30 70 34.48 70 40V50" 
                    stroke="#9ca3af" 
                    strokeWidth="3" 
                    fill="none" 
                    strokeLinecap="round"/>
              
              {/* Key hole */}
              <circle cx="60" cy="65" r="3" fill="#374151"/>
              <rect x="58.5" y="65" width="3" height="8" fill="#374151"/>
              
              {/* Question mark */}
              <circle cx="85" cy="35" r="12" fill="#fef3c7"/>
              <text x="85" y="42" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#d97706">?</text>
            </svg>
          </div>
          
          <p className="login-modal-message">
            Saat ini fitur ini belum tersedia
          </p>
          
          <button 
            onClick={handleModalClose}
            className="login-modal-action-btn"
          >
            Baiklah
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Login;