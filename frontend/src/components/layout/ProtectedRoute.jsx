import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="flex-col align-center justify-center" style={{ minHeight: '60vh', gap: '16px', padding: '24px' }}>
        <div style={{ 
          backgroundColor: 'var(--color-danger-bg)', 
          color: 'var(--color-danger)', 
          border: '1px solid var(--color-danger)', 
          padding: '32px', 
          borderRadius: 'var(--border-radius-lg)', 
          textAlign: 'center', 
          maxWidth: '480px',
          boxShadow: '0 10px 30px rgba(239, 68, 68, 0.1)'
        }}>
          <ShieldAlert size={54} style={{ margin: '0 auto 16px auto', animation: 'pulse-glow 2s infinite' }} />
          <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px 0' }}>Security Violation Alert</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '0 0 16px 0', lineHeight: 1.6 }}>
            Your simulated duty credentials **({currentUser.role})** are not whitelisted to access this secure command screen.
          </p>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Please authenticate using the correct simulated officer profile in the Login screen.
          </div>
        </div>
      </div>
    );
  }

  return children;
}
