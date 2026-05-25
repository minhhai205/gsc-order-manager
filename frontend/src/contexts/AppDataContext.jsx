import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const AppDataContext = createContext();

const initialAgencies = [
  { id: 1, code: 'FBI-GSC', name: 'Federal Bureau of Investigation (FBI)', address: '935 Pennsylvania Avenue NW, Washington, D.C.', contact: 'Agent John Miller', phone: '202-324-3000', email: 'j.miller@fbi.gov', status: 'ACTIVE' },
  { id: 2, code: 'NASA-GSC', name: 'National Aeronautics and Space Administration', address: '300 E Street SW, Washington, D.C.', contact: 'Dr. Sarah Connor', phone: '202-358-0000', email: 's.connor@nasa.gov', status: 'ACTIVE' },
  { id: 3, code: 'DHS-GSC', name: 'Department of Homeland Security', address: '2707 Martin Luther King Jr Ave SE, Washington, D.C.', contact: 'Director Carl Jenkins', phone: '202-282-8000', email: 'c.jenkins@dhs.gov', status: 'ACTIVE' }
];

const initialEquipment = [
  { id: 1, code: 'EQ-TAC-01', name: 'Tactical Mobile Communication Hub', price: 12500, stock: 15, minStock: 5, status: 'ACTIVE' },
  { id: 2, code: 'EQ-SVR-02', name: 'Rugged Server Rack Alpha', price: 24000, stock: 8, minStock: 3, status: 'ACTIVE' },
  { id: 3, code: 'EQ-THM-03', name: 'Thermal Imaging Scanner', price: 4800, stock: 22, minStock: 10, status: 'ACTIVE' },
  { id: 4, code: 'EQ-SAT-04', name: 'Encrypted Satellite Receiver', price: 8500, stock: 4, minStock: 5, status: 'ACTIVE' }
];

const initialContracts = [
  { 
    id: 1, 
    agencyId: 1, 
    code: 'GSC-FBI-2026', 
    costLimit: 500000, 
    spent: 185000, 
    endDate: '2027-12-31', 
    allowedEquipment: [1, 2, 3], 
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
    priority: 'HIGH',
    shippingAddress: '935 Pennsylvania Avenue NW, Washington, D.C.',
    deliveryNotes: 'Deliver directly to the secure tactical operations center (TOC) on B3. Contact Agent Miller on arrival.',
    officerRemarks: 'PO validated and approved for communication systems upgrades.',
    trackingNumber: 'GSC-TRK-7Y2K8B',
    carrier: 'GSC_CARGO',
    status: 'SHIPPED', 
    items: [
      { equipmentId: 1, quantity: 4, catalogPrice: 12500, price: 12500 },
      { equipmentId: 3, quantity: 5, catalogPrice: 4800, price: 4800 }
    ], 
    totalAmount: 74000,
    validationErrors: [],
    statusHistory: [
      { timestamp: '2026-05-20 09:00:00', action: 'DIGITIZED', user: 'Agent John Miller (CO)', comment: 'Purchase Order digitized from secure FBI paper form.' },
      { timestamp: '2026-05-20 10:15:00', action: 'COMPLIANCE_AUDITED', user: 'Agent John Miller (CO)', comment: 'Compliance checks passed successfully.' },
      { timestamp: '2026-05-20 13:30:00', action: 'INVENTORY_ALLOCATED', user: 'Sarah Connor (Fulfillment)', comment: 'Stock quantities checked and successfully allocated in Warehouse.' },
      { timestamp: '2026-05-20 15:45:00', action: 'SHIPPED', user: 'Sarah Connor (Fulfillment)', comment: 'Shipping bill SHP-1 issued. Stock deducted and carrier GSC_CARGO assigned.' }
    ]
  },
  { 
    id: 2, 
    poNumber: 'PO-NASA-102', 
    contractId: 2, 
    issueDate: '2026-05-22', 
    priority: 'CRITICAL',
    shippingAddress: '300 E Street SW, Washington, D.C.',
    deliveryNotes: 'Urgent spacecraft simulation rack upgrades.',
    officerRemarks: 'Special approval for customized price points granted by CO.',
    trackingNumber: '',
    carrier: 'FEDEX',
    status: 'PENDING', 
    items: [
      { equipmentId: 2, quantity: 3, catalogPrice: 24000, price: 23500 }, // customized price override
      { equipmentId: 4, quantity: 6, catalogPrice: 8500, price: 8500 }
    ], 
    totalAmount: 121500,
    validationErrors: [],
    statusHistory: [
      { timestamp: '2026-05-22 14:00:00', action: 'DIGITIZED', user: 'Agent John Miller (CO)', comment: 'Purchase Order digitized with custom catalog price adjustments.' }
    ]
  }
];

const initialAuditLogs = [
  { id: 1, timestamp: '2026-05-25 08:00:00', action: 'CREATE', entity: 'FederalAgency', details: 'Created agency FBI-GSC', user: 'John Miller' },
  { id: 2, timestamp: '2026-05-25 08:15:00', action: 'CREATE', entity: 'FederalAgency', details: 'Created agency NASA-GSC', user: 'John Miller' },
  { id: 3, timestamp: '2026-05-25 09:00:00', action: 'CREATE', entity: 'StandingContract', details: 'Issued contract GSC-FBI-2026 (Limit: $500,000)', user: 'John Miller' },
  { id: 4, timestamp: '2026-05-25 09:30:00', action: 'IMPORT', entity: 'Equipment', details: 'Imported equipment EQ-SAT-04 stock', user: 'Carl Jenkins' }
];

export function AppDataProvider({ children }) {
  const { currentUser } = useAuth();

  const [agencies, setAgencies] = useState(initialAgencies);
  const [equipment, setEquipment] = useState(initialEquipment);
  const [contracts, setContracts] = useState(initialContracts);
  const [purchaseOrders, setPurchaseOrders] = useState(initialPurchaseOrders);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [exceptionReports, setExceptionReports] = useState([]);
  const [shippingBills, setShippingBills] = useState([]);
  const [rejectionLetters, setRejectionLetters] = useState([]);
  const [backups, setBackups] = useState([]);

  const addAuditLog = (action, entity, details) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString().slice(0, 19).replace('T', ' '),
      action,
      entity,
      details,
      user: currentUser ? currentUser.name : 'SYSTEM'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const handleCreateAgency = (agencyData) => {
    const created = {
      id: Date.now(),
      ...agencyData,
      status: 'ACTIVE'
    };
    setAgencies(prev => [...prev, created]);
    addAuditLog('CREATE', 'FederalAgency', `Created agency ${created.code} (${created.name})`);
    return created;
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

  const handleCreateContract = (contractData) => {
    const created = {
      id: Date.now(),
      agencyId: parseInt(contractData.agencyId),
      code: contractData.code,
      costLimit: parseFloat(contractData.costLimit),
      spent: 0,
      endDate: contractData.endDate || '2027-12-31',
      allowedEquipment: contractData.allowedEquipment.map(id => parseInt(id)),
      status: 'VALID'
    };
    setContracts(prev => [...prev, created]);
    addAuditLog('CREATE', 'StandingContract', `Contract ${created.code} registered for agency ID ${created.agencyId}`);
    return created;
  };

  const handleStockAdjustment = (adjustment) => {
    const { equipmentId, quantity, operation, note } = adjustment;
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
  };

  const handleCreatePo = (poData) => {
    const contractId = parseInt(poData.contractId);
    let totalAmount = 0;
    
    const items = poData.items.map(item => {
      const eqId = parseInt(item.equipmentId);
      const qty = parseInt(item.quantity);
      const eq = equipment.find(e => e.id === eqId);
      
      // Support custom overrides of prices
      const price = item.customPrice ? parseFloat(item.customPrice) : (eq ? eq.price : 0);
      totalAmount += price * qty;
      
      return { 
        equipmentId: eqId, 
        quantity: qty, 
        catalogPrice: eq ? eq.price : 0, 
        price 
      };
    });

    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const username = currentUser ? currentUser.name : 'SYSTEM';

    const created = {
      id: Date.now(),
      poNumber: poData.poNumber,
      contractId,
      issueDate: poData.issueDate || new Date().toISOString().slice(0, 10),
      priority: poData.priority || 'MEDIUM',
      shippingAddress: poData.shippingAddress || '1600 Pennsylvania Ave NW, Washington, D.C.',
      deliveryNotes: poData.deliveryNotes || '',
      officerRemarks: poData.officerRemarks || '',
      trackingNumber: '',
      carrier: poData.carrier || 'GSC_CARGO',
      status: 'PENDING',
      items,
      totalAmount,
      validationErrors: [],
      statusHistory: [
        { timestamp, action: 'DIGITIZED', user: username, comment: 'Purchase order digitized from paper and metadata values saved.' }
      ]
    };

    setPurchaseOrders(prev => [created, ...prev]);
    addAuditLog('CREATE', 'PurchaseOrder', `Purchase Order ${created.poNumber} digitized ($${created.totalAmount.toLocaleString()})`);
    return created;
  };

  const handleUpdatePo = (id, data) => {
    let totalAmount = 0;
    const items = data.items.map(item => {
      const eqId = parseInt(item.equipmentId);
      const qty = parseInt(item.quantity);
      const eq = equipment.find(e => e.id === eqId);
      
      const price = item.customPrice ? parseFloat(item.customPrice) : (eq ? eq.price : 0);
      totalAmount += price * qty;
      
      return { 
        equipmentId: eqId, 
        quantity: qty, 
        catalogPrice: eq ? eq.price : 0, 
        price 
      };
    });

    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const username = currentUser ? currentUser.name : 'SYSTEM';

    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === id) {
        const updatedHistory = [
          ...po.statusHistory,
          { timestamp, action: 'MODIFIED', user: username, comment: 'Officer adjusted order metadata parameters or customized line item pricing.' }
        ];

        return { 
          ...po, 
          poNumber: data.poNumber, 
          contractId: parseInt(data.contractId), 
          issueDate: data.issueDate,
          priority: data.priority || po.priority,
          shippingAddress: data.shippingAddress || po.shippingAddress,
          deliveryNotes: data.deliveryNotes || po.deliveryNotes,
          officerRemarks: data.officerRemarks || po.officerRemarks,
          carrier: data.carrier || po.carrier,
          items,
          totalAmount,
          status: 'PENDING',
          validationErrors: [],
          statusHistory: updatedHistory
        };
      }
      return po;
    }));

    addAuditLog('UPDATE', 'PurchaseOrder', `Updated purchase order specifications for ID: ${id}`);
  };

  const validatePurchaseOrder = (poId) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        const contract = contracts.find(c => c.id === po.contractId);
        const errors = [];

        if (!contract) {
          errors.push('Assigned contract does not exist.');
        } else {
          if (contract.status !== 'VALID') {
            errors.push(`Contract ${contract.code} is status: ${contract.status}.`);
          }
          const today = new Date().toISOString().slice(0, 10);
          if (contract.endDate < today) {
            errors.push(`Contract ${contract.code} expired on ${contract.endDate}.`);
          }

          po.items.forEach(item => {
            if (!contract.allowedEquipment.includes(item.equipmentId)) {
              const eq = equipment.find(e => e.id === item.equipmentId);
              errors.push(`Equipment ${eq ? eq.code : '#' + item.equipmentId} is not in contract whitelist.`);
            }
          });

          const projectedTotal = contract.spent + po.totalAmount;
          if (projectedTotal > contract.costLimit) {
            errors.push(`PO amount ($${po.totalAmount.toLocaleString()}) combined with contract spent ($${contract.spent.toLocaleString()}) exceeds cost limit ($${contract.costLimit.toLocaleString()}).`);
          }
        }

        const isValid = errors.length === 0;
        const nextStatus = isValid ? 'OUTSTANDING' : 'INVALID';
        
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const username = currentUser ? currentUser.name : 'SYSTEM';
        const updatedHistory = [
          ...po.statusHistory,
          { 
            timestamp, 
            action: 'COMPLIANCE_AUDITED', 
            user: username, 
            comment: isValid 
              ? 'Passed whitelists budget and catalog allowed items verification checks.' 
              : `Compliance check failed: ${errors.join('; ')}`
          }
        ];

        addAuditLog('VALIDATE_PO', 'PurchaseOrder', `Validated PO ${po.poNumber} -> ${nextStatus}. Errors: ${errors.length}`);
        
        return {
          ...po,
          status: nextStatus,
          validationErrors: errors,
          statusHistory: updatedHistory
        };
      }
      return po;
    }));
  };

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

    // Update status history
    setPurchaseOrders(prev => prev.map(o => {
      if (o.id === po.id) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        return {
          ...o,
          statusHistory: [
            ...o.statusHistory,
            { timestamp, action: 'REJECTION_GENERATED', user: currentUser ? currentUser.name : 'SYSTEM', comment: 'Complied rejection letter issued to draft status due to whitelists violations.' }
          ]
        };
      }
      return o;
    }));

    setRejectionLetters(prev => [newLetter, ...prev]);
    addAuditLog('ISSUE_REJECTION_LETTER', 'RejectionLetter', `Generated draft rejection letter for PO ${po.poNumber}`);
    return newLetter;
  };

  const handleSendRejectionLetter = (letterId) => {
    setRejectionLetters(prev => prev.map(letter => {
      if (letter.id === letterId) {
        // Update purchase order status to REJECTED
        setPurchaseOrders(prevPOs => prevPOs.map(o => {
          if (o.id === letter.poId) {
            const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
            return {
              ...o,
              status: 'REJECTED',
              statusHistory: [
                ...o.statusHistory,
                { timestamp, action: 'REJECTED', user: currentUser ? currentUser.name : 'SYSTEM', comment: `Official Rejection Letter sent and emailed to partner agency: ${letter.agencyEmail}.` }
              ]
            };
          }
          return o;
        }));

        addAuditLog('ISSUE_REJECTION_LETTER', 'RejectionLetter', `Issued and sent Rejection Letter for PO ${letter.poNumber} to ${letter.agencyEmail}`);
        return { ...letter, status: 'ISSUED' };
      }
      return letter;
    }));
  };

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

    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const username = currentUser ? currentUser.name : 'SYSTEM';

    if (shortages.length > 0) {
      setPurchaseOrders(prev => prev.map(o => {
        if (o.id === po.id) {
          return {
            ...o,
            statusHistory: [
              ...o.statusHistory,
              { timestamp, action: 'SHORTAGE_FLAGGED', user: username, comment: `Stock checks failed. Quantity deficits detected on ${shortages.length} items.` }
            ]
          };
        }
        return o;
      }));
      return { shortages, success: false };
    } else {
      setPurchaseOrders(prev => prev.map(o => {
        if (o.id === po.id) {
          addAuditLog('INVENTORY_CHECK', 'PurchaseOrder', `Inventory check cleared for PO ${po.poNumber}. Stock is sufficient.`);
          return { 
            ...o, 
            status: 'READY_TO_SHIP',
            statusHistory: [
              ...o.statusHistory,
              { timestamp, action: 'INVENTORY_ALLOCATED', user: username, comment: 'Stock quantities checked. Necessary stock is allocated and held successfully.' }
            ]
          };
        }
        return o;
      }));
      return { shortages: [], success: true };
    }
  };

  const handleConfirmExceptionReport = (po, shortages) => {
    const report = {
      id: Date.now(),
      poId: po.id,
      poNumber: po.poNumber,
      date: new Date().toISOString().slice(0, 10),
      shortages,
      checksum: 'SHA256-REP:' + Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    setExceptionReports(prev => [report, ...prev]);
    
    setPurchaseOrders(prev => prev.map(o => {
      if (o.id === po.id) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        addAuditLog('CREATE_EXCEPTION_REPORT', 'ExceptionReport', `Exception report generated for PO ${o.poNumber} (Missing items: ${shortages.length})`);
        return { 
          ...o, 
          status: 'INVENTORY_CHECKED',
          statusHistory: [
            ...o.statusHistory,
            { timestamp, action: 'EXCEPTION_REPORTED', user: currentUser ? currentUser.name : 'SYSTEM', comment: `Deficit exception report EXP-${report.id} registered for procurement.` }
          ]
        };
      }
      return o;
    }));
  };

  const handleConfirmShipping = (po) => {
    let hasStockIssue = false;
    po.items.forEach(item => {
      const eq = equipment.find(eq => eq.id === item.equipmentId);
      if (!eq || eq.stock < item.quantity) {
        hasStockIssue = true;
      }
    });

    if (hasStockIssue) {
      return false;
    }

    setEquipment(prev => prev.map(eq => {
      const item = po.items.find(i => i.equipmentId === eq.id);
      if (item) {
        return { ...eq, stock: eq.stock - item.quantity };
      }
      return eq;
    }));

    setContracts(prev => prev.map(c => {
      if (c.id === po.contractId) {
        return { ...c, spent: c.spent + po.totalAmount };
      }
      return c;
    }));

    const trackingNumber = 'GSC-TRK-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const billId = Date.now();

    const bill = {
      id: billId,
      poId: po.id,
      poNumber: po.poNumber,
      shippingDate: new Date().toISOString().slice(0, 10),
      items: po.items,
      status: 'DELIVERED',
      checksum: 'SHA256-SHIP:' + Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    setShippingBills(prev => [bill, ...prev]);

    setPurchaseOrders(prev => prev.map(o => {
      if (o.id === po.id) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        addAuditLog('ISSUE_SHIPPING_BILL', 'ShippingBill', `Shipping bill issued and inventory deducted for PO ${o.poNumber}`);
        return { 
          ...o, 
          status: 'SHIPPED', 
          trackingNumber,
          statusHistory: [
            ...o.statusHistory,
            { timestamp, action: 'SHIPPED', user: currentUser ? currentUser.name : 'SYSTEM', comment: `Secure Shipping Bill SHP-${billId} issued. Stock deducted, tracking code: ${trackingNumber}.` }
          ]
        };
      }
      return o;
    }));

    return true;
  };

  const closeAndArchivePo = (poId) => {
    setPurchaseOrders(prev => prev.map(po => {
      if (po.id === poId) {
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        addAuditLog('CLOSE_PURCHASE_ORDER', 'PurchaseOrder', `Purchase Order ${po.poNumber} closed and archived under code ARC-${po.id}`);
        return { 
          ...po, 
          status: 'CLOSED',
          statusHistory: [
            ...po.statusHistory,
            { timestamp, action: 'ARCHIVED', user: currentUser ? currentUser.name : 'SYSTEM', comment: 'Purchase order closed and stored under long-term system archive logs.' }
          ]
        };
      }
      return po;
    }));
  };

  const triggerDatabaseBackup = () => {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const fileName = `gsc-order-manager_${timestamp}.sql`;
    
    const backupRecord = {
      id: Date.now(),
      fileName,
      filePath: `D:/gsc-order-manager-backups/${fileName}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'FULL',
      status: 'COMPLETED',
      checksum: 'SHA256-BAK:' + Math.random().toString(36).substring(2, 10).toUpperCase(),
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
    return backupRecord.filePath;
  };

  const triggerDatabaseRestore = (backup) => {
    const snap = backup.snapshot;
    setAgencies(snap.agencies);
    setEquipment(snap.equipment);
    setContracts(snap.contracts);
    setPurchaseOrders(snap.purchaseOrders);
    setExceptionReports(snap.exceptionReports);
    setShippingBills(snap.shippingBills);
    setRejectionLetters(snap.rejectionLetters);

    addAuditLog('RESTORE', 'SystemSettings', `Database successfully restored from backup file ${backup.fileName}`);
  };

  const handleUpdateAgency = (id, data) => {
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    addAuditLog('UPDATE', 'FederalAgency', `Updated agency profile details for ID: ${id}`);
  };

  const handleDeleteAgency = (id) => {
    setAgencies(prev => prev.filter(a => a.id !== id));
    addAuditLog('DELETE', 'FederalAgency', `Deleted agency profile for ID: ${id}`);
  };

  const handleUpdateContract = (id, data) => {
    setContracts(prev => prev.map(c => c.id === id ? { 
      ...c, 
      code: data.code,
      agencyId: parseInt(data.agencyId),
      costLimit: parseFloat(data.costLimit),
      endDate: data.endDate,
      allowedEquipment: data.allowedEquipment.map(Number)
    } : c));
    addAuditLog('UPDATE', 'StandingContract', `Updated standing contract parameters for ID: ${id}`);
  };

  const handleDeleteContract = (id) => {
    setContracts(prev => prev.filter(c => c.id !== id));
    addAuditLog('DELETE', 'StandingContract', `Deleted standing contract registry for ID: ${id}`);
  };

  const handleCreateEquipment = (data) => {
    const created = {
      id: Date.now(),
      code: data.code,
      name: data.name,
      price: parseFloat(data.price),
      stock: parseInt(data.stock),
      minStock: parseInt(data.minStock),
      status: 'ACTIVE'
    };
    setEquipment(prev => [...prev, created]);
    addAuditLog('CREATE', 'Equipment', `Created catalog equipment: ${created.code}`);
    return created;
  };

  const handleUpdateEquipment = (id, data) => {
    setEquipment(prev => prev.map(e => e.id === id ? { 
      ...e, 
      code: data.code,
      name: data.name,
      price: parseFloat(data.price), 
      stock: parseInt(data.stock), 
      minStock: parseInt(data.minStock) 
    } : e));
    addAuditLog('UPDATE', 'Equipment', `Updated equipment catalog specifications for ID: ${id}`);
  };

  const handleDeleteEquipment = (id) => {
    setEquipment(prev => prev.filter(e => e.id !== id));
    addAuditLog('DELETE', 'Equipment', `Deleted equipment catalog item for ID: ${id}`);
  };

  const handleDeletePo = (id) => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== id));
    addAuditLog('DELETE', 'PurchaseOrder', `Deleted purchase order digitization for ID: ${id}`);
  };

  return (
    <AppDataContext.Provider value={{
      agencies, equipment, contracts, purchaseOrders, auditLogs,
      exceptionReports, shippingBills, rejectionLetters, backups,
      handleCreateAgency, toggleAgencyStatus, handleCreateContract,
      handleStockAdjustment, handleCreatePo, validatePurchaseOrder,
      generateRejectionLetter, handleSendRejectionLetter, handleInventoryCheck,
      handleConfirmExceptionReport, handleConfirmShipping, closeAndArchivePo,
      triggerDatabaseBackup, triggerDatabaseRestore,
      handleUpdateAgency, handleDeleteAgency, handleUpdateContract, handleDeleteContract,
      handleCreateEquipment, handleUpdateEquipment, handleDeleteEquipment, handleUpdatePo, handleDeletePo
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
