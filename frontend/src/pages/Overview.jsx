import React, { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { 
  Building2, FileCheck, FileText, AlertTriangle, Play, CheckCircle, 
  ArrowRight, Download, Search, Settings, RefreshCw, Truck, Database, 
  User, ShieldAlert, Award, FileWarning, Eye, KeyRound, Clock 
} from 'lucide-react';

export default function Overview() {
  const { 
    agencies, contracts, purchaseOrders, equipment, auditLogs, 
    exceptionReports, shippingBills, backups, validatePurchaseOrder, 
    handleStockAdjustment, triggerDatabaseRestore 
  } = useAppData();
  const { currentUser, users } = useAuth();
  
  const role = currentUser?.role;

  // Selected Detail Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailModalTitle, setDetailModalTitle] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Search/Filters inside dashboards
  const [adminSearch, setAdminSearch] = useState('');
  const [coSearch, setCoSearch] = useState('');

  const openInspector = (item, type) => {
    setSelectedItem(item);
    setDetailModalTitle(type);
    setShowDetailModal(true);
  };

  // Helper to export dataset as JSON
  const handleExportData = (data, filename) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `${filename}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  /* ═══════════════════════════════════════════════════════
     RENDER 1: CONTRACTING OFFICER DASHBOARD
     ═══════════════════════════════════════════════════════ */
  const renderContractingOfficerDashboard = () => {
    const validContractsCount = contracts.filter(c => c.status === 'VALID').length;
    const pendingPos = purchaseOrders.filter(po => po.status === 'PENDING');
    
    // Filter pending POs by search
    const filteredPending = pendingPos.filter(po => 
      po.poNumber.toLowerCase().includes(coSearch.toLowerCase())
    );

    // Simple analysis: percentage of contracts that are valid
    const totalContracts = contracts.length || 1;
    const contractProgressPercent = Math.round((validContractsCount / totalContracts) * 100);

    return (
      <div className="animate-fade-in-up">
        {/* Sub-Header */}
        <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Contracting Officer Hub</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              Manage federal directories, white-list assets, and authorize digital purchase order agreements.
            </p>
          </div>
          <button 
            onClick={() => handleExportData({ agencies, contracts, purchaseOrders }, 'gsc_co_compliance_datasets')}
            className="btn btn-secondary export-btn"
          >
            <Download size={14} />
            Export CO Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper primary-bg"><Building2 size={22} /></div>
            <div>
              <h3 className="stat-number">{agencies.length}</h3>
              <p className="stat-label">Federal Agencies</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper success-bg"><Award size={22} /></div>
            <div>
              <h3 className="stat-number">{validContractsCount}</h3>
              <p className="stat-label">Active Whitelists</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper secondary-bg"><FileText size={22} /></div>
            <div>
              <h3 className="stat-number">{purchaseOrders.length}</h3>
              <p className="stat-label">Digitized POs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper warning-bg"><FileWarning size={22} /></div>
            <div>
              <h3 className="stat-number">{pendingPos.length}</h3>
              <p className="stat-label">Pending Audits</p>
            </div>
          </div>
        </div>

        {/* Analytics & Actions Split */}
        <div className="grid-cols-3 gap-lg" style={{ marginBottom: '32px' }}>
          {/* Circular gauge spent progress */}
          <div className="box-card flex-col align-center justify-center">
            <h3 style={{ margin: '0 0 16px 0', alignSelf: 'flex-start', fontSize: 'var(--font-size-sm)' }}>
              Standing Whitelists Ratio
            </h3>
            <div className="circular-progress-container">
              <div className="circular-dial-bg" style={{ '--progress': contractProgressPercent }}>
                <div className="circular-dial-content">
                  <span className="circular-dial-percent">{contractProgressPercent}%</span>
                  <span className="circular-dial-label">Valid Contracts</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '16px', marginBottom: 0 }}>
              {validContractsCount} out of {contracts.length} active standing contracts are verified healthy and whitelisting catalog resources.
            </p>
          </div>

          {/* Quick links to actions */}
          <div className="box-card col-span-2">
            <h3>Contracting Operations Quick Access</h3>
            <p className="card-description">Decoupled command operations for official Contracting duties.</p>
            <div className="grid-cols-2 gap-sm" style={{ marginTop: '12px' }}>
              <Link to="/co/agencies" className="quick-action-link-btn">
                <span>Manage Official Agencies</span>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>
              <Link to="/co/contracts" className="quick-action-link-btn">
                <span>Standing Contracts & Whitelists</span>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>
              <Link to="/co/orders" className="quick-action-link-btn" style={{ gridColumn: 'span 2' }}>
                <span>Purchase Orders digitizer & Validators</span>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>
            </div>
          </div>
        </div>

        {/* Dynamic work lists */}
        <div className="grid-cols-3 gap-lg">
          {/* Pending Compliance table */}
          <div className="box-card col-span-2">
            <div className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Pending PO Validation Queue</h3>
              <div className="flex-row align-center search-bar-container">
                <Search size={12} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Filter PO..." 
                  value={coSearch} 
                  onChange={(e) => setCoSearch(e.target.value)} 
                  className="search-input"
                  style={{ padding: '4px 8px 4px 28px', fontSize: '11px', width: '130px', border: '1px solid var(--border-light)' }}
                />
              </div>
            </div>
            
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Value Amount</th>
                    <th>Date digitized</th>
                    <th>Operation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No outstanding compliance validations matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredPending.map(po => (
                      <tr key={po.id}>
                        <td>
                          <strong className="cursor-pointer" onClick={() => openInspector(po, 'PO')} style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
                            {po.poNumber}
                          </strong>
                        </td>
                        <td><strong>${po.totalAmount.toLocaleString()}</strong></td>
                        <td>{po.issueDate}</td>
                        <td>
                          <button 
                            onClick={() => validatePurchaseOrder(po.id)}
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}
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

          {/* Active Standing Contracts Whitelist Progress */}
          <div className="box-card">
            <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              Contracts budget progress
            </h3>
            <div className="flex-col gap-md">
              {contracts.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', textAlign: 'center', padding: '16px' }}>
                  No active standing contracts recorded.
                </div>
              ) : (
                contracts.slice(0, 4).map(c => {
                  const usagePercent = Math.round((c.spent / c.costLimit) * 100);
                  return (
                    <div key={c.id} className="horizontal-bar-graph-item">
                      <div className="horizontal-bar-label-group">
                        <span className="cursor-pointer" onClick={() => openInspector(c, 'Contract')} style={{ textDecoration: 'underline' }}>{c.code}</span>
                        <span className="horizontal-bar-limit-label">{usagePercent}% ({c.spent.toLocaleString()} / {c.costLimit.toLocaleString()})</span>
                      </div>
                      <div className="horizontal-bar-track">
                        <div className="horizontal-bar-fill" style={{ width: `${usagePercent}%`, backgroundColor: usagePercent > 90 ? 'var(--color-danger)' : usagePercent > 70 ? 'var(--color-warning)' : 'var(--color-success)' }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════
     RENDER 2: ORDER FULFILLMENT DASHBOARD
     ═══════════════════════════════════════════════════════ */
  const renderOrderFulfillmentDashboard = () => {
    const outstandingChecks = purchaseOrders.filter(po => po.status === 'OUTSTANDING');
    const totalLogisticsDispatched = shippingBills.length;
    
    // Total shipped cargo cost limit spent
    const totalDispatchedValue = shippingBills.reduce((acc, sb) => {
      const matchedPo = purchaseOrders.find(po => po.poNumber === sb.poNumber);
      return acc + (matchedPo ? matchedPo.totalAmount : 0);
    }, 0);

    return (
      <div className="animate-fade-in-up">
        {/* Sub-Header */}
        <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Fulfillment Logistics Dashboard</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              Coordinate stock allocation clearances, record cargo shortages, and issue official secure shipping bills.
            </p>
          </div>
          <button 
            onClick={() => handleExportData({ shippingBills, exceptionReports }, 'gsc_fulfillment_logs')}
            className="btn btn-secondary export-btn"
          >
            <Download size={14} />
            Export Shipping Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper primary-bg"><RefreshCw size={22} /></div>
            <div>
              <h3 className="stat-number">{outstandingChecks.length}</h3>
              <p className="stat-label">Pending Stock Checks</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper warning-bg"><AlertTriangle size={22} /></div>
            <div>
              <h3 className="stat-number">{exceptionReports.length}</h3>
              <p className="stat-label">Shortages Flagged</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper primary-bg"><Building2 size={22} /></div>
            <div>
              <h3 className="stat-number">{equipment.length}</h3>
              <p className="stat-label">Catalog Items</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper secondary-bg"><FileText size={22} /></div>
            <div>
              <h3 className="stat-number">{contracts.length}</h3>
              <p className="stat-label">Active Contracts</p>
            </div>
          </div>
        </div>

        {/* Analytics & Fast Links */}
        <div className="grid-cols-3 gap-lg" style={{ marginBottom: '32px' }}>
          {/* Outstanding check list queue */}
          <div className="box-card col-span-2">
            <h3>Logistics Stock Allocation Queue</h3>
            <p className="card-description">Outstanding purchase orders digitized by COs that require physical warehouse checks.</p>
            
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Assigned Items</th>
                    <th>Fulfillment Cost</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingChecks.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No outstanding allocations pending warehouse stock clearance.
                      </td>
                    </tr>
                  ) : (
                    outstandingChecks.map(po => (
                      <tr key={po.id}>
                        <td><strong>{po.poNumber}</strong></td>
                        <td>
                          <div className="flex-col gap-xxs" style={{ fontSize: '11px' }}>
                            {po.items.map((i, idx) => {
                              const eq = equipment.find(e => e.id === i.equipmentId);
                              return (
                                <span key={idx}>• {eq ? eq.code : `#${i.equipmentId}`} (x{i.quantity})</span>
                              );
                            })}
                          </div>
                        </td>
                        <td><strong>${po.totalAmount.toLocaleString()}</strong></td>
                        <td>
                          <Link to="/fulfillment/checks" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}>
                            <Play size={12} />
                            Check Stock
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick links */}
          <div className="box-card flex-col justify-between">
            <div>
              <h3 style={{ margin: '0 0 12px 0' }}>Logistics Controls</h3>
              <p className="card-description" style={{ margin: 0 }}>Access functional modules designed strictly for Order Fulfillment logistics.</p>
            </div>
            <div className="flex-col gap-sm" style={{ marginTop: '24px' }}>
              <Link to="/fulfillment/checks" className="quick-action-link-btn">
                <span>Allocate Stock (UC6)</span>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════
     RENDER 3: WAREHOUSE STAFF DASHBOARD
     ═══════════════════════════════════════════════════════ */
  const renderWarehouseStaffDashboard = () => {
    const lowStockItems = equipment.filter(e => e.stock < e.minStock);
    const totalStockVolume = equipment.reduce((acc, eq) => acc + eq.stock, 0);

    const totalLogisticsDispatched = shippingBills.length;
    const totalDispatchedValue = shippingBills.reduce((acc, sb) => {
      const matchedPo = purchaseOrders.find(po => po.poNumber === sb.poNumber);
      return acc + (matchedPo ? matchedPo.totalAmount : 0);
    }, 0);

    // Prepare simulated pure-CSS bar chart stats
    const topEquipment = equipment.slice(0, 5);

    return (
      <div className="animate-fade-in-up">
        {/* Sub-Header */}
        <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0 }}>Warehouse Inventory Command</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              Manage corporate equipment specifications catalog, view critical shortage warnings, and log stock adjustments.
            </p>
          </div>
          <button 
            onClick={() => handleExportData(equipment, 'gsc_equipment_catalog')}
            className="btn btn-secondary export-btn"
          >
            <Download size={14} />
            Export Catalog
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid-cols-3" style={{ marginBottom: '32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper primary-bg"><Building2 size={22} /></div>
            <div>
              <h3 className="stat-number">{equipment.length}</h3>
              <p className="stat-label">Catalog Items</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper success-bg"><FileCheck size={22} /></div>
            <div>
              <h3 className="stat-number">{totalStockVolume}</h3>
              <p className="stat-label">Warehouse Stock Units</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper warning-bg"><AlertTriangle size={22} /></div>
            <div>
              <h3 className="stat-number" style={{ color: lowStockItems.length > 0 ? 'var(--color-danger)' : 'inherit' }}>
                {lowStockItems.length}
              </h3>
              <p className="stat-label">Low Stock Alerts</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper success-bg"><Truck size={22} /></div>
            <div>
              <h3 className="stat-number">{totalLogisticsDispatched}</h3>
              <p className="stat-label">Dispatched Cargoes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper secondary-bg"><FileText size={22} /></div>
            <div>
              <h3 className="stat-number">${totalDispatchedValue.toLocaleString()}</h3>
              <p className="stat-label">Dispatched Net Value</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper warning-bg"><FileWarning size={22} /></div>
            <div>
              <h3 className="stat-number">{exceptionReports.reduce((acc, rep) => acc + rep.shortages.length, 0)}</h3>
              <p className="stat-label">Procurement Gaps</p>
            </div>
          </div>
        </div>

        {/* pure CSS Vertical bar chart stock limits */}
        <div className="grid-cols-3 gap-lg" style={{ marginBottom: '32px' }}>
          {/* Vertical Bar Chart Box */}
          <div className="box-card col-span-2">
            <h3>Catalog Equipment Physical Quantities vs Min Threshold</h3>
            <p className="card-description">Visualizing available stock columns relative to safe threshold metrics.</p>
            
            <div className="bar-chart-visualization">
              {topEquipment.map(eq => {
                const heightPercent = Math.min(100, Math.max(5, (eq.stock / 30) * 100));
                const thresholdPercent = Math.min(100, (eq.minStock / 30) * 100);
                return (
                  <div key={eq.id} className="bar-chart-column">
                    <div 
                      className="bar-chart-pill" 
                      style={{ 
                        height: `${heightPercent}%`, 
                        background: eq.stock < eq.minStock 
                          ? 'linear-gradient(180deg, var(--color-danger) 0%, #b91c1c 100%)' 
                          : 'linear-gradient(180deg, var(--color-success) 0%, #047857 100%)'
                      }}
                    >
                      <span className="bar-chart-tooltip">Stock: {eq.stock} (Min: {eq.minStock})</span>
                    </div>
                    <span className="bar-chart-x-axis-label">{eq.code}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="box-card flex-col justify-between">
            <div>
              <h3 style={{ margin: '0 0 12px 0' }}>Warehouse Controls</h3>
              <p className="card-description" style={{ margin: 0 }}>Register catalog specs and input logs.</p>
            </div>
            <div className="flex-col gap-sm" style={{ marginTop: '24px' }}>
              <Link to="/warehouse/stock" className="quick-action-link-btn">
                <span>Equipment Catalog</span>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>
              <Link to="/warehouse/stock" className="quick-action-link-btn">
                <span>Stock Adjustments (UC3)</span>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>
              <Link to="/warehouse/shipping" className="quick-action-link-btn">
                <span>Shipping & Dispatch (UC8)</span>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>
            </div>
          </div>
        </div>

        {/* Low-stock table details */}
        <div className="box-card">
          <h3 style={{ color: lowStockItems.length > 0 ? 'var(--color-danger)' : 'inherit' }}>
            Critical Stock Shortfalls Warning (Adjust Immediately)
          </h3>
          <p className="card-description">Catalog items that have dropped below security margin limits and must be replenished.</p>
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Equipment Code</th>
                  <th>Specifications</th>
                  <th>Unit Cost</th>
                  <th>Stock Count</th>
                  <th>Safe Minimum Threshold</th>
                  <th>Replenish Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-success)', padding: '20px', fontWeight: 600 }}>
                      ✓ All equipment inventory levels are healthy! No shortfalls detected.
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map(eq => (
                    <tr key={eq.id}>
                      <td><strong>{eq.code}</strong></td>
                      <td>{eq.name}</td>
                      <td>${eq.price.toLocaleString()}</td>
                      <td style={{ color: 'var(--color-danger)', fontWeight: 700 }}>{eq.stock} units</td>
                      <td>{eq.minStock} units</td>
                      <td>
                        <Link to="/warehouse/stock" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}>
                          Adjust Stock
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shipped Bills Log Feed */}
        <div className="box-card" style={{ marginTop: '32px' }}>
          <h3>Recent Dispatched Shipping Bills Registry</h3>
          <p className="card-description">Secure transportation ledger with registered cryptographic checksums.</p>
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Shipment Ref</th>
                  <th>PO Reference</th>
                  <th>Shipping Date</th>
                  <th>Logistics Status</th>
                  <th>Security Checksum</th>
                </tr>
              </thead>
              <tbody>
                {shippingBills.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No shipping bills issued in this session.</td>
                  </tr>
                ) : (
                  shippingBills.slice(0, 4).map(sb => (
                    <tr key={sb.id}>
                      <td><strong className="cursor-pointer" onClick={() => openInspector(sb, 'ShippingBill')} style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>SHP-{sb.id}</strong></td>
                      <td><strong>{sb.poNumber}</strong></td>
                      <td>{sb.shippingDate}</td>
                      <td><span className="badge badge-success">ARRIVED / {sb.status}</span></td>
                      <td><code style={{ fontSize: '10px' }}>{sb.checksum}</code></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════
     RENDER 4: SYSTEM ADMIN DASHBOARD
     ═══════════════════════════════════════════════════════ */
  const renderSystemAdminDashboard = () => {
    // Filter security logs by text
    const filteredLogs = auditLogs.filter(log => 
      log.details.toLowerCase().includes(adminSearch.toLowerCase()) || 
      log.action.toLowerCase().includes(adminSearch.toLowerCase()) || 
      log.entity.toLowerCase().includes(adminSearch.toLowerCase())
    );

    return (
      <div className="animate-fade-in-up">
        {/* Sub-Header */}
        <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0 }}>System Admin Console</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              Monitor secure operator account credentials, analyze cryptographic action logs, and write system SQL snapshots.
            </p>
          </div>
          <button 
            onClick={() => handleExportData(auditLogs, 'gsc_cryptographic_audit_trails')}
            className="btn btn-secondary export-btn"
          >
            <Download size={14} />
            Export System Audits
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper primary-bg"><User size={22} /></div>
            <div>
              <h3 className="stat-number">{users.length}</h3>
              <p className="stat-label">Operator Accounts</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper success-bg"><Database size={22} /></div>
            <div>
              <h3 className="stat-number">{backups.length}</h3>
              <p className="stat-label">Database Backups</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper secondary-bg"><FileText size={22} /></div>
            <div>
              <h3 className="stat-number">{auditLogs.length}</h3>
              <p className="stat-label">Security Audit logs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper warning-bg"><Settings size={22} /></div>
            <div>
              <h3 className="stat-number">Healthy</h3>
              <p className="stat-label">System Status (3309)</p>
            </div>
          </div>
        </div>

        {/* Disaster Recovery SQL Snapshots & Fast Tools */}
        <div className="grid-cols-3 gap-lg" style={{ marginBottom: '32px' }}>
          {/* Backups List */}
          <div className="box-card col-span-2">
            <h3>Disaster Recovery Snapshots Logs (UC11)</h3>
            <p className="card-description">Database volumes are written to encrypted local fail-safe folders inside the system workspace.</p>
            
            <div className="table-container">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Backup File</th>
                    <th>Backup Path</th>
                    <th>Timestamp</th>
                    <th>Recovery action</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No simulated SQL database snapshot logs recorded in this session.
                      </td>
                    </tr>
                  ) : (
                    backups.map(bak => (
                      <tr key={bak.id}>
                        <td><strong>{bak.fileName}</strong></td>
                        <td><code style={{ fontSize: '10px' }}>{bak.filePath}</code></td>
                        <td>{bak.timestamp}</td>
                        <td>
                          <button 
                            onClick={() => triggerDatabaseRestore(bak)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick links to Admin Pages */}
          <div className="box-card flex-col justify-between">
            <div>
              <h3 style={{ margin: '0 0 12px 0' }}>Admin Controls</h3>
              <p className="card-description" style={{ margin: 0 }}>Configure virtual SQL mirrors, manage roles, and review security logs.</p>
            </div>
            <div className="flex-col gap-sm" style={{ marginTop: '24px' }}>
              <Link to="/admin/utilities" className="quick-action-link-btn">
                <span>Database Backup / Restore</span>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>
              <Link to="/admin/utilities" className="quick-action-link-btn">
                <span>Review Audit Logs (UC10)</span>
                <ArrowRight size={16} className="arrow-icon" />
              </Link>
            </div>
          </div>
        </div>

        {/* Live Audits Feed Searcher */}
        <div className="box-card">
          <div className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Live Cryptographic Audit Trails Feed</h3>
            <div className="flex-row align-center search-bar-container">
              <Search size={14} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search live security logs..." 
                value={adminSearch} 
                onChange={(e) => setAdminSearch(e.target.value)} 
                className="search-input"
                style={{ padding: '6px 12px 6px 30px', fontSize: '11px', width: '220px', border: '1px solid var(--border-light)' }}
              />
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="premium-table" style={{ fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Timestamp</th>
                  <th>DB Operation</th>
                  <th>Entity</th>
                  <th>Security Details</th>
                  <th>Operator</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                      No audit trails logged matching search criteria.
                    </td>
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
  };

  /* ═══════════════════════════════════════════════════════
     OVERVIEW ROUTER DISPATCHER
     ═══════════════════════════════════════════════════════ */
  const renderDashboard = () => {
    switch (role) {
      case ROLES.CONTRACTING_OFFICER:
        return renderContractingOfficerDashboard();
      case ROLES.ORDER_FULFILLMENT_STAFF:
        return renderOrderFulfillmentDashboard();
      case ROLES.WAREHOUSE_STAFF:
        return renderWarehouseStaffDashboard();
      case ROLES.SYSTEM_ADMIN:
        return renderSystemAdminDashboard();
      default:
        return (
          <div className="box-card text-center" style={{ padding: '40px' }}>
            <ShieldAlert size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 16px auto' }} />
            <h3>Role Credentials Unrecognized</h3>
            <p>Your simulated account duty role ({role || 'N/A'}) cannot be mapped to any operational dashboard. Please log in using the simulated accounts panel.</p>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Header bar section */}
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <h2>System Command Overview</h2>
        <div className="flex-row align-center gap-sm">
          <span className="pulse-glow-dot"></span>
          <span className="server-status-label">GSC Monolithic Core Online</span>
        </div>
      </div>

      {/* Main dashboard dispatch */}
      {renderDashboard()}

      {/* DETAILED INFORMATION OVERLAY INSPECTOR MODAL */}
      <Modal 
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)} 
        title={`${detailModalTitle} Specifications`}
        className={detailModalTitle === 'PO' || detailModalTitle === 'ShippingBill' ? 'modal-content-wide' : ''}
      >
        {selectedItem && (
          <div className="flex-col gap-lg" style={{ fontSize: 'var(--font-size-sm)' }}>
            <div className="box-card" style={{ backgroundColor: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)' }}>
              
              {detailModalTitle === 'PO' && (
                <div className="flex-col gap-md">
                  <div className="grid-cols-2 gap-lg" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
                    {/* Shipping info */}
                    <div className="flex-col gap-sm" style={{ borderRight: '1px solid var(--border-light)', paddingRight: '20px' }}>
                      <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Consignee & Shipping</h4>
                      <div>
                        <strong style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>PO NUMBER:</strong>
                        <span style={{ fontSize: '14px', fontWeight: 700 }}>{selectedItem.poNumber}</span>
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>CONTRACT REFERENCE:</strong>
                        <span>{contracts.find(c => c.id === selectedItem.contractId)?.code || 'N/A'}</span>
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>DELIVERY ADDRESS:</strong>
                        <span style={{ fontWeight: 600 }}>{selectedItem.shippingAddress || 'N/A'}</span>
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>CARRIER / TRACKING:</strong>
                        <span>{selectedItem.carrier || 'GSC_CARGO'} {selectedItem.trackingNumber ? `(${selectedItem.trackingNumber})` : '(Not Shipped)'}</span>
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>DELIVERY NOTES:</strong>
                        <span style={{ fontStyle: 'italic' }}>{selectedItem.deliveryNotes || 'None'}</span>
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)' }}>OFFICER REMARKS:</strong>
                        <span>{selectedItem.officerRemarks || 'None'}</span>
                      </div>
                    </div>

                    {/* Costing info */}
                    <div className="flex-col gap-sm">
                      <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Billing Invoice details</h4>
                      <div className="flex-col gap-sm">
                        {selectedItem.items.map((item, idx) => {
                          const eq = equipment.find(e => e.id === item.equipmentId);
                          return (
                            <div key={idx} className="flex-col gap-xxs" style={{ borderBottom: '1px dashed var(--border-light)', paddingBottom: '6px' }}>
                              <div className="flex-row justify-between">
                                <span>• {eq ? eq.code : `#${item.equipmentId}`} (x{item.quantity})</span>
                                <strong>${(item.price * item.quantity).toLocaleString()}</strong>
                              </div>
                              <small style={{ color: 'var(--text-muted)' }}>
                                Unit Price: ${item.price.toLocaleString()} {item.price !== item.catalogPrice && `(Catalog: $${item.catalogPrice.toLocaleString()})`}
                              </small>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex-row justify-between align-center" style={{ marginTop: '16px', borderTop: '2px solid var(--border-medium)', paddingTop: '10px' }}>
                        <span>GRAND PO VALUE:</span>
                        <strong style={{ fontSize: '18px', color: 'var(--color-secondary)' }}>${selectedItem.totalAmount.toLocaleString()}</strong>
                      </div>
                      <div className="flex-row justify-between" style={{ marginTop: '12px' }}>
                        <div>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>STATUS:</span><br/>
                          <Badge status={selectedItem.status} />
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700 }}>PRIORITY:</span><br/>
                          <span className={`priority-tag priority-${(selectedItem.priority || 'MEDIUM').toLowerCase()}`}>{selectedItem.priority || 'MEDIUM'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step Timeline */}
                  <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '16px 0' }} />
                  <h4 style={{ margin: '0 0 12px 0', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} /> Lifecycle History Timeline Logs
                  </h4>
                  <div className="timeline-container">
                    {selectedItem.statusHistory?.map((hist, idx) => (
                      <div key={idx} className="timeline-node success">
                        <div className="timeline-meta">{hist.timestamp} • {hist.action} • USER: {hist.user}</div>
                        <div className="timeline-comment">{hist.comment}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailModalTitle === 'Contract' && (
                <div className="grid-cols-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: '12px' }}>
                  <strong>Contract Code:</strong>
                  <span>{selectedItem.code}</span>

                  <strong>Partner Agency:</strong>
                  <span>{agencies.find(a => a.id === selectedItem.agencyId)?.name || 'N/A'}</span>

                  <strong>Budget Cost Limit:</strong>
                  <strong>${selectedItem.costLimit.toLocaleString()}</strong>

                  <strong>Executed spent:</strong>
                  <span>${selectedItem.spent.toLocaleString()} ({((selectedItem.spent / selectedItem.costLimit) * 100).toFixed(1)}% Usage)</span>

                  <strong>Expiration Date:</strong>
                  <span>{selectedItem.endDate}</span>

                  <strong>Whitelist Status:</strong>
                  <div><Badge status={selectedItem.status} /></div>
                </div>
              )}

              {detailModalTitle === 'ShippingBill' && (
                <div className="flex-col gap-md">
                  <div className="grid-cols-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: '12px' }}>
                    <strong>Shipment Ref:</strong>
                    <span>SHP-{selectedItem.id}</span>

                    <strong>PO Reference:</strong>
                    <strong>{selectedItem.poNumber}</strong>

                    <strong>Shipping Date:</strong>
                    <span>{selectedItem.shippingDate}</span>

                    <strong>Cargo status:</strong>
                    <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>ARRIVED / {selectedItem.status}</span>

                    <strong>Cryptographic sign:</strong>
                    <code style={{ fontSize: '10px' }}>{selectedItem.checksum}</code>
                  </div>
                  
                  <h4 style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '12px' }}>Cargo Item Invoices:</h4>
                  <div className="flex-col gap-xs">
                    {selectedItem.items?.map((item, idx) => {
                      const eq = equipment.find(e => e.id === item.equipmentId);
                      return (
                        <div key={idx} className="flex-row justify-between" style={{ borderBottom: '1px dashed var(--border-light)', paddingBottom: '4px' }}>
                          <span>• {eq ? eq.code : `#${item.equipmentId}`} - {eq ? eq.name : 'Unknown Equipment'}</span>
                          <span>Quantity: x{item.quantity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
            <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>
              Close specifications
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
