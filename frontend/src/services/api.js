const BASE_URL = '';

async function request(path, options = {}) {
  const token = localStorage.getItem('gsc-auth-token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Tự động xử lý khi Token hết hạn hoặc không hợp lệ
  if (response.status === 401 && !path.includes('/api/auth/login')) {
    localStorage.removeItem('gsc-auth-token');
    localStorage.removeItem('gsc-current-user');
    window.dispatchEvent(new Event('auth-unauthorized'));
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Đã có lỗi xảy ra từ máy chủ!');
  }
  return data;
}

export const api = {
  get: (path, options) => request(path, { method: 'GET', ...options }),
  post: (path, body, options) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options }),
  put: (path, body, options) => request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...options }),
  patch: (path, body, options) => request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options }),
};
