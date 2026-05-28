import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../ui/Modal';
import { Sun, Moon, Layers, User, LogOut, Settings, Bell, Check, KeyRound } from 'lucide-react';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout, updateProfile } = useAuth();

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePassword, setProfilePassword] = useState(currentUser?.password || '');
  const [profileTheme, setProfileTheme] = useState(currentUser?.themeClass || 'default');
  const [profileNotif, setProfileNotif] = useState(
    currentUser?.notifications || { emailAlerts: true, stockAlerts: true, dbAlerts: false }
  );

  const getFriendlyRoleName = (r) => {
    switch (r) {
      case 'SYSTEM_ADMIN': return 'System Admin';
      case 'CONTRACTING_OFFICER': return 'Contracting Officer';
      case 'ORDER_FULFILLMENT_STAFF': return 'Fulfillment Logistics';
      case 'WAREHOUSE_STAFF': return 'Warehouse Management';
      default: return r;
    }
  };

  const handleOpenSettings = () => {
    setProfileName(currentUser?.name || '');
    setProfilePassword(currentUser?.password || '');
    setProfileTheme(currentUser?.themeClass || 'default');
    setProfileNotif(currentUser?.notifications || { emailAlerts: true, stockAlerts: true, dbAlerts: false });
    setShowSettingsModal(true);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const res = updateProfile(profileName, profilePassword, profileTheme, profileNotif);
    if (res.success) {
      alert('Personal profile settings successfully updated and applied!');
      setShowSettingsModal(false);
    }
  };

  // Preset themes catalog
  const THEME_PRESETS = [
    { id: 'default', name: 'Default Indigo', color: '#6366f1', label: 'Indigo Core' },
    { id: 'spring', name: 'Spring Mint', color: '#f472b6', label: 'Sakura Pink' },
    { id: 'summer', name: 'Summer Turquoise', color: '#06b6d4', label: 'Aqua breeze' },
    { id: 'autumn', name: 'Autumn Copper', color: '#f97316', label: 'Maple Copper' },
    { id: 'winter', name: 'Winter Ice', color: '#38bdf8', label: 'Glacier Blue' },
    { id: 'tet', name: 'Imperial Tet Red', color: '#ef4444', label: 'Red & Gold' }
  ];

  return (
    <header className="app-header">
      <div className="brand-title">
        <span className="brand-icon">
          <Layers size={22} className="pulse-icon" />
        </span>
        GSC Order Manager
      </div>

      <div className="controls-group">
        {/* User profile & details customizer */}
        {currentUser && (
          <div className="flex-row align-center gap-md user-profile-header-group">
            <div 
              className="flex-row align-center gap-xs cursor-pointer" 
              onClick={handleOpenSettings}
              title="Open Personal Profile Customizations"
            >
              <div className="flex-col align-end">
                <span className="user-profile-name" style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>
                  {currentUser.name}
                </span>
                <span className="user-profile-role" style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  {getFriendlyRoleName(currentUser.role)}
                </span>
              </div>
              <div 
                className="user-profile-avatar" 
                style={{ 
                  backgroundColor: 'var(--color-primary-light)', 
                  color: 'var(--color-primary)', 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700, 
                  fontSize: '14px', 
                  border: '1px solid var(--border-light)' 
                }}
              >
                <User size={16} style={{ margin: 'auto' }} />
              </div>
            </div>

            {/* Logout button */}
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

      {/* PERSONAL PROFILE CUSTOMIZER MODAL */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Personal Officer Customizations (UC-Settings)">
        <form onSubmit={handleSaveSettings} className="flex-col gap-md">
          
          <div className="form-section-title">Profile Authentication</div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xxs">
              <label>Duty Officer Name</label>
              <input 
                type="text" 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)} 
                required 
              />
            </div>
            <div className="flex-col gap-xxs">
              <label>Simulated Password</label>
              <input 
                type="password" 
                value={profilePassword} 
                onChange={(e) => setProfilePassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div className="form-section-title" style={{ marginTop: '8px' }}>Visual Seasonal Accents Theme</div>
          <p style={{ margin: '0 0 10px 0', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Choose a seasonal accent theme. Accent colors on borders, graphs, and indicators will shift dynamically system-wide.
          </p>
          <div className="grid-cols-3 gap-xs" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {THEME_PRESETS.map(preset => {
              const isActive = profileTheme === preset.id;
              return (
                <div 
                  key={preset.id}
                  onClick={() => setProfileTheme(preset.id)}
                  style={{
                    border: isActive ? '2px solid var(--border-focus)' : '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '10px',
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-primary-light)' : 'rgba(10,17,40,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.color, border: '1px solid var(--border-medium)' }}></div>
                  <strong style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{preset.name}</strong>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{preset.label}</span>
                </div>
              );
            })}
          </div>

          <div className="form-section-title" style={{ marginTop: '8px' }}>Logistics Alerts Notifications</div>
          <div className="flex-col gap-sm" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-sm)', padding: '12px', background: 'rgba(10,17,40,0.01)' }}>
            <label className="flex-row align-center gap-sm cursor-pointer" style={{ textTransform: 'none', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
              <input 
                type="checkbox" 
                checked={profileNotif.emailAlerts}
                onChange={(e) => setProfileNotif({...profileNotif, emailAlerts: e.target.checked})}
                style={{ width: 'auto', marginRight: '6px' }}
              />
              <span>Send secure emails to agencies upon compliance validation failures</span>
            </label>
            <label className="flex-row align-center gap-sm cursor-pointer" style={{ textTransform: 'none', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
              <input 
                type="checkbox" 
                checked={profileNotif.stockAlerts}
                onChange={(e) => setProfileNotif({...profileNotif, stockAlerts: e.target.checked})}
                style={{ width: 'auto', marginRight: '6px' }}
              />
              <span>Desktop warning notifications upon inventory shortages</span>
            </label>
            <label className="flex-row align-center gap-sm cursor-pointer" style={{ textTransform: 'none', fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
              <input 
                type="checkbox" 
                checked={profileNotif.dbAlerts}
                onChange={(e) => setProfileNotif({...profileNotif, dbAlerts: e.target.checked})}
                style={{ width: 'auto', marginRight: '6px' }}
              />
              <span>Integrity alert warnings on backup triggers</span>
            </label>
          </div>

          <div className="flex-row justify-end gap-sm" style={{ marginTop: '16px' }}>
            <button type="button" onClick={() => setShowSettingsModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} />
              Save Settings
            </button>
          </div>
        </form>
      </Modal>
    </header>
  );
}
