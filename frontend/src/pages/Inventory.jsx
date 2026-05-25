import React, { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth, ROLES } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Play, FileWarning, Check, RefreshCw, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const { 
    equipment, purchaseOrders, exceptionReports, 
    handleStockAdjustment, handleInventoryCheck, handleConfirmExceptionReport 
  } = useAppData();
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const isWarehouseOrAdmin = role === ROLES.WAREHOUSE_STAFF || role === ROLES.SYSTEM_ADMIN;
  const isFulfillmentOrAdmin = role === ROLES.ORDER_FULFILLMENT_STAFF || role === ROLES.SYSTEM_ADMIN;

  // Modals state
  const [showStockModal, setShowStockModal] = useState(false);
  const [showShortageModal, setShowShortageModal] = useState(false);

  // Forms state
  const [adjustment, setAdjustment] = useState({ equipmentId: '', quantity: '', operation: 'INCREASE', note: '' });
  const [selectedShortagePo, setSelectedShortagePo] = useState(null);
  const [selectedShortages, setSelectedShortages] = useState([]);

  const onSubmitStock = (e) => {
    e.preventDefault();
    if (!adjustment.equipmentId || !adjustment.quantity) return;
    handleStockAdjustment(adjustment);
    setAdjustment({ equipmentId: '', quantity: '', operation: 'INCREASE', note: '' });
    setShowStockModal(false);
  };

  const runInventoryCheck = (po) => {
    const result = handleInventoryCheck(po);
    if (!result.success) {
      setSelectedShortagePo(po);
      setSelectedShortages(result.shortages);
      setShowShortageModal(true);
    } else {
      alert(`Inventory check cleared for PO ${po.poNumber}! Ready for shipping.`);
    }
  };

  const confirmExceptionReport = () => {
    if (!selectedShortagePo) return;
    handleConfirmExceptionReport(selectedShortagePo, selectedShortages);
    setShowShortageModal(false);
    setSelectedShortagePo(null);
    setSelectedShortages([]);
  };

  // Orders that need inventory checking (OUTSTANDING state)
  const uncheckedOrders = purchaseOrders.filter(po => po.status === 'OUTSTANDING');

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <h2>Inventory & Catalog Management</h2>
        {isWarehouseOrAdmin && (
          <button onClick={() => setShowStockModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} />
            Adjust Stock Level
          </button>
        )}
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
        {/* Catalog */}
        <div className="box-card col-span-2">
          <h3>Equipment Catalog & Stock levels (UC3)</h3>
          <p className="card-description">View pricing, stock numbers, and manage low stock thresholds.</p>
          
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Unit Price</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {equipment.map(eq => {
                  const isLow = eq.stock < eq.minStock;
                  return (
                    <tr key={eq.id}>
                      <td><strong>{eq.code}</strong></td>
                      <td>{eq.name}</td>
                      <td>${eq.price.toLocaleString()}</td>
                      <td style={{ color: isLow ? 'var(--color-danger)' : 'inherit', fontWeight: isLow ? 700 : 'inherit' }}>
                        <div className="flex-row align-center gap-xs">
                          {eq.stock}
                          {isLow && (
                            <span className="badge badge-danger" style={{ fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <AlertTriangle size={10} />
                              LOW (Min: {eq.minStock})
                            </span>
                          )}
                        </div>
                      </td>
                      <td><Badge status={eq.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Checks Checklist */}
        <div className="box-card">
          <h3>Availability Check (UC6)</h3>
          <p className="card-description">Trigger stock allocation verification for validated POs.</p>

          <div className="flex-col gap-sm" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {uncheckedOrders.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                No outstanding orders pending inventory check.
              </div>
            ) : (
              uncheckedOrders.map(po => (
                <div key={po.id} className="flex-col gap-xs" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-sm)', padding: '12px', backgroundColor: 'var(--card-bg-subtle)' }}>
                  <div className="flex-row justify-between align-center">
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{po.poNumber}</span>
                    <Badge status={po.status} />
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Total items: {po.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <button 
                    onClick={() => runInventoryCheck(po)} 
                    className="btn btn-primary"
                    style={{ fontSize: '11px', padding: '6px 10px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}
                    disabled={!isFulfillmentOrAdmin}
                  >
                    <Play size={12} />
                    Run Stock Allocation Check
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Exception reports (UC7) */}
      <div className="box-card">
        <h3>Shortage Exception Reports Registry (UC7)</h3>
        <p className="card-description">Official reports generated when required catalog items fall short of PO purchase volumes.</p>

        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Purchase Order</th>
                <th>Date Generated</th>
                <th>Shortage Items Log</th>
                <th>Registry Checksum</th>
              </tr>
            </thead>
            <tbody>
              {exceptionReports.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No shortage exception reports have been generated.</td>
                </tr>
              ) : (
                exceptionReports.map(rep => (
                  <tr key={rep.id}>
                    <td><strong>EXP-{rep.id}</strong></td>
                    <td><strong>{rep.poNumber}</strong></td>
                    <td>{rep.date}</td>
                    <td>
                      <div className="flex-col gap-xs">
                        {rep.shortages.map((s, idx) => (
                          <div key={idx} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
                            ⚠ {s.code}: Requested {s.requested}, Stock {s.available} (Missing: -{s.shortage})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td><small style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{rep.checksum}</small></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STOCK ADJUSTMENT MODAL */}
      <Modal isOpen={showStockModal} onClose={() => setShowStockModal(false)} title="Adjust Equipment Stock (UC3)">
        <form onSubmit={onSubmitStock} className="flex-col gap-md">
          <div className="flex-col gap-xs">
            <label>Select Catalog Equipment</label>
            <select 
              value={adjustment.equipmentId}
              onChange={(e) => setAdjustment({...adjustment, equipmentId: e.target.value})}
              required
            >
              <option value="">-- Choose Equipment --</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.code} - {eq.name} (In stock: {eq.stock})</option>
              ))}
            </select>
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Operation Type</label>
              <select 
                value={adjustment.operation}
                onChange={(e) => setAdjustment({...adjustment, operation: e.target.value})}
                required
              >
                <option value="INCREASE">Increase Stock (+)</option>
                <option value="DECREASE">Deduct Stock (-)</option>
              </select>
            </div>
            <div className="flex-col gap-xs">
              <label>Quantity</label>
              <input 
                type="number" 
                min="1" 
                placeholder="Adjust value"
                value={adjustment.quantity}
                onChange={(e) => setAdjustment({...adjustment, quantity: e.target.value})}
                required 
              />
            </div>
          </div>
          <div className="flex-col gap-xs">
            <label>Adjustment Note (UC3 Requirement)</label>
            <input 
              type="text" 
              placeholder="Reason for adjustment, e.g. imported cargo shipment"
              value={adjustment.note}
              onChange={(e) => setAdjustment({...adjustment, note: e.target.value})}
            />
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowStockModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Apply Stock Change</button>
          </div>
        </form>
      </Modal>

      {/* SHORTAGE / EXCEPTION REPORT CONFIRMATION MODAL */}
      <Modal isOpen={showShortageModal} onClose={() => setShowShortageModal(false)} title="Generate Shortage Exception Report (UC7)">
        {selectedShortagePo && (
          <div className="flex-col gap-md">
            <div className="flex-row align-center gap-sm warning-alert" style={{ border: '1px solid var(--color-warning)', padding: '12px', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-warning)' }}>
              <AlertTriangle size={24} />
              <div>
                <strong style={{ fontSize: 'var(--font-size-sm)' }}>Inventory Shortage Identified!</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)' }}>
                  Order No. {selectedShortagePo.poNumber} requires more units than currently stocked. An Exception Report must be recorded.
                </p>
              </div>
            </div>

            <h4 style={{ margin: '8px 0 0 0' }}>Line Items with Shortages:</h4>
            <div className="table-container">
              <table className="premium-table" style={{ fontSize: 'var(--font-size-xs)' }}>
                <thead>
                  <tr>
                    <th>Equipment Code</th>
                    <th>Requested Quantity</th>
                    <th>In Stock</th>
                    <th>Missing Count</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedShortages.map((s, idx) => (
                    <tr key={idx}>
                      <td><strong>{s.code}</strong><br/><small style={{ color: 'var(--text-muted)' }}>{s.name}</small></td>
                      <td>{s.requested}</td>
                      <td>{s.available}</td>
                      <td style={{ color: 'var(--color-danger)', fontWeight: 700 }}>-{s.shortage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
              <button type="button" onClick={() => setShowShortageModal(false)} className="btn btn-secondary">Cancel</button>
              <button 
                type="button" 
                onClick={confirmExceptionReport} 
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <FileWarning size={14} />
                Generate Exception Report
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
