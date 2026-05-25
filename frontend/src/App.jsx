import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, ROLES } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Overview from './pages/Overview';
import ManageAgencies from './pages/co/ManageAgencies';
import ManageContracts from './pages/co/ManageContracts';
import ManageOrders from './pages/co/ManageOrders';
import AvailabilityChecks from './pages/fulfillment/AvailabilityChecks';
import ShippingBills from './pages/fulfillment/ShippingBills';
import StockAdjustment from './pages/warehouse/StockAdjustment';
import SystemAdmin from './pages/admin/SystemAdmin';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Overview />} />
              <Route 
                path="co/agencies" 
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CONTRACTING_OFFICER]}>
                    <ManageAgencies />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="co/contracts" 
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CONTRACTING_OFFICER]}>
                    <ManageContracts />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="co/orders" 
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CONTRACTING_OFFICER]}>
                    <ManageOrders />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="fulfillment/checks" 
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ORDER_FULFILLMENT_STAFF]}>
                    <AvailabilityChecks />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="fulfillment/shipping" 
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ORDER_FULFILLMENT_STAFF]}>
                    <ShippingBills />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="warehouse/stock" 
                element={
                  <ProtectedRoute allowedRoles={[ROLES.WAREHOUSE_STAFF]}>
                    <StockAdjustment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="admin/utilities" 
                element={
                  <ProtectedRoute allowedRoles={[ROLES.SYSTEM_ADMIN]}>
                    <SystemAdmin />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  );
}
