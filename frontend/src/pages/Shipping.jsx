import React, { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth, ROLES } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Plus, Check, Truck, User, Calendar, FileText } from 'lucide-react';

export default function Shipping() {
  const { purchaseOrders, contracts, agencies, shippingBills, equipment, handleConfirmShipping } = useAppData();
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const isFulfillmentOrAdmin = role === ROLES.ORDER_FULFILLMENT_STAFF || role === ROLES.SYSTEM_ADMIN;

  // Modals state
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedShippingPo, setSelectedShippingPo] = useState(null);

  const openShippingForm = (po) => {
    setSelectedShippingPo(po);
    setShowShippingModal(true);
  };

  const onSubmitShipping = (e) => {
    e.preventDefault();
    if (!selectedShippingPo) return;
    const success = handleConfirmShipping(selectedShippingPo);
    if (!success) {
      alert("Error: Stock levels are insufficient. Run inventory availability checks again.");
    }
    setShowShippingModal(false);
    setSelectedShippingPo(null);
  };

  // Orders that are ready to be shipped
  const readyOrders = purchaseOrders.filter(po => po.status === 'READY_TO_SHIP');

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <h2>Shipping & Logistics Center</h2>
      </div>

      <div className="grid-cols-3" style={{ marginBottom: '32px' }}>
        {/* Shipped Bills Registry */}
        <div className="box-card col-span-2">
          <h3>Issued Shipping Bills Registry (UC8)</h3>
          <p className="card-description">Official cargo transport records including stock verification signatures and security checksums.</p>

          <div className="table-container">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Shipment Ref</th>
                  <th>Purchase Order</th>
                  <th>Shipping Date</th>
                  <th>Consigned Cargo</th>
                  <th>Delivery Status</th>
                  <th>Logistics Checksum</th>
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
                      <td><strong>SHP-{bill.id}</strong></td>
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
                      <td><span className="badge badge-success">ARRIVED / {bill.status}</span></td>
                      <td><small style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{bill.checksum}</small></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ready to ship sidebar checklist */}
        <div className="box-card">
          <h3>Ready for Shipping</h3>
          <p className="card-description">Inventory allocation completed successfully. Dispatch cargo now.</p>

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
                    disabled={!isFulfillmentOrAdmin}
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
        {selectedShippingPo && (
          <form onSubmit={onSubmitShipping} className="flex-col gap-md">
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg-subtle)', border: '1px dashed var(--border-light)' }}>
              <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>Consignee Invoice Detail</h4>
              
              <div className="grid-cols-2" style={{ fontSize: 'var(--font-size-sm)', gap: '12px 24px' }}>
                <div className="flex-row align-center gap-xs">
                  <FileText size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>Order Reference: <strong>{selectedShippingPo.poNumber}</strong></span>
                </div>
                <div className="flex-row align-center gap-xs">
                  <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                  <span>Shipment Date: <strong>{new Date().toISOString().slice(0, 10)}</strong></span>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '12px 0' }} />
              
              <h5 style={{ margin: '0 0 6px 0', fontWeight: 700 }}>Dispatching Cargo List:</h5>
              <ul className="flex-col gap-xs" style={{ paddingLeft: '20px', fontSize: 'var(--font-size-sm)' }}>
                {selectedShippingPo.items.map((item, idx) => {
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
                <strong>${selectedShippingPo.totalAmount.toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex-row align-start gap-sm warning-alert" style={{ border: '1px solid var(--color-success)', padding: '10px', borderRadius: 'var(--border-radius-sm)', color: 'var(--color-success)', fontSize: 'var(--font-size-xs)' }}>
              <Check size={20} />
              <span>
                By confirming, stock numbers will be automatically deducted, and contract expenses will be registered.
              </span>
            </div>

            <div className="flex-row justify-end gap-sm" style={{ marginTop: '8px' }}>
              <button type="button" onClick={() => setShowShippingModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={14} />
                Confirm Dispatch Cargo
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
