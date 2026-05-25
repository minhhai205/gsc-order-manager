import React, { useState } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth, ROLES } from '../contexts/AuthContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Plus, ToggleLeft, ToggleRight, Info } from 'lucide-react';

export default function AgenciesContracts() {
  const { agencies, contracts, equipment, handleCreateAgency, toggleAgencyStatus, handleCreateContract } = useAppData();
  const { currentUser } = useAuth();
  const role = currentUser?.role;

  const isCoOrAdmin = role === ROLES.CONTRACTING_OFFICER || role === ROLES.SYSTEM_ADMIN;

  // Modals state
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  // Forms state
  const [newAgency, setNewAgency] = useState({ code: '', name: '', address: '', contact: '', phone: '', email: '' });
  const [newContract, setNewContract] = useState({ agencyId: '', code: '', costLimit: '', endDate: '', allowedEquipment: [] });

  const onSubmitAgency = (e) => {
    e.preventDefault();
    if (!newAgency.code || !newAgency.name) return;
    handleCreateAgency(newAgency);
    setNewAgency({ code: '', name: '', address: '', contact: '', phone: '', email: '' });
    setShowAgencyModal(false);
  };

  const onSubmitContract = (e) => {
    e.preventDefault();
    if (!newContract.agencyId || !newContract.code || !newContract.costLimit) return;
    handleCreateContract(newContract);
    setNewContract({ agencyId: '', code: '', costLimit: '', endDate: '', allowedEquipment: [] });
    setShowContractModal(false);
  };

  const toggleEquipmentInWhitelist = (eqId) => {
    const parsedId = parseInt(eqId);
    setNewContract(prev => {
      const allowed = prev.allowedEquipment.includes(parsedId)
        ? prev.allowedEquipment.filter(id => id !== parsedId)
        : [...prev.allowedEquipment, parsedId];
      return { ...prev, allowedEquipment: allowed };
    });
  };

  return (
    <div>
      <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
        <h2>Federal Agencies & Standing Contracts</h2>
        {isCoOrAdmin && (
          <div className="flex-row gap-sm">
            <button onClick={() => setShowAgencyModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              New Agency
            </button>
            <button onClick={() => setShowContractModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              New Contract
            </button>
          </div>
        )}
      </div>

      {/* Agencies registry */}
      <div className="box-card" style={{ marginBottom: '32px' }}>
        <h3>Federal Agencies Profiles (UC1)</h3>
        <p className="card-description">Register and manage official profiles of partner departments.</p>
        
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Agency Name</th>
                <th>Contact</th>
                <th>Email / Phone</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map(a => (
                <tr key={a.id}>
                  <td><strong>{a.code}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.name}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{a.address}</small>
                  </td>
                  <td>{a.contact}</td>
                  <td>
                    <div>{a.email}</div>
                    <small style={{ color: 'var(--text-muted)' }}>{a.phone}</small>
                  </td>
                  <td><Badge status={a.status} /></td>
                  <td>
                    <button 
                      onClick={() => toggleAgencyStatus(a.id)}
                      className={`btn ${a.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                      style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
                      disabled={!isCoOrAdmin}
                    >
                      {a.status === 'ACTIVE' ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                      {a.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contracts whitelist */}
      <div className="box-card">
        <h3>Standing Contracts Whitelisting (UC2)</h3>
        <p className="card-description">Standing contracts govern budget caps, timelines, and allowlists for catalog items.</p>
        
        <div className="table-container">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Contract Code</th>
                <th>Agency</th>
                <th>Cost Limit</th>
                <th>Spent Progress</th>
                <th>Expiration Date</th>
                <th>Allowed Equipment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map(c => {
                const agency = agencies.find(a => a.id === c.agencyId);
                const today = new Date().toISOString().slice(0, 10);
                const isExpired = c.endDate < today;
                const progressPercent = Math.min(100, (c.spent / c.costLimit) * 100);

                return (
                  <tr key={c.id}>
                    <td><strong>{c.code}</strong></td>
                    <td>{agency ? agency.code : 'N/A'}</td>
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
                      <div className="flex-row gap-xs wrap">
                        {c.allowedEquipment.map(eqId => {
                          const eq = equipment.find(e => e.id === eqId);
                          return (
                            <span key={eqId} className="badge badge-info" style={{ fontSize: '10px' }}>
                              {eq ? eq.code : eqId}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td>
                      <Badge status={isExpired ? 'EXPIRED' : c.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW AGENCY MODAL */}
      <Modal isOpen={showAgencyModal} onClose={() => setShowAgencyModal(false)} title="Register New Federal Agency">
        <form onSubmit={onSubmitAgency} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Agency Code</label>
              <input 
                type="text" 
                placeholder="e.g. FBI-GSC"
                value={newAgency.code}
                onChange={(e) => setNewAgency({...newAgency, code: e.target.value})}
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Agency Name</label>
              <input 
                type="text" 
                placeholder="e.g. Federal Bureau of Investigation"
                value={newAgency.name}
                onChange={(e) => setNewAgency({...newAgency, name: e.target.value})}
                required 
              />
            </div>
          </div>
          <div className="flex-col gap-xs">
            <label>Physical Address</label>
            <input 
              type="text" 
              placeholder="Full address"
              value={newAgency.address}
              onChange={(e) => setNewAgency({...newAgency, address: e.target.value})}
            />
          </div>
          <div className="flex-col gap-xs">
            <label>Contact Person Name</label>
            <input 
              type="text" 
              placeholder="e.g. Agent Miller"
              value={newAgency.contact}
              onChange={(e) => setNewAgency({...newAgency, contact: e.target.value})}
            />
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Phone Number</label>
              <input 
                type="text" 
                placeholder="Phone"
                value={newAgency.phone}
                onChange={(e) => setNewAgency({...newAgency, phone: e.target.value})}
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Official Email</label>
              <input 
                type="email" 
                placeholder="Email address"
                value={newAgency.email}
                onChange={(e) => setNewAgency({...newAgency, email: e.target.value})}
              />
            </div>
          </div>
          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowAgencyModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Agency</button>
          </div>
        </form>
      </Modal>

      {/* NEW CONTRACT MODAL */}
      <Modal isOpen={showContractModal} onClose={() => setShowContractModal(false)} title="Issue Standing Contract">
        <form onSubmit={onSubmitContract} className="flex-col gap-md">
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Select Agency</label>
              <select 
                value={newContract.agencyId}
                onChange={(e) => setNewContract({...newContract, agencyId: e.target.value})}
                required
              >
                <option value="">-- Choose Agency --</option>
                {agencies.filter(a => a.status === 'ACTIVE').map(a => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-col gap-xs">
              <label>Contract Code</label>
              <input 
                type="text" 
                placeholder="e.g. GSC-FBI-2026"
                value={newContract.code}
                onChange={(e) => setNewContract({...newContract, code: e.target.value})}
                required 
              />
            </div>
          </div>
          <div className="grid-cols-2">
            <div className="flex-col gap-xs">
              <label>Cost Limit ($)</label>
              <input 
                type="number" 
                placeholder="Limit budget"
                value={newContract.costLimit}
                onChange={(e) => setNewContract({...newContract, costLimit: e.target.value})}
                required 
              />
            </div>
            <div className="flex-col gap-xs">
              <label>Expiration Date</label>
              <input 
                type="date" 
                value={newContract.endDate}
                onChange={(e) => setNewContract({...newContract, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="flex-col gap-xs">
            <label>Equipment Allist (Select Whitelisted Equipment)</label>
            <div className="grid-cols-2" style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-sm)', padding: '10px', backgroundColor: 'var(--card-bg-subtle)' }}>
              {equipment.map(eq => (
                <label key={eq.id} className="flex-row align-center gap-xs cursor-pointer" style={{ padding: '4px 0', fontSize: 'var(--font-size-sm)' }}>
                  <input 
                    type="checkbox" 
                    checked={newContract.allowedEquipment.includes(eq.id)}
                    onChange={() => toggleEquipmentInWhitelist(eq.id)}
                  />
                  <span>{eq.code} - {eq.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex-row justify-end gap-sm" style={{ marginTop: '12px' }}>
            <button type="button" onClick={() => setShowContractModal(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Contract</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
