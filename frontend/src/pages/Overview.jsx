import React from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import { Building2, FileCheck, FileText, AlertTriangle, Play, CheckCircle } from 'lucide-react';

export default function Overview() {
  const { agencies, contracts, purchaseOrders, equipment, auditLogs, validatePurchaseOrder } = useAppData();
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const canPerformValidation = role === ROLES.CONTRACTING_OFFICER || role === ROLES.SYSTEM_ADMIN;

  const validContractsCount = contracts.filter(c => c.status === 'VALID').length;
  const lowStockCount = equipment.filter(e => e.stock < e.minStock).length;
  const pendingPos = purchaseOrders.filter(po => po.status === 'PENDING');

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <h2>System Overview</h2>
        <div className="flex-row align-center gap-sm">
          <span className="pulse-glow-dot"></span>
          <span className="server-status-label">GSC Cloud Server Online</span>
        </div>
      </div>

      {/* Grid of stats */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="box-card stat-card">
          <div className="stat-icon-wrapper primary-bg">
            <Building2 size={24} />
          </div>
          <div>
            <h3 className="stat-number">{agencies.length}</h3>
            <p className="stat-label">Agencies</p>
          </div>
        </div>

        <div className="box-card stat-card">
          <div className="stat-icon-wrapper secondary-bg">
            <FileCheck size={24} />
          </div>
          <div>
            <h3 className="stat-number">{validContractsCount}</h3>
            <p className="stat-label">Valid Contracts</p>
          </div>
        </div>

        <div className="box-card stat-card">
          <div className="stat-icon-wrapper success-bg">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="stat-number">{purchaseOrders.length}</h3>
            <p className="stat-label">Total POs</p>
          </div>
        </div>

        <div className="box-card stat-card">
          <div className="stat-icon-wrapper warning-bg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="stat-number">{lowStockCount}</h3>
            <p className="stat-label">Low-Stock Items</p>
          </div>
        </div>
      </div>

      {/* Tables and activities */}
      <div className="grid-cols-2">
        
        {/* Pending validation box */}
        <div className="box-card">
          <div className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Pending Validation</h3>
            <Link to="/orders" className="text-link" style={{ fontSize: 'var(--font-size-xs)' }}>View All</Link>
          </div>
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingPos.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending POs.</td>
                  </tr>
                ) : (
                  pendingPos.map(po => (
                    <tr key={po.id}>
                      <td><strong>{po.poNumber}</strong></td>
                      <td>${po.totalAmount.toLocaleString()}</td>
                      <td><Badge status={po.status} /></td>
                      <td>
                        <button 
                          onClick={() => validatePurchaseOrder(po.id)}
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                          disabled={!canPerformValidation}
                        >
                          <Play size={12} />
                          Validate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent logs audit box */}
        <div className="box-card">
          <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>Recent Activities</h3>
          <div className="audit-list">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className={`audit-item border-left-${log.action.toLowerCase().includes('create') ? 'success' : 'primary'}`}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{log.details}</div>
                  <div className="audit-meta">{log.timestamp} by {log.user}</div>
                </div>
                <span className={`badge ${log.action.toLowerCase().includes('create') ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                  {log.action}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
