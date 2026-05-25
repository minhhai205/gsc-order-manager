import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  CONTRACTING_OFFICER: 'CONTRACTING_OFFICER',
  ORDER_FULFILLMENT_STAFF: 'ORDER_FULFILLMENT_STAFF',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF'
};

const DEFAULT_USERS = [
  { username: 'admin', password: '123', role: ROLES.SYSTEM_ADMIN, name: 'System Administrator' },
  { username: 'officer', password: '123', role: ROLES.CONTRACTING_OFFICER, name: 'Agent John Miller (CO)' },
  { username: 'fulfillment', password: '123', role: ROLES.ORDER_FULFILLMENT_STAFF, name: 'Sarah Connor (Fulfillment)' },
  { username: 'warehouse', password: '123', role: ROLES.WAREHOUSE_STAFF, name: 'Carl Jenkins (Warehouse)' }
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
    const newUser = { username: username.toLowerCase(), password, name, role };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('gsc-users', JSON.stringify(updatedUsers));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('gsc-current-user');
  };

  const hasAccess = (allowedRoles) => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role) || currentUser.role === ROLES.SYSTEM_ADMIN;
  };

  return (
    <AuthContext.Provider value={{ currentUser, login, register, logout, hasAccess, users }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
