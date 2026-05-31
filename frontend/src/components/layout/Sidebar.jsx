import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { LayoutDashboard, Building2, FileText, ClipboardCheck, Box, Truck, Settings, Briefcase } from 'lucide-react';

export default function Sidebar() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;
  const { role } = currentUser;

  const showAgencies = role === ROLES.CONTRACTING_OFFICER;
  const showOrders = role === ROLES.CONTRACTING_OFFICER;
  const showChecks = role === ROLES.ORDER_FULFILLMENT_STAFF;
  const showShipping = role === ROLES.WAREHOUSE_STAFF;
  const showWarehouse = role === ROLES.WAREHOUSE_STAFF;
  const showAdmin = role === ROLES.SYSTEM_ADMIN;

  return (
    <aside className="sidebar">
      <NavLink 
        to="/" 
        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
      >
        <LayoutDashboard size={18} />
        Overview
      </NavLink>

      {showAgencies && (
        <>
          <NavLink 
            to="/co/agencies" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Building2 size={18} />
            Federal Agencies
          </NavLink>
          <NavLink 
            to="/co/contracts" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Briefcase size={18} />
            Standing Contracts
          </NavLink>
        </>
      )}

      {showOrders && (
        <NavLink 
          to="/co/orders" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          Purchase Orders
        </NavLink>
      )}

      {showChecks && (
        <NavLink 
          to="/fulfillment/checks" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <ClipboardCheck size={18} />
          Stock Allocations
        </NavLink>
      )}

      {showShipping && (
        <NavLink 
          to="/warehouse/shipping" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Truck size={18} />
          Shipping Bills
        </NavLink>
      )}

      {showWarehouse && (
        <NavLink 
          to="/warehouse/stock" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Box size={18} />
          Catalog & Stock Adjust
        </NavLink>
      )}

      {/* Admin Utilities (Only visible to SYSTEM_ADMIN) */}
      {showAdmin && (
        <NavLink 
          to="/admin/utilities" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          style={{ borderTop: '1px solid var(--border-light)', marginTop: '8px', paddingTop: '16px' }}
        >
          <Settings size={18} />
          Admin Utilities
        </NavLink>
      )}
    </aside>
  );
}
