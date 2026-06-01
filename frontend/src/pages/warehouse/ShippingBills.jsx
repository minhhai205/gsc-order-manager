import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Truck, ShieldAlert, Check, Calendar, FileText, Eye, ShieldCheck, CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function ShippingBills() {
  const { purchaseOrders, shippingBills, equipment, handleCreateShippingBill, handleConfirmShippingBill, handleUpdateShippingStatus } = useAppData();
  const { currentUser } = useAuth();

  const isWarehouse = currentUser?.role === ROLES.WAREHOUSE_STAPS || currentUser?.role === ROLES.WAREHOUSE_STAFF;

  // Modals state
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Active records state
  const [selectedPo, setSelectedPo] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);

  // System notification alert state
  const [systemAlert, setSystemAlert] = useState({ type: '', message: '' });

  const triggerAlert = (type, message) => {
    setSystemAlert({ type, message });
    setTimeout(() => {
      setSystemAlert({ type: '', message: '' });
    }, 4500);
  };

  const openShippingForm = (po) => {
    setSelectedPo(po);
    setShowShippingModal(true);
  };

  const onSubmitShipping = async (e) => {
    e.preventDefault();
    if (!selectedPo) return;
    try {
      const success = await handleCreateShippingBill(selectedPo);
      if (!success) {
        triggerAlert('danger', "Error: Stock changed and is now insufficient. Run inventory allocation checks again!");
      } else {
        triggerAlert('success', `Draft Cargo Shipping Bill created successfully for PO: ${selectedPo.poNumber}! Click 'Confirm' in the registry below to dispatch cargo.`);
      }
      setShowShippingModal(false);
      setSelectedPo(null);
    } catch (err) {
      triggerAlert('danger', `Failed to create draft shipping bill: ${err.message}`);
    }
  };

  const onConfirmBill = async (billId) => {
    try {
      await handleConfirmShippingBill(billId);
      triggerAlert('success', 'Cargo Shipping Bill confirmed successfully! Shipment is now IN_TRANSIT and stock is deducted.');
    } catch (err) {
      triggerAlert('danger', `Failed to confirm cargo dispatch: ${err.message}`);
    }
  };

  const onUpdateStatus = async (billId, status) => {
    try {
      await handleUpdateShippingStatus(billId, status);
      triggerAlert('success', `Shipment status updated to ${status}!`);
    } catch (err) {
      triggerAlert('danger', `Failed to update shipment status: ${err.message}`);
    }
  };

  const openDetail = (bill) => {
    setSelectedBill(bill);
    setShowDetailModal(true);
  };

  if (!isWarehouse) {
    return (
      <div className="flex-col align-center justify-center" style={{ minHeight: '60vh', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center', maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 12px auto' }} />
          <h3>Access Level Restrict</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            This page is strictly reserved for **Warehouse Staff** to dispatch cargo shipments.
          </p>
        </div>
      </div>
    );
  }

  // Orders that are ready to be shipped
  const readyOrders = purchaseOrders.filter(po => po.status === 'READY_TO_SHIP');

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Shipping & Dispatch Logistics (Warehouse Concern)</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Confirm cargo allocations, record contract expenses, and issue secure Cargo Shipping Bills.</p>
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
        {/* Shipped Bills Registry */}
        <div className="box-card col-span-2">
          <h3>Issued Shipping Bills Registry (UC8)</h3>
          <p className="card-description">Official transportation invoices containing stock verification signatures and logistics checksums.</p>

          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Shipment Ref</th>
                  <th>PO Reference</th>
                  <th>Shipping Date</th>
                  <th>Consigned Cargo</th>
                  <th>Status</th>
                  <th>Operation Actions</th>
                </tr>
              </thead>
              <tbody>
                {shippingBills.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No shipping bills have been issued.</td>
                  </tr>
                ) : (
                  shippingBills.map(bill => (
                    <tr key={bill.id}>
                      <td><strong>{bill.shippingBillNumber || `SHP-${bill.id}`}</strong></td>
                      <td><strong>{bill.poNumber}</strong></td>
                      <td>{bill.shippingDate}</td>
                      <td>
                        <div className="flex-col gap-xs">
                          {bill.items.map((item, idx) => {
                            const eq = equipment.find(e => e.id === item.equipmentId);
                            return (
                              <div key={idx} style={{ fontSize: 'var(--font-size-xs)' }}>
                                • {eq ? eq.code : `#${item.equipmentId}`} (x{item.quantity})
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td><Badge status={bill.status} /></td>
                      <td>
                        <div className="flex-row align-center gap-xs">
                          <button onClick={() => openDetail(bill)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="View Detail">
                            <Eye size={14} />
                          </button>
                          {bill.status === 'DRAFT' && (
                            <button 
                              onClick={() => onConfirmBill(bill.id)} 
                              className="btn btn-success" 
                              style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Confirm Dispatch"
                            >
                              <ShieldCheck size={12} />
                              Confirm
                            </button>
                          )}
                          {bill.status === 'IN_TRANSIT' && (
                            <button 
                              onClick={() => onUpdateStatus(bill.id, 'DELIVERED')} 
                              className="btn btn-primary" 
                              style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Complete Delivery"
                            >
                              <CheckCircle size={12} />
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ready to ship sidebar checklist */}
        <div className="box-card">
          <h3>Ready for Dispatch</h3>
          <p className="card-description">Stock allocations completed successfully. Dispatch cargo immediately.</p>

          <div className="flex-col gap-sm" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {readyOrders.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                No outstanding orders ready to dispatch.
              </div>
            ) : (
              readyOrders.map(po => (
                <div key={po.id} className="flex-col gap-xs" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-sm)', padding: '12px', backgroundColor: 'var(--card-bg-subtle)' }}>
                  <div className="flex-row justify-between align-center">
                    <span style={{ fontWeight: 700, fontSize: 'var(--font-size-sm)' }}>{po.poNumber}</span>
                    <Badge status={po.status} />
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Fulfillment Cost: ${po.totalAmount.toLocaleString()}
                  </div>
                  <button 
                    onClick={() => openShippingForm(po)} 
                    className="btn btn-success"
                    style={{ fontSize: '11px', padding: '6px 10px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}
                  >
                    <Truck size={12} />
                    Issue Shipping Bill
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DISPATCH SHIPPING BILL FORM MODAL */}
      <Modal isOpen={showShippingModal} onClose={() => setShowShippingModal(false)} title="Issue Cargo Shipping Bill (UC8)">
        {selectedPo && (
          <form onSubmit={onSubmitShipping} className="flex-col gap-md">
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg-subtle)', border: '1px dashed var(--border-light)' }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>Consignee Invoice Detail</h4>
              
              <div className="grid-cols-2" style={{ fontSize: 'var(--font-size-sm)', gap: '12px 24px' }}>
                <div className="flex-row align-center gap-xs">
                  <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>Order Reference: <strong>{selectedPo.poNumber}</strong></span>
                </div>
                <div className="flex-row align-center gap-xs">
                  <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>Shipment Date: <strong>{new Date().toISOString().slice(0, 10)}</strong></span>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '12px 0' }} />
              
              <h5 style={{ margin: '0 0 6px 0', fontWeight: 700 }}>Dispatching Cargo List:</h5>
              <ul className="flex-col gap-xs" style={{ paddingLeft: '20px', fontSize: 'var(--font-size-sm)' }}>
                {selectedPo.items.map((item, idx) => {
                  const eq = equipment.find(e => e.id === item.equipmentId);
                  return (
                    <li key={idx}>
                      {eq ? eq.code : `#${item.equipmentId}`} - {eq ? eq.name : 'Unknown Equipment'} (x{item.quantity} units)
                    </li>
                  );
                })}
              </ul>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '12px 0' }} />
              
              <div className="flex-row justify-between" style={{ fontSize: 'var(--font-size-sm)' }}>
                <span>Budget Charge Value:</span>
                <strong>${selectedPo.totalAmount.toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex-row align-start gap-sm warning-alert" style={{ border: '1px solid var(--color-success)', padding: '10px', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-success)', fontSize: 'var(--font-size-xs)' }}>
              <Check size={20} />
              <span>
                By confirming, a draft shipping bill will be created to allocate shipment details. Stock will be deducted only upon manual dispatch confirmation.
              </span>
            </div>

            <div className="flex-row justify-end gap-sm" style={{ marginTop: '8px' }}>
              <button type="button" onClick={() => setShowShippingModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} />
                Create Draft Invoice
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DETAIL MODAL */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Shipping Bill Detail: SHP-${selectedBill?.id}`}>
        {selectedBill && (
          <div className="flex-col gap-md" style={{ fontSize: 'var(--font-size-sm)' }}>
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div className="grid-cols-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: '12px' }}>
                <strong>Shipment Ref:</strong>
                <span>{selectedBill.shippingBillNumber || `SHP-${selectedBill.id}`}</span>

                <strong>PO Reference:</strong>
                <strong>{selectedBill.poNumber}</strong>

                <strong>Date Shipped:</strong>
                <span>{selectedBill.shippingDate}</span>

                <strong>Destination Address:</strong>
                <span>{selectedBill.destinationAddress}</span>

                <strong>Created By:</strong>
                <span>{selectedBill.createdBy}</span>

                <strong>Transport Status:</strong>
                <div><Badge status={selectedBill.status} /></div>
              </div>
            </div>

            <div className="box-card">
              <h4 style={{ margin: '0 0 10px 0' }}>Consigned Cargo Invoices:</h4>
              <div className="flex-col gap-xs">
                {selectedBill.items.map((item, idx) => {
                  const eq = equipment.find(e => e.id === item.equipmentId);
                  return (
                    <div key={idx} className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      <span>• <strong>{eq ? eq.code : `#${item.equipmentId}`}</strong> - {eq ? eq.name : 'Unknown Equipment'}</span>
                      <span>Dispatched Qty: x{item.quantity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>Close Invoice</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
