import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Plus, Edit2, Trash2, Eye, ShieldAlert, Award } from 'lucide-react';

export default function ManageContracts() {
  const { 
    contracts, agencies, equipment, 
    handleCreateContract, handleUpdateContract, handleDeleteContract 
  } = useAppData();
  const { currentUser } = useAuth();

  const isCo = currentUser?.role === ROLES.CONTRACTING_OFFICER;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Active records state
  const [selectedContract, setSelectedContract] = useState(null);

  // Forms state
  const [formData, setFormData] = useState({ agencyId: '', code: '', costLimit: '', endDate: '', allowedEquipment: [] });

  const openCreate = () => {
    setFormData({ agencyId: '', code: '', costLimit: '', endDate: '', allowedEquipment: [] });
    setShowCreateModal(true);
  };

  const openEdit = (contract) => {
    setSelectedContract(contract);
    setFormData({
      agencyId: contract.agencyId.toString(),
      code: contract.code,
      costLimit: contract.costLimit.toString(),
      endDate: contract.endDate || '',
      allowedEquipment: [...contract.allowedEquipment]
    });
    setShowEditModal(true);
  };

  const openDetail = (contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  };

  const openDelete = (contract) => {
    setSelectedContract(contract);
    setShowDeleteConfirm(true);
  };

  const onCreateSubmit = (e) => {
    e.preventDefault();
    if (!formData.agencyId || !formData.code || !formData.costLimit) return;
    handleCreateContract(formData);
    setShowCreateModal(false);
  };

  const onEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedContract || !formData.code || !formData.costLimit) return;
    handleUpdateContract(selectedContract.id, formData);
    setShowEditModal(false);
  };

  const onDeleteConfirm = () => {
    if (!selectedContract) return;
    handleDeleteContract(selectedContract.id);
    setShowDeleteConfirm(false);
  };

  const toggleEquipmentInWhitelist = (eqId, isEdit = false) => {
    const parsedId = parseInt(eqId);
    setFormData(prev => {
      const allowed = prev.allowedEquipment.includes(parsedId)
        ? prev.allowedEquipment.filter(id => id !== parsedId)
        : [...prev.allowedEquipment, parsedId];
      return { ...prev, allowedEquipment: allowed };
    });
  };

  if (!isCo) {
    return (
      <div className="flex-col align-center justify-center" style={{ minHeight: '60vh', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center', maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 12px auto' }} />
          <h3>Access Level Restrict</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            This page is strictly reserved for **Contracting Officers** to manage federal standing contracts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Standing Contracts Registry (CO Concern)</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Regulate budget ceilings, expiration timelines, and equipment whitelist allocations.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          Issue New Contract
        </button>
      </div>

      <div className="box-card">
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Contract Code</th>
                <th>Federal Agency</th>
                <th>Cost Limit</th>
                <th>Spent Value Progress</th>
                <th>Expiration Date</th>
                <th>Whitelisted Items</th>
                <th>Operation Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No standing contracts issued.</td>
                </tr>
              ) : (
                contracts.map(c => {
                  const agency = agencies.find(a => a.id === c.agencyId);
                  const today = new Date().toISOString().slice(0, 10);
                  const isExpired = c.endDate < today;
                  const progressPercent = Math.min(100, (c.spent / c.costLimit) * 100);

                  return (
                    <tr key={c.id}>
                      <td><strong>{c.code}</strong></td>
                      <td><strong>{agency ? agency.code : `ID: ${c.agencyId}`}</strong></td>
                      <td>${c.costLimit.toLocaleString()}</td>
                      <td>
                        <div className="flex-col gap-xs" style={{ minWidth: '120px' }}>
                          <div className="flex-row justify-between" style={{ fontSize: '11px', fontWeight: 600 }}>
                            <span>${c.spent.toLocaleString()}</span>
                            <span>{progressPercent.toFixed(1)}%</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div 
                              className="progress-bar-fill" 
                              style={{ 
                                width: `${progressPercent}%`,
                                backgroundColor: progressPercent > 90 ? 'var(--color-danger)' : progressPercent > 70 ? 'var(--color-warning)' : 'var(--color-success)'
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: isExpired ? 'var(--color-danger)' : 'inherit', fontWeight: isExpired ? 700 : 'inherit' }}>
                        {c.endDate} {isExpired && '⚠️'}
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '10px' }}>
                          {c.allowedEquipment.length} Catalog Items
                        </span>
                      </td>
                      <td>
                        <div className="flex-row gap-xs align-center">
                          <button onClick={() => openDetail(c)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="View Catalog Whitelist">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => openEdit(c)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="Modify Specifications">
                            <Edit2 size={14} style={{ color: 'var(--color-primary)' }} />
                          </button>
                          <button onClick={() => openDelete(c)} className="btn btn-danger" style={{ padding: '6px', borderRadius: '6px' }} title="Delete Contract">
                            <Trash2 size={14} />
                          </button>
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
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Issue Standing Contract Whitelist">
        <form onSubmit={onCreateSubmit} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Select active Agency</label>
              <select 
                value={formData.agencyId} 
                onChange={(e) => setFormData({...formData, agencyId: e.target.value})} 
                required
              >
                <option value="">-- Choose Agency --</option>
                {agencies.filter(a => a.status === 'ACTIVE').map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-col gap-xs">
              <label>Contract Registry Code</label>
              <input 
                type="text" 
                placeholder="e.g. GSC-FBI-2026" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Cost Limit Budget ($)</label>
              <input 
                type="number" 
                placeholder="Budget cap limit" 
                value={formData.costLimit} 
                onChange={(e) => setFormData({...formData, costLimit: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Expiration Date</label>
              <input 
                type="date" 
                value={formData.endDate} 
                onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex-col gap-xs">
            <label>Whitelisting Allowed Equipment Catalog</label>
            <div className="grid-cols-2" style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-sm)', padding: '10px', backgroundColor: 'var(--card-bg-subtle)' }}>
              {equipment.map(eq => (
                <label key={eq.id} className="flex-row align-center gap-xs cursor-pointer" style={{ padding: '4px 0', fontSize: 'var(--font-size-sm)' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.allowedEquipment.includes(eq.id)}
                    onChange={() => toggleEquipmentInWhitelist(eq.id)}
                  />
                  <span>{eq.code} - {eq.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Standing Contract</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Modify Standing Contract: ${selectedContract?.code}`}>
        <form onSubmit={onEditSubmit} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Governing Agency (Locked)</label>
              <select value={formData.agencyId} disabled style={{ opacity: 0.6 }}>
                {agencies.map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-col gap-xs">
              <label>Contract Code</label>
              <input 
                type="text" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Cost Limit Budget ($)</label>
              <input 
                type="number" 
                value={formData.costLimit} 
                onChange={(e) => setFormData({...formData, costLimit: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Expiration Date</label>
              <input 
                type="date" 
                value={formData.endDate} 
                onChange={(e) => setFormData({...formData, endDate: e.target.value})} 
              />
            </div>
          </div>

          <div className="flex-col gap-xs">
            <label>Whitelisting Allowed Equipment Catalog</label>
            <div className="grid-cols-2" style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-sm)', padding: '10px', backgroundColor: 'var(--card-bg-subtle)' }}>
              {equipment.map(eq => (
                <label key={eq.id} className="flex-row align-center gap-xs cursor-pointer" style={{ padding: '4px 0', fontSize: 'var(--font-size-sm)' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.allowedEquipment.includes(eq.id)}
                    onChange={() => toggleEquipmentInWhitelist(eq.id)}
                  />
                  <span>{eq.code} - {eq.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Update Standing Contract</button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAIL MODAL */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Standing Contract Specifications: ${selectedContract?.code}`}>
        {selectedContract && (
          <div className="flex-col gap-md" style={{ fontSize: 'var(--font-size-sm)' }}>
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div className="grid-cols-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: '12px' }}>
                <strong>Contract Code:</strong>
                <span>{selectedContract.code}</span>

                <strong>Partner Agency:</strong>
                <span>{agencies.find(a => a.id === selectedContract.agencyId)?.name || 'N/A'}</span>

                <strong>Cost Limit Allocation:</strong>
                <strong>${selectedContract.costLimit.toLocaleString()}</strong>

                <strong>Executed Spent:</strong>
                <span>${selectedContract.spent.toLocaleString()} ({((selectedContract.spent / selectedContract.costLimit) * 100).toFixed(1)}% usage)</span>

                <strong>Expiry Date:</strong>
                <span>{selectedContract.endDate}</span>

                <strong>Status Badge:</strong>
                <div><Badge status={selectedContract.status} /></div>
              </div>
            </div>

            <div className="box-card">
              <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}><Award size={18} style={{ color: 'var(--color-primary)' }} /> Whitelisted Equipment Catalog:</h4>
              <div className="flex-col gap-xs">
                {selectedContract.allowedEquipment.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>No catalog items whitelisted yet.</span>
                ) : (
                  selectedContract.allowedEquipment.map(eqId => {
                    const eq = equipment.find(e => e.id === eqId);
                    return (
                      <div key={eqId} className="flex-row justify-between align-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                        <span>• <strong>{eq ? eq.code : eqId}</strong> - {eq ? eq.name : 'Unknown Item'}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Unit Price: ${eq ? eq.price.toLocaleString() : 'N/A'}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>Close Specifications</button>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirm Standing Contract Annulment">
        <div className="flex-col gap-md">
          <div className="flex-row align-start gap-sm warning-alert">
            <ShieldAlert size={20} />
            <span>
              Are you absolutely sure you want to annul contract <strong>{selectedContract?.code}</strong>? This operation is permanent and all whitelisting rules will be purged!
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
