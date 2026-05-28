import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Plus, Edit2, Trash2, Eye, ShieldAlert, RefreshCw, AlertTriangle, CheckCircle, X } from 'lucide-react';

export default function StockAdjustment() {
  const { 
    equipment, exceptionReports, 
    handleStockAdjustment, handleCreateEquipment, handleUpdateEquipment, handleDeleteEquipment 
  } = useAppData();
  const { currentUser } = useAuth();

  const isWarehouse = currentUser?.role === ROLES.WAREHOUSE_STAFF;

  // Modals state
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Active records state
  const [selectedEq, setSelectedEq] = useState(null);

  // System notification alert state
  const [systemAlert, setSystemAlert] = useState({ type: '', message: '' });

  const triggerAlert = (type, message) => {
    setSystemAlert({ type, message });
    setTimeout(() => {
      setSystemAlert({ type: '', message: '' });
    }, 4500);
  };

  // Forms state
  const [adjustData, setAdjustData] = useState({ equipmentId: '', quantity: '', operation: 'INCREASE', note: '' });
  const [formData, setFormData] = useState({ code: '', name: '', price: '', stock: '', minStock: '', manufacturer: '', hardwareConfig: '' });

  const openAdjust = (eq) => {
    setAdjustData({ equipmentId: eq.id.toString(), quantity: '', operation: 'INCREASE', note: '' });
    setSelectedEq(eq);
    setShowAdjustModal(true);
  };

  const openCreate = () => {
    setFormData({ code: '', name: '', price: '', stock: '', minStock: '', manufacturer: '', hardwareConfig: '' });
    setShowCreateModal(true);
  };

  const openEdit = (eq) => {
    setSelectedEq(eq);
    setFormData({
      code: eq.code,
      name: eq.name,
      price: eq.price.toString(),
      stock: eq.stock.toString(),
      minStock: eq.minStock.toString(),
      manufacturer: eq.manufacturer || '',
      hardwareConfig: eq.hardwareConfig || ''
    });
    setShowEditModal(true);
  };

  const openDetail = (eq) => {
    setSelectedEq(eq);
    setShowDetailModal(true);
  };

  const openDelete = (eq) => {
    setSelectedEq(eq);
    setShowDeleteConfirm(true);
  };

  const onAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustData.equipmentId || !adjustData.quantity) return;
    handleStockAdjustment(adjustData);
    setShowAdjustModal(false);
    const eqName = equipment.find(eq => eq.id.toString() === adjustData.equipmentId)?.code || 'item';
    triggerAlert('success', `Stock adjusted successfully for ${eqName} (${adjustData.operation === 'INCREASE' ? '+' : '-'}${adjustData.quantity}).`);
  };

  const onCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.price || !formData.stock || !formData.manufacturer || !formData.hardwareConfig) {
      triggerAlert('danger', 'Error: All creation fields are required.');
      return;
    }
    // Enforce unique item code
    const isDuplicate = equipment.some(eq => eq.code.toUpperCase() === formData.code.toUpperCase());
    if (isDuplicate) {
      triggerAlert('danger', `Error: Equipment item code ${formData.code} already exists.`);
      return;
    }
    const unitPrice = parseFloat(formData.price);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      triggerAlert('danger', 'Error: Unit Price must be a positive number greater than zero.');
      return;
    }
    handleCreateEquipment(formData);
    setShowCreateModal(false);
    triggerAlert('success', `Equipment ${formData.code} added to catalog successfully!`);
  };

  const onEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedEq || !formData.code || !formData.name || !formData.price || !formData.manufacturer || !formData.hardwareConfig) {
      triggerAlert('danger', 'Error: All updating fields are required.');
      return;
    }
    const unitPrice = parseFloat(formData.price);
    if (isNaN(unitPrice) || unitPrice <= 0) {
      triggerAlert('danger', 'Error: Unit Price must be a positive number greater than zero.');
      return;
    }
    handleUpdateEquipment(selectedEq.id, formData);
    setShowEditModal(false);
    triggerAlert('success', `Equipment ${formData.code} specifications updated successfully.`);
  };

  const onDeleteConfirm = () => {
    if (!selectedEq) return;
    const code = selectedEq.code;
    handleDeleteEquipment(selectedEq.id);
    setShowDeleteConfirm(false);
    triggerAlert('success', `Equipment ${code} was purged from catalog.`);
  };

  if (!isWarehouse) {
    return (
      <div className="flex-col align-center justify-center" style={{ minHeight: '60vh', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center', maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 12px auto' }} />
          <h3>Access Level Restrict</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            This page is strictly reserved for **Warehouse Management Staff** to adjust equipment stock levels.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Equipment Catalog & Stock Adjustments (Warehouse Concern)</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Perform physical catalog CRUD modifications and apply stock increments or deductions.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          Add Catalog Item
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

      <div className="box-card" style={{ marginBottom: '32px' }}>
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Equipment Name</th>
                <th>Unit Price</th>
                <th>Current Stock Quantity</th>
                <th>Item Status</th>
                <th>Operation Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map(eq => {
                const isLow = eq.stock < eq.minStock;
                return (
                  <tr key={eq.id}>
                    <td><strong>{eq.code}</strong></td>
                    <td className="text-wrap">
                      <div style={{ fontWeight: 600 }}>{eq.name}</div>
                      {eq.manufacturer && <small style={{ color: 'var(--text-muted)', display: 'block' }}>Mfr: {eq.manufacturer}</small>}
                    </td>
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
                    <td>
                      <div className="flex-row gap-xs align-center">
                        <button onClick={() => openDetail(eq)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="View Catalog Specs">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => openAdjust(eq)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }} title="Adjust Stock levels">
                          <RefreshCw size={12} />
                          Adjust Stock
                        </button>
                        <button onClick={() => openEdit(eq)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="Modify specs">
                          <Edit2 size={14} style={{ color: 'var(--color-primary)' }} />
                        </button>
                        <button onClick={() => openDelete(eq)} className="btn btn-danger" style={{ padding: '6px', borderRadius: '6px' }} title="Delete Catalog item">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exception reports catalog */}
      <div className="box-card">
        <h3>Critical Warehouse Shortage exception logs (UC7)</h3>
        <p className="card-description">Refer to these shortage exception records to initiate cargo procurement requests.</p>
        
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Report Ref</th>
                <th>PO Number</th>
                <th>Reported At</th>
                <th>Reported By</th>
                <th>Deficit Items Log</th>
              </tr>
            </thead>
            <tbody>
              {exceptionReports.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No shortage logs recorded. Inventory levels healthy.</td>
                </tr>
              ) : (
                exceptionReports.map(rep => (
                  <tr key={rep.id}>
                    <td><strong>{rep.reportNumber || `EXP-${rep.id}`}</strong></td>
                    <td><strong>{rep.poNumber}</strong></td>
                    <td>{rep.reportedAt || rep.date}</td>
                    <td>{rep.reportedBy || 'SYSTEM'}</td>
                    <td>
                      <div className="flex-col gap-xs">
                        {rep.shortages.map((s, idx) => (
                          <div key={idx} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
                            ⚠ {s.code} - {s.name}: Requested {s.requested}, Stock {s.available} (Shortfall: -{s.shortage})
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADJUST STOCK LEVEL MODAL */}
      <Modal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} title={`Adjust Stock levels: ${selectedEq?.code}`}>
        <form onSubmit={onAdjustSubmit} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Operation Type</label>
              <select 
                value={adjustData.operation} 
                onChange={(e) => setAdjustData({...adjustData, operation: e.target.value})} 
                required
              >
                <option value="INCREASE">Increase Stock (+)</option>
                <option value="DECREASE">Deduct Stock (-)</option>
              </select>
            </div>
            <div className="flex-col gap-xs">
              <label>Adjust Quantity</label>
              <input 
                type="number" 
                min="1" 
                placeholder="Adjust margin" 
                value={adjustData.quantity} 
                onChange={(e) => setAdjustData({...adjustData, quantity: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="flex-col gap-xs">
            <label>Adjustment Reason/Note (UC3 Requirement)</label>
            <input 
              type="text" 
              placeholder="e.g. Received cargo container, damaged inventory deduction" 
              value={adjustData.note} 
              onChange={(e) => setAdjustData({...adjustData, note: e.target.value})} 
              required
            />
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowAdjustModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Apply Stock Change</button>
          </div>
        </form>
      </Modal>

      {/* CREATE CATALOG MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Equipment to Catalog">
        <form onSubmit={onCreateSubmit} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Equipment Code</label>
              <input 
                type="text" 
                placeholder="e.g. EQ-SAT-05" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Equipment Name</label>
              <input 
                type="text" 
                placeholder="e.g. Satellite Encryption receiver" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Manufacturer</label>
              <input 
                type="text" 
                placeholder="e.g. Raytheon Systems" 
                value={formData.manufacturer} 
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Hardware Configuration Details</label>
              <input 
                type="text" 
                placeholder="e.g. AES-256 core decryption engine" 
                value={formData.hardwareConfig} 
                onChange={(e) => setFormData({...formData, hardwareConfig: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="grid-cols-3">
            <div className="flex-col gap-xs">
              <label>Unit Price ($)</label>
              <input 
                type="number" 
                placeholder="Price value" 
                min="1"
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Initial Stock</label>
              <input 
                type="number" 
                placeholder="Stock quantity" 
                min="0"
                value={formData.stock} 
                onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Min Stock Threshold</label>
              <input 
                type="number" 
                placeholder="Min cap value" 
                min="1"
                value={formData.minStock} 
                onChange={(e) => setFormData({...formData, minStock: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Add to Catalog</button>
          </div>
        </form>
      </Modal>

      {/* EDIT SPEC MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Modify Specifications: ${selectedEq?.code}`}>
        <form onSubmit={onEditSubmit} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Equipment Code (Locked)</label>
              <input 
                type="text" 
                value={formData.code} 
                disabled 
                style={{ opacity: 0.6 }} 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Equipment Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Manufacturer</label>
              <input 
                type="text" 
                value={formData.manufacturer} 
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Hardware Configuration Details</label>
              <input 
                type="text" 
                value={formData.hardwareConfig} 
                onChange={(e) => setFormData({...formData, hardwareConfig: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="grid-cols-3">
            <div className="flex-col gap-xs">
              <label>Unit Price ($)</label>
              <input 
                type="number" 
                min="1"
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Current Stock (Locked)</label>
              <input type="number" value={formData.stock} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="flex-col gap-xs">
              <label>Min Stock Threshold</label>
              <input 
                type="number" 
                min="1"
                value={formData.minStock} 
                onChange={(e) => setFormData({...formData, minStock: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Update Catalog</button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAIL SPEC MODAL */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Catalog item Specifications: ${selectedEq?.code}`}>
        {selectedEq && (
          <div className="flex-col gap-md" style={{ fontSize: 'var(--font-size-sm)' }}>
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div className="grid-cols-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: '12px' }}>
                <strong>Equipment Code:</strong>
                <span>{selectedEq.code}</span>

                <strong>Equipment Name:</strong>
                <strong>{selectedEq.name}</strong>

                <strong>Manufacturer:</strong>
                <span>{selectedEq.manufacturer || 'N/A'}</span>

                <strong>Hardware Config:</strong>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)' }}>{selectedEq.hardwareConfig || 'N/A'}</span>

                <strong>Unit Price:</strong>
                <span>${selectedEq.price.toLocaleString()}</span>

                <strong>Current Stock:</strong>
                <span>{selectedEq.stock} units</span>

                <strong>Min Cap Threshold:</strong>
                <span>{selectedEq.minStock} units</span>

                <strong>Item Status:</strong>
                <div><Badge status={selectedEq.status} /></div>
              </div>
            </div>
            <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>Close specs</button>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Purge Catalog Specifications Record">
        <div className="flex-col gap-md">
          <div className="flex-row align-start gap-sm warning-alert">
            <ShieldAlert size={20} />
            <span>
              Are you absolutely sure you want to purge catalog item <strong>{selectedEq?.code}</strong>? This action is permanent and will break whitelists on active contracts!
            </span>
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '8px' }}>
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={onDeleteConfirm} className="btn btn-danger">Confirm purges</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
