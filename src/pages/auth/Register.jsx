import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './Register.css'; // tambahkan ini di bagian atas file Register.js

const Register = () => {
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    noHp: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    
    setLoading(true);

    try {
      const userData = await authAPI.register({
        nama: formData.nama,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        no_hp: formData.noHp
      });
      
      login(userData);
      navigate('/');
      alert('Registration successful!');
    } catch (error) {
      console.error('Registration error:', error);
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

  return (
    <div className="form-register">
      <h3>Register</h3>

      <form className='input-register-contain' onSubmit={handleSubmit}>
        <input className="input-register" type="text" name="nama" placeholder="Full Name" value={formData.nama} onChange={handleChange} required />
        
        <input className="input-register" type="text" name="username" placeholder="Username" value={formData.username} onChange={handleChange} required />
        
        <input className="input-register" type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        
        <div className="password-input-container">
          <input className="input-register-password" type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="password-input-container">
          <input className="input-register-password" type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
          <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <input className="input-register" type="tel" name="noHp" placeholder="Phone Number" value={formData.noHp} onChange={handleChange} required />
        
        <button className="button-register" type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Register'}
        </button>
      </form>
      <p className='goto-login'>
        Already have account? <Link to="/login"><b>Login here</b></Link>
      </p>
    </div>
  );
};

export default Register;