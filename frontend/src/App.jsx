import React, { useState, useEffect } from 'react';
import { useTheme } from './contexts/ThemeContext';
import './App.css';

// Initial Mock Data to ensure the dashboard feels complete and "WOW"s immediately
const initialAgencies = [
  { id: 1, code: 'FBI-GSC', name: 'Federal Bureau of Investigation (FBI)', address: '935 Pennsylvania Avenue NW, Washington, D.C.', contact: 'Agent John Miller', phone: '202-324-3000', email: 'j.miller@fbi.gov', status: 'ACTIVE' },
  { id: 2, code: 'NASA-GSC', name: 'National Aeronautics and Space Administration', address: '300 E Street SW, Washington, D.C.', contact: 'Dr. Sarah Connor', phone: '202-358-0000', email: 's.connor@nasa.gov', status: 'ACTIVE' },
  { id: 3, code: 'DHS-GSC', name: 'Department of Homeland Security', address: '2707 Martin Luther King Jr Ave SE, Washington, D.C.', contact: 'Director Carl Jenkins', phone: '202-282-8000', email: 'c.jenkins@dhs.gov', status: 'ACTIVE' }
];

const initialEquipment = [
  { id: 1, code: 'EQ-TAC-01', name: 'Tactical Mobile Communication Hub', price: 12500, stock: 15, minStock: 5, status: 'ACTIVE' },
  { id: 2, code: 'EQ-SVR-02', name: 'Rugged Server Rack Alpha', price: 24000, stock: 8, minStock: 3, status: 'ACTIVE' },
  { id: 3, code: 'EQ-THM-03', name: 'Thermal Imaging Scanner', price: 4800, stock: 22, minStock: 10, status: 'ACTIVE' },
  { id: 4, code: 'EQ-SAT-04', name: 'Encrypted Satellite Receiver', price: 8500, stock: 4, minStock: 5, status: 'ACTIVE' } // Triggering low-stock alert!
];

const initialContracts = [
  { 
    id: 1, 
    agencyId: 1, 
    code: 'GSC-FBI-2026', 
    costLimit: 500000, 
    spent: 185000, 
    endDate: '2027-12-31', 
    allowedEquipment: [1, 2, 3], // Whitelist IDs
    status: 'VALID' 
  },
  { 
    id: 2, 
    agencyId: 2, 
    code: 'GSC-NASA-2026', 
    costLimit: 1200000, 
    spent: 420000, 
    endDate: '2028-06-30', 
    allowedEquipment: [2, 4], 
    status: 'VALID' 
  }
];

const initialPurchaseOrders = [
  { 
    id: 1, 
    poNumber: 'PO-FBI-889', 
    contractId: 1, 
    issueDate: '2026-05-20', 
    status: 'PENDING', 
    items: [
      { equipmentId: 1, quantity: 4, price: 12500 }, // $50,000
      { equipmentId: 3, quantity: 5, price: 4800 }   // $24,000
    ], 
    totalAmount: 74000,
    validationErrors: [] 
  },
  { 
    id: 2, 
    poNumber: 'PO-NASA-102', 
    contractId: 2, 
    issueDate: '2026-05-22', 
    status: 'PENDING', 
    items: [
      { equipmentId: 2, quantity: 3, price: 24000 }, // $72,000
      { equipmentId: 4, quantity: 6, price: 8500 }   // $51,000  (6 satellites requires checking stock!)
    ], 
    totalAmount: 123000,
    validationErrors: []
  }
];

const initialAuditLogs = [
  { id: 1, timestamp: '2026-05-25T08:00:00', action: 'CREATE', entity: 'FederalAgency', details: 'Created agency FBI-GSC', user: 'CO_OFFICER' },
  { id: 2, timestamp: '2026-05-25T08:15:00', action: 'CREATE', entity: 'FederalAgency', details: 'Created agency NASA-GSC', user: 'CO_OFFICER' },
  { id: 3, timestamp: '2026-05-25T09:00:00', action: 'CREATE', entity: 'StandingContract', details: 'Issued contract GSC-FBI-2026 (Limit: $500,000)', user: 'CO_OFFICER' },
  { id: 4, timestamp: '2026-05-25T09:30:00', action: 'IMPORT', entity: 'Equipment', details: 'Imported equipment EQ-SAT-04 stock', user: 'WH_STAFF' }
];

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // Active Role State (Simulating security levels)
  // SYSTEM_ADMIN, CONTRACTING_OFFICER, ORDER_FULFILLMENT_STAFF, WAREHOUSE_STAFF
  const [role, setRole] = useState('CONTRACTING_OFFICER'); 
  
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState('overview');

  // Application Data States
  const [agencies, setAgencies] = useState(initialAgencies);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [contracts, setContracts] = useState(initialContracts);
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [exceptionReports, setExceptionReports] = useState([]);
  const [shippingBills, setShippingBills] = useState([]);
  const [rejectionLetters, setRejectionLetters] = useState([]);
  const [backups, setBackups] = useState([]);

  // Forms / Modals States
  const [showAgencyModal, setShowAgencyModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [showRejectionLetterModal, setShowRejectionLetterModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [showExceptionReportModal, setShowExceptionReportModal] = useState(false);
  const [selectedShortagePo, setSelectedShortagePo] = useState(null);
  const [selectedShortages, setSelectedShortages] = useState([]);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedShippingPo, setSelectedShippingPo] = useState(null);

  // New Record Forms Inputs State
  const [newAgency, setNewAgency] = useState({ code: '', name: '', address: '', contact: '', phone: '', email: '' });
  const [newContract, setNewContract] = useState({ agencyId: '', code: '', costLimit: '', endDate: '', allowedEquipment: [] });
  const [newPo, setNewPo] = useState({ poNumber: '', contractId: '', issueDate: '', items: [{ equipmentId: '', quantity: '' }] });
  const [stockAdjustment, setStockAdjustment] = useState({ equipmentId: '', quantity: '', operation: 'INCREASE', note: '' });

  // ═══════════════════════════════════════════════════════
  // AUXILIARY UTILITIES & LOGGERS
  // ═══════════════════════════════════════════════════════
  const addAuditLog = (action, entity, details) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString().slice(0, 19),
      action,
      entity,
      details,
      user: role
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 1: MANAGE FEDERAL AGENCY
  // ═══════════════════════════════════════════════════════
  const handleCreateAgency = (e) => {
    e.preventDefault();
    if (!newAgency.code || !newAgency.name) return;

    const created = {
      id: Date.now(),
      ...newAgency,
      status: 'ACTIVE'
    };
    setAgencies(prev => [...prev, created]);
    addAuditLog('CREATE', 'FederalAgency', `Created agency ${created.code} (${created.name})`);
    setNewAgency({ code: '', name: '', address: '', contact: '', phone: '', email: '' });
    setShowAgencyModal(false);
  };

  const toggleAgencyStatus = (id) => {
    setAgencies(prev => prev.map(a => {
      if (a.id === id) {
        const nextStatus = a.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        addAuditLog(nextStatus === 'ACTIVE' ? 'ENABLE' : 'DISABLE', 'FederalAgency', `Status updated to ${nextStatus} for agency ${a.code}`);
        return { ...a, status: nextStatus };
      }
      return a;
    }));
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 2: MANAGE STANDING CONTRACT
  // ═══════════════════════════════════════════════════════
  const handleCreateContract = (e) => {
    e.preventDefault();
    if (!newContract.agencyId || !newContract.code || !newContract.costLimit) return;

    const created = {
      id: Date.now(),
      agencyId: parseInt(newContract.agencyId),
      code: newContract.code,
      costLimit: parseFloat(newContract.costLimit),
      spent: 0,
      endDate: newContract.endDate || '2027-12-31',
      allowedEquipment: newContract.allowedEquipment.map(id => parseInt(id)),
      status: 'VALID'
    };
    setContracts(prev => [...prev, created]);
    addAuditLog('CREATE', 'StandingContract', `Contract ${created.code} registered for agency ID ${created.agencyId}`);
    setNewContract({ agencyId: '', code: '', costLimit: '', endDate: '', allowedEquipment: [] });
    setShowContractModal(false);
  };

  const handleEquipmentToggleInContract = (equipmentId) => {
    const eqId = parseInt(equipmentId);
    setNewContract(prev => {
      const allowed = prev.allowedEquipment.includes(eqId)
        ? prev.allowedEquipment.filter(id => id !== eqId)
        : [...prev.allowedEquipment, eqId];
      return { ...prev, allowedEquipment: allowed };
    });
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 3: EQUIPMENT STOCK ADJUSTMENT
  // ═══════════════════════════════════════════════════════
  const handleStockAdjustment = (e) => {
    e.preventDefault();
    const { equipmentId, quantity, operation, note } = stockAdjustment;
    if (!equipmentId || !quantity) return;

    const eqId = parseInt(equipmentId);
    const qty = parseInt(quantity);

    setEquipment(prev => prev.map(eq => {
      if (eq.id === eqId) {
        const delta = operation === 'INCREASE' ? qty : -qty;
        const newStock = Math.max(0, eq.stock + delta);
        addAuditLog('UPDATE_STOCK', 'Equipment', `Stock for ${eq.code} updated: ${eq.stock} -> ${newStock} (${operation}). Note: ${note || 'N/A'}`);
        return { ...eq, stock: newStock };
      }
      return eq;
    }));

    setStockAdjustment({ equipmentId: '', quantity: '', operation: 'INCREASE', note: '' });
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 4: RECEIVE & DIGITIZE PURCHASE ORDER
  // ═══════════════════════════════════════════════════════
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

  const handleCreatePo = (e) => {
    e.preventDefault();
    if (!newPo.poNumber || !newPo.contractId || newPo.items.some(item => !item.equipmentId || !item.quantity)) return;

    const contractId = parseInt(newPo.contractId);
    const contract = contracts.find(c => c.id === contractId);

    let totalAmount = 0;
    const items = newPo.items.map(item => {
      const eqId = parseInt(item.equipmentId);
      const qty = parseInt(item.quantity);
      const eq = equipment.find(e => e.id === eqId);
      const price = eq ? eq.price : 0;
      totalAmount += price * qty;
      return { equipmentId: eqId, quantity: qty, price };
    });

    const created = {
      id: Date.now(),
      poNumber: newPo.poNumber,
      contractId,
      issueDate: newPo.issueDate || new Date().toISOString().slice(0, 10),
      status: 'PENDING',
      items,
      totalAmount,
      validationErrors: []
    };

    setPurchaseOrders(prev => [created, ...prev]);
    addAuditLog('CREATE', 'PurchaseOrder', `Purchase Order ${created.poNumber} digitized ($${created.totalAmount.toLocaleString()})`);
    setNewPo({ poNumber: '', contractId: '', issueDate: '', items: [{ equipmentId: '', quantity: '' }] });
    setShowPoModal(false);
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 4 (CONTINUED): PO RULES VALIDATION
  // ═══════════════════════════════════════════════════════
  const validatePurchaseOrder = (poId) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        const contract = contracts.find(c => c.id === po.contractId);
        const errors = [];

        if (!contract) {
          errors.push('Assigned contract does not exist.');
        } else {
          // Rule 1: Contract validity
          if (contract.status !== 'VALID') {
            errors.push(`Contract ${contract.code} is status: ${contract.status}.`);
          }
          const today = new Date().toISOString().slice(0, 10);
          if (contract.endDate < today) {
            errors.push(`Contract ${contract.code} expired on ${contract.endDate}.`);
          }

          // Rule 2: Whitelisted equipment validation
          po.items.forEach(item => {
            if (!contract.allowedEquipment.includes(item.equipmentId)) {
              const eq = equipment.find(e => e.id === item.equipmentId);
              errors.push(`Equipment ${eq ? eq.code : '#' + item.equipmentId} is not in contract whitelist.`);
            }
          });

          // Rule 3: Cost limit check
          const projectedTotal = contract.spent + po.totalAmount;
          if (projectedTotal > contract.costLimit) {
            errors.push(`PO amount ($${po.totalAmount.toLocaleString()}) combined with contract spent ($${contract.spent.toLocaleString()}) exceeds the cost limit ($${contract.costLimit.toLocaleString()}).`);
          }
        }

        const isValid = errors.length === 0;
        const nextStatus = isValid ? 'OUTSTANDING' : 'INVALID';
        
        addAuditLog('VALIDATE_PO', 'PurchaseOrder', `Validated PO ${po.poNumber} -> ${nextStatus}. Errors: ${errors.length}`);
        
        return {
          ...po,
          status: nextStatus,
          validationErrors: errors
        };
      }
      return po;
    }));
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 5: PROCESS REJECTION LETTER FOR INVALID PO
  // ═══════════════════════════════════════════════════════
  const generateRejectionLetter = (po) => {
    const letterId = Date.now();
    const contract = contracts.find(c => c.id === po.contractId);
    const agency = contract ? agencies.find(a => a.id === contract.agencyId) : null;

    const newLetter = {
      id: letterId,
      poId: po.id,
      poNumber: po.poNumber,
      agencyName: agency ? agency.name : 'Unknown Agency',
      agencyEmail: agency ? agency.email : 'contact@agency.gov',
      reasons: po.validationErrors,
      issueDate: new Date().toISOString().slice(0, 10),
      status: 'DRAFT',
      checksum: 'SHA256:' + Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    setRejectionLetters(prev => [newLetter, ...prev]);
    addAuditLog('ISSUE_REJECTION_LETTER', 'RejectionLetter', `Generated draft rejection letter for PO ${po.poNumber}`);
    setSelectedLetter(newLetter);
    setShowRejectionLetterModal(true);
  };

  const handleSendRejectionLetter = (letterId) => {
    setRejectionLetters(prev => prev.map(letter => {
      if (letter.id === letterId) {
        addAuditLog('ISSUE_REJECTION_LETTER', 'RejectionLetter', `Issued and sent Rejection Letter for PO ${letter.poNumber} to ${letter.agencyEmail}`);
        return { ...letter, status: 'ISSUED' };
      }
      return letter;
    }));
    setShowRejectionLetterModal(false);
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 6: INVENTORY AVAILABILITY CHECK
  // ═══════════════════════════════════════════════════════
  const handleInventoryCheck = (po) => {
    const shortages = [];
    po.items.forEach(item => {
      const eq = equipment.find(e => e.id === item.equipmentId);
      if (eq) {
        if (eq.stock < item.quantity) {
          shortages.push({
            equipmentId: item.equipmentId,
            code: eq.code,
            name: eq.name,
            requested: item.quantity,
            available: eq.stock,
            shortage: item.quantity - eq.stock
          });
        }
      }
    });

    if (shortages.length > 0) {
      // Stock shortage! Flag for Exception Report
      setSelectedShortagePo(po);
      setSelectedShortages(shortages);
      setShowExceptionReportModal(true);
    } else {
      // Inventory cleared! Mark PO as READY_TO_SHIP
      setPurchaseOrders(prev => prev.map(o => {
        if (o.id === po.id) {
          addAuditLog('INVENTORY_CHECK', 'PurchaseOrder', `Inventory check cleared for PO ${po.poNumber}. Stock is sufficient.`);
          return { ...o, status: 'READY_TO_SHIP' };
        }
        return o;
      }));
      alert(`Inventory check cleared for PO ${po.poNumber}! Ready to generate Shipping Bill.`);
    }
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 7: CREATE EXCEPTION REPORT FOR SHORTAGES
  // ═══════════════════════════════════════════════════════
  const handleConfirmExceptionReport = () => {
    if (!selectedShortagePo) return;

    const report = {
      id: Date.now(),
      poId: selectedShortagePo.id,
      poNumber: selectedShortagePo.poNumber,
      date: new Date().toISOString().slice(0, 10),
      shortages: selectedShortages,
      checksum: 'SHA256-REP:' + Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    setExceptionReports(prev => [report, ...prev]);
    
    // Update PO status to INVENTORY_CHECKED
    setPurchaseOrders(prev => prev.map(o => {
      if (o.id === selectedShortagePo.id) {
        addAuditLog('CREATE_EXCEPTION_REPORT', 'ExceptionReport', `Exception report generated for PO ${o.poNumber} (Missing items: ${selectedShortages.length})`);
        return { ...o, status: 'INVENTORY_CHECKED' };
      }
      return o;
    }));

    setShowExceptionReportModal(false);
    setSelectedShortagePo(null);
    setSelectedShortages([]);
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 8: CREATE & CONFIRM SHIPPING BILL
  // ═══════════════════════════════════════════════════════
  const handleOpenShippingForm = (po) => {
    const contract = contracts.find(c => c.id === po.contractId);
    const agency = contract ? agencies.find(a => a.id === contract.agencyId) : null;
    
    setSelectedShippingPo(po);
    setShowShippingModal(true);
  };

  const handleConfirmShipping = (e) => {
    e.preventDefault();
    if (!selectedShippingPo) return;

    // Deduct stock levels for items
    let hasStockIssue = false;
    selectedShippingPo.items.forEach(item => {
      const eq = equipment.find(eq => eq.id === item.equipmentId);
      if (!eq || eq.stock < item.quantity) {
        hasStockIssue = true;
      }
    });

    if (hasStockIssue) {
      alert("Error: Stock level changed and is now insufficient to ship. Re-run inventory checks.");
      setShowShippingModal(false);
      return;
    }

    // Deduct stock
    setEquipment(prev => prev.map(eq => {
      const item = selectedShippingPo.items.find(i => i.equipmentId === eq.id);
      if (item) {
        return { ...eq, stock: eq.stock - item.quantity };
      }
      return eq;
    }));

    // Update contract Spent amount
    setContracts(prev => prev.map(c => {
      if (c.id === selectedShippingPo.contractId) {
        return { ...c, spent: c.spent + selectedShippingPo.totalAmount };
      }
      return c;
    }));

    // Create shipping bill
    const bill = {
      id: Date.now(),
      poId: selectedShippingPo.id,
      poNumber: selectedShippingPo.poNumber,
      shippingDate: new Date().toISOString().slice(0, 10),
      items: selectedShippingPo.items,
      status: 'DELIVERED',
      checksum: 'SHA256-SHIP:' + Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    setShippingBills(prev => [bill, ...prev]);

    // Update PO Status
    setPurchaseOrders(prev => prev.map(o => {
      if (o.id === selectedShippingPo.id) {
        addAuditLog('ISSUE_SHIPPING_BILL', 'ShippingBill', `Shipping bill issued and inventory deducted for PO ${o.poNumber}`);
        return { ...o, status: 'SHIPPED' };
      }
      return o;
    }));

    setShowShippingModal(false);
    setSelectedShippingPo(null);
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 9: CLOSE & ARCHIVE PURCHASE ORDER
  // ═══════════════════════════════════════════════════════
  const closeAndArchivePo = (poId) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        addAuditLog('CLOSE_PURCHASE_ORDER', 'PurchaseOrder', `Purchase Order ${po.poNumber} closed and archived under code ARC-${po.id}`);
        return { ...po, status: 'CLOSED' };
      }
      return po;
    }));
  };

  // ═══════════════════════════════════════════════════════
  // USE CASE 11: DATABASE BACKUP AND RESTORE
  // ═══════════════════════════════════════════════════════
  const triggerDatabaseBackup = () => {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const fileName = `gsc-order-manager_${timestamp}.sql`;
    
    // Create backup registry record
    const backupRecord = {
      id: Date.now(),
      fileName,
      filePath: `D:/gsc-order-manager-backups/${fileName}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'FULL',
      status: 'COMPLETED',
      checksum: 'SHA256-BAK:' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      
      // Store current data state inside backup for simulation restore
      snapshot: {
        agencies: [...agencies],
        equipment: [...equipment],
        contracts: [...contracts],
        purchaseOrders: [...purchaseOrders],
        exceptionReports: [...exceptionReports],
        shippingBills: [...shippingBills],
        rejectionLetters: [...rejectionLetters]
      }
    };

    setBackups(prev => [backupRecord, ...prev]);
    addAuditLog('BACKUP', 'SystemSettings', `Database backup written to file path ${backupRecord.filePath}`);
    alert(`Database backup completed successfully! Saved to: ${backupRecord.filePath}`);
  };

  const triggerDatabaseRestore = (backup) => {
    if (!window.confirm(`Are you sure you want to restore database to backup: ${backup.fileName}? This will overwrite all current changes.`)) return;

    const snap = backup.snapshot;
    setAgencies(snap.agencies);
    setEquipment(snap.equipment);
    setContracts(snap.contracts);
    setPurchaseOrders(snap.purchaseOrders);
    setExceptionReports(snap.exceptionReports);
    setShippingBills(snap.shippingBills);
    setRejectionLetters(snap.rejectionLetters);

    addAuditLog('RESTORE', 'SystemSettings', `Database successfully restored from backup file ${backup.fileName}`);
    alert(`Database state has been restored to backup created on ${backup.timestamp}.`);
  };


  // Filtering POs by roles access
  const canPerformValidation = role === 'CONTRACTING_OFFICER' || role === 'SYSTEM_ADMIN';
  const canPerformFulfillment = role === 'ORDER_FULFILLMENT_STAFF' || role === 'SYSTEM_ADMIN';
  const canPerformWarehouse = role === 'WAREHOUSE_STAFF' || role === 'SYSTEM_ADMIN';

  return (
    <div className="app-container">
      
      {/* ═══════════════════════════════════════════════════════
         HEADER AREA
         ═══════════════════════════════════════════════════════ */}
      <header className="app-header">
        <div className="brand-title">
          <span className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          GSC Order Manager
        </div>

        <div className="controls-group">
          {/* Theme Mode Toggle (Inspired by TicketRush) */}
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.2"/>
                <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" fillOpacity="0.2"/>
              </svg>
            )}
          </button>

          {/* Role selector to simulate access permissions */}
          <div className="flex-row align-center gap-sm">
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Role:</span>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="role-switcher-select"
            >
              <option value="CONTRACTING_OFFICER">Contracting Officer</option>
              <option value="ORDER_FULFILLMENT_STAFF">Fulfillment Staff</option>
              <option value="WAREHOUSE_STAFF">Warehouse Staff</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
            </select>
          </div>
        </div>
      </header>

      <div className="main-wrapper">
        
        {/* ═══════════════════════════════════════════════════════
           SIDEBAR NAVIGATION
           ═══════════════════════════════════════════════════════ */}
        <aside className="sidebar">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/>
              <rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
            </svg>
            Overview
          </button>

          <button 
            className={`nav-item ${activeTab === 'agencies' ? 'active' : ''}`}
            onClick={() => setActiveTab('agencies')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            Agencies & Contracts
          </button>

          <button 
            className={`nav-item ${activeTab === 'purchaseOrders' ? 'active' : ''}`}
            onClick={() => setActiveTab('purchaseOrders')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            Purchase Orders
          </button>

          <button 
            className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
            Inventory & Catalog
          </button>

          <button 
            className={`nav-item ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Shipping Bills
          </button>

          {/* Admin exclusive tabs */}
          {role === 'SYSTEM_ADMIN' && (
            <button 
              className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
              style={{ borderTop: '1px solid var(--border-light)', marginTop: '8px', paddingTop: '16px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Admin Utilities
            </button>
          )}
        </aside>

        {/* ═══════════════════════════════════════════════════════
           MAIN CONTENT DISPLAY AREA
           ═══════════════════════════════════════════════════════ */}
        <main className="content-pane">

          {/* ═══════════════════════════════════════════════════════
             TAB: OVERVIEW
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div>
              <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
                <h2>System Overview</h2>
                <div className="flex-row align-center gap-sm">
                  <span className="pulse-glow-dot"></span>
                  <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>GSC Cloud Server Online</span>
                </div>
              </div>

              {/* Stat Boxes */}
              <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
                <div className="box-card stat-card">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="stat-number">{agencies.length}</h3>
                    <p className="stat-label">Agencies</p>
                  </div>
                </div>

                <div className="box-card stat-card">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-secondary-light)', color: 'var(--color-secondary)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="stat-number">{contracts.filter(c => c.status === 'VALID').length}</h3>
                    <p className="stat-label">Valid Contracts</p>
                  </div>
                </div>

                <div className="box-card stat-card">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="stat-number">{purchaseOrders.length}</h3>
                    <p className="stat-label">Total POs</p>
                  </div>
                </div>

                <div className="box-card stat-card">
                  <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="stat-number">{equipment.filter(e => e.stock < e.minStock).length}</h3>
                    <p className="stat-label">Low-Stock Items</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Recent Logs */}
              <div className="grid-cols-2">
                
                {/* Pending POs */}
                <div className="box-card">
                  <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>Pending Validation</h3>
                  <div className="table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>PO Number</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseOrders.filter(po => po.status === 'PENDING').length === 0 ? (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No pending POs.</td>
                          </tr>
                        ) : (
                          purchaseOrders.filter(po => po.status === 'PENDING').map(po => (
                            <tr key={po.id}>
                              <td><strong>{po.poNumber}</strong></td>
                              <td>${po.totalAmount.toLocaleString()}</td>
                              <td><span className="badge badge-warning">{po.status}</span></td>
                              <td>
                                <button 
                                  onClick={() => { validatePurchaseOrder(po.id); setActiveTab('purchaseOrders'); }}
                                  className="btn btn-primary"
                                  style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
                                  disabled={!canPerformValidation}
                                >
                                  Validate
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit trail preview */}
                <div className="box-card">
                  <h3 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>Recent Activities</h3>
                  <div className="audit-list">
                    {auditLogs.slice(0, 4).map(log => (
                      <div key={log.id} className="audit-item" style={{ borderLeftColor: log.action === 'CREATE' ? 'var(--color-success)' : 'var(--color-primary)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{log.details}</div>
                          <div className="audit-meta">{log.timestamp} by {log.user}</div>
                        </div>
                        <span className={`badge ${log.action === 'CREATE' ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '9px' }}>
                          {log.action}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
             TAB: AGENCIES & CONTRACTS
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'agencies' && (
            <div>
              <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
                <h2>Federal Agencies & Contracts</h2>
                <div className="flex-row gap-sm">
                  <button 
                    onClick={() => setShowAgencyModal(true)} 
                    className="btn btn-primary"
                    disabled={role !== 'CONTRACTING_OFFICER' && role !== 'SYSTEM_ADMIN'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New Agency
                  </button>
                  <button 
                    onClick={() => setShowContractModal(true)} 
                    className="btn btn-secondary"
                    disabled={role !== 'CONTRACTING_OFFICER' && role !== 'SYSTEM_ADMIN'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    New Standing Contract
                  </button>
                </div>
              </div>

              {/* Agencies List */}
              <div className="box-card" style={{ marginBottom: '32px' }}>
                <h3>Federal Agencies Profiles (UC1)</h3>
                <p>Register, adjust details, and manage profiles of GSC partner organizations.</p>
                
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Agency Name</th>
                        <th>Contact Person</th>
                        <th>Email / Phone</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agencies.map(a => (
                        <tr key={a.id}>
                          <td><strong>{a.code}</strong></td>
                          <td className="text-wrap"><strong>{a.name}</strong><br/><small style={{ color: 'var(--text-muted)' }}>{a.address}</small></td>
                          <td>{a.contact}</td>
                          <td>
                            <div>{a.email}</div>
                            <small style={{ color: 'var(--text-muted)' }}>{a.phone}</small>
                          </td>
                          <td>
                            <span className={`badge ${a.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                              {a.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              onClick={() => toggleAgencyStatus(a.id)}
                              className={`btn ${a.status === 'ACTIVE' ? 'btn-danger' : 'btn-primary'}`}
                              style={{ padding: '4px 10px', fontSize: 'var(--font-size-xs)' }}
                              disabled={role !== 'CONTRACTING_OFFICER' && role !== 'SYSTEM_ADMIN'}
                            >
                              {a.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Contracts List */}
              <div className="box-card">
                <h3>Standing Contracts Whitelisting (UC2)</h3>
                <p>Standing contracts regulate limits, valid timelines, and a whitelist of eligible equipment catalogs.</p>
                
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Contract Code</th>
                        <th>Agency Code</th>
                        <th>Cost Limit</th>
                        <th>Spent Amount</th>
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
                        const statusClass = c.status === 'VALID' && !isExpired ? 'badge-success' : 'badge-danger';
                        const statusLabel = isExpired ? 'EXPIRED' : c.status;
                        return (
                          <tr key={c.id}>
                            <td><strong>{c.code}</strong></td>
                            <td>{agency ? agency.code : 'N/A'}</td>
                            <td>${c.costLimit.toLocaleString()}</td>
                            <td>
                              <div style={{ fontWeight: 600 }}>${c.spent.toLocaleString()}</div>
                              <small style={{ color: 'var(--text-muted)' }}>({((c.spent/c.costLimit)*100).toFixed(1)}% usage)</small>
                            </td>
                            <td style={{ color: isExpired ? 'var(--color-danger)' : 'inherit' }}>
                              {c.endDate} {isExpired && '⚠️'}
                            </td>
                            <td className="text-wrap">
                              {c.allowedEquipment.map(eqId => {
                                const eq = equipment.find(e => e.id === eqId);
                                return <span key={eqId} className="badge badge-info" style={{ marginRight: '4px', marginBottom: '4px', fontSize: '10px' }}>{eq ? eq.code : eqId}</span>;
                              })}
                            </td>
                            <td>
                              <span className={`badge ${statusClass}`}>{statusLabel}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
             TAB: PURCHASE ORDERS
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'purchaseOrders' && (
            <div>
              <div className="flex-row justify-between align-center" style={{ marginBottom: '24px' }}>
                <h2>Purchase Orders Digitization & Validation</h2>
                <button 
                  onClick={() => setShowPoModal(true)} 
                  className="btn btn-primary"
                  disabled={role !== 'CONTRACTING_OFFICER' && role !== 'SYSTEM_ADMIN'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Digitize Purchase Order
                </button>
              </div>

              {/* Purchase Orders List */}
              <div className="box-card">
                <h3>Digitized PO Registry (UC4, UC5, UC9)</h3>
                <p>All federal orders must match standing contract validity whitelists and strict budget margins.</p>
                
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>PO Number</th>
                        <th>Contract</th>
                        <th>Issue Date</th>
                        <th>Line Items</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th>Actions & Logs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseOrders.map(po => {
                        const contract = contracts.find(c => c.id === po.contractId);
                        const agency = contract ? agencies.find(a => a.id === contract.agencyId) : null;
                        
                        let badgeColor = 'badge-info';
                        if (po.status === 'PENDING') badgeColor = 'badge-warning';
                        if (po.status === 'INVALID') badgeColor = 'badge-danger';
                        if (po.status === 'SHIPPED') badgeColor = 'badge-info';
                        if (po.status === 'CLOSED') badgeColor = 'badge-success';

                        return (
                          <tr key={po.id}>
                            <td>
                              <strong>{po.poNumber}</strong>
                              {agency && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{agency.code}</div>}
                            </td>
                            <td>{contract ? contract.code : 'N/A'}</td>
                            <td>{po.issueDate}</td>
                            <td className="text-wrap">
                              {po.items.map((item, idx) => {
                                const eq = equipment.find(e => e.id === item.equipmentId);
                                return (
                                  <div key={idx} style={{ fontSize: 'var(--font-size-xs)', marginBottom: '2px' }}>
                                    • {eq ? eq.name : 'Item'}: <strong>{item.quantity} units</strong>
                                  </div>
                                );
                              })}
                            </td>
                            <td style={{ fontWeight: 700 }}>${po.totalAmount.toLocaleString()}</td>
                            <td>
                              <span className={`badge ${badgeColor}`}>{po.status}</span>
                            </td>
                            <td className="text-wrap">
                              
                              {/* Trigger Rules Validation */}
                              {po.status === 'PENDING' && (
                                <button 
                                  onClick={() => validatePurchaseOrder(po.id)}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', marginRight: '6px' }}
                                  disabled={!canPerformValidation}
                                >
                                  Validate PO
                                </button>
                              )}

                              {/* Invalid PO: Rejection Letter */}
                              {po.status === 'INVALID' && (
                                <div className="flex-col gap-sm">
                                  <div style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: 600 }}>
                                    🚨 FAILED: {po.validationErrors.join(' ')}
                                  </div>
                                  <button 
                                    onClick={() => generateRejectionLetter(po)}
                                    className="btn btn-danger"
                                    style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}
                                    disabled={!canPerformValidation}
                                  >
                                    Rejection Letter
                                  </button>
                                </div>
                              )}

                              {/* Outstanding PO: Inventory availability check */}
                              {po.status === 'OUTSTANDING' && (
                                <div className="flex-col gap-sm">
                                  <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600 }}>✓ Validation Passed</span>
                                  <button 
                                    onClick={() => handleInventoryCheck(po)}
                                    className="btn btn-primary"
                                    style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}
                                    disabled={!canPerformFulfillment}
                                  >
                                    Inventory Check
                                  </button>
                                </div>
                              )}

                              {/* Inventory checked shortage report generated */}
                              {po.status === 'INVENTORY_CHECKED' && (
                                <div>
                                  <span className="badge badge-warning" style={{ fontSize: '9px', marginBottom: '4px' }}>SHORTAGE REPORTED</span>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Awaiting stock supply.</div>
                                </div>
                              )}

                              {/* Ready to Ship: Create shipping bill */}
                              {po.status === 'READY_TO_SHIP' && (
                                <button 
                                  onClick={() => handleOpenShippingForm(po)}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-secondary)' }}
                                  disabled={!canPerformWarehouse}
                                >
                                  Ship Equipment
                                </button>
                              )}

                              {/* Shipped: Close and Archive PO */}
                              {po.status === 'SHIPPED' && (
                                <button 
                                  onClick={() => closeAndArchivePo(po.id)}
                                  className="btn btn-primary"
                                  style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', backgroundColor: 'var(--color-success)' }}
                                  disabled={!canPerformValidation}
                                >
                                  Close & Archive
                                </button>
                              )}

                              {po.status === 'CLOSED' && (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>🔒 Finalized & Archived</span>
                              )}

                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
             TAB: INVENTORY & CATALOG
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'inventory' && (
            <div>
              <div className="grid-cols-3 align-center" style={{ marginBottom: '24px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <h2>Equipment Catalog & Stock</h2>
                  <p>Check standing stock volumes, record deliveries, and manage catalog minimum levels.</p>
                </div>
                
                {/* Stock Adjuster (Warehouse Exclusive) */}
                <div className="box-card" style={{ padding: '16px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 'var(--font-size-sm)' }}>Adjust Inventory Level (UC3)</h4>
                  <form onSubmit={handleStockAdjustment} className="flex-col gap-sm">
                    <select 
                      value={stockAdjustment.equipmentId}
                      onChange={(e) => setStockAdjustment(prev => ({ ...prev, equipmentId: e.target.value }))}
                      required
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                    >
                      <option value="">Select Equipment...</option>
                      {equipment.map(e => (
                        <option key={e.id} value={e.id}>{e.code} - {e.name}</option>
                      ))}
                    </select>

                    <div className="flex-row gap-sm">
                      <select 
                        value={stockAdjustment.operation}
                        onChange={(e) => setStockAdjustment(prev => ({ ...prev, operation: e.target.value }))}
                        style={{ padding: '6px 10px', fontSize: '12px', width: '120px' }}
                      >
                        <option value="INCREASE">Increase</option>
                        <option value="DECREASE">Decrease</option>
                      </select>
                      <input 
                        type="number"
                        placeholder="Qty"
                        value={stockAdjustment.quantity}
                        onChange={(e) => setStockAdjustment(prev => ({ ...prev, quantity: e.target.value }))}
                        required
                        min="1"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                      />
                    </div>

                    <input 
                      type="text" 
                      placeholder="Audit note/Reason" 
                      value={stockAdjustment.note}
                      onChange={(e) => setStockAdjustment(prev => ({ ...prev, note: e.target.value }))}
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                    />

                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', width: '100%' }}
                      disabled={!canPerformWarehouse}
                    >
                      Record Stock Adjustment
                    </button>
                  </form>
                </div>
              </div>

              {/* Inventory Table */}
              <div className="box-card" style={{ marginBottom: '32px' }}>
                <h3>Equipment Stock Status</h3>
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Model Name</th>
                        <th>Unit Price</th>
                        <th>Current Stock</th>
                        <th>Min Stock Threshold</th>
                        <th>Stock Alert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipment.map(e => {
                        const isLow = e.stock < e.minStock;
                        return (
                          <tr key={e.id}>
                            <td><strong>{e.code}</strong></td>
                            <td>{e.name}</td>
                            <td>${e.price.toLocaleString()}</td>
                            <td style={{ fontWeight: 700, color: isLow ? 'var(--color-danger)' : 'inherit' }}>
                              {e.stock} units
                            </td>
                            <td>{e.minStock} units</td>
                            <td>
                              {isLow ? (
                                <span className="badge badge-danger">⚠️ LOW STOCK ALERT</span>
                              ) : (
                                <span className="badge badge-success">✓ Healthy</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Exception Reports List */}
              <div className="box-card">
                <h3>Exception Reports Registry (UC7)</h3>
                <p>Formally generated audit trail for stock shortages discovered during validation checks.</p>
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Report ID</th>
                        <th>PO Number</th>
                        <th>Date Raised</th>
                        <th>Shortage Items & Quantities</th>
                        <th>Integrity Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exceptionReports.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Exception Reports generated.</td>
                        </tr>
                      ) : (
                        exceptionReports.map(rep => (
                          <tr key={rep.id}>
                            <td><strong>REP-{rep.id.toString().slice(-6)}</strong></td>
                            <td><strong>{rep.poNumber}</strong></td>
                            <td>{rep.date}</td>
                            <td className="text-wrap">
                              {rep.shortages.map((s, idx) => (
                                <div key={idx} style={{ fontSize: '11px' }}>
                                  • {s.name}: requested {s.requested}, available {s.available} (<span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>shortage: {s.shortage}</span>)
                                </div>
                              ))}
                            </td>
                            <td><code>{rep.checksum}</code></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
             TAB: SHIPPING BILLS
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'shipping' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2>Shipping & Deliveries</h2>
                <p>View confirmed shipments, inventory tracking records, and digital shipping bills.</p>
              </div>

              {/* Shipping Bills registry */}
              <div className="box-card">
                <h3>Confirmed Shipping Bills (UC8)</h3>
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Bill ID</th>
                        <th>PO Number</th>
                        <th>Shipping Date</th>
                        <th>Shipped Equipment</th>
                        <th>Destination</th>
                        <th>Status</th>
                        <th>Hash Checksum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shippingBills.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No Shipping Bills issued yet.</td>
                        </tr>
                      ) : (
                        shippingBills.map(bill => (
                          <tr key={bill.id}>
                            <td><strong>SHIP-{bill.id.toString().slice(-6)}</strong></td>
                            <td><strong>{bill.poNumber}</strong></td>
                            <td>{bill.shippingDate}</td>
                            <td className="text-wrap">
                              {bill.items.map((item, idx) => {
                                const eq = equipment.find(e => e.id === item.equipmentId);
                                return (
                                  <div key={idx} style={{ fontSize: '11px' }}>
                                    {eq ? eq.code : 'Item'} x {item.quantity} units
                                  </div>
                                );
                              })}
                            </td>
                            <td>Agency Default Address</td>
                            <td><span className="badge badge-success">{bill.status}</span></td>
                            <td><code>{bill.checksum}</code></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
             TAB: ADMIN UTILITIES (BACKUP & RESTORE)
             ═══════════════════════════════════════════════════════ */}
          {activeTab === 'admin' && role === 'SYSTEM_ADMIN' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2>System Administration Utilities</h2>
                <p>Audit logging trails and physical data preservation tools (backup & restore).</p>
              </div>

              <div className="grid-cols-2" style={{ marginBottom: '32px' }}>
                
                {/* Backup Action box */}
                <div className="box-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3>Database Backup Service (UC11)</h3>
                    <p>
                      Execute a simulated full database export (`mysqldump`). 
                      Backups will preserve Federal Agency logs, Contract configurations, whitelists, inventory volumes, and transaction tables.
                    </p>
                    <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-light)', fontSize: 'var(--font-size-xs)', marginBottom: '16px' }}>
                      <strong>Storage Destination:</strong> <code>D:/gsc-order-manager-backups/</code>
                    </div>
                  </div>
                  <button 
                    onClick={triggerDatabaseBackup} 
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Execute Database Backup
                  </button>
                </div>

                {/* Backups List and Restore triggers */}
                <div className="box-card">
                  <h3>Backup History Registry</h3>
                  <p>Choose an archived snapshot to restore GSC Monolithic state.</p>
                  
                  <div className="flex-col gap-sm" style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                    {backups.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        No backup records registered. Trigger one above.
                      </div>
                    ) : (
                      backups.map(bak => (
                        <div key={bak.id} className="flex-row align-center justify-between" style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{bak.fileName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created: {bak.timestamp}</div>
                          </div>
                          <button 
                            onClick={() => triggerDatabaseRestore(bak)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}
                          >
                            Restore
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Complete Audit Logs History */}
              <div className="box-card">
                <h3>Transactional Audit Logs Trail (UC10)</h3>
                <p>Complete transactional record checking of every database write, change, validate or restore action.</p>
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Entity Name</th>
                        <th>Action Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id}>
                          <td>{log.timestamp}</td>
                          <td><span className="badge badge-info" style={{ fontSize: '10px' }}>{log.user}</span></td>
                          <td><strong>{log.action}</strong></td>
                          <td><code>{log.entity}</code></td>
                          <td className="text-wrap">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* ═══════════════════════════════════════════════════════
         MODAL: NEW FEDERAL AGENCY (UC1)
         ═══════════════════════════════════════════════════════ */}
      {showAgencyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Federal Agency</h3>
              <button onClick={() => setShowAgencyModal(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateAgency}>
              <div className="form-row">
                <div className="form-group">
                  <label>Agency Code *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. FBI-GSC"
                    value={newAgency.code}
                    onChange={(e) => setNewAgency(prev => ({ ...prev, code: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Official Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Federal Bureau of Investigation"
                    value={newAgency.name}
                    onChange={(e) => setNewAgency(prev => ({ ...prev, name: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Official Street Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. 935 Pennsylvania Avenue NW..."
                  value={newAgency.address}
                  onChange={(e) => setNewAgency(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Contact Person Name</label>
                  <input 
                    type="text" 
                    placeholder="Agent name"
                    value={newAgency.contact}
                    onChange={(e) => setNewAgency(prev => ({ ...prev, contact: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="202-XXX-XXXX"
                    value={newAgency.phone}
                    onChange={(e) => setNewAgency(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="name@agency.gov"
                  value={newAgency.email}
                  onChange={(e) => setNewAgency(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="flex-row justify-between" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAgencyModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Agency Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: NEW STANDING CONTRACT & WHITELISTS (UC2)
         ═══════════════════════════════════════════════════════ */}
      {showContractModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Standing Contract</h3>
              <button onClick={() => setShowContractModal(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateContract}>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign to Federal Agency *</label>
                  <select 
                    value={newContract.agencyId}
                    onChange={(e) => setNewContract(prev => ({ ...prev, agencyId: e.target.value }))}
                    required
                  >
                    <option value="">Choose Agency...</option>
                    {agencies.filter(a => a.status === 'ACTIVE').map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Standing Contract Code *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. GSC-FBI-2026"
                    value={newContract.code}
                    onChange={(e) => setNewContract(prev => ({ ...prev, code: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Cost Limit Budget ($) *</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 500000"
                    value={newContract.costLimit}
                    onChange={(e) => setNewContract(prev => ({ ...prev, costLimit: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Expiration Date *</label>
                  <input 
                    type="date" 
                    value={newContract.endDate}
                    onChange={(e) => setNewContract(prev => ({ ...prev, endDate: e.target.value }))}
                    required 
                  />
                </div>
              </div>

              {/* Equipment Whitelisting interface */}
              <div className="form-group">
                <label>Whitelisted Eligible Equipment *</label>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {equipment.map(eq => (
                    <label key={eq.id} className="flex-row align-center gap-sm" style={{ cursor: 'pointer', fontSize: 'var(--font-size-sm)' }}>
                      <input 
                        type="checkbox" 
                        checked={newContract.allowedEquipment.includes(eq.id)}
                        onChange={() => handleEquipmentToggleInContract(eq.id)}
                        style={{ width: 'auto' }}
                      />
                      <span><strong>{eq.code}</strong> - {eq.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex-row justify-between" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setShowContractModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Contract & Whitelists</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: RECEIVE & DIGITIZE PURCHASE ORDER (UC4)
         ═══════════════════════════════════════════════════════ */}
      {showPoModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Digitize Purchase Order</h3>
              <button onClick={() => setShowPoModal(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreatePo}>
              <div className="form-row">
                <div className="form-group">
                  <label>Official PO Number *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. PO-FBI-889"
                    value={newPo.poNumber}
                    onChange={(e) => setNewPo(prev => ({ ...prev, poNumber: e.target.value }))}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Under Standing Contract *</label>
                  <select 
                    value={newPo.contractId}
                    onChange={(e) => setNewPo(prev => ({ ...prev, contractId: e.target.value }))}
                    required
                  >
                    <option value="">Choose Contract...</option>
                    {contracts.filter(c => c.status === 'VALID').map(c => {
                      const agency = agencies.find(a => a.id === c.agencyId);
                      return <option key={c.id} value={c.id}>{c.code} ({agency ? agency.code : ''})</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Issue Date *</label>
                <input 
                  type="date" 
                  value={newPo.issueDate}
                  onChange={(e) => setNewPo(prev => ({ ...prev, issueDate: e.target.value }))}
                  required 
                />
              </div>

              {/* Dynamically adjust line items */}
              <div className="form-section-title">Purchase Line Items</div>
              
              {newPo.items.map((item, idx) => (
                <div key={idx} className="flex-row flex-row-responsive align-center gap-sm" style={{ marginBottom: '12px' }}>
                  
                  <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                    <select 
                      value={item.equipmentId}
                      onChange={(e) => handlePoItemChange(idx, 'equipmentId', e.target.value)}
                      required
                      style={{ padding: '8px 12px' }}
                    >
                      <option value="">Select Equipment Item...</option>
                      {equipment.map(eq => (
                        <option key={eq.id} value={eq.id}>{eq.code} - {eq.name} (${eq.price.toLocaleString()})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <input 
                      type="number" 
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handlePoItemChange(idx, 'quantity', e.target.value)}
                      required
                      style={{ padding: '8px 12px' }}
                    />
                  </div>

                  {newPo.items.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removePoItemField(idx)}
                      className="btn btn-danger"
                      style={{ padding: '8px 12px', height: '38px', minWidth: '40px' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              <button 
                type="button" 
                onClick={addPoItemField}
                className="btn btn-secondary"
                style={{ width: '100%', marginBottom: '24px', fontSize: 'var(--font-size-xs)' }}
              >
                + Add Another Line Item
              </button>

              <div className="flex-row justify-between" style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setShowPoModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Digitize Purchase Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: GENERATED REJECTION LETTER VIEWER (UC5)
         ═══════════════════════════════════════════════════════ */}
      {showRejectionLetterModal && selectedLetter && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Official Rejection Letter</h3>
              <button onClick={() => setShowRejectionLetterModal(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              This letter has been generated to reject GSC purchase order due to compliance validation failure:
            </p>

            {/* A4 Paper mockup visualizer */}
            <div className="paper-visualizer-dark-theme-wrapper">
              <div className="paper-visualizer">
                <div className="paper-header">
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b' }}>General Services Administration (GSA)</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>GSC Order Control Center</div>
                  <div className="paper-title">Rejection Notice</div>
                </div>

                <div className="paper-body">
                  <div><strong>Date:</strong> {selectedLetter.issueDate}</div>
                  <div><strong>To:</strong> {selectedLetter.agencyName}</div>
                  <div><strong>Address:</strong> Official Partner Agency HQ</div>
                  <div><strong>Subject:</strong> Rejection of Purchase Order No. <strong>{selectedLetter.poNumber}</strong></div>
                  
                  <hr style={{ border: 'none', borderTop: '1px solid #cbd5e1', margin: '8px 0' }} />

                  <p>Dear Contracting Department,</p>
                  <p>
                    Please be notified that the digitized Purchase Order <strong>{selectedLetter.poNumber}</strong> failed to pass our mandatory GSC Standing Contract Validation check. 
                    Consequently, your purchase request has been declined under the following terms:
                  </p>

                  <div style={{ padding: '12px', backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', borderRadius: '4px', margin: '8px 0' }}>
                    {selectedLetter.reasons.map((r, idx) => (
                      <div key={idx} style={{ color: '#b91c1c', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        ❌ {r}
                      </div>
                    ))}
                  </div>

                  <p>
                    Please adjust the line items, contract numbers, or cost parameters in accordance with GSC Standing whitelists and resubmit your digital order.
                  </p>
                </div>

                <div className="paper-footer">
                  GSC Compliance Management Office<br/>
                  Registry Seal: <code>{selectedLetter.checksum}</code>
                </div>
              </div>
            </div>

            <div className="flex-row justify-between" style={{ marginTop: '24px' }}>
              <button 
                type="button" 
                onClick={() => handleSendRejectionLetter(selectedLetter.id)} 
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                Send Official Rejection Letter to {selectedLetter.agencyEmail}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: CREATE EXCEPTION REPORT FOR SHORTAGE (UC7)
         ═══════════════════════════════════════════════════════ */}
      {showExceptionReportModal && selectedShortagePo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Exception Report</h3>
              <button onClick={() => setShowExceptionReportModal(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)' }}>
              Stock shortages have been detected for Purchase Order <strong>{selectedShortagePo.poNumber}</strong>. 
              Creating this report will record the shortage parameters to audit registries.
            </p>

            <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
              <div className="form-section-title" style={{ color: 'var(--color-danger)', borderLeftColor: 'var(--color-danger)' }}>Shortage Analysis</div>
              
              <div className="flex-col gap-sm">
                {selectedShortages.map((s, idx) => (
                  <div key={idx} style={{ paddingBottom: '8px', borderBottom: idx < selectedShortages.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ fontWeight: 700 }}>{s.code} - {s.name}</div>
                    <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span>Requested: <strong>{s.requested}</strong></span>
                      <span>Stock: <strong>{s.available}</strong></span>
                      <span style={{ color: 'var(--color-danger)' }}>Shortage: <strong>{s.shortage} units</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-row justify-between" style={{ gap: '16px' }}>
              <button type="button" onClick={() => setShowExceptionReportModal(false)} className="btn btn-secondary">Cancel</button>
              <button 
                type="button" 
                onClick={handleConfirmExceptionReport} 
                className="btn btn-danger"
              >
                Confirm Exception Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
         MODAL: CREATE SHIPPING BILL (UC8)
         ═══════════════════════════════════════════════════════ */}
      {showShippingModal && selectedShippingPo && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Shipping Bill</h3>
              <button onClick={() => setShowShippingModal(false)} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleConfirmShipping}>
              <p style={{ color: 'var(--text-secondary)' }}>
                Confirming shipment will deduct inventory levels from warehouse stock catalog and mark PO <strong>{selectedShippingPo.poNumber}</strong> as SHIPPED.
              </p>

              <div className="form-group">
                <label>PO Reference</label>
                <input type="text" value={selectedShippingPo.poNumber} disabled style={{ backgroundColor: 'var(--bg-secondary)', fontWeight: 700 }} />
              </div>

              <div className="form-group">
                <label>Shipping Date</label>
                <input type="date" value={new Date().toISOString().slice(0, 10)} required />
              </div>

              <div className="form-group">
                <label>Destination Delivery Address</label>
                <input type="text" value="Agency Default Delivery Warehouse HQ" disabled style={{ backgroundColor: 'var(--bg-secondary)' }} />
              </div>

              <div className="form-section-title" style={{ marginTop: '16px' }}>Shipping Checklist</div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {selectedShippingPo.items.map((item, idx) => {
                  const eq = equipment.find(e => e.id === item.equipmentId);
                  return (
                    <div key={idx} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{eq ? eq.name : 'Equipment'}</span>
                      <strong>shipped: {item.quantity} units</strong>
                    </div>
                  );
                })}
              </div>

              <div className="flex-row justify-between">
                <button type="button" onClick={() => setShowShippingModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--color-secondary)' }}>Confirm & Ship Cargo</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
