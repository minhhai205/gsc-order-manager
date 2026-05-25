import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  CONTRACTING_OFFICER: 'CONTRACTING_OFFICER',
  ORDER_FULFILLMENT_STAFF: 'ORDER_FULFILLMENT_STAFF',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF'
};

const DEFAULT_USERS = [
  { username: 'admin', password: '123', role: ROLES.SYSTEM_ADMIN, name: 'System Administrator', themeClass: 'default', notifications: { emailAlerts: true, stockAlerts: true, dbAlerts: true } },
  { username: 'officer', password: '123', role: ROLES.CONTRACTING_OFFICER, name: 'Agent John Miller (CO)', themeClass: 'tet', notifications: { emailAlerts: true, stockAlerts: false, dbAlerts: false } },
  { username: 'fulfillment', password: '123', role: ROLES.ORDER_FULFILLMENT_STAFF, name: 'Sarah Connor (Fulfillment)', themeClass: 'summer', notifications: { emailAlerts: false, stockAlerts: true, dbAlerts: false } },
  { username: 'warehouse', password: '123', role: ROLES.WAREHOUSE_STAFF, name: 'Carl Jenkins (Warehouse)', themeClass: 'spring', notifications: { emailAlerts: false, stockAlerts: true, dbAlerts: false } }
];

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('gsc-users');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('gsc-users', JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('gsc-current-user');
    return saved ? JSON.parse(saved) : null;
  });

  // Apply stored seasonal themes class dynamically to body element
  useEffect(() => {
    if (currentUser && currentUser.themeClass) {
      document.body.className = currentUser.themeClass;
    } else {
      document.body.className = 'default';
    }
  }, [currentUser]);

  const login = (username, password) => {
    const matched = users.find(u => u.username === username.toLowerCase() && u.password === password);
    if (matched) {
      setCurrentUser(matched);
      localStorage.setItem('gsc-current-user', JSON.stringify(matched));
      return { success: true };
    }
    return { success: false, message: 'Invalid username or password!' };
  };

  const register = (username, password, name, role) => {
    const exists = users.some(u => u.username === username.toLowerCase());
    if (exists) {
      return { success: false, message: 'Username already exists!' };
    }
    const newUser = { 
      username: username.toLowerCase(), 
      password, 
      name, 
      role, 
      themeClass: 'default',
      notifications: { emailAlerts: true, stockAlerts: true, dbAlerts: false } 
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('gsc-users', JSON.stringify(updatedUsers));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gsc-current-user');
    document.body.className = 'default';
  };

  const updateProfile = (name, password, themeClass, notifications) => {
    if (!currentUser) return { success: false, message: 'No active session!' };
    
    const updated = { ...currentUser, name, password, themeClass, notifications };
    
    // Write changes back to active storage registry
    const updatedUsers = users.map(u => u.username === currentUser.username ? updated : u);
    setUsers(updatedUsers);
    localStorage.setItem('gsc-users', JSON.stringify(updatedUsers));
    
    setCurrentUser(updated);
    localStorage.setItem('gsc-current-user', JSON.stringify(updated));
    return { success: true };
  };

  const hasAccess = (allowedRoles) => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, updateProfile, hasAccess, users }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
