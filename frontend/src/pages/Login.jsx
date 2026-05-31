import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, User, Lock, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="premium-auth-card">
        
        <div className="auth-header-logo-centered">
          <Layers size={36} className="pulse-icon" style={{ color: 'var(--color-primary)' }} />
          <h2>GSC Order Manager</h2>
          <p>Monolithic Federal Logistics Command System</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-md">
          {error && (
            <div className="error-alert flex-row align-center gap-sm" style={{ margin: 0, padding: '12px 16px', borderRadius: '12px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
            </div>
          )}

          <div className="auth-field-container">
            <label>Username</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input 
                type="text" 
                placeholder="Enter command username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field-container">
            <label>Access Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle-btn"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" style={{ marginTop: '4px', borderRadius: '12px' }}>
            Verify Key & Establish Session
          </button>
        </form>

        <div className="auth-footer" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', margin: 0 }}>
          <span>Need duty clearance? </span>
          <Link to="/register" className="text-link font-semibold" style={{ color: 'var(--color-primary)' }}>Request Credentials</Link>
        </div>

        {/* Quick Simulated CAC smartcards */}
        <div className="quick-logins-container">
          <div className="quick-logins-header">
            <span>
              <KeyRound size={12} style={{ color: 'var(--color-primary)' }} />
              <span>Secure CAC Card Bypass</span>
            </span>
            <span className="quick-logins-badge">Simulated</span>
          </div>

          <div className="cac-grid">
            <button type="button" onClick={() => handleQuickLogin('officer')} className="cac-smartcard-btn co-card">
              <div className="cac-card-header">
                <div className="cac-card-chip"></div>
                <div className="cac-card-avatar">JM</div>
              </div>
              <div className="cac-card-info">
                <strong>John Miller</strong>
                <small>Contracting Officer</small>
              </div>
            </button>

            <button type="button" onClick={() => handleQuickLogin('fulfillment')} className="cac-smartcard-btn fulfillment-card">
              <div className="cac-card-header">
                <div className="cac-card-chip"></div>
                <div className="cac-card-avatar">SC</div>
              </div>
              <div className="cac-card-info">
                <strong>Sarah Connor</strong>
                <small>Logistics Staff</small>
              </div>
            </button>

            <button type="button" onClick={() => handleQuickLogin('warehouse')} className="cac-smartcard-btn warehouse-card">
              <div className="cac-card-header">
                <div className="cac-card-chip"></div>
                <div className="cac-card-avatar">CJ</div>
              </div>
              <div className="cac-card-info">
                <strong>Carl Jenkins</strong>
                <small>Warehouse Staff</small>
              </div>
            </button>

            <button type="button" onClick={() => handleQuickLogin('admin')} className="cac-smartcard-btn admin-card">
              <div className="cac-card-header">
                <div className="cac-card-chip"></div>
                <div className="cac-card-avatar">AD</div>
              </div>
              <div className="cac-card-info">
                <strong>System Admin</strong>
                <small>Command Access</small>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

