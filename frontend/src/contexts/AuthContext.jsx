import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  CONTRACTING_OFFICER: 'CONTRACTING_OFFICER',
  ORDER_FULFILLMENT_STAFF: 'ORDER_FULFILLMENT_STAFF',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF'
};

const DEFAULT_USERS = [
  { username: 'admin', password: '123', role: ROLES.SYSTEM_ADMIN, name: 'System Administrator', themeClass: 'default', status: 'ACTIVE', notifications: { emailAlerts: true, stockAlerts: true, dbAlerts: true } },
  { username: 'officer', password: '123', role: ROLES.CONTRACTING_OFFICER, name: 'Agent John Miller (CO)', themeClass: 'tet', status: 'ACTIVE', notifications: { emailAlerts: true, stockAlerts: false, dbAlerts: false } },
  { username: 'fulfillment', password: '123', role: ROLES.ORDER_FULFILLMENT_STAFF, name: 'Sarah Connor (Fulfillment)', themeClass: 'summer', status: 'ACTIVE', notifications: { emailAlerts: false, stockAlerts: true, dbAlerts: false } },
  { username: 'warehouse', password: '123', role: ROLES.WAREHOUSE_STAFF, name: 'Carl Jenkins (Warehouse)', themeClass: 'spring', status: 'ACTIVE', notifications: { emailAlerts: false, stockAlerts: true, dbAlerts: false } }
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
      if (matched.status === 'SUSPENDED') {
        return { success: false, message: 'This account has been suspended by the System Administrator.' };
      }
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

  const adminCreateUser = (username, password, name, role, status = 'ACTIVE') => {
    if (!currentUser || currentUser.role !== ROLES.SYSTEM_ADMIN) {
      return { success: false, message: 'Unauthorized! Admin privileges required.' };
    }
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
      status: status || 'ACTIVE',
      notifications: { emailAlerts: true, stockAlerts: true, dbAlerts: false } 
    };
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('gsc-users', JSON.stringify(updatedUsers));
    return { success: true };
  };

  const adminUpdateUser = (username, { name, password, role, status }) => {
    if (!currentUser || currentUser.role !== ROLES.SYSTEM_ADMIN) {
      return { success: false, message: 'Unauthorized! Admin privileges required.' };
    }
    const userIndex = users.findIndex(u => u.username === username.toLowerCase());
    if (userIndex === -1) {
      return { success: false, message: 'User not found!' };
    }
    
    const updatedUsers = [...users];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      name,
      password: password || updatedUsers[userIndex].password,
      role,
      status: status || updatedUsers[userIndex].status || 'ACTIVE'
    };
    
    setUsers(updatedUsers);
    localStorage.setItem('gsc-users', JSON.stringify(updatedUsers));
    
    // If the updated user is the currently logged-in user, update their active session too!
    if (currentUser.username === username.toLowerCase()) {
      const updatedSelf = updatedUsers[userIndex];
      setCurrentUser(updatedSelf);
      localStorage.setItem('gsc-current-user', JSON.stringify(updatedSelf));
    }
    
    return { success: true };
  };

  const adminDeleteUser = (username) => {
    if (!currentUser || currentUser.role !== ROLES.SYSTEM_ADMIN) {
      return { success: false, message: 'Unauthorized! Admin privileges required.' };
    }
    if (currentUser.username === username.toLowerCase()) {
      return { success: false, message: 'Cannot delete your own administrator account!' };
    }
    
    const exists = users.some(u => u.username === username.toLowerCase());
    if (!exists) {
      return { success: false, message: 'User not found!' };
    }
    
    const updatedUsers = users.filter(u => u.username !== username.toLowerCase());
    setUsers(updatedUsers);
    localStorage.setItem('gsc-users', JSON.stringify(updatedUsers));
    return { success: true };
  };

  const hasAccess = (allowedRoles) => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      register, 
      logout, 
      updateProfile, 
      hasAccess, 
      users,
      adminCreateUser,
      adminUpdateUser,
      adminDeleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
