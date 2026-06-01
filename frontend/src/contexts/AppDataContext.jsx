import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const AppDataContext = createContext();

// Mapper functions to bridge frontend DTO expectation with backend real response fields

const mapAgency = (a) => ({
  id: a.id,
  code: a.agencyCode,
  name: a.name,
  address: a.address,
  contact: a.contactName,
  jobTitle: a.contactPosition,
  phone: a.contactPhone,
  email: a.contactEmail,
  status: a.active ? 'ACTIVE' : 'DISABLED'
});

const mapAgencyRequest = (data) => ({
  agencyCode: data.code,
  name: data.name,
  address: data.address,
  contactName: data.contact,
  contactPosition: data.jobTitle,
  contactPhone: data.phone,
  contactEmail: data.email
});

const mapEquipment = (e) => ({
  id: e.id,
  code: e.sku,
  name: e.name,
  manufacturer: e.manufacturer,
  hardwareConfig: e.hardwareSpecs,
  price: Number(e.unitPrice),
  stock: e.availableStock,
  minStock: e.minimumStockLevel,
  status: e.active ? 'ACTIVE' : 'DISABLED'
});

const mapEquipmentRequest = (data) => ({
  sku: data.code,
  name: data.name,
  manufacturer: data.manufacturer || 'General GSC Vendor',
  hardwareSpecs: data.hardwareConfig || 'Standard Configuration',
  unitPrice: Number(data.price),
  availableStock: Number(data.stock),
  minimumStockLevel: Number(data.minStock)
});

const mapContract = (c) => ({
  id: c.id,
  agencyId: c.agency ? c.agency.id : null,
  code: c.contractNumber,
  costLimit: Number(c.costLimit),
  spent: 0, // Placeholder, usually computed in backend
  startDate: c.startDate ? c.startDate.toString() : '',
  endDate: c.endDate ? c.endDate.toString() : '',
  allowedEquipment: c.allowedEquipment ? c.allowedEquipment.map(e => e.id) : [],
  status: c.status === 'VALID' || c.status === 'ACTIVE' ? 'VALID' : 'DISABLED'
});

const mapContractRequest = (data) => ({
  contractNumber: data.code,
  agencyId: Number(data.agencyId),
  startDate: data.startDate,
  endDate: data.endDate,
  costLimit: Number(data.costLimit),
  allowedEquipmentIds: data.allowedEquipment ? data.allowedEquipment.map(Number) : []
});

const mapPO = (po) => {
  const history = [
    {
      timestamp: po.createdAt ? new Date(po.createdAt).toLocaleString() : '',
      action: 'DIGITIZED',
      user: 'Hệ thống',
      comment: 'Đơn đặt hàng được số hoá và lưu trữ trên cơ sở dữ liệu.'
    }
  ];

  if (po.validatedAt) {
    history.push({
      timestamp: new Date(po.validatedAt).toLocaleString(),
      action: po.status === 'INVALID' ? 'REJECTED' : 'COMPLIANCE_AUDITED',
      user: 'Officer',
      comment: po.validationReason || 'Hoàn thành việc đối soát đơn hàng.'
    });
  }

  if (po.status === 'SHIPPED') {
    history.push({
      timestamp: po.updatedAt ? new Date(po.updatedAt).toLocaleString() : '',
      action: 'SHIPPED',
      user: 'Warehouse',
      comment: 'Vận đơn đã được lập, kho xuất hàng thành công.'
    });
  }

  if (po.status === 'CLOSED') {
    history.push({
      timestamp: po.closedAt ? new Date(po.closedAt).toLocaleString() : '',
      action: 'ARCHIVED',
      user: 'Hệ thống',
      comment: 'Đơn hàng được lưu trữ dài hạn.'
    });
  }

  return {
    id: po.id,
    poNumber: po.poNumber,
    contractId: po.contract ? po.contract.id : null,
    issueDate: po.issueDate ? po.issueDate.toString() : '',
    validationReason: po.validationReason || '',
    archiveCode: po.archiveCode || '',
    status: po.status,
    items: po.items ? po.items.map(item => ({
      equipmentId: item.equipment ? item.equipment.id : null,
      quantity: item.quantity,
      catalogPrice: item.unitPrice ? Number(item.unitPrice) : 0,
      price: item.unitPrice ? Number(item.unitPrice) : 0
    })) : [],
    totalAmount: Number(po.totalAmount),
    validationErrors: po.status === 'INVALID' ? [po.validationReason] : [],
    statusHistory: history
  };
};

const mapExceptionReport = (r) => ({
  id: r.id,
  reportNumber: r.reportNumber,
  poId: r.purchaseOrderId,
  poNumber: r.poNumber,
  reportedAt: r.reportedAt ? new Date(r.reportedAt).toLocaleString() : new Date(r.createdAt).toLocaleString(),
  reportedBy: r.reportedBy || 'SYSTEM',
  note: r.note || '',
  shortages: r.items ? r.items.map(item => ({
    equipmentId: item.equipment ? item.equipment.id : null,
    code: item.equipment ? item.equipment.sku : '',
    name: item.equipment ? item.equipment.name : '',
    requested: item.requestedQuantity,
    available: item.availableQuantity,
    shortage: item.shortageQuantity
  })) : []
});

const mapRejectionLetter = (l) => ({
  id: l.id,
  letterNumber: l.letterNumber,
  poId: l.purchaseOrderId,
  poNumber: l.poNumber,
  agencyName: l.agency ? l.agency.name : 'Unknown Agency',
  agencyEmail: l.agency ? l.agency.contactEmail : '',
  issueDate: l.issuedAt ? new Date(l.issuedAt).toISOString().slice(0, 10) : new Date(l.createdAt).toISOString().slice(0, 10),
  reason: l.reason || '',
  reasons: l.reason ? l.reason.split(';').map(r => r.trim()).filter(Boolean) : [],
  createdBy: l.issuedBy || 'SYSTEM',
  status: l.status // DRAFT / SENT
});

const mapBackup = (b) => ({
  id: b.id,
  fileName: b.fileName,
  filePath: b.filePath,
  timestamp: b.completedAt ? new Date(b.completedAt).toLocaleString() : new Date(b.createdAt).toLocaleString(),
  type: b.type,
  status: b.status,
  checksum: b.checksum || 'N/A'
});

export function AppDataProvider({ children }) {
  const { currentUser, authToken } = useAuth();

  const [agencies, setAgencies] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [exceptionReports, setExceptionReports] = useState([]);
  const [shippingBills, setShippingBills] = useState([]);
  const [rejectionLetters, setRejectionLetters] = useState([]);
  const [backups, setBackups] = useState([]);

  const loadAllData = () => {
    if (!authToken) return;

    // Load Agencies
    api.get('/api/agencies?size=100')
      .then(body => {
        if (body && body.data && body.data.content) {
          setAgencies(body.data.content.map(mapAgency));
        }
      }).catch(err => console.error('Failed to load agencies', err));

    // Load Equipment
    api.get('/api/equipment?size=100')
      .then(body => {
        if (body && body.data && body.data.content) {
          setEquipment(body.data.content.map(mapEquipment));
        }
      }).catch(err => console.error('Failed to load equipment', err));

    // Load Contracts
    api.get('/api/contracts?size=100')
      .then(body => {
        if (body && body.data && body.data.content) {
          setContracts(body.data.content.map(mapContract));
        }
      }).catch(err => console.error('Failed to load contracts', err));

    // Load Purchase Orders
    api.get('/api/purchase-orders?size=100')
      .then(body => {
        if (body && body.data && body.data.content) {
          setPurchaseOrders(body.data.content.map(mapPO));
        }
      }).catch(err => console.error('Failed to load purchase orders', err));

    // Load Audit Logs & Backups (restricted to SYSTEM_ADMIN)
    if (currentUser && currentUser.role === 'SYSTEM_ADMIN') {
      api.get('/api/audit-logs?size=100')
        .then(body => {
          if (body && body.data && body.data.content) {
            setAuditLogs(body.data.content.map(log => ({
              id: log.id,
              timestamp: log.occurredAt ? new Date(log.occurredAt).toLocaleString() : '',
              action: log.action,
              entity: log.entityName,
              details: log.detail,
              user: log.actorName || 'SYSTEM'
            })));
          }
        }).catch(err => console.error('Failed to load audit logs', err));

      api.get('/api/backups?size=100')
        .then(body => {
          if (body && body.data && body.data.content) {
            setBackups(body.data.content.map(mapBackup));
          }
        }).catch(err => console.error('Failed to load backups', err));
    }

    // Load Exception Reports
    api.get('/api/exception-reports?size=100')
      .then(body => {
        if (body && body.data && body.data.content) {
          setExceptionReports(body.data.content.map(mapExceptionReport));
        }
      }).catch(err => console.error('Failed to load exception reports', err));

    // Load Shipping Bills
    api.get('/api/shipping-bills?size=100')
      .then(body => {
        if (body && body.data && body.data.content) {
          setShippingBills(body.data.content.map(bill => ({
            id: bill.id,
            shippingBillNumber: bill.shippingBillNumber,
            poId: bill.purchaseOrderId,
            poNumber: bill.poNumber,
            shippingDate: bill.shippingDate ? bill.shippingDate.toString() : '',
            items: bill.items ? bill.items.map(item => ({
              equipmentId: item.equipment ? item.equipment.id : null,
              quantity: item.shippedQuantity
            })) : [],
            status: bill.status,
            destinationAddress: bill.destinationAddress || '',
            createdBy: bill.performedBy || 'SYSTEM'
          })));
        }
      }).catch(err => console.error('Failed to load shipping bills', err));

    // Load Rejection Letters
    api.get('/api/rejection-letters?size=100')
      .then(body => {
        if (body && body.data && body.data.content) {
          setRejectionLetters(body.data.content.map(mapRejectionLetter));
        }
      }).catch(err => console.error('Failed to load rejection letters', err));
  };

  useEffect(() => {
    loadAllData();
  }, [authToken, currentUser]);

  const addAuditLog = (action, entity, details) => {
    // No-op on frontend: Backend handles auditing triggers in Services natively!
    console.log(`[AuditLog Sim]: ${action} on ${entity} -> ${details}`);
  };

  const handleCreateAgency = async (agencyData) => {
    const res = await api.post('/api/agencies', mapAgencyRequest(agencyData));
    loadAllData();
    return mapAgency(res.data);
  };

  const handleUpdateAgency = async (id, data) => {
    await api.put(`/api/agencies/${id}`, mapAgencyRequest(data));
    loadAllData();
  };

  const handleDeleteAgency = async (id) => {
    // Backend doesn't support hard delete, we disable instead
    await api.patch(`/api/agencies/${id}/disable`);
    loadAllData();
  };

  const toggleAgencyStatus = async (id) => {
    const target = agencies.find(a => a.id === id);
    if (target) {
      if (target.status === 'ACTIVE') {
        await api.patch(`/api/agencies/${id}/disable`);
      } else {
        await api.patch(`/api/agencies/${id}/enable`);
      }
      loadAllData();
    }
  };

  const handleCreateContract = async (contractData) => {
    const res = await api.post('/api/contracts', mapContractRequest(contractData));
    loadAllData();
    return mapContract(res.data);
  };

  const handleUpdateContract = async (id, data) => {
    await api.put(`/api/contracts/${id}`, mapContractRequest(data));
    loadAllData();
  };

  const handleDeleteContract = async (id) => {
    await api.patch(`/api/contracts/${id}/disable`);
    loadAllData();
  };

  const toggleContractStatus = async (id) => {
    await api.patch(`/api/contracts/${id}/disable`);
    loadAllData();
  };

  const handleStockAdjustment = async (adjustment) => {
    const { equipmentId, quantity, operation, note } = adjustment;
    await api.patch(`/api/equipment/${equipmentId}/stock`, {
      quantity: Number(quantity),
      operation,
      note: note || ''
    });
    loadAllData();
  };

  const handleCreatePo = async (poData) => {
    const requestBody = {
      poNumber: poData.poNumber,
      contractId: Number(poData.contractId),
      issueDate: poData.issueDate || new Date().toISOString().slice(0, 10),
      items: poData.items.map(item => ({
        equipmentId: Number(item.equipmentId),
        quantity: Number(item.quantity)
      }))
    };
    const res = await api.post('/api/purchase-orders', requestBody);
    loadAllData();
    return mapPO(res.data);
  };

  const handleUpdatePo = async (id, data) => {
    await api.put(`/api/purchase-orders/${id}`, {
      poNumber: data.poNumber,
      contractId: Number(data.contractId),
      issueDate: data.issueDate,
      items: data.items.map(item => ({
        equipmentId: Number(item.equipmentId),
        quantity: Number(item.quantity)
      }))
    });
    loadAllData();
  };

  const validatePurchaseOrder = async (poId) => {
    await api.post(`/api/purchase-orders/${poId}/validate`);
    loadAllData();
  };

  const generateRejectionLetter = async (po) => {
    const res = await api.post(`/api/purchase-orders/${po.id}/rejection-letter`);
    loadAllData();
    return mapRejectionLetter(res.data);
  };

  const handleSendRejectionLetter = async (letterId) => {
    await api.patch(`/api/rejection-letters/${letterId}/issue`);
    loadAllData();
  };

  const handleInventoryCheck = async (po) => {
    const response = await api.post(`/api/purchase-orders/${po.id}/inventory-check`);
    const checkData = response.data || response;
    const shortages = checkData.items ? checkData.items.filter(item => !item.sufficient).map(item => ({
      equipmentId: item.equipment.id,
      code: item.equipment.sku,
      name: item.equipment.name,
      requested: item.requestedQuantity,
      available: item.availableQuantity,
      shortage: item.shortageQuantity
    })) : [];

    console.log('Inventory Check Result:', response);

    if (checkData.allItemsAvailable) {
      await api.patch(`/api/purchase-orders/${po.id}/confirm-inventory-check`);
    }

    loadAllData();
    return { shortages, success: checkData.allItemsAvailable };
  };

  const handleConfirmExceptionReport = async (po, shortages) => {
    await api.post(`/api/purchase-orders/${po.id}/exception-report`);
    loadAllData();
  };

  const handleCreateShippingBill = async (po) => {
    const matchedContract = contracts.find(c => c.id === po.contractId);
    const matchedAgency = matchedContract ? agencies.find(a => a.id === matchedContract.agencyId) : null;
    const destinationAddress = matchedAgency ? matchedAgency.address : 'Địa chỉ Cơ quan Đối tác';

    const exceptionReport = exceptionReports.find(r => r.poId === po.id);

    const requestBody = {
      shippingDate: new Date().toISOString().slice(0, 10),
      destinationAddress: destinationAddress,
      items: po.items
        .map(item => {
          let qty = Number(item.quantity);
          if (exceptionReport) {
            const shortageItem = exceptionReport.shortages.find(s => s.equipmentId === item.equipmentId);
            if (shortageItem) {
              qty = Number(shortageItem.available);
            }
          }
          return {
            equipmentId: Number(item.equipmentId),
            shippedQuantity: qty
          };
        })
        .filter(item => item.shippedQuantity > 0)
    };
    if (requestBody.items.length === 0) {
      throw new Error('No purchase order items are available to ship.');
    }
    await api.post(`/api/purchase-orders/${po.id}/shipping-bill`, requestBody);
    loadAllData();
    return true;
  };

  const handleConfirmShippingBill = async (billId) => {
    await api.patch(`/api/shipping-bills/${billId}/confirm`);
    loadAllData();
    return true;
  };

  const handleUpdateShippingStatus = async (billId, status) => {
    await api.patch(`/api/shipping-bills/${billId}/status`, { status });
    loadAllData();
    return true;
  };

  const closeAndArchivePo = async (poId) => {
    await api.post(`/api/purchase-orders/${poId}/close`);
    loadAllData();
  };

  const triggerDatabaseBackup = async () => {
    const res = await api.post('/api/backups', { type: 'FULL' });
    loadAllData();
    return res.data ? res.data.filePath : '';
  };

  const triggerDatabaseRestore = async (backup) => {
    await api.post(`/api/backups/${backup.id}/restore`, { note: 'Khôi phục từ Frontend UI', confirmed: true });
    loadAllData();
  };

  const handleCreateEquipment = async (data) => {
    const res = await api.post('/api/equipment', mapEquipmentRequest(data));
    loadAllData();
    return mapEquipment(res.data);
  };

  const handleUpdateEquipment = async (id, data) => {
    await api.put(`/api/equipment/${id}`, mapEquipmentRequest(data));
    loadAllData();
  };

  const handleDeleteEquipment = async (id) => {
    await api.patch(`/api/equipment/${id}/disable`);
    loadAllData();
  };

  const handleDeletePo = async (id) => {
    console.warn('Backend không hỗ trợ xoá đơn đặt hàng!');
  };

  const computedContracts = contracts.map(c => ({
    ...c,
    spent: purchaseOrders
      .filter(po => po.contractId === c.id && po.status !== 'INVALID' && po.status !== 'REJECTED')
      .reduce((sum, po) => sum + po.totalAmount, 0)
  }));

  return (
    <AppDataContext.Provider value={{
      agencies, equipment, contracts: computedContracts, purchaseOrders, auditLogs,
      exceptionReports, shippingBills, rejectionLetters, backups,
      handleCreateAgency, toggleAgencyStatus, handleCreateContract,
      handleStockAdjustment, handleCreatePo, validatePurchaseOrder,
      generateRejectionLetter, handleSendRejectionLetter, handleInventoryCheck,
      handleConfirmExceptionReport, handleCreateShippingBill, handleConfirmShippingBill, handleUpdateShippingStatus, closeAndArchivePo,
      triggerDatabaseBackup, triggerDatabaseRestore,
      handleUpdateAgency, handleDeleteAgency, handleUpdateContract, handleDeleteContract, toggleContractStatus,
      handleCreateEquipment, handleUpdateEquipment, handleDeleteEquipment, handleUpdatePo, handleDeletePo,
      addAuditLog
    }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataContext);
}
