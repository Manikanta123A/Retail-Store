import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('retail_pro_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        config.headers['X-User-Id'] = user.id;
      }
    } catch (e) {}
  }
  return config;
});

export const customerService = {
  getCustomers: (search = '') => api.get(`/customers/?search=${search}`),
  addCustomer: (data: any) => api.post('/customers/', data),
  getCustomer: (id: string) => api.get(`/customers/${id}`),
  updateCustomer: (id: string, data: any) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/customers/${id}`),
  collectDues: (id: string, amount: number) => api.put(`/customers/${id}/collect`, { amount }),
};

export const itemService = {
  getItems: (search = '') => api.get(`/items/?search=${search}`),
  addItem: (data: any) => api.post('/items/', data),
  updateItem: (id: string, data: any) => api.put(`/items/${id}`, data),
  deleteItem: (id: string) => api.delete(`/items/${id}`),
};

export const billingService = {
  getBills: (search = '', customerId = '') => api.get(`/billing/?search=${search}&customer_id=${customerId}`),
  getBill: (id: string) => api.get(`/billing/${id}`),
  createBill: (data: any) => api.post('/billing/', data),
  deleteBill: (id: string) => api.delete(`/billing/${id}`),
  payBill: (id: string, amount: number) => api.put(`/billing/${id}/pay`, { amount }),
};

export const authService = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  signup: (userData: any) => api.post('/auth/signup', userData),
};

export const dashboardService = {
  getDashboard: (range: string = 'today') => api.get(`/dashboard/?range=${range}`),
};

export default api;
