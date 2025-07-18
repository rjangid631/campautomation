import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach JWT access token to all requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

// ✅ Handle 401 errors by refreshing token
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('refresh_token')
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.post(`${BASE_URL}/api/token/refresh/`, {
          refresh: localStorage.getItem('refresh_token'),
        });

        const newAccess = refreshRes.data.access;
        localStorage.setItem('access_token', newAccess);

        api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (err) {
        console.error("Token refresh failed:", err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// ✅ LOGIN: Customer
export const loginAsCustomer = async (email, password) => {
  try {
    console.log("🚀 Attempting login for:", email);

    const response = await fetch(`${BASE_URL}/api/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    console.log("📡 Login response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Login failed:", errorData);
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    console.log("✅ Login successful. Raw response data:", data);

    // Log token info
    console.log("🔐 Access Token:", data.access);
    console.log("🔁 Refresh Token:", data.refresh);

    // Log client details
    console.log("🧾 Role:", data.login_type);
    console.log("🆔 clientId:", data.client_id);
    console.log("👤 Name:", data.name);
    console.log("🧑‍💻 userId:", data.user_id);
    // ✅ Store tokens
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('clientId', data.client_id); 
    console.log("📦 About to store client_id:", data.client_id);
    return {
      role: data.login_type || 'Customer',
      clientId: data.client_id,
      name: data.name,
      userId: data.user_id,
    };
  } catch (error) {
    console.error('🔥 Login error caught:', error);
    throw new Error(error.message || 'Login failed');
  }
};


// ✅ LOGIN: Technician
export const loginAsTechnician = async (email, password) => {
  try {
    const response = await api.post('technician/login/', { email, password });

    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);

    return {
      role: 'Technician',
      technicianId: response.data.technician_id,
      name: response.data.name,
      email: response.data.email,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Technician login failed';
    console.error('[LOGIN FAILED]', errorMsg);
    throw new Error(errorMsg);
  }
};

// ✅ LOGIN: Coordinator
export const loginAsCoordinator = async (username, password) => {
  const creds = {
    coordinator: { username: "campcalculator@123", password: "camp15042002" },
    onsite: { username: "onsite@campcalculator.com", password: "onsite12345" },
  };

  if (username === creds.coordinator.username && password === creds.coordinator.password) {
    return { role: "Coordinator", username };
  } else if (username === creds.onsite.username && password === creds.onsite.password) {
    return { role: "OnsiteCoordinator", username };
  } else {
    throw new Error("Invalid coordinator credentials.");
  }
};

// ✅ LOGOUT
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// ✅ REGISTER
export const signupUser = async (userData) => {
  try {
    await api.post('register/', userData);
    return "Signup successful! You can now log in.";
  } catch (error) {
    console.error("Signup error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message || "Signup failed");
  }
};

// ✅ CREATE CAMP
export const createCamp = async (campData) => {
  const response = await api.post('camps/', campData);
  return response.data;
};

// ✅ CREATE SERVICE SELECTION
export const creatservices = async (data) => {
  try {
    const response = await api.post('serviceselection/', data);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.detail || error.message || "Backend error occurred.",
    };
  }
};

// ✅ FETCH HARD COPY PRICES
export const fetchHardCopyPrices = async () => {
  const response = await api.get('copyprice/');
  return response.data.reduce((acc, service) => {
    acc[service.name] = parseFloat(service.hard_copy_price);
    return acc;
  }, {});
};

// ✅ SAVE TEST CASE DATA
export const saveTestCaseData = async (payload) => {
  const response = await api.post('test-case-data/', payload);
  return response.data;
};

// ✅ GET SERVICE COSTS
export const getServiceCosts = async () => {
  const response = await api.get('service_costs/');
  return response.data;
};

// ✅ SUBMIT COST DETAILS
export const submitCostDetails = async (clientId, costDetails) => {
  const response = await api.post('cost_details/', { clientId, costDetails });
  return response.data;
};

// ✅ SUBMIT COST SUMMARY
export const submitCostSummary = async (data) => {
  const response = await api.post('costsummaries/', data);
  return response.data;
};

// ✅ API HANDLERS OBJECT
export const apiHandlers = {
  getClientDashboard: async (clientId) => {
    const res = await api.get(`client-dashboard/?client_id=${clientId}`);
    return res.data;
  },
  getCamps: async (clientId) => {
    const res = await api.get(`camps/?client_id=${clientId}`);
    return res.data.filter(camp => camp.ready_to_go === true);
  },
  getCampDetails: async (campId) => {
    const res = await api.get(`${BASE_URL}/camp-details/${campId}/`);
    return res.data;
  },
  getInvoiceHistory: async (campId) => {
    const res = await api.get(`${BASE_URL}/invoice-history/${campId}/`);
    return res.data;
  },
  getReports: async (campId) => {
    const res = await api.get(`${BASE_URL}/reports/${campId}/`);
    return res.data;
  },
  createCamp: async (campData) => {
    const res = await api.post(`${BASE_URL}/campmanager/camps/`, campData);
    return res.data;
  },
  updateCamp: async (campId, data) => {
    const res = await api.put(`${BASE_URL}/campmanager/camps/${campId}/`, data);
    return res.data;
  },
  deleteCamp: async (campId) => {
    const res = await api.delete(`${BASE_URL}/campmanager/camps/${campId}/`);
    return res.data;
  },
  markCampReady: async (campId) => {
    const res = await api.patch(`${BASE_URL}/campmanager/camps/${campId}/`, {
      ready_to_go: true,
    });
    return res.data;
  },
};

export default api;
