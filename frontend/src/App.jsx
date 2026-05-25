import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import Layout from './components/layout/Layout';
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
              <Route path="co/agencies" element={<ManageAgencies />} />
              <Route path="co/contracts" element={<ManageContracts />} />
              <Route path="co/orders" element={<ManageOrders />} />
              <Route path="fulfillment/checks" element={<AvailabilityChecks />} />
              <Route path="fulfillment/shipping" element={<ShippingBills />} />
              <Route path="warehouse/stock" style={{ overflow: 'hidden' }} element={<StockAdjustment />} />
              <Route path="admin/utilities" element={<SystemAdmin />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  );
}
