import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Plus, Edit2, Trash2, Eye, ShieldAlert, Check, FileWarning, Archive, Mail, PlusCircle, MinusCircle } from 'lucide-react';

export default function ManageOrders() {
  const { 
    purchaseOrders, contracts, equipment, agencies, rejectionLetters,
    handleCreatePo, handleUpdatePo, handleDeletePo, validatePurchaseOrder, 
    generateRejectionLetter, handleSendRejectionLetter, closeAndArchivePo
  } = useAppData();
  const { currentUser } = useAuth();

  const isCoOrAdmin = currentUser?.role === ROLES.CONTRACTING_OFFICER || currentUser?.role === ROLES.SYSTEM_ADMIN;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);

  // Active records state
  const [selectedPo, setSelectedPo] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);

  // Forms state
  const [formData, setFormData] = useState({ poNumber: '', contractId: '', issueDate: '', items: [{ equipmentId: '', quantity: '' }] });

  const openCreate = () => {
    setFormData({ poNumber: '', contractId: '', issueDate: '', items: [{ equipmentId: '', quantity: '' }] });
    setShowCreateModal(true);
  };

  const openEdit = (po) => {
    setSelectedPo(po);
    setFormData({
      poNumber: po.poNumber,
      contractId: po.contractId.toString(),
      issueDate: po.issueDate || '',
      items: po.items.map(item => ({
        equipmentId: item.equipmentId.toString(),
        quantity: item.quantity.toString()
      }))
    });
    setShowEditModal(true);
  };

  const openDetail = (po) => {
    setSelectedPo(po);
    setShowDetailModal(true);
  };

  const openDelete = (po) => {
    setSelectedPo(po);
    setShowDeleteConfirm(true);
  };

  const handlePoItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addPoItemField = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { equipmentId: '', quantity: '' }]
    }));
  };

  const removePoItemField = (index) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const onCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.poNumber || !formData.contractId || formData.items.some(item => !item.equipmentId || !item.quantity)) return;
    handleCreatePo(formData);
    setShowCreateModal(false);
  };

  const onEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedPo || !formData.poNumber || !formData.contractId) return;
    handleUpdatePo(selectedPo.id, formData);
    setShowEditModal(false);
  };

  const onDeleteConfirm = () => {
    if (!selectedPo) return;
    handleDeletePo(selectedPo.id);
    setShowDeleteConfirm(false);
  };

  const openRejectionLetter = (po) => {
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

  if (!isCoOrAdmin) {
    return (
      <div className="flex-col align-center justify-center" style={{ minHeight: '60vh', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center', maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 12px auto' }} />
          <h3>Access Level Restrict</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            This page is strictly reserved for **Contracting Officers** to digitize and validate purchase orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Federal Purchase Orders Registry (CO Concern)</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Digitize incoming orders, run real-time contract compliance whitelists, and issue rejection letters.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          Digitize Purchase Order
        </button>
      </div>

      <div className="box-card">
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Standing Contract</th>
                <th>Date Issued</th>
                <th>Ordered Items Catalog</th>
                <th>Total Value</th>
                <th>Compliance Status</th>
                <th>Operation Actions</th>
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
                  const agency = contract ? agencies.find(a => a.id === contract.agencyId) : null;
                  
                  return (
                    <tr key={po.id}>
                      <td><strong>{po.poNumber}</strong></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{contract ? contract.code : 'N/A'}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{agency ? agency.code : 'N/A'}</small>
                      </td>
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
                          <button onClick={() => openDetail(po)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="View Invoice details">
                            <Eye size={14} />
                          </button>
                          
                          {po.status === 'PENDING' ? (
                            <button
                              onClick={() => validatePurchaseOrder(po.id)}
                              className="btn btn-primary"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={12} />
                              Validate
                            </button>
                          ) : po.status === 'INVALID' ? (
                            <button
                              onClick={() => openRejectionLetter(po)}
                              className="btn btn-warning"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <FileWarning size={12} />
                              Rejection
                            </button>
                          ) : po.status === 'SHIPPED' ? (
                            <button
                              onClick={() => closeAndArchivePo(po.id)}
                              className="btn btn-success"
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Archive size={12} />
                              Archive
                            </button>
                          ) : (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Verified ✓</span>
                          )}

                          {po.status === 'PENDING' && (
                            <>
                              <button onClick={() => openEdit(po)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="Edit Digitization">
                                <Edit2 size={14} style={{ color: 'var(--color-primary)' }} />
                              </button>
                              <button onClick={() => openDelete(po)} className="btn btn-danger" style={{ padding: '6px', borderRadius: '6px' }} title="Delete Digitization">
                                <Trash2 size={14} />
                              </button>
                            </>
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

      {/* CREATE MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Digitize Incoming Purchase Order Invoice">
        <form onSubmit={onCreateSubmit} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Purchase Order Number</label>
              <input 
                type="text" 
                placeholder="e.g. PO-FBI-889" 
                value={formData.poNumber} 
                onChange={(e) => setFormData({...formData, poNumber: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Select standing contract</label>
              <select 
                value={formData.contractId} 
                onChange={(e) => setFormData({...formData, contractId: e.target.value})} 
                required
              >
                <option value="">-- Choose Contract --</option>
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
              value={formData.issueDate} 
              onChange={(e) => setFormData({...formData, issueDate: e.target.value})} 
            />
          </div>

          <div className="flex-col gap-xs">
            <label style={{ fontWeight: 700 }}>Line Items (Equipment catalog orders)</label>
            <div className="flex-col gap-sm">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex-row gap-sm align-center">
                  <div className="flex-grow flex-col gap-xxs">
                    <select 
                      value={item.equipmentId} 
                      onChange={(e) => handlePoItemChange(idx, 'equipmentId', e.target.value)} 
                      required
                    >
                      <option value="">-- Choose Equipment --</option>
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
                  {formData.items.length > 1 && (
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
              <PlusCircle size={14} />
              Add Order Line
            </button>
          </div>

          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Digitize Invoice</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Modify Digitization: ${selectedPo?.poNumber}`}>
        <form onSubmit={onEditSubmit} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Purchase Order Number</label>
              <input 
                type="text" 
                value={formData.poNumber} 
                onChange={(e) => setFormData({...formData, poNumber: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Standing Contract Whitelist</label>
              <select 
                value={formData.contractId} 
                onChange={(e) => setFormData({...formData, contractId: e.target.value})} 
                required
              >
                {contracts.map(c => {
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
              value={formData.issueDate} 
              onChange={(e) => setFormData({...formData, issueDate: e.target.value})} 
            />
          </div>

          <div className="flex-col gap-xs">
            <label style={{ fontWeight: 700 }}>Line Items (Equipment catalog orders)</label>
            <div className="flex-col gap-sm">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex-row gap-sm align-center">
                  <div className="flex-grow flex-col gap-xxs">
                    <select 
                      value={item.equipmentId} 
                      onChange={(e) => handlePoItemChange(idx, 'equipmentId', e.target.value)} 
                      required
                    >
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.code} - {eq.name} (${eq.price.toLocaleString()})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-col gap-xxs" style={{ width: '100px' }}>
                    <input 
                      type="number" 
                      min="1" 
                      value={item.quantity} 
                      onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)} 
                      required 
                    />
                  </div>
                  {formData.items.length > 1 && (
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
              <PlusCircle size={14} />
              Add Order Line
            </button>
          </div>

          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Update Digitization</button>
          </div>
        </form>
      </Modal>

      {/* DETAIL VIEW MODAL */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Digitized Invoice Invoice: ${selectedPo?.poNumber}`}>
        {selectedPo && (
          <div className="flex-col gap-md" style={{ fontSize: 'var(--font-size-sm)' }}>
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div className="grid-cols-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: '12px' }}>
                <strong>PO Reference:</strong>
                <span>{selectedPo.poNumber}</span>

                <strong>Standing Contract:</strong>
                <span>{contracts.find(c => c.id === selectedPo.contractId)?.code || 'N/A'}</span>

                <strong>Date Issued:</strong>
                <span>{selectedPo.issueDate}</span>

                <strong>Total Order Invoice:</strong>
                <strong>${selectedPo.totalAmount.toLocaleString()}</strong>

                <strong>Validation Status:</strong>
                <div><Badge status={selectedPo.status} /></div>
              </div>
            </div>

            <div className="box-card">
              <h4 style={{ margin: '0 0 12px 0' }}>Invoice Line Items Detail:</h4>
              <div className="flex-col gap-xs">
                {selectedPo.items.map((item, idx) => {
                  const eq = equipment.find(e => e.id === item.equipmentId);
                  return (
                    <div key={idx} className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      <span>• <strong>{eq ? eq.code : `#${item.equipmentId}`}</strong> - {eq ? eq.name : 'Unknown Equipment'} (x{item.quantity})</span>
                      <span>Total: ${(item.price * item.quantity).toLocaleString()} (${item.price.toLocaleString()} ea)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>Close Invoice</button>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Destroy Digitized Invoice Record">
        <div className="flex-col gap-md">
          <div className="flex-row align-start gap-sm warning-alert">
            <ShieldAlert size={20} />
            <span>
              Are you absolutely sure you want to destroy digitized purchase order <strong>{selectedPo?.poNumber}</strong>? This action is irreversible!
            </span>
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '8px' }}>
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={onDeleteConfirm} className="btn btn-danger">Confirm Destruction</button>
          </div>
        </div>
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
