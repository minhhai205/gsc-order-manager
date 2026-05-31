import React, { useState, useEffect } from 'react';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, User, Lock, FileSignature, AlertCircle, CheckCircle, Eye, EyeOff, Key } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLES.CONTRACTING_OFFICER);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0); // 0 to 3

  // Update password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    let score = 0;
    if (password.length >= 6) score += 1;
    if (/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    setPasswordStrength(score);
  }, [password]);

  const getStrengthClass = (segmentIndex) => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1 && segmentIndex === 1) return 'active-weak';
    if (passwordStrength === 2 && segmentIndex <= 2) return 'active-fair';
    if (passwordStrength === 3 && segmentIndex <= 3) return 'active-strong';
    return '';
  };

  const getStrengthLabel = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Weak (Add numbers & characters)';
    if (passwordStrength === 2) return 'Fair (Good combination)';
    if (passwordStrength === 3) return 'Strong (Highly Secure)';
    return '';
  };

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
      <div className="premium-auth-card">
        
        <div className="auth-header-logo-centered">
          <Layers size={36} className="pulse-icon" style={{ color: '#ec4899' }} />
          <h2>Request Duty Access</h2>
          <p>Enroll new officer profile in GSC Supply Network</p>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-md">
          {error && (
            <div className="error-alert flex-row align-center gap-sm" style={{ margin: 0, padding: '12px 16px', borderRadius: '12px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{error}</span>
            </div>
          )}

          {success && (
            <div className="success-alert flex-row align-center gap-sm" style={{ margin: 0, padding: '12px 16px', borderRadius: '12px' }}>
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>{success}</span>
            </div>
          )}

          <div className="auth-field-container">
            <label>Full Identity Name</label>
            <div className="auth-input-wrapper">
              <FileSignature size={18} className="auth-input-icon" />
              <input 
                type="text" 
                placeholder="e.g. Capt. Alex Mercer" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-field-container">
            <label>Duty Username</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input 
                type="text" 
                placeholder="Choose network handle" 
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
                placeholder="Create secure password" 
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

            {password && (
              <>
                <div className="password-strength-meter">
                  <div className={`password-strength-segment ${getStrengthClass(1)}`}></div>
                  <div className={`password-strength-segment ${getStrengthClass(2)}`}></div>
                  <div className={`password-strength-segment ${getStrengthClass(3)}`}></div>
                </div>
                <span className="password-tip-text">
                  <Key size={10} style={{ color: 'var(--text-muted)' }} />
                  <span>{getStrengthLabel()}</span>
                </span>
              </>
            )}
          </div>

          <div className="auth-field-container">
            <label>Assigned Logistics Role</label>
            <div className="auth-input-wrapper">
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
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" style={{ marginTop: '8px', borderRadius: '12px' }}>
            Enroll Profile Credentials
          </button>
        </form>

        <div className="auth-footer" style={{ borderTop: '1px solid var(--border-light)', paddingTop: '20px', margin: 0 }}>
          <span>Already verified officer? </span>
          <Link to="/login" className="text-link font-semibold" style={{ color: 'var(--color-primary)' }}>Secure Sign-In</Link>
        </div>

      </div>
    </div>
  );
}

