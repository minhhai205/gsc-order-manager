import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Play, ShieldAlert, AlertTriangle, FileWarning, Check, Eye, CheckCircle, X } from 'lucide-react';

export default function AvailabilityChecks() {
  const { 
    purchaseOrders, equipment, exceptionReports, 
    handleInventoryCheck, handleConfirmExceptionReport 
  } = useAppData();
  const { currentUser } = useAuth();

  const isFulfillment = currentUser?.role === ROLES.ORDER_FULFILLMENT_STAFF;

  // Modals state
  const [showShortageModal, setShowShortageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Active records state
  const [selectedPo, setSelectedPo] = useState(null);
  const [selectedShortages, setSelectedShortages] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  // System notification alert state
  const [systemAlert, setSystemAlert] = useState({ type: '', message: '' });

  const triggerAlert = (type, message) => {
    setSystemAlert({ type, message });
    setTimeout(() => {
      setSystemAlert({ type: '', message: '' });
    }, 4500);
  };

  const runCheck = async (po) => {
    try {
      const result = await handleInventoryCheck(po);
      if (!result.success) {
        setSelectedPo(po);
        setSelectedShortages(result.shortages);
        setShowShortageModal(true);
      } else {
        triggerAlert('success', `Inventory allocation check cleared successfully for PO: ${po.poNumber}! Validated for shipment.`);
      }
    } catch (err) {
      triggerAlert('danger', `Failed to run stock check: ${err.message}`);
    }
  };

  const confirmExceptionReport = async () => {
    if (!selectedPo) return;
    try {
      await handleConfirmExceptionReport(selectedPo, selectedShortages);
      setShowShortageModal(false);
      setSelectedPo(null);
      setSelectedShortages([]);
      triggerAlert('success', `Deficit exception report has been successfully generated.`);
    } catch (err) {
      triggerAlert('danger', `Failed to generate exception report: ${err.message}`);
    }
  };

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  if (!isFulfillment) {
    return (
      <div className="flex-col align-center justify-center" style={{ minHeight: '60vh', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center', maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 12px auto' }} />
          <h3>Access Level Restrict</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            This page is strictly reserved for **Order Fulfillment Staff** to perform stock allocation checks.
          </p>
        </div>
      </div>
    );
  }

  // Validated orders waiting for stock checks (outstanding or previously checked with shortages)
  const pendingChecks = purchaseOrders.filter(po => po.status === 'OUTSTANDING' || po.status === 'INVENTORY_CHECKED');

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Stock Allocation & Availability (Fulfillment Concern)</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Perform physical stock allocation checks and issue shortage reports.</p>
        </div>
      </div>

      {systemAlert.message && (
        <div 
          className={`${systemAlert.type === 'success' ? 'success-alert' : 'error-alert'} flex-row align-center justify-between`} 
          style={{ marginBottom: '20px', padding: '12px 20px', borderRadius: 'var(--border-radius-md)', animation: 'pulse-glow-simple 2s' }}
        >
          <div className="flex-row align-center gap-xs">
            {systemAlert.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{systemAlert.message}</span>
          </div>
          <button 
            type="button"
            onClick={() => setSystemAlert({ type: '', message: '' })} 
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid-cols-3 gap-lg" style={{ marginBottom: '32px' }}>
        {/* Outstanding checks list */}
        <div className="box-card col-span-2">
          <h3>POs Awaiting Inventory Check (UC6)</h3>
          <p className="card-description">Select outstanding validated purchase orders to allocate physical warehouse quantities.</p>
          
          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>PO Reference</th>
                  <th>Total Invoice</th>
                  <th>Order Items Breakdown</th>
                  <th>Status</th>
                  <th>Operation Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingChecks.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No outstanding POs awaiting stock check.</td>
                  </tr>
                ) : (
                  pendingChecks.map(po => (
                    <tr key={po.id}>
                      <td><strong>{po.poNumber}</strong></td>
                      <td><strong>${po.totalAmount.toLocaleString()}</strong></td>
                      <td>
                        <div className="flex-col gap-xs">
                          {po.items.map((item, idx) => {
                            const eq = equipment.find(e => e.id === item.equipmentId);
                            return (
                              <div key={idx} style={{ fontSize: 'var(--font-size-xs)' }}>
                                • {eq ? eq.code : `#${item.equipmentId}`} (Req: {item.quantity} / Stock: {eq ? eq.stock : 0})
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td><Badge status={po.status} /></td>
                      <td>
                        <button 
                          onClick={() => runCheck(po)} 
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Play size={12} />
                          Run Stock Check
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="box-col gap-md">
          <div className="box-card">
            <h3>Nomenclature Guide</h3>
            <ul style={{ fontSize: 'var(--font-size-xs)', lineHeight: 1.5, margin: 0, paddingLeft: '20px' }}>
              <li><strong>OUTSTANDING:</strong> PO validated by CO, waiting for physical stock allocation check.</li>
              <li><strong>READY_TO_SHIP:</strong> Stock is sufficient and allocated. Safe to issue cargo shipping bill.</li>
              <li><strong>INVENTORY_CHECKED:</strong> Shortages detected and registered in Exception Report.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Exception reports log */}
      <div className="box-card">
        <h3>Shortage Exception Reports Directory (UC7)</h3>
        <p className="card-description">Review cryptographic logs of stock shortfalls recorded during allocation checks.</p>

        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Report Ref</th>
                <th>PO Number</th>
                <th>Date Generated</th>
                <th>Deficit Items Log</th>
                <th>Registry Checksum</th>
              </tr>
            </thead>
            <tbody>
              {exceptionReports.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No shortage exception reports generated.</td>
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
                            ⚠ {s.code}: Req {s.requested}, Stock {s.available} (Deficit: -{s.shortage})
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="flex-row align-center gap-xs">
                        <small style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{rep.checksum}</small>
                        <button onClick={() => viewReportDetails(rep)} className="btn btn-secondary" style={{ padding: '4px', borderRadius: '4px' }}>
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SHORTAGE EXCEPTION REPORT MODAL */}
      <Modal isOpen={showShortageModal} onClose={() => setShowShortageModal(false)} title="Confirm Shortage Exception Report (UC7)">
        {selectedPo && (
          <div className="flex-col gap-md">
            <div className="flex-row align-start gap-sm warning-alert" style={{ border: '1px solid var(--color-warning)', color: 'var(--color-warning)' }}>
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div>
                <strong>Allocations Deficit Flagged!</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-xs)' }}>
                  Purchase order {selectedPo.poNumber} cannot be fulfilled immediately because required items exceed active stock caps.
                </p>
              </div>
            </div>

            <h4 style={{ margin: '8px 0 0 0' }}>Shortage Breakdown:</h4>
            <div className="table-container">
              <table className="premium-table" style={{ fontSize: 'var(--font-size-xs)' }}>
                <thead>
                  <tr>
                    <th>Equipment Reference</th>
                    <th>Requested count</th>
                    <th>In Stock</th>
                    <th>Deficit Margin</th>
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
              <button type="button" onClick={() => setShowShortageModal(false)} className="btn btn-secondary">Cancel Check</button>
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

      {/* DETAIL MODAL */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Exception Report: EXP-${selectedReport?.id}`}>
        {selectedReport && (
          <div className="flex-col gap-md" style={{ fontSize: 'var(--font-size-sm)' }}>
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div className="grid-cols-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: '12px' }}>
                <strong>Report Ref:</strong>
                <span>EXP-{selectedReport.id}</span>

                <strong>PO Reference:</strong>
                <strong>{selectedReport.poNumber}</strong>

                <strong>Date Generated:</strong>
                <span>{selectedReport.date}</span>

                <strong>Logistics Checksum:</strong>
                <span style={{ fontFamily: 'monospace' }}>{selectedReport.checksum}</span>
              </div>
            </div>

            <div className="box-card">
              <h4 style={{ margin: '0 0 10px 0' }}>Registered Deficit Margin Logs:</h4>
              <div className="flex-col gap-xs">
                {selectedReport.shortages.map((s, idx) => (
                  <div key={idx} className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                    <span>• <strong>{s.code}</strong> - {s.name}</span>
                    <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Requested: {s.requested} | Stock: {s.available} (Shortage: -{s.shortage})</span>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>Close report</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
