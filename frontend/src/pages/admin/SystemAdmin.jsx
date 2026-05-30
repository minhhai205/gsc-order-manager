import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';
import { 
  Database, 
  ShieldAlert, 
  RotateCcw, 
  Search, 
  Terminal, 
  UserPlus, 
  Users, 
  UserCheck, 
  UserX, 
  Edit2, 
  Trash2, 
  Lock, 
  Unlock, 
  Activity, 
  FileText, 
  AlertCircle,
  Settings,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

export default function SystemAdmin() {
  const { auditLogs, backups, triggerDatabaseBackup, triggerDatabaseRestore, addAuditLog } = useAppData();
  const { currentUser, users, adminCreateUser, adminUpdateUser, adminDeleteUser } = useAuth();

  const isAdmin = currentUser?.role === ROLES.SYSTEM_ADMIN;

  // Active Tab: 'users' (UC10), 'backups' (UC11), 'audit' (Logs Feed)
  const [activeTab, setActiveTab] = useState('users');

  // General Notification Alert
  const [systemAlert, setSystemAlert] = useState(null);

  // Search/Filters states
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState('all');

  // Modal display states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states for Create/Edit Modals
  const [formDataName, setFormDataName] = useState('');
  const [formDataUsername, setFormDataUsername] = useState('');
  const [formDataPassword, setFormDataPassword] = useState('');
  const [formDataRole, setFormDataRole] = useState(ROLES.CONTRACTING_OFFICER);
  const [formDataStatus, setFormDataStatus] = useState('ACTIVE');

  // Trigger Toast Notification Alert
  const showAlert = (message, type = 'success') => {
    setSystemAlert({ message, type });
    setTimeout(() => {
      setSystemAlert(null);
    }, 4000);
  };

  const resetForm = () => {
    setFormDataName('');
    setFormDataUsername('');
    setFormDataPassword('');
    setFormDataRole(ROLES.CONTRACTING_OFFICER);
    setFormDataStatus('ACTIVE');
    setSelectedUser(null);
  };

  // UC11: Backup Trigger
  const onBackup = async () => {
    try {
      const path = await triggerDatabaseBackup();
      showAlert(`System Database archive written to path: ${path}`, 'success');
    } catch (err) {
      showAlert('Failed to write database backup: ' + err.message, 'error');
    }
  };

  // UC11: Restore Trigger
  const onRestore = async (bak) => {
    if (window.confirm(`Are you sure you want to restore the system state to database archive: "${bak.fileName}"? This will overwrite active parameters.`)) {
      try {
        await triggerDatabaseRestore(bak);
        showAlert(`Disaster recovery restoration completed successfully from file: ${bak.fileName}!`, 'success');
      } catch (err) {
        showAlert('Failed to restore database snap state: ' + err.message, 'error');
      }
    }
  };

  // UC10: Create User Account Action
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formDataName.trim()) {
      showAlert('Display Name is strictly required!', 'error');
      return;
    }
    if (!formDataUsername.trim()) {
      showAlert('Account Username is strictly required!', 'error');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formDataUsername)) {
      showAlert('Username must contain only letters, numbers, and underscores!', 'error');
      return;
    }
    if (!formDataPassword.trim()) {
      showAlert('Temporary Password is required to initialize security credentials!', 'error');
      return;
    }
    if (formDataPassword.length < 3) {
      showAlert('Password must contain at least 3 characters!', 'error');
      return;
    }

    const result = await adminCreateUser(formDataUsername, formDataPassword, formDataName, formDataRole, formDataStatus);
    
    if (result.success) {
      if (addAuditLog) {
        addAuditLog('CREATE_USER', 'UserAccount', `Admin initialized account: ${formDataUsername} (Role: ${formDataRole})`);
      }
      showAlert(`Officer account for "${formDataName}" was created successfully!`, 'success');
      setShowCreateModal(false);
      resetForm();
    } else {
      showAlert(result.message || 'Failed to create user account.', 'error');
    }
  };

  // UC10: Edit User Trigger
  const triggerEditUser = (user) => {
    setSelectedUser(user);
    setFormDataName(user.name || '');
    setFormDataUsername(user.username || '');
    setFormDataPassword(''); // Don't expose password
    setFormDataRole(user.role || ROLES.CONTRACTING_OFFICER);
    setFormDataStatus(user.status || 'ACTIVE');
    setShowEditModal(true);
  };

  // UC10: Update User Action
  const handleUpdateUser = async (e) => {
    e.preventDefault();

    if (!formDataName.trim()) {
      showAlert('Display Name cannot be empty!', 'error');
      return;
    }
    if (formDataPassword && formDataPassword.length < 3) {
      showAlert('Temporary Password must contain at least 3 characters!', 'error');
      return;
    }

    const result = await adminUpdateUser(selectedUser.username, {
      name: formDataName,
      password: formDataPassword || undefined,
      role: formDataRole,
      status: formDataStatus
    });

    if (result.success) {
      if (addAuditLog) {
        addAuditLog('UPDATE_USER', 'UserAccount', `Admin updated attributes for account: ${selectedUser.username}`);
      }
      showAlert(`User account "${selectedUser.username}" has been updated successfully.`, 'success');
      setShowEditModal(false);
      resetForm();
    } else {
      showAlert(result.message || 'Failed to update user account details.', 'error');
    }
  };

  // UC10: Toggle Quick User Status (Active/Suspend)
  const handleToggleStatus = async (user) => {
    if (user.username === currentUser.username) {
      showAlert('Cannot suspend your own active administrator account!', 'error');
      return;
    }

    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    const result = await adminUpdateUser(user.username, {
      name: user.name,
      role: user.role,
      status: nextStatus
    });

    if (result.success) {
      if (addAuditLog) {
        addAuditLog(nextStatus === 'ACTIVE' ? 'ACTIVATE_USER' : 'SUSPEND_USER', 'UserAccount', `Toggled status to ${nextStatus} for account: ${user.username}`);
      }
      showAlert(`Account "${user.username}" has been ${nextStatus === 'ACTIVE' ? 'Activated' : 'Suspended'}!`, nextStatus === 'ACTIVE' ? 'success' : 'warning');
    } else {
      showAlert(result.message || 'Failed to toggle status.', 'error');
    }
  };

  // UC10: Delete User
  const handleDeleteUser = async (user) => {
    if (user.username === currentUser.username) {
      showAlert('Cannot delete your own active administrator account!', 'error');
      return;
    }

    if (window.confirm(`Are you absolutely sure you want to permanently delete the officer account for "${user.name}" (${user.username})? This action cannot be undone.`)) {
      const result = await adminDeleteUser(user.username);
      if (result.success) {
        if (addAuditLog) {
          addAuditLog('DELETE_USER', 'UserAccount', `Purged officer account record: ${user.username}`);
        }
        showAlert(`Officer account "${user.username}" was permanently removed.`, 'success');
      } else {
        showAlert(result.message || 'Failed to delete user account.', 'error');
      }
    }
  };

  // Filters logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
      user.username.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = userFilterRole === 'all' || user.role === userFilterRole;
    return matchesSearch && matchesRole;
  });

  const filteredLogs = auditLogs.filter(log => 
    log.details.toLowerCase().includes(auditSearchQuery.toLowerCase()) || 
    log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) || 
    log.entity.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(auditSearchQuery.toLowerCase())
  );

  // Statistics counters
  const totalAccountsCount = users.length;
  const activeAccountsCount = users.filter(u => u.status !== 'SUSPENDED').length;
  const suspendedAccountsCount = totalAccountsCount - activeAccountsCount;
  const adminAccountsCount = users.filter(u => u.role === ROLES.SYSTEM_ADMIN).length;

  // Helper to map role strings to human-friendly English labels
  const getFriendlyRoleLabel = (role) => {
    switch (role) {
      case ROLES.SYSTEM_ADMIN: return 'System Administrator';
      case ROLES.CONTRACTING_OFFICER: return 'Contracting Officer';
      case ROLES.WAREHOUSE_STAFF: return 'Warehouse Management';
      case ROLES.ORDER_FULFILLMENT_STAFF: return 'Order Fulfillment Staff';
      default: return role;
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-col align-center justify-center" style={{ minHeight: '60vh', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center', maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 12px auto' }} />
          <h3>Access Level Restricted</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            This page is strictly reserved for **System Administrators** to manage credentials, database snapshots, and audit log feeds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Toast Alert Banner */}
      {systemAlert && (
        <div className="fade-in" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          padding: '14px 24px',
          borderRadius: 'var(--border-radius-md)',
          boxShadow: 'var(--box-shadow-lg)',
          backgroundColor: systemAlert.type === 'success' 
            ? 'rgba(16, 185, 129, 0.95)' 
            : systemAlert.type === 'warning' 
              ? 'rgba(245, 158, 11, 0.95)'
              : 'rgba(239, 68, 68, 0.95)',
          color: '#ffffff',
          border: `1px solid ${systemAlert.type === 'success' ? '#10b981' : systemAlert.type === 'warning' ? '#f59e0b' : '#ef4444'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          backdropFilter: 'blur(8px)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {systemAlert.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{systemAlert.message}</span>
        </div>
      )}

      {/* Main Title & Context Header */}
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>System Command Console</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            Supervise system credentials, security clearance levels, encrypted database archives, and cryptographic audit logs.
          </p>
        </div>
        {activeTab === 'backups' && (
          <button onClick={onBackup} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Database size={16} />
            Initialize Database Backup
          </button>
        )}
        {activeTab === 'users' && (
          <button 
            onClick={() => { resetForm(); setShowCreateModal(true); }} 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={16} />
            Register System Officer
          </button>
        )}
      </div>

      {/* Premium Tab Navigation Headers */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid var(--border-light)',
        marginBottom: '28px'
      }}>
        <div 
          onClick={() => setActiveTab('users')} 
          style={{
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'var(--font-size-sm)',
            color: activeTab === 'users' ? 'var(--color-primary)' : 'var(--text-muted)',
            borderBottom: '3px solid ' + (activeTab === 'users' ? 'var(--color-primary)' : 'transparent'),
            marginBottom: '-2px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Users size={16} />
          User Accounts & Privileges (UC10)
        </div>
        
        <div 
          onClick={() => setActiveTab('backups')} 
          style={{
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'var(--font-size-sm)',
            color: activeTab === 'backups' ? 'var(--color-primary)' : 'var(--text-muted)',
            borderBottom: '3px solid ' + (activeTab === 'backups' ? 'var(--color-primary)' : 'transparent'),
            marginBottom: '-2px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Database size={16} />
          Database Backup & Recovery (UC11)
        </div>

        <div 
          onClick={() => setActiveTab('audit')} 
          style={{
            padding: '12px 20px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: 'var(--font-size-sm)',
            color: activeTab === 'audit' ? 'var(--color-primary)' : 'var(--text-muted)',
            borderBottom: '3px solid ' + (activeTab === 'audit' ? 'var(--color-primary)' : 'transparent'),
            marginBottom: '-2px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FileText size={16} />
          Cryptographic Audit Trails Monitor
        </div>
      </div>

      {/* Tab Panels */}

      {/* TAB 1: USER ACCOUNTS & PRIVILEGES (UC10) */}
      {activeTab === 'users' && (
        <div className="fade-in">
          
          {/* Quick Statistics Grid */}
          <div className="grid-cols-4 gap-md" style={{ marginBottom: '24px' }}>
            <div className="box-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--card-bg-subtle)' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-primary-bg)', color: 'var(--color-primary)' }}>
                <Users size={24} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ACCOUNTS</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-color)', marginTop: '4px' }}>{totalAccountsCount} Registered</div>
              </div>
            </div>

            <div className="box-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--card-bg-subtle)' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                <UserCheck size={24} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>ACTIVE STAFF</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-color)', marginTop: '4px' }}>{activeAccountsCount} Active</div>
              </div>
            </div>

            <div className="box-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--card-bg-subtle)' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <UserX size={24} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>SUSPENDED</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-color)', marginTop: '4px' }}>{suspendedAccountsCount} Blocked</div>
              </div>
            </div>

            <div className="box-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--card-bg-subtle)' }}>
              <div style={{ padding: '10px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>ADMINISTRATORS</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-color)', marginTop: '4px' }}>{adminAccountsCount} Accounts</div>
              </div>
            </div>
          </div>

          {/* Table Container & Filter controls */}
          <div className="box-card">
            
            <div className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>System Directory & Security Clearances</h3>
              
              {/* Search & Filter Bar */}
              <div className="flex-row align-center gap-sm">
                
                {/* Role Filter Dropdown */}
                <select
                  value={userFilterRole}
                  onChange={(e) => setUserFilterRole(e.target.value)}
                  className="search-input"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)',
                    outline: 'none',
                    minWidth: '150px'
                  }}
                >
                  <option value="all">All Clearance Levels</option>
                  <option value={ROLES.SYSTEM_ADMIN}>System Administrators</option>
                  <option value={ROLES.CONTRACTING_OFFICER}>Contracting Officers</option>
                  <option value={ROLES.WAREHOUSE_STAFF}>Warehouse Management</option>
                  <option value={ROLES.ORDER_FULFILLMENT_STAFF}>Order Fulfillment Staff</option>
                </select>

                {/* Text Search Input */}
                <div className="flex-row align-center search-bar-container" style={{ position: 'relative' }}>
                  <Search size={14} className="search-icon" style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Search officer name/username..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="search-input"
                    style={{ 
                      padding: '6px 12px 6px 30px', 
                      fontSize: '12px', 
                      border: '1px solid var(--border-light)', 
                      borderRadius: 'var(--border-radius-sm)', 
                      outline: 'none',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-color)',
                      width: '240px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Premium Table */}
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>System Username</th>
                    <th>Security Privilege Level</th>
                    <th>Custom Display Theme</th>
                    <th>Security Clearance Status</th>
                    <th style={{ textAlign: 'right' }}>Management Controls</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No system accounts matched your filtering parameters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isSelf = user.username === currentUser.username;
                      const isSuspended = user.status === 'SUSPENDED';
                      return (
                        <tr key={user.username} style={{ backgroundColor: isSuspended ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: isSelf ? 'var(--color-primary-bg)' : 'var(--border-light)',
                                color: isSelf ? 'var(--color-primary)' : 'var(--text-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 'var(--font-size-sm)'
                              }}>
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <strong>{user.name}</strong> {isSelf && <small style={{ color: 'var(--color-primary)', fontStyle: 'italic', fontWeight: 600 }}>(You)</small>}
                              </div>
                            </div>
                          </td>
                          <td>
                            <code style={{ fontSize: 'var(--font-size-sm)', backgroundColor: 'var(--card-bg-subtle)', padding: '2px 6px', borderRadius: '4px' }}>
                              {user.username}
                            </code>
                          </td>
                          <td>
                            <Badge type={user.role === ROLES.SYSTEM_ADMIN ? 'primary' : user.role === ROLES.CONTRACTING_OFFICER ? 'success' : 'info'}>
                              {getFriendlyRoleLabel(user.role)}
                            </Badge>
                          </td>
                          <td>
                            <span style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-sm)' }}>
                              {user.themeClass || 'Default (Slate)'}
                            </span>
                          </td>
                          <td>
                            {isSuspended ? (
                              <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                Suspended / Locked
                              </span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                                Clearance Active
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div className="flex-row gap-xs justify-end" style={{ display: 'inline-flex' }}>
                              
                              {/* Edit details */}
                              <button 
                                onClick={() => triggerEditUser(user)}
                                className="btn btn-secondary" 
                                style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                                title="Edit clearance and password"
                              >
                                <Edit2 size={12} />
                                Modify
                              </button>

                              {/* Toggle suspension */}
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className="btn"
                                style={{
                                  padding: '6px 10px',
                                  fontSize: 'var(--font-size-xs)',
                                  backgroundColor: isSuspended ? 'var(--color-success-bg)' : 'rgba(239, 68, 68, 0.1)',
                                  color: isSuspended ? 'var(--color-success)' : '#ef4444',
                                  border: `1px solid ${isSuspended ? 'var(--color-success)' : '#ef4444'}`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  opacity: isSelf ? 0.4 : 1,
                                  cursor: isSelf ? 'not-allowed' : 'pointer'
                                }}
                                disabled={isSelf}
                                title={isSelf ? 'Cannot suspend your own account' : isSuspended ? 'Activate account clearance' : 'Suspend account and restrict login'}
                              >
                                {isSuspended ? <Unlock size={12} /> : <Lock size={12} />}
                                {isSuspended ? 'Activate' : 'Suspend'}
                              </button>

                              {/* Delete Account */}
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="btn"
                                style={{
                                  padding: '6px 10px',
                                  fontSize: 'var(--font-size-xs)',
                                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                  color: '#ef4444',
                                  border: '1px solid transparent',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  opacity: isSelf ? 0.4 : 1,
                                  cursor: isSelf ? 'not-allowed' : 'pointer'
                                }}
                                disabled={isSelf}
                                title={isSelf ? 'Cannot purge currently authenticated session' : 'Permanently remove from directory'}
                              >
                                <Trash2 size={12} />
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: DATABASE BACKUP & RESTORE LOGS (UC11) */}
      {activeTab === 'backups' && (
        <div className="fade-in">
          <div className="grid-cols-3 gap-lg" style={{ marginBottom: '32px' }}>
            
            {/* Backup list container */}
            <div className="box-card col-span-2">
              <h3>Simulated Database Backup & Restore Logs (UC11)</h3>
              <p className="card-description">Database archive snaps are automatically hashed, secured, and written to system root partition directories.</p>

              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Backup Target File</th>
                      <th>Written Target Directory Path</th>
                      <th>Timestamp</th>
                      <th>Status Check</th>
                      <th>Disaster Recovery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                          No database snapshots generated in this session.
                        </td>
                      </tr>
                    ) : (
                      backups.map(bak => (
                        <tr key={bak.id}>
                          <td><strong>{bak.fileName}</strong></td>
                          <td><small style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{bak.filePath}</small></td>
                          <td>{bak.timestamp}</td>
                          <td><span className="badge badge-success">{bak.status}</span></td>
                          <td>
                            <button 
                              onClick={() => onRestore(bak)}
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <RotateCcw size={12} />
                              Restore State
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disaster Recovery Info Panel */}
            <div className="box-card">
              <h3>Disaster Recovery Matrix</h3>
              <p className="card-description">All system administrators must initiate emergency fail-over mirror recovery within 15 minutes of downtime notifications.</p>
              
              <div className="flex-col gap-sm" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-sm)', padding: '16px', backgroundColor: 'var(--card-bg-subtle)', fontSize: 'var(--font-size-xs)', lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                  <ShieldAlert size={14} />
                  System Integrity Specs:
                </div>
                <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '6px', marginBottom: '4px' }}></div>
                <div>• <strong>Primary Engine:</strong> Spring Boot REST Broker (Active)</div>
                <div>• <strong>Relational Registry DB:</strong> MySQL 8.0 Mirror volume</div>
                <div>• <strong>Primary Port Listening:</strong> 3309 listener</div>
                <div>• <strong>Cryptographic Hashing:</strong> SHA256 secure checksum volume</div>
                <div>• <strong>Disaster Target Folder:</strong> <code>D:/gsc-order-manager-backups</code></div>
                <div style={{ marginTop: '8px', padding: '8px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <strong>Safety Notice:</strong> Restoring snapshot volumes will override existing memory parameters with target backup checkpoint properties. Proceed with caution.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: CRYPTOGRAPHIC AUDIT LOG FEED */}
      {activeTab === 'audit' && (
        <div className="fade-in box-card">
          
          <div className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Cryptographic Audit Logs Feed</h3>
              <p className="card-description" style={{ margin: '4px 0 0 0' }}>Persistent, read-only system operation telemetry logs saved on local container registry.</p>
            </div>
            
            <div className="flex-row align-center search-bar-container" style={{ position: 'relative' }}>
              <Search size={14} className="search-icon" style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Filter logs by operation, model, description, operator..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="search-input"
                style={{ 
                  padding: '6px 12px 6px 30px', 
                  fontSize: '12px', 
                  border: '1px solid var(--border-light)', 
                  borderRadius: 'var(--border-radius-sm)', 
                  outline: 'none',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-color)',
                  width: '320px'
                }}
              />
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '450px', overflowY: 'auto' }}>
            <table className="premium-table" style={{ fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr>
                  <th>Trace ID</th>
                  <th>UTC Timestamp</th>
                  <th>Core Operation</th>
                  <th>Database Model</th>
                  <th>Details & Target description</th>
                  <th>Responsible Officer</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No audit trails matched trace search query.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td><code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{log.id}</code></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                      <td>
                        <span className={`badge badge-${
                          log.action.includes('CREATE') || log.action.includes('ACTIVATE') ? 'success' :
                          log.action.includes('DELETE') || log.action.includes('SUSPEND') ? 'danger' : 'info'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td><code>{log.entity}</code></td>
                      <td><strong>{log.details}</strong></td>
                      <td>
                        <code style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{log.user}</code>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}


      {/* CENTERED POP-UP MODALS (UC10) */}

      {/* 1. Modal: Register New Officer Account */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="box-card" style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--box-shadow-lg)',
            border: '1px solid var(--border-light)',
            animation: 'scaleIn 0.2s ease-out',
            position: 'relative',
            padding: '24px'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ margin: 0 }}>Register New Officer Account</h3>
              </div>
              <button 
                onClick={() => { setShowCreateModal(false); resetForm(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateUser} className="flex-col gap-md">
              
              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Display Officer Name *</label>
                <input 
                  type="text"
                  placeholder="e.g. Agent Frank Castle"
                  value={formDataName}
                  onChange={(e) => setFormDataName(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)'
                  }}
                  required
                />
              </div>

              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>System Account Username *</label>
                <input 
                  type="text"
                  placeholder="e.g. fcastle (lowercase alphanumeric)"
                  value={formDataUsername}
                  onChange={(e) => setFormDataUsername(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)'
                  }}
                  required
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  This will be the key unique login credential. Alphanumeric/underscores only.
                </small>
              </div>

              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Initial Temporary Password *</label>
                <input 
                  type="password"
                  placeholder="Minimum 3 characters"
                  value={formDataPassword}
                  onChange={(e) => setFormDataPassword(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)'
                  }}
                  required
                />
              </div>

              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Security Privilege Level (Role) *</label>
                <select
                  value={formDataRole}
                  onChange={(e) => setFormDataRole(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)',
                    outline: 'none'
                  }}
                >
                  <option value={ROLES.CONTRACTING_OFFICER}>Contracting Officer (CO)</option>
                  <option value={ROLES.WAREHOUSE_STAFF}>Warehouse Management</option>
                  <option value={ROLES.ORDER_FULFILLMENT_STAFF}>Order Fulfillment Staff</option>
                  <option value={ROLES.SYSTEM_ADMIN}>System Administrator</option>
                </select>
              </div>

              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Clearance Status *</label>
                <select
                  value={formDataStatus}
                  onChange={(e) => setFormDataStatus(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)',
                    outline: 'none'
                  }}
                >
                  <option value="ACTIVE">ACTIVE (Clearance Granted)</option>
                  <option value="SUSPENDED">SUSPENDED (Restricted login)</option>
                </select>
              </div>

              {/* Modal Footer Controls */}
              <div style={{ display: 'flex', justifySelf: 'end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', width: '100%' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowCreateModal(false); resetForm(); }}
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  Confirm Registration
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 2. Modal: Edit/Modify Existing User Account */}
      {showEditModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="box-card" style={{
            width: '100%',
            maxWidth: '500px',
            backgroundColor: 'var(--card-bg)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--box-shadow-lg)',
            border: '1px solid var(--border-light)',
            animation: 'scaleIn 0.2s ease-out',
            position: 'relative',
            padding: '24px'
          }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ margin: 0 }}>Modify System Clearance</h3>
              </div>
              <button 
                onClick={() => { setShowEditModal(false); resetForm(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleUpdateUser} className="flex-col gap-md">
              
              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Display Officer Name *</label>
                <input 
                  type="text"
                  placeholder="Name"
                  value={formDataName}
                  onChange={(e) => setFormDataName(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)'
                  }}
                  required
                />
              </div>

              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>System Username (LOCKED) *</label>
                <input 
                  type="text"
                  value={formDataUsername}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--card-bg-subtle)',
                    color: 'var(--text-muted)',
                    cursor: 'not-allowed'
                  }}
                  disabled
                  readOnly
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  Usernames are strictly read-only after creation to maintain cryptographic audit trail consistency.
                </small>
              </div>

              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Update Password (Optional)</label>
                <input 
                  type="password"
                  placeholder="Leave blank to keep existing password"
                  value={formDataPassword}
                  onChange={(e) => setFormDataPassword(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)'
                  }}
                />
                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  Provide values only if you intend to override temporary security credentials.
                </small>
              </div>

              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Security Privilege Level (Role) *</label>
                <select
                  value={formDataRole}
                  onChange={(e) => setFormDataRole(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)',
                    outline: 'none'
                  }}
                >
                  <option value={ROLES.CONTRACTING_OFFICER}>Contracting Officer (CO)</option>
                  <option value={ROLES.WAREHOUSE_STAFF}>Warehouse Management</option>
                  <option value={ROLES.ORDER_FULFILLMENT_STAFF}>Order Fulfillment Staff</option>
                  <option value={ROLES.SYSTEM_ADMIN}>System Administrator</option>
                </select>
              </div>

              <div className="form-group flex-col gap-xs">
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Clearance Status *</label>
                <select
                  value={formDataStatus}
                  onChange={(e) => setFormDataStatus(e.target.value)}
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: 'var(--font-size-sm)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: selectedUser.username === currentUser.username ? 'var(--card-bg-subtle)' : 'var(--input-bg)',
                    color: selectedUser.username === currentUser.username ? 'var(--text-muted)' : 'var(--text-color)',
                    cursor: selectedUser.username === currentUser.username ? 'not-allowed' : 'default',
                    outline: 'none'
                  }}
                  disabled={selectedUser.username === currentUser.username}
                >
                  <option value="ACTIVE">ACTIVE (Clearance Granted)</option>
                  <option value="SUSPENDED">SUSPENDED (Restricted login)</option>
                </select>
                {selectedUser.username === currentUser.username && (
                  <small style={{ color: 'var(--color-primary)', fontSize: '11px', fontWeight: 600 }}>
                    You cannot change the clearance status of your own administrator account.
                  </small>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div style={{ display: 'flex', justifySelf: 'end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px', width: '100%' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowEditModal(false); resetForm(); }}
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
