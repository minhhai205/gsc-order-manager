import React, { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth, ROLES } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Plus, Check, FileWarning, Eye, Archive, Trash2, Mail } from 'lucide-react';

export default function PurchaseOrders() {
  const { 
    purchaseOrders, contracts, equipment, agencies, rejectionLetters,
    handleCreatePo, validatePurchaseOrder, generateRejectionLetter, handleSendRejectionLetter, closeAndArchivePo
  } = useAppData();
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const isCoOrAdmin = role === ROLES.CONTRACTING_OFFICER || role === ROLES.SYSTEM_ADMIN;

  // Modals state
  const [showPoModal, setShowPoModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);

  // New PO state
  const [newPo, setNewPo] = useState({ poNumber: '', contractId: '', issueDate: '', items: [{ equipmentId: '', quantity: '' }] });

  const onSubmitPo = (e) => {
    e.preventDefault();
    if (!newPo.poNumber || !newPo.contractId || newPo.items.some(item => !item.equipmentId || !item.quantity)) return;
    handleCreatePo(newPo);
    setNewPo({ poNumber: '', contractId: '', issueDate: '', items: [{ equipmentId: '', quantity: '' }] });
    setShowPoModal(false);
  };

  const handlePoItemChange = (index, field, value) => {
    const updatedItems = [...newPo.items];
    updatedItems[index][field] = value;
    setNewPo(prev => ({ ...prev, items: updatedItems }));
  };

  const addPoItemField = () => {
    setNewPo(prev => ({
      ...prev,
      items: [...prev.items, { equipmentId: '', quantity: '' }]
    }));
  };

  const removePoItemField = (index) => {
    if (newPo.items.length <= 1) return;
    setNewPo(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const openRejectionLetter = (po) => {
    // Check if letter exists first
    const existing = rejectionLetters.find(l => l.poId === po.id);
    if (existing) {
      setSelectedLetter(existing);
    } else {
      const created = generateRejectionLetter(po);
      setSelectedLetter(created);
    }
    setShowLetterModal(true);
  };

  const onSendRejectionLetter = (id) => {
    handleSendRejectionLetter(id);
    setShowLetterModal(false);
  };

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <h2>Purchase Orders Registry & Validation</h2>
        {isCoOrAdmin && (
          <button onClick={() => setShowPoModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} />
            Digitize Purchase Order
          </button>
        )}
      </div>

      <div className="box-card">
        <h3>Federal Digitized Orders (UC4, UC5, UC9)</h3>
        <p className="card-description">All incoming purchase orders must be verified against their governing contracts and stock availability.</p>

        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Contract Code</th>
                <th>Date Issued</th>
                <th>Purchased Items</th>
                <th>Total Value</th>
                <th>Rules Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No digitized purchase orders recorded.</td>
                </tr>
              ) : (
                purchaseOrders.map(po => {
                  const contract = contracts.find(c => c.id === po.contractId);
                  
                  return (
                    <tr key={po.id}>
                      <td><strong>{po.poNumber}</strong></td>
                      <td><strong>{contract ? contract.code : 'N/A'}</strong></td>
                      <td>{po.issueDate}</td>
                      <td>
                        <div className="flex-col gap-xs">
                          {po.items.map((item, idx) => {
                            const eq = equipment.find(e => e.id === item.equipmentId);
                            return (
                              <div key={idx} style={{ fontSize: 'var(--font-size-xs)' }}>
                                • {eq ? eq.code : `#${item.equipmentId}`} (x{item.quantity})
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td><strong>${po.totalAmount.toLocaleString()}</strong></td>
                      <td>
                        <div className="flex-col gap-xs align-start">
                          <Badge status={po.status} />
                          {po.status === 'INVALID' && po.validationErrors.length > 0 && (
                            <div className="flex-col gap-xxs" style={{ color: 'var(--color-danger)', fontSize: '10px', maxWidth: '220px', marginTop: '4px' }}>
                              {po.validationErrors.map((err, i) => (
                                <div key={i} className="flex-row align-start gap-xxs">
                                  <span>⚠</span>
                                  <span>{err}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex-row gap-xs align-center">
                          {po.status === 'PENDING' && (
                            <button
                              onClick={() => validatePurchaseOrder(po.id)}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              disabled={!isCoOrAdmin}
                            >
                              <Check size={12} />
                              Validate
                            </button>
                          )}
                          
                          {po.status === 'INVALID' && (
                            <button
                              onClick={() => openRejectionLetter(po)}
                              className="btn btn-warning"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              disabled={!isCoOrAdmin}
                            >
                              <FileWarning size={12} />
                              Rejection
                            </button>
                          )}

                          {po.status === 'SHIPPED' && (
                            <button
                              onClick={() => closeAndArchivePo(po.id)}
                              className="btn btn-success"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              disabled={!isCoOrAdmin}
                            >
                              <Archive size={12} />
                              Archive
                            </button>
                          )}

                          {(po.status === 'OUTSTANDING' || po.status === 'READY_TO_SHIP' || po.status === 'CLOSED') && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Verified ✓</span>
                          )}
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

      {/* DIGITIZE PO MODAL */}
      <Modal isOpen={showPoModal} onClose={() => setShowPoModal(false)} title="Digitize Incoming Purchase Order">
        <form onSubmit={onSubmitPo} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Purchase Order Number</label>
              <input 
                type="text" 
                placeholder="e.g. PO-FBI-889"
                value={newPo.poNumber}
                onChange={(e) => setNewPo({...newPo, poNumber: e.target.value})}
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Governing Contract</label>
              <select 
                value={newPo.contractId}
                onChange={(e) => setNewPo({...newPo, contractId: e.target.value})}
                required
              >
                <option value="">-- Select Contract --</option>
                {contracts.filter(c => c.status === 'VALID').map(c => {
                  const agency = agencies.find(a => a.id === c.agencyId);
                  return (
                    <option key={c.id} value={c.id}>{c.code} ({agency ? agency.code : 'N/A'})</option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="flex-col gap-xs" style={{ width: '50%' }}>
            <label>Date Issued</label>
            <input 
              type="date" 
              value={newPo.issueDate}
              onChange={(e) => setNewPo({...newPo, issueDate: e.target.value})}
            />
          </div>

          <div className="flex-col gap-xs">
            <label style={{ fontWeight: 700 }}>Line Items (Equipment catalog orders)</label>
            <div className="flex-col gap-sm">
              {newPo.items.map((item, idx) => (
                <div key={idx} className="flex-row gap-sm align-center">
                  <div className="flex-grow flex-col gap-xxs">
                    <select 
                      value={item.equipmentId}
                      onChange={(e) => handlePoItemChange(idx, 'equipmentId', e.target.value)}
                      required
                    >
                      <option value="">-- Catalog Item --</option>
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.code} - {eq.name} (${eq.price.toLocaleString()})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-col gap-xxs" style={{ width: '100px' }}>
                    <input 
                      type="number" 
                      min="1" 
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)}
                      required 
                    />
                  </div>
                  {newPo.items.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removePoItemField(idx)} 
                      className="btn btn-danger"
                      style={{ padding: '8px', borderRadius: '50%' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button 
              type="button" 
              onClick={addPoItemField} 
              className="btn btn-secondary" 
              style={{ marginTop: '8px', alignSelf: 'flex-start', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={12} />
              Add Order Line
            </button>
          </div>

          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowPoModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Digitize Order</button>
          </div>
        </form>
      </Modal>

      {/* REJECTION LETTER MODAL */}
      <Modal isOpen={showLetterModal} onClose={() => setShowLetterModal(false)} title="Generate Rejection Letter (UC5)">
        {selectedLetter && (
          <div className="flex-col gap-md">
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg-subtle)', border: '1px dashed var(--border-light)' }}>
              <div className="flex-row justify-between" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GSC-CO-REJLETTER-DRAFT</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>Date: {selectedLetter.issueDate}</span>
              </div>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>
                <strong>TO:</strong> {selectedLetter.agencyName} ({selectedLetter.agencyEmail})
              </p>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>
                <strong>SUBJECT:</strong> Rejection of Purchase Order No. {selectedLetter.poNumber}
              </p>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '12px 0' }} />
              <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.5 }}>
                Your purchase order is officially <strong>REJECTED</strong> due to the following non-compliance errors:
              </p>
              <ul className="flex-col gap-xs" style={{ paddingLeft: '20px', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
                {selectedLetter.reasons.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)', margin: '12px 0' }} />
              <div className="flex-row justify-between align-center" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>Signed: Contracting Officer (Authorized)</span>
                <span>SHA256 CHECKSUM: {selectedLetter.checksum}</span>
              </div>
            </div>

            <div className="flex-row justify-between align-center">
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)' }}>Status: </span>
                <Badge status={selectedLetter.status} />
              </div>
              <div className="flex-row gap-sm">
                <button type="button" onClick={() => setShowLetterModal(false)} className="btn btn-secondary">Close</button>
                {selectedLetter.status === 'DRAFT' && (
                  <button 
                    type="button" 
                    onClick={() => onSendRejectionLetter(selectedLetter.id)} 
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Mail size={14} />
                    Issue & Email Agency
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
