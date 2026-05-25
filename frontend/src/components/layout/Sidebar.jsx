import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import { LayoutDashboard, Building2, FileText, Box, Truck, Settings } from 'lucide-react';

export default function Sidebar() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;
  const { role } = currentUser;

  const showAgencies = role === ROLES.SYSTEM_ADMIN || role === ROLES.CONTRACTING_OFFICER;
  const showOrders = role === ROLES.SYSTEM_ADMIN || role === ROLES.CONTRACTING_OFFICER;
  const showInventory = role === ROLES.SYSTEM_ADMIN || role === ROLES.ORDER_FULFILLMENT_STAFF || role === ROLES.WAREHOUSE_STAFF;
  const showShipping = role === ROLES.SYSTEM_ADMIN || role === ROLES.ORDER_FULFILLMENT_STAFF;
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
        <NavLink 
          to="/agencies" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Building2 size={18} />
          Agencies & Contracts
        </NavLink>
      )}

      {showOrders && (
        <NavLink 
          to="/orders" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          Purchase Orders
        </NavLink>
      )}

      {showInventory && (
        <NavLink 
          to="/inventory" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Box size={18} />
          Inventory & Catalog
        </NavLink>
      )}

      {showShipping && (
        <NavLink 
          to="/shipping" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Truck size={18} />
          Shipping Bills
        </NavLink>
      )}

      {/* Admin Utilities (Only visible to SYSTEM_ADMIN) */}
      {showAdmin && (
        <NavLink 
          to="/admin" 
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
