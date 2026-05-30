import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Plus, Edit2, Trash2, Eye, ShieldAlert, Check, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ManageAgencies() {
  const { agencies, handleCreateAgency, handleUpdateAgency, handleDeleteAgency, toggleAgencyStatus } = useAppData();
  const { currentUser } = useAuth();

  const isCo = currentUser?.role === ROLES.CONTRACTING_OFFICER;

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Active records state
  const [selectedAgency, setSelectedAgency] = useState(null);

  // System notification alert state
  const [systemAlert, setSystemAlert] = useState({ type: '', message: '' });

  const triggerAlert = (type, message) => {
    setSystemAlert({ type, message });
    setTimeout(() => {
      setSystemAlert({ type: '', message: '' });
    }, 4500);
  };

  // Forms state
  const [formData, setFormData] = useState({ code: '', name: '', address: '', contact: '', phone: '', email: '', jobTitle: '' });

  const openCreate = () => {
    setFormData({ code: '', name: '', address: '', contact: '', phone: '', email: '', jobTitle: '' });
    setShowCreateModal(true);
  };

  const openEdit = (agency) => {
    setSelectedAgency(agency);
    setFormData({
      code: agency.code,
      name: agency.name,
      address: agency.address || '',
      contact: agency.contact || '',
      phone: agency.phone || '',
      email: agency.email || '',
      jobTitle: agency.jobTitle || ''
    });
    setShowEditModal(true);
  };

  const openDetail = (agency) => {
    setSelectedAgency(agency);
    setShowDetailModal(true);
  };

  const openDelete = (agency) => {
    setSelectedAgency(agency);
    setShowDeleteConfirm(true);
  };

  const onCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.address || !formData.contact || !formData.phone || !formData.email || !formData.jobTitle) {
      triggerAlert('danger', 'Error: All agency registration fields are required.');
      return;
    }
    try {
      await handleCreateAgency(formData);
      setShowCreateModal(false);
      triggerAlert('success', `Agency profile ${formData.code} has been successfully registered!`);
    } catch (err) {
      triggerAlert('danger', `Failed to register agency: ${err.message}`);
    }
  };

  const onEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgency || !formData.name || !formData.address || !formData.contact || !formData.phone || !formData.email || !formData.jobTitle) {
      triggerAlert('danger', 'Error: All fields must be filled to update.');
      return;
    }
    try {
      await handleUpdateAgency(selectedAgency.id, formData);
      setShowEditModal(false);
      triggerAlert('success', `Agency profile ${formData.code} has been successfully updated.`);
    } catch (err) {
      triggerAlert('danger', `Failed to update agency: ${err.message}`);
    }
  };

  const onDeleteConfirm = async () => {
    if (!selectedAgency) return;
    const code = selectedAgency.code;
    try {
      await handleDeleteAgency(selectedAgency.id);
      setShowDeleteConfirm(false);
      triggerAlert('success', `Agency profile ${code} was successfully destroyed.`);
    } catch (err) {
      triggerAlert('danger', `Failed to delete agency: ${err.message}`);
    }
  };

  if (!isCo) {
    return (
      <div className="flex-col align-center justify-center" style={{ minHeight: '60vh', gap: '16px' }}>
        <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', padding: '24px', borderRadius: 'var(--border-radius-lg)', textAlign: 'center', maxWidth: '450px' }}>
          <ShieldAlert size={48} style={{ margin: '0 auto 12px auto' }} />
          <h3>Access Level Restrict</h3>
          <p style={{ fontSize: 'var(--font-size-sm)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            This page is strictly reserved for **Contracting Officers** to manage official Federal Agency profiles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <div>
          <h2>Federal Agencies Directories (CO Concern)</h2>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Perform comprehensive profile registrations and whitelists access audits.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={16} />
          Register New Agency
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

      <div className="box-card">
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Agency Name</th>
                <th>Contact Representative</th>
                <th>Email & Telecommunications</th>
                <th>Active Status</th>
                <th>Operation Actions</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.code}</strong></td>
                  <td className="text-wrap">
                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{a.address}</small>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.contact}</div>
                    {a.jobTitle && <small style={{ color: 'var(--text-muted)', display: 'block' }}>{a.jobTitle}</small>}
                  </td>
                  <td>
                    <div>{a.email}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{a.phone}</small>
                  </td>
                  <td><Badge status={a.status} /></td>
                  <td>
                    <div className="flex-row gap-xs align-center">
                      <button onClick={() => openDetail(a)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="View Specifications">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => openEdit(a)} className="btn btn-secondary" style={{ padding: '6px', borderRadius: '6px' }} title="Modify profile">
                        <Edit2 size={14} style={{ color: 'var(--color-primary)' }} />
                      </button>
                      <button 
                        onClick={() => {
                          toggleAgencyStatus(a.id);
                          triggerAlert('success', `Agency ${a.code} status toggled successfully.`);
                        }} 
                        className={`btn ${a.status === 'ACTIVE' ? 'btn-secondary' : 'btn-primary'}`} 
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        {a.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => openDelete(a)} className="btn btn-danger" style={{ padding: '6px', borderRadius: '6px' }} title="Delete Agency">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Register New Federal Agency Profile">
        <form onSubmit={onCreateSubmit} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Agency Code</label>
              <input 
                type="text" 
                placeholder="e.g. FBI-GSC" 
                value={formData.code} 
                onChange={(e) => setFormData({...formData, code: e.target.value})} 
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Agency Corporate Name</label>
              <input 
                type="text" 
                placeholder="e.g. Federal Bureau of Investigation" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="flex-col gap-xs">
            <label>Physical HQ Address</label>
            <input 
              type="text" 
              placeholder="e.g. 935 Pennsylvania Avenue NW, D.C." 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
              required
            />
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Corporate Contact Person Name</label>
              <input 
                type="text" 
                placeholder="e.g. Agent Miller" 
                value={formData.contact} 
                onChange={(e) => setFormData({...formData, contact: e.target.value})} 
                required
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Representative Position / Job Title</label>
              <input 
                type="text" 
                placeholder="e.g. Contracting Officer" 
                value={formData.jobTitle} 
                onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} 
                required
              />
            </div>
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Phone Number</label>
              <input 
                type="text" 
                placeholder="e.g. 202-324-3000" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                required
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Secure Corporate Email</label>
              <input 
                type="email" 
                placeholder="e.g. j.miller@fbi.gov" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required
              />
            </div>
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Agency</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={`Modify Profile: ${selectedAgency?.code}`}>
        <form onSubmit={onEditSubmit} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Agency Code (Locked)</label>
              <input type="text" value={formData.code} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="flex-col gap-xs">
              <label>Agency Corporate Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
          </div>
          <div className="flex-col gap-xs">
            <label>Physical HQ Address</label>
            <input 
              type="text" 
              value={formData.address} 
              onChange={(e) => setFormData({...formData, address: e.target.value})} 
              required
            />
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Corporate Contact Person Name</label>
              <input 
                type="text" 
                value={formData.contact} 
                onChange={(e) => setFormData({...formData, contact: e.target.value})} 
                required
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Representative Position / Job Title</label>
              <input 
                type="text" 
                value={formData.jobTitle} 
                onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} 
                required
              />
            </div>
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Phone Number</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                required
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Secure Corporate Email</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                required
              />
            </div>
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Update Profile</button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAIL MODAL */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Agency Profile Details: ${selectedAgency?.code}`}>
        {selectedAgency && (
          <div className="flex-col gap-md" style={{ fontSize: 'var(--font-size-sm)' }}>
            <div className="box-card" style={{ backgroundColor: 'var(--card-bg-subtle)', border: '1px solid var(--border-light)' }}>
              <div className="grid-cols-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '150px 1fr', rowGap: '12px' }}>
                <strong>Agency Code:</strong>
                <span>{selectedAgency.code}</span>

                <strong>Corporate Name:</strong>
                <strong>{selectedAgency.name}</strong>

                <strong>HQ Address:</strong>
                <span>{selectedAgency.address || 'N/A'}</span>

                <strong>Contact Person:</strong>
                <span>{selectedAgency.contact || 'N/A'}</span>

                <strong>Representative Position:</strong>
                <span>{selectedAgency.jobTitle || 'N/A'}</span>

                <strong>Phone Link:</strong>
                <span>{selectedAgency.phone || 'N/A'}</span>

                <strong>Secure Email:</strong>
                <span>{selectedAgency.email || 'N/A'}</span>

                <strong>Status Badge:</strong>
                <div><Badge status={selectedAgency.status} /></div>
              </div>
            </div>
            <button type="button" onClick={() => setShowDetailModal(false)} className="btn btn-secondary" style={{ alignSelf: 'flex-end' }}>Close Specifications</button>
          </div>
        )}
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Confirm Profile Destruction">
        <div className="flex-col gap-md">
          <div className="flex-row align-start gap-sm warning-alert">
            <ShieldAlert size={20} />
            <span>
              Are you absolutely sure you want to delete profile <strong>{selectedAgency?.code}</strong>? This action will break and invalidate any associated standing contracts!
            </span>
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '8px' }}>
            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={onDeleteConfirm} className="btn btn-danger">Confirm Destruction</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
