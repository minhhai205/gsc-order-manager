import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Sun, Moon, Layers, User, LogOut } from 'lucide-react';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  const getFriendlyRoleName = (r) => {
    switch (r) {
      case 'SYSTEM_ADMIN': return 'System Admin';
      case 'CONTRACTING_OFFICER': return 'Contracting Officer';
      case 'ORDER_FULFILLMENT_STAFF': return 'Fulfillment Logistics';
      case 'WAREHOUSE_STAFF': return 'Warehouse Management';
      default: return r;
    }
  };

  return (
    <header className="app-header">
      <div className="brand-title">
        <span className="brand-icon">
          <Layers size={22} className="pulse-icon" />
        </span>
        GSC Order Manager
      </div>

      <div className="controls-group">
        {/* Theme toggle */}
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User profile & logout */}
        {currentUser && (
          <div className="flex-row align-center gap-md user-profile-header-group">
            <div className="flex-col align-end">
              <span className="user-profile-name" style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                {currentUser.name}
              </span>
              <span className="user-profile-role" style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                {getFriendlyRoleName(currentUser.role)}
              </span>
            </div>
            <div className="user-profile-avatar" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 700, fontSize: '14px', border: '1px solid var(--border-light)' }}>
              <User size={16} style={{ margin: 'auto' }} />
            </div>
            <button 
              onClick={logout} 
              className="btn btn-secondary logout-btn" 
              style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Log Out Session"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
