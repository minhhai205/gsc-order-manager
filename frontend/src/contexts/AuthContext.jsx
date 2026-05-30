import React, { createContext, useState, useContext, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  CONTRACTING_OFFICER: 'CONTRACTING_OFFICER',
  ORDER_FULFILLMENT_STAFF: 'ORDER_FULFILLMENT_STAFF',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF'
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('gsc-current-user');
    return saved ? JSON.parse(saved) : null;
  });

  const [authToken, setAuthToken] = useState(() => localStorage.getItem('gsc-auth-token') || '');
  const [users, setUsers] = useState([]);

  // Fetch current user details on mount to restore session & verify token validity
  useEffect(() => {
    if (authToken && !currentUser) {
      api.get('/api/auth/me')
        .then(user => {
          const mappedUser = {
            id: user.id,
            name: user.fullName,
            username: user.email.split('@')[0],
            email: user.email,
            role: user.role,
            status: user.status,
            department: user.department,
            themeClass: localStorage.getItem(`gsc-theme-${user.id}`) || 'default',
            notifications: JSON.parse(localStorage.getItem(`gsc-notifications-${user.id}`)) || { emailAlerts: true, stockAlerts: true, dbAlerts: false }
          };
          setCurrentUser(mappedUser);
          localStorage.setItem('gsc-current-user', JSON.stringify(mappedUser));
        })
        .catch(err => {
          console.error('Session restoration failed', err);
          logout();
        });
    }
  }, [authToken]);

  // Sync users list if SYSTEM_ADMIN is logged in
  useEffect(() => {
    if (currentUser && currentUser.role === ROLES.SYSTEM_ADMIN && authToken) {
      api.get('/api/users?size=100')
        .then(body => {
          if (body && body.data && body.data.content) {
            setUsers(body.data.content.map(u => ({
              id: u.id,
              username: u.email.split('@')[0],
              name: u.fullName,
              email: u.email,
              role: u.role,
              status: u.status,
              department: u.department
            })));
          }
        })
        .catch(err => {
          console.error('Failed to load user accounts', err);
        });
    } else {
      setUsers([]);
    }
  }, [currentUser, authToken]);

  // Apply stored seasonal themes class dynamically to body element
  useEffect(() => {
    if (currentUser && currentUser.themeClass) {
      document.body.className = currentUser.themeClass;
    } else {
      document.body.className = 'default';
    }
  }, [currentUser]);

  // Listen to global unauthorized events (e.g. 401 response from api.js)
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (username, password) => {
    try {
      let email = username;
      if (!email.includes('@')) {
        email = `${username.toLowerCase()}@gsc.local`;
      }

      const data = await api.post('/api/auth/login', { email, password });
      
      if (data && data.accessToken) {
        const user = data.user;
        const mappedUser = {
          id: user.id,
          name: user.fullName,
          username: user.email.split('@')[0],
          email: user.email,
          role: user.role,
          status: user.status,
          department: user.department,
          themeClass: localStorage.getItem(`gsc-theme-${user.id}`) || 'default',
          notifications: JSON.parse(localStorage.getItem(`gsc-notifications-${user.id}`)) || { emailAlerts: true, stockAlerts: true, dbAlerts: false }
        };

        if (mappedUser.status === 'DISABLED') {
          return { success: false, message: 'Tài khoản này đã bị khoá bởi Quản trị viên!' };
        }

        setAuthToken(data.accessToken);
        setCurrentUser(mappedUser);
        localStorage.setItem('gsc-auth-token', data.accessToken);
        localStorage.setItem('gsc-current-user', JSON.stringify(mappedUser));
        return { success: true };
      }
      return { success: false, message: 'Đăng nhập thất bại!' };
    } catch (err) {
      return { success: false, message: err.message || 'Sai tên đăng nhập hoặc mật khẩu!' };
    }
  };

  const register = async (username, password, name, role) => {
    try {
      let email = username;
      if (!email.includes('@')) {
        email = `${username.toLowerCase()}@gsc.local`;
      }

      await api.post('/api/auth/register', {
        fullName: name,
        email,
        password,
        role,
        department: 'GSC HQ'
      });

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Đăng ký tài khoản thất bại!' };
    }
  };

  const logout = () => {
    // Optionally call logout endpoint (non-blocking)
    api.post('/api/auth/logout').catch(() => {});
    
    setAuthToken('');
    setCurrentUser(null);
    setUsers([]);
    localStorage.removeItem('gsc-auth-token');
    localStorage.removeItem('gsc-current-user');
    document.body.className = 'default';
  };

  const updateProfile = async (name, password, themeClass, notifications) => {
    if (!currentUser) return { success: false, message: 'Chưa đăng nhập!' };
    
    try {
      // Update core details on backend
      const updatedBackend = await api.put(`/api/users/${currentUser.id}`, {
        fullName: name,
        email: currentUser.email,
        department: currentUser.department || 'GSC HQ'
      });

      // Update local settings
      localStorage.setItem(`gsc-theme-${currentUser.id}`, themeClass);
      localStorage.setItem(`gsc-notifications-${currentUser.id}`, JSON.stringify(notifications));

      const updated = { 
        ...currentUser, 
        name: updatedBackend.data.fullName, 
        themeClass, 
        notifications 
      };
      
      setCurrentUser(updated);
      localStorage.setItem('gsc-current-user', JSON.stringify(updated));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Cập nhật tài khoản thất bại!' };
    }
  };

  const adminCreateUser = async (username, password, name, role, status = 'ACTIVE') => {
    if (!currentUser || currentUser.role !== ROLES.SYSTEM_ADMIN) {
      return { success: false, message: 'Yêu cầu quyền Quản trị viên!' };
    }

    try {
      let email = username;
      if (!email.includes('@')) {
        email = `${username.toLowerCase()}@gsc.local`;
      }

      const res = await api.post('/api/users', {
        fullName: name,
        email,
        password,
        role,
        department: 'GSC HQ'
      });

      if (status === 'DISABLED' && res.data && res.data.id) {
        await api.patch(`/api/users/${res.data.id}/disable`);
      }

      // Re-fetch users
      const body = await api.get('/api/users?size=100');
      if (body && body.data && body.data.content) {
        setUsers(body.data.content.map(u => ({
          id: u.id,
          username: u.email.split('@')[0],
          name: u.fullName,
          email: u.email,
          role: u.role,
          status: u.status,
          department: u.department
        })));
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Tạo tài khoản thất bại!' };
    }
  };

  const adminUpdateUser = async (username, { name, role, status }) => {
    if (!currentUser || currentUser.role !== ROLES.SYSTEM_ADMIN) {
      return { success: false, message: 'Yêu cầu quyền Quản trị viên!' };
    }

    try {
      const targetUser = users.find(u => u.username === username.toLowerCase());
      if (!targetUser) {
        return { success: false, message: 'Không tìm thấy người dùng!' };
      }

      // Update basic info
      await api.put(`/api/users/${targetUser.id}`, {
        fullName: name,
        email: targetUser.email,
        department: targetUser.department || 'GSC HQ'
      });

      // Update role if changed
      if (role !== targetUser.role) {
        await api.patch(`/api/users/${targetUser.id}/role`, { role });
      }

      // Update status if changed
      if (status !== targetUser.status) {
        if (status === 'DISABLED') {
          await api.patch(`/api/users/${targetUser.id}/disable`);
        } else {
          await api.patch(`/api/users/${targetUser.id}/enable`);
        }
      }

      // Re-fetch users list
      const body = await api.get('/api/users?size=100');
      if (body && body.data && body.data.content) {
        const updatedUsers = body.data.content.map(u => ({
          id: u.id,
          username: u.email.split('@')[0],
          name: u.fullName,
          email: u.email,
          role: u.role,
          status: u.status,
          department: u.department
        }));
        setUsers(updatedUsers);

        // If updated self, sync own session
        if (currentUser.id === targetUser.id) {
          const self = updatedUsers.find(u => u.id === currentUser.id);
          const mappedSelf = {
            ...currentUser,
            name: self.name,
            role: self.role,
            status: self.status
          };
          setCurrentUser(mappedSelf);
          localStorage.setItem('gsc-current-user', JSON.stringify(mappedSelf));
        }
      }

      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Cập nhật tài khoản thất bại!' };
    }
  };

  const adminDeleteUser = async (username) => {
    return { success: false, message: 'Xóa tài khoản không được hỗ trợ ở phía backend (chỉ hỗ trợ khóa tài khoản).' };
  };

  const hasAccess = (allowedRoles) => {
    if (!currentUser) return false;
    return allowedRoles.includes(currentUser.role);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      authToken,
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
