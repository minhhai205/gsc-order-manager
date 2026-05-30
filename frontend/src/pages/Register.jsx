import React, { useState } from 'react';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, User, Lock, FileSignature, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES.CONTRACTING_OFFICER);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password || !name) return;
    setError('');
    setSuccess('');
    const res = await register(username, password, name, role);
    if (res.success) {
      setSuccess('Tài khoản đã đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="silk-container">
        <div className="silk-ribbon silk-1"></div>
        <div className="silk-ribbon silk-2"></div>
      </div>

      <div className="glass-panel auth-card">
        <div className="auth-header">
          <div className="auth-brand">
            <Layers size={32} className="pulse-icon" />
            <h2>Create Account</h2>
          </div>
          <p className="auth-subtitle">Register new officer credentials in the logistics network</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-md">
          {error && (
            <div className="error-alert flex-row align-center gap-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-alert flex-row align-center gap-sm">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="flex-col gap-xs">
            <label className="auth-label">Full Name</label>
            <div className="auth-input-wrapper">
              <FileSignature size={16} className="auth-input-icon" />
              <input 
                type="text" 
                placeholder="e.g. Agent John Miller" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="flex-col gap-xs">
            <label className="auth-label">Username</label>
            <div className="auth-input-wrapper">
              <User size={16} className="auth-input-icon" />
              <input 
                type="text" 
                placeholder="Choose username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="flex-col gap-xs">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="flex-col gap-xs">
            <label className="auth-label">Assigned Duty/Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="auth-select"
              required
            >
              <option value={ROLES.CONTRACTING_OFFICER}>Contracting Officer (CO)</option>
              <option value={ROLES.ORDER_FULFILLMENT_STAFF}>Fulfillment Logistics Staff</option>
              <option value={ROLES.WAREHOUSE_STAFF}>Warehouse Management Staff</option>
              <option value={ROLES.SYSTEM_ADMIN}>System Administrator</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" style={{ marginTop: '8px' }}>
            Register Duty Credentials
          </button>
        </form>

        <div className="auth-footer">
          <span>Already registered? </span>
          <Link to="/login" className="text-link font-semibold">Log in here</Link>
        </div>
      </div>
    </div>
  );
}
