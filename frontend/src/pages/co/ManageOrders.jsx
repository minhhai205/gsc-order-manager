import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { 
  Plus, Edit2, Trash2, Eye, ShieldAlert, Check, FileWarning, 
  Archive, Mail, PlusCircle, Trash, Truck, Calendar, MapPin, 
  AlertTriangle, DollarSign, Info, ShieldCheck, Clock, Search,
  CheckCircle, X
} from 'lucide-react';

export default function ManageOrders() {
  const { 
    purchaseOrders, contracts, equipment, agencies, rejectionLetters,
    handleCreatePo, handleUpdatePo, handleDeletePo, validatePurchaseOrder, 
    generateRejectionLetter, handleSendRejectionLetter, closeAndArchivePo
  } = useAppData();
  const { currentUser } = useAuth();

  const isCo = currentUser?.role === ROLES.CONTRACTING_OFFICER;

  // Search filter
  const [poFilter, setPoFilter] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);

  // Active records state
  const [selectedPo, setSelectedPo] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);

  // System notification alert state
  const [systemAlert, setSystemAlert] = useState({ type: '', message: '' });

  const triggerAlert = (type, message) => {
    setSystemAlert({ type, message });
    setTimeout(() => {
      setSystemAlert({ type: '', message: '' });
    }, 4500);
  };

  // Advanced Forms state
  const [formData, setFormData] = useState({ 
    poNumber: '', 
    contractId: '', 
    issueDate: '', 
    validationReason: '',
    items: [{ equipmentId: '', quantity: '', customPrice: '' }] 
  });

  const openCreate = () => {
    setFormData({ 
      poNumber: '', 
      contractId: '', 
      issueDate: new Date().toISOString().slice(0, 10), 
      validationReason: '',
      items: [{ equipmentId: '', quantity: '', customPrice: '' }] 
    });
    setShowCreateModal(true);
  };

  const openEdit = (po) => {
    setSelectedPo(po);
    setFormData({
      poNumber: po.poNumber,
      contractId: po.contractId.toString(),
      issueDate: po.issueDate || '',
      validationReason: po.validationReason || '',
      items: po.items.map(item => ({
        equipmentId: item.equipmentId.toString(),
        quantity: item.quantity.toString(),
        customPrice: item.price !== item.catalogPrice ? item.price.toString() : ''
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
    setFormData(prev => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addPoItemField = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { equipmentId: '', quantity: '', customPrice: '' }]
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
    if (!formData.poNumber || !formData.contractId || formData.items.some(item => !item.equipmentId || !item.quantity)) {
      triggerAlert('danger', "Error: Please verify all required items fields are completed!");
      return;
    }
    handleCreatePo(formData);
    setShowCreateModal(false);
    triggerAlert('success', `Purchase Order ${formData.poNumber} has been successfully digitized!`);
  };

  const onEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedPo || !formData.poNumber || !formData.contractId) {
      triggerAlert('danger', 'Error: All fields are required.');
      return;
    }
    handleUpdatePo(selectedPo.id, formData);
    setShowEditModal(false);
    triggerAlert('success', `Purchase Order ${formData.poNumber} metadata updated successfully.`);
  };

  const onDeleteConfirm = () => {
    if (!selectedPo) return;
    const poNumber = selectedPo.poNumber;
    handleDeletePo(selectedPo.id);
    setShowDeleteConfirm(false);
    triggerAlert('success', `Purchase Order ${poNumber} has been successfully deleted.`);
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
    triggerAlert('success', 'Official rejection letter has been issued and emailed to the agency.');
  };

  if (!isCo) {
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

  // Filter Purchase Orders
  const filteredOrders = purchaseOrders.filter(po => 
    po.poNumber.toLowerCase().includes(poFilter.toLowerCase()) ||
    (contracts.find(c => c.id === po.contractId)?.code || '').toLowerCase().includes(poFilter.toLowerCase())
  );

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Federal Purchase Orders Registry (CO Concern)</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            Digitize incoming orders with custom price overrides, run compliance validation audits, and manage shipment status.
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          Digitize Purchase Order
        </button>
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

      {/* Spacious Search bar */}
      <div className="box-card" style={{ padding: '16px', marginBottom: '20px' }}>
        <div className="flex-row align-center search-bar-container" style={{ width: '100%' }}>
          <Search size={16} className="search-icon" style={{ left: '16px' }} />
          <input 
            type="text" 
            placeholder="Search by PO Number or Standing Contract Code..." 
            value={poFilter}
            onChange={(e) => setPoFilter(e.target.value)}
            className="search-input"
            style={{ 
              padding: '12px 16px 12px 42px', 
              fontSize: '13px', 
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-light)',
              width: '100%',
              backgroundColor: 'rgba(255,255,255,0.02)'
            }}
          />
        </div>
      </div>

      {/* Main Grid spacious PO listing */}
      <div className="box-card">
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Standing Contract</th>
                <th>Issue Date</th>
                <th>Validation Reason</th>
                <th>Value (Amount)</th>
                <th>Compliance Status</th>
                <th>Operation Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    No digitized purchase orders recorded.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(po => {
                  const contract = contracts.find(c => c.id === po.contractId);
                  const agency = contract ? agencies.find(a => a.id === contract.agencyId) : null;
                  
                  return (
                    <tr key={po.id}>
                      <td>
                        <strong className="cursor-pointer" onClick={() => openDetail(po)} style={{ textDecoration: 'underline', color: 'var(--color-primary)' }}>
                          {po.poNumber}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{contract ? contract.code : 'N/A'}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{agency ? agency.code : 'N/A'}</small>
                      </td>
                      <td>{po.issueDate}</td>
                      <td>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {po.validationReason || 'N/A'}
                        </span>
                      </td>
                      <td><strong>${po.totalAmount.toLocaleString()}</strong></td>
                      <td>
                        <div className="flex-col gap-xxs align-start">
                          <Badge status={po.status} />
                          {po.status === 'INVALID' && po.validationErrors.length > 0 && (
                            <small style={{ color: 'var(--color-danger)', fontSize: '10px' }}>
                              Whitelists Violations ⚠
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex-row gap-xs align-center">
                          <button onClick={() => openDetail(po)} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '6px' }} title="View Detailed Invoice">
                            <Eye size={14} />
                          </button>
                          
                          {po.status === 'PENDING' ? (
                            <button
                              onClick={() => {
                                validatePurchaseOrder(po.id);
                                triggerAlert('success', `Compliance check ran successfully for PO: ${po.poNumber}`);
                              }}
                              className="btn btn-primary"
                              style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)' }}
                            >
                              <Check size={12} />
                              Validate
                            </button>
                          ) : po.status === 'INVALID' ? (
                            <button
                              onClick={() => openRejectionLetter(po)}
                              className="btn btn-warning"
                              style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)' }}
                            >
                              <FileWarning size={12} />
                              Rejection
                            </button>
                          ) : po.status === 'SHIPPED' ? (
                            <button
                              onClick={() => {
                                closeAndArchivePo(po.id);
                                triggerAlert('success', `Purchase order ${po.poNumber} has been successfully closed and archived.`);
                              }}
                              className="btn btn-success"
                              style={{ padding: '6px 10px', fontSize: 'var(--font-size-xs)' }}
                            >
                              <Archive size={12} />
                              Archive
                            </button>
                          ) : (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Verified ✓</span>
                          )}

                          {po.status === 'PENDING' && (
                            <>
                              <button onClick={() => openEdit(po)} className="btn btn-secondary" style={{ padding: '8px', borderRadius: '6px' }} title="Modify Metadata">
                                <Edit2 size={14} style={{ color: 'var(--color-primary)' }} />
                              </button>
                              <button onClick={() => openDelete(po)} className="btn btn-danger" style={{ padding: '8px', borderRadius: '6px' }} title="Delete Digitization">
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

      {/* CREATE MODAL (Spacious size) */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Digitize Incoming Purchase Order Invoice">
        <form onSubmit={onCreateSubmit} className="flex-col gap-md">
          
          <div className="form-section-title">Core Order Metadata</div>
          <div className="grid-cols-3">
            <div className="flex-col gap-xxs">
              <label>PO Number Reference</label>
              <input 
                type="text" 
                placeholder="e.g. PO-FBI-890" 
                value={formData.poNumber} 
                onChange={(e) => setFormData({...formData, poNumber: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xxs">
              <label>Standing Contract</label>
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
            <div className="flex-col gap-xxs">
              <label>Validation Reason (Optional)</label>
              <textarea 
                placeholder="Validation reason or remarks..." 
                value={formData.validationReason} 
                onChange={(e) => setFormData({...formData, validationReason: e.target.value})} 
                style={{ height: '38px', resize: 'none' }}
              />
            </div>
          </div>

          <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            Choose an item and specify quantities. Leave the Custom Price Override field blank to use default catalog pricing.
          </p>
          <div className="flex-col gap-sm" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', padding: '12px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255,255,255,0.01)' }}>
            {formData.items.map((item, idx) => (
              <div key={idx} className="flex-row gap-sm align-center">
                <div className="flex-grow flex-col gap-xxs">
                  <select 
                    value={item.equipmentId} 
                    onChange={(e) => handlePoItemChange(idx, 'equipmentId', e.target.value)} 
                    required
                    style={{ padding: '8px 12px' }}
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
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div className="flex-col gap-xxs" style={{ width: '130px' }}>
                  <input 
                    type="number" 
                    min="1" 
                    placeholder="Custom Price" 
                    value={item.customPrice} 
                    onChange={(e) => handlePoItemChange(idx, 'customPrice', e.target.value)} 
                    style={{ padding: '8px 12px' }}
                    title="Leave blank to use default price"
                  />
                </div>
                {formData.items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removePoItemField(idx)} 
                    className="btn btn-danger"
                    style={{ padding: '8px', borderRadius: '50%' }}
                  >
                    <Trash size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={addPoItemField} 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}
          >
            <PlusCircle size={14} />
            Add Order Line Item
          </button>

          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Digitize Invoice</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Modify Digitization Metadata: ${selectedPo?.poNumber}`}>
        <form onSubmit={onEditSubmit} className="flex-col gap-md">
          
          <div className="form-section-title">Core Order Metadata</div>
          <div className="grid-cols-3">
            <div className="flex-col gap-xxs">
              <label>PO Reference (Locked)</label>
              <input type="text" value={formData.poNumber} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="flex-col gap-xxs">
              <label>Standing Contract</label>
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
            <div className="flex-col gap-xxs">
              <label>Validation Reason</label>
              <textarea 
                value={formData.validationReason} 
                onChange={(e) => setFormData({...formData, validationReason: e.target.value})} 
                style={{ height: '38px', resize: 'none' }}
              />
            </div>
          </div>

          <div className="flex-col gap-sm" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-light)', padding: '12px', borderRadius: 'var(--border-radius-sm)' }}>
            {formData.items.map((item, idx) => (
              <div key={idx} className="flex-row gap-sm align-center">
                <div className="flex-grow flex-col gap-xxs">
                  <select 
                    value={item.equipmentId} 
                    onChange={(e) => handlePoItemChange(idx, 'equipmentId', e.target.value)} 
                    required
                    style={{ padding: '8px 12px' }}
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
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                <div className="flex-col gap-xxs" style={{ width: '130px' }}>
                  <input 
                    type="number" 
                    min="1" 
                    placeholder="Custom Price" 
                    value={item.customPrice} 
                    onChange={(e) => handlePoItemChange(idx, 'customPrice', e.target.value)} 
                    style={{ padding: '8px 12px' }}
                  />
                </div>
                {formData.items.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removePoItemField(idx)} 
                    className="btn btn-danger"
                    style={{ padding: '8px', borderRadius: '50%' }}
                  >
                    <Trash size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button 
            type="button" 
            onClick={addPoItemField} 
            className="btn btn-secondary" 
            style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start' }}
          >
            <PlusCircle size={14} />
            Add Order Line Item
          </button>

          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Update Digitization</button>
          </div>
        </form>
      </Modal>

      {/* HIGH-FIDELITY EXTRA WIDE INVOICE DETAIL VIEW MODAL */}
      <Modal 
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)} 
        title={`Purchase Order Invoice: ${selectedPo?.poNumber}`}
        className="modal-content-wide"
      >
        {selectedPo && (
          <div className="flex-col gap-lg" style={{ fontSize: 'var(--font-size-sm)' }}>
            
            {/* Upper Grid Layout */}
            <div className="grid-cols-2 gap-lg" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              
              {/* Left Column: Consignee & Shipping */}
              <div className="box-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ margin: 0, color: 'var(--color-primary)', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                  Purchase Order Specifications
                </h4>

                <div className="flex-row align-start gap-sm">
                  <Calendar size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date Digitized:</strong>
                    <span>{selectedPo.issueDate}</span>
                  </div>
                </div>

                <div className="flex-row align-start gap-sm">
                  <ShieldCheck size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Validation Reason:</strong>
                    <span>{selectedPo.validationReason || 'None'}</span>
                  </div>
                </div>
                
                <div className="flex-row align-start gap-sm">
                  <Archive size={18} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Archive Code:</strong>
                    <span>{selectedPo.archiveCode || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Invoice items & totals */}
              <div className="flex-col gap-md">
                <div className="box-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)' }}>
                  <h4 style={{ margin: '0 0 14px 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px' }}>
                    Itemized Billing Charges
                  </h4>
                  <div className="flex-col gap-sm">
                    {selectedPo.items.map((item, idx) => {
                      const eq = equipment.find(e => e.id === item.equipmentId);
                      const hasPriceOverride = item.price !== item.catalogPrice;
                      return (
                        <div key={idx} className="flex-col gap-xxs" style={{ borderBottom: '1px dashed var(--border-light)', paddingBottom: '8px' }}>
                          <div className="flex-row justify-between align-center">
                            <span><strong>{eq ? eq.code : `#${item.equipmentId}`}</strong> - {eq ? eq.name : 'Unknown Equipment'}</span>
                            <strong>${(item.price * item.quantity).toLocaleString()}</strong>
                          </div>
                          <div className="flex-row justify-between" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span>Qty: x{item.quantity}</span>
                            <span>
                              {hasPriceOverride ? (
                                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                                  Custom Price: ${item.price.toLocaleString()} (Catalog: ${item.catalogPrice.toLocaleString()})
                                </span>
                              ) : (
                                `Unit Price: $${item.price.toLocaleString()}`
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex-row justify-between align-center" style={{ marginTop: '20px', borderTop: '2px solid var(--border-medium)', paddingTop: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Grand PO Total Value:</span>
                    <strong style={{ fontSize: '18px', color: 'var(--color-secondary)' }}>
                      ${selectedPo.totalAmount.toLocaleString()}
                    </strong>
                  </div>
                </div>

                {/* Status indicator blocks */}
                <div className="box-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="flex-col">
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>PO STATUS:</span>
                    <div style={{ marginTop: '4px' }}><Badge status={selectedPo.status} /></div>
                  </div>
                  <div className="flex-col align-end">
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700 }}>PRIORITY:</span>
                    <span className={`priority-tag priority-${(selectedPo.priority || 'MEDIUM').toLowerCase()}`} style={{ marginTop: '4px' }}>
                      {selectedPo.priority || 'MEDIUM'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Visual Lifecycle timeline history tracker */}
            <div className="box-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-light)' }}>
              <h4 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} style={{ color: 'var(--color-primary)' }} /> 
                Lifecycle Audit status history tracking timeline (SRP Compliance)
              </h4>
              <div className="timeline-container">
                {selectedPo.statusHistory?.map((hist, idx) => {
                  let statusClass = 'success';
                  if (hist.action.includes('FAIL') || hist.action.includes('SHORTAGE') || hist.action.includes('REJECTED')) {
                    statusClass = 'danger';
                  }
                  return (
                    <div key={idx} className={`timeline-node ${statusClass}`}>
                      <div className="timeline-meta">
                        {hist.timestamp} • {hist.action} • OPERATOR: {hist.user}
                      </div>
                      <div className="timeline-comment">{hist.comment}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>
              Close specifications
            </button>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM */}
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
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg)', border: '1px dashed var(--border-light)' }}>
              <div className="flex-row justify-between" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedLetter.letterNumber || 'REJ-DRAFT'}</span>
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
                <span>Created By: {selectedLetter.createdBy}</span>
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
