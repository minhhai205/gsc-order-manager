import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, User, Lock, AlertCircle, KeyRound } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleQuickLogin = async (uname) => {
    setError('');
    const res = await login(uname, '123');
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setError('');
    const res = await login(username, password);
    if (res.success) {
      navigate('/');
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
            <h2>GSC Order Manager</h2>
          </div>
          <p className="auth-subtitle">Monolithic Federal Logistics Command System</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-md">
          {error && (
            <div className="error-alert flex-row align-center gap-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex-col gap-xs relative">
            <label className="auth-label">Username</label>
            <div className="auth-input-wrapper">
              <User size={16} className="auth-input-icon" />
              <input 
                type="text" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="flex-col gap-xs relative">
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

          <button type="submit" className="btn btn-primary auth-submit-btn">
            Authenticate & Log In
          </button>
        </form>

        <div className="auth-footer">
          <span>Need custom permissions? </span>
          <Link to="/register" className="text-link font-semibold">Register account</Link>
        </div>

        {/* Quick Simulated Logins for High Usability */}
        <div className="quick-logins-panel">
          <div className="flex-row align-center gap-xs quick-login-title">
            <KeyRound size={12} />
            <span>Simulated Accounts (Click to log in instantly):</span>
          </div>
          <div className="grid-cols-2 gap-xs quick-login-grid">
            <button type="button" onClick={() => handleQuickLogin('officer')} className="quick-login-btn co-btn">
              <strong>John Miller</strong>
              <small>Contracting Officer</small>
            </button>
            <button type="button" onClick={() => handleQuickLogin('fulfillment')} className="quick-login-btn fulfillment-btn">
              <strong>Sarah Connor</strong>
              <small>Fulfillment Staff</small>
            </button>
            <button type="button" onClick={() => handleQuickLogin('warehouse')} className="quick-login-btn warehouse-btn">
              <strong>Carl Jenkins</strong>
              <small>Warehouse Staff</small>
            </button>
            <button type="button" onClick={() => handleQuickLogin('admin')} className="quick-login-btn admin-btn">
              <strong>Admin</strong>
              <small>System Admin (All access)</small>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
