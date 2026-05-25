import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import Badge from '../../components/ui/Badge';
import { Database, ShieldAlert, RotateCcw, Search, Terminal } from 'lucide-react';

export default function SystemAdmin() {
  const { auditLogs, backups, triggerDatabaseBackup, triggerDatabaseRestore } = useAppData();
  const { currentUser } = useAuth();

  const isAdmin = currentUser?.role === ROLES.SYSTEM_ADMIN;

  const [searchQuery, setSearchQuery] = useState('');

  const onBackup = () => {
    const path = triggerDatabaseBackup();
  };

  const filteredLogs = auditLogs.filter(log => 
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
    log.entity.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex-col align-center justify-center" style={{ minHeight: '60vh', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center', maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 12px auto' }} />
          <h3>Access Level Restrict</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            This page is strictly reserved for **System Administrators** to manage databases and search audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>System Administration Command (Admin Concern)</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Perform virtual database backups, recovery restorations, and audit logs analysis.</p>
        </div>
        <button onClick={onBackup} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Database size={16} />
          Create Database Backup
        </button>
      </div>

      <div className="grid-cols-3 gap-lg" style={{ marginBottom: '32px' }}>
        {/* Backup files list */}
        <div className="box-card col-span-2">
          <h3>Simulated Database Backup & Restore Logs (UC11)</h3>
          <p className="card-description">Database archives are automatically encrypted and written to local system directories.</p>

          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Backup File</th>
                  <th>Written Directory Path</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Restore Actions</th>
                </tr>
              </thead>
              <tbody>
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No backups generated yet in this session.</td>
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
                          onClick={() => triggerDatabaseRestore(bak)}
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

        {/* Info card */}
        <div className="box-card">
          <h3>Disaster Recovery</h3>
          <p className="card-description">Disaster recovery procedures must be initiated within 15 minutes of server outage reports.</p>
          <div className="flex-col gap-sm" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-sm)', padding: '12px', backgroundColor: 'var(--card-bg-subtle)', fontSize: 'var(--font-size-xs)' }}>
            <div style={{ fontWeight: 700 }}>System Integrity Info:</div>
            <div>• Registry Database: MySQL 8.0 Expose (Port: 3309)</div>
            <div>• Encrypted Volume Checksums: Active (SHA256)</div>
            <div>• Fail-safe Mirror Volume: D:/gsc-order-manager-backups</div>
          </div>
        </div>
      </div>

      {/* Full Audit Trails Log */}
      <div className="box-card">
        <div className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Cryptographic Audit Logs Feed (UC10)</h3>
          <div className="flex-row align-center search-bar-container">
            <Search size={14} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              style={{ padding: '6px 12px 6px 30px', fontSize: '11px', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-sm)', outline: 'none' }}
            />
          </div>
        </div>

        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table className="premium-table" style={{ fontSize: 'var(--font-size-xs)' }}>
            <thead>
              <tr>
                <th>Log ID</th>
                <th>UTC Timestamp</th>
                <th>Operation</th>
                <th>Database Model</th>
                <th>Details Description</th>
                <th>Operator</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs matched search criteria.</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td><code>#{log.id}</code></td>
                    <td>{log.timestamp}</td>
                    <td><span className="badge badge-info">{log.action}</span></td>
                    <td><code>{log.entity}</code></td>
                    <td><strong>{log.details}</strong></td>
                    <td><code>{log.user}</code></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
