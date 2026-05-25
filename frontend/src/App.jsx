import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import Layout from './components/layout/Layout';
import Overview from './pages/Overview';
import AgenciesContracts from './pages/AgenciesContracts';
import PurchaseOrders from './pages/PurchaseOrders';
import Inventory from './pages/Inventory';
import Shipping from './pages/Shipping';
import Admin from './pages/Admin';
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
              <Route path="agencies" element={<AgenciesContracts />} />
              <Route path="orders" element={<PurchaseOrders />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="shipping" element={<Shipping />} />
              <Route path="admin" element={<Admin />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  );
}
