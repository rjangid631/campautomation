import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000, // Increased timeout for camp status requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach token for authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ✅ LOGIN: Customer
export const loginAsCustomer = async (email, password) => {
  try {
    const response = await fetch(`${BASE_URL}/api/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: email, password }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    // Use client_id instead of clientId
    if (!data.access || !data.client_id) {
      console.error("Login response:", data);
      throw new Error("Authentication data incomplete");
    }

    return {
      token: data.access,  // Using access token
      refreshToken: data.refresh,
      role: data.login_type,  // Using login_type as role
      username: data.name,    // Using name as username
      clientId: data.client_id,  // Using client_id
      userId: data.user_id
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// ✅ LOGIN: Technician
export const loginAsTechnician = async (email, password) => {
  console.log(`[API CALL] Attempting technician login with email: ${email}`);

  try {
    const response = await api.post('technician/login/', {
      email,
      password,
    });

    console.log(`[API RESPONSE] Status: ${response.status}`, response.data);

    // Construct login info from response
    const loginInfo = {
      role: 'Technician',
      technicianId: response.data.technician_id,
      name: response.data.name,
      email: response.data.email,
    };

    console.log('[LOGIN SUCCESS] Technician Info:', loginInfo);
    return loginInfo;

  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Technician login failed';
    console.error('[LOGIN FAILED]', error.response?.data || error.message);
    throw new Error(errorMsg);
  }
};

// ✅ LOGIN: Coordinator (updated to handle both types)
export const loginAsCoordinator = async (username, password) => {
  // Regular coordinator credentials
  const coordinatorCredentials = {
    username: "campcalculator@123",
    password: "camp15042002"
  };

  // Onsite coordinator credentials
  const onsiteCoordinatorCredentials = {
    username: "onsite@campcalculator.com",
    password: "onsite12345"
  };

  if (username === coordinatorCredentials.username && 
      password === coordinatorCredentials.password) {
    return { role: "Coordinator", username };
  } 
  else if (username === onsiteCoordinatorCredentials.username && 
           password === onsiteCoordinatorCredentials.password) {
    return { role: "OnsiteCoordinator", username };
  } 
  else {
    throw new Error("Invalid coordinator credentials.");
  }
};

// ✅ REGISTER
export const signupUser = async ({
  client_id,
  name,
  email,
  password,
  contact_number,
  gst_number,
  pan_card,
  district,
  state,
  pin_code,
  landmark
}) => {
  try {
    await api.post('register/', {
      client_id,
      name,
      email,
      password,
      contact_number,
      gst_number,
      pan_card,
      district,
      state,
      pin_code,
      landmark,
    });

    return "Signup successful! You can now log in.";
  } catch (error) {
    console.error("Signup error:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.detail || error.message || "Signup failed"
    );
  }
};

// ✅ CREATE CAMP
export const createCamp = async (campData) => {
  try {
    const response = await api.post('camps/', campData);
    return response.data;
  } catch (error) {
    console.error('Error creating camp:', error.response?.data || error.message);
    throw error;
  }
};

// ✅ CREATE SERVICE SELECTION
export const creatservices = async (data) => {
  try {
    const response = await api.post('serviceselection/', data);

    console.log("🧾 Backend response:", response);

    if (response.status === 201 || response.status === 200) {
      return response;
    } else {
      console.warn("⚠️ Unexpected status:", response.status);
      return {
        success: false,
        error: "Unexpected response status from backend."
      };
    }
  } catch (error) {
    console.error('❌ API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    return {
      success: false,
      error: error.response?.data?.detail || "Backend error occurred."
    };
  }
};

// ✅ FETCH HARD COPY PRICES
export const fetchHardCopyPrices = async () => {
  try {
    const response = await api.get('copyprice/');
    return response.data.reduce((acc, service) => {
      acc[service.name] = parseFloat(service.hard_copy_price);
      return acc;
    }, {});
  } catch (error) {
    console.error('Error fetching hard copy prices:', error);
    throw error;
  }
};

// ✅ SAVE TEST CASE DATA
export const saveTestCaseData = async (payload) => {
  try {
    const response = await api.post('test-case-data/', payload);
    return response.data;
  } catch (error) {
    console.error('❌ Error saving test case data:', error.response?.data || error);
    throw error;
  }
};

// ✅ GET SERVICE COSTS
export const getServiceCosts = async () => {
  try {
    const response = await api.get('service_costs/');
    return response.data;
  } catch (error) {
    console.error('Error fetching service costs:', error);
    throw error;
  }
};

// ✅ SUBMIT COST DETAILS
export const submitCostDetails = async (clientId, costDetails) => {
  try {
    const response = await api.post('cost_details/', {
      clientId,
      costDetails,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting cost details:', error);
    throw error;
  }
};

// ✅ SUBMIT COST SUMMARY
export const submitCostSummary = async (data) => {
  try {
    const response = await api.post('costsummaries/', data);
    return response.data;
  } catch (error) {
    console.error('Error submitting cost summary:', error);
    throw error;
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Token ${token}`,
    },
  };
};

// ✅ API ENDPOINTS - Centralized endpoint management
export const apiEndpoints = {
  // Authentication
  login: `${BASE_URL}/api/login/`,
  register: `${BASE_URL}/api/register/`,
  technicianLogin: `${BASE_URL}/api/technician/login/`,

  // Camp Manager APIs
  camps: `${BASE_URL}/api/campmanager/camps/`,
  allCamps: `${BASE_URL}/api/camps/`,
  campDetails: (campId) => `${BASE_URL}/api/campmanager/camps/${campId}/details/`,
  
  // ✅ NEW: Camp Progress/Status APIs
  campProgress: (campId) => `${BASE_URL}/api/technician/camp/${campId}/progress/`,
  campStatus: (campId) => `${BASE_URL}/api/technician/camp/${campId}/progress/`,
  
  // Patient APIs
  patients: (campId) => `${BASE_URL}/api/camps/${campId}/upload-excel/`,
  packagePatients: (campId, packageId) => `${BASE_URL}/api/campmanager/patients/?camp_id=${campId}&package_id=${packageId}`,
  
  // Technician APIs
  technicians: `${BASE_URL}/api/technicians/`,
  technicianCamps: (technicianId) => `${BASE_URL}/api/technician/${technicianId}/camps/`,

  // Client Dashboard
  clientDashboard: (clientId) => `${BASE_URL}/api/client-dashboard/?client_id=${clientId}`,
  
  // Reports and Invoice
  invoiceHistory: (campId) => `${BASE_URL}/invoice-history/${campId}/`,
  reports: (campId) => `${BASE_URL}/reports/${campId}/`,
  
  // Services
  serviceCosts: `${BASE_URL}/api/service_costs/`,
  serviceSelection: `${BASE_URL}/api/serviceselection/`,
  copyPrices: `${BASE_URL}/api/copyprice/`,
  
  // Cost Management
  costDetails: `${BASE_URL}/api/cost_details/`,
  costSummaries: `${BASE_URL}/api/costsummaries/`,
  testCaseData: `${BASE_URL}/api/test-case-data/`,
};

// API handlers object
export const apiHandlers = {
  // Client Dashboard API
  getClientDashboard: async (clientId) => {
    try {
      if (!clientId || clientId.includes("undefined")) {
      throw new Error("Invalid client ID");
    }
    const formattedClientId = clientId.startsWith('CL-') ? clientId : `CL-${clientId}`;
    
    const response = await axios.get(`${BASE_URL}/api/client-dashboard/`, {
      params: {
        client_id: formattedClientId
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    if (!response.data) {
      throw new Error("No data received");
    }
    return response.data;
    } catch (error) {
      console.error('Error fetching client dashboard:', error);
      throw error;
    }
  },

  // Camp Manager API - Get all camps
  getCamps: async (clientId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/camps/?client_id=${clientId}`,
        getAuthHeaders()
      );

      // Now response.data is an array
      const filteredCamps = response.data.filter(camp => camp.ready_to_go === true);
      
      return filteredCamps;
    } catch (error) {
      console.error('Error fetching camps:', error);
      throw error;
    }
  },

  // Get specific camp details
  getCampDetails: async (campId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/camp-details/${campId}/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching camp details:', error);
      throw error;
    }
  },

  // ✅ NEW: Camp Status/Progress APIs
  getCampProgress: async (campId) => {
    try {
      const response = await api.get(`technician/camp/${campId}/progress/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching camp progress:', error);
      throw error;
    }
  },

  getCampStatus: async (campId) => {
    try {
      const response = await api.get(`technician/camp/${campId}/progress/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching camp status:', error);
      throw error;
    }
  },

  // ✅ NEW: Real-time camp status updates
  getCampStatusRealTime: async (campId) => {
    try {
      const response = await api.get(`technician/camp/${campId}/progress/`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time camp status:', error);
      throw error;
    }
  },

  // Invoice History API
  getInvoiceHistory: async (campId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/invoice-history/${campId}/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice history:', error);
      throw error;
    }
  },

  // Reports API
  getReports: async (campId) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/reports/${campId}/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  // Create new camp
  createCamp: async (campData) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/campmanager/camps/`,
        campData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating camp:', error);
      throw error;
    }
  },

  // Update camp
  updateCamp: async (campId, campData) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/campmanager/camps/${campId}/`,
        campData,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error updating camp:', error);
      throw error;
    }
  },

  // Delete camp
  deleteCamp: async (campId) => {
    try {
      const response = await axios.delete(
        `${BASE_URL}/campmanager/camps/${campId}/`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error deleting camp:', error);
      throw error;
    }
  },

  // Mark camp as ready to go
  markCampReady: async (campId) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/campmanager/camps/${campId}/`,
        { ready_to_go: true },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error marking camp as ready:', error);
      throw error;
    }
  },

  // ✅ NEW: Technician related APIs
  getTechnicians: async () => {
    try {
      const response = await api.get('technicians/');
      return response.data;
    } catch (error) {
      console.error('Error fetching technicians:', error);
      throw error;
    }
  },

  getTechnicianCamps: async (technicianId) => {
    try {
      const response = await api.get(`technician/${technicianId}/camps/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching technician camps:', error);
      throw error;
    }
  },

  // ✅ NEW: Patient related APIs
  getPatients: async (campId) => {
    try {
      const response = await api.get(`camps/${campId}/upload-excel/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  },

  getPackagePatients: async (campId, packageId) => {
    try {
      const response = await api.get(`campmanager/patients/?camp_id=${campId}&package_id=${packageId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching package patients:', error);
      throw error;
    }
  },

  // ✅ NEW: Service related APIs
  getServices: async () => {
    try {
      const response = await api.get('services/');
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  },

  getServiceCosts: async () => {
    try {
      const response = await api.get('service_costs/');
      return response.data;
    } catch (error) {
      console.error('Error fetching service costs:', error);
      throw error;
    }
  },

  // ✅ NEW: Generic API methods
  get: (url) => api.get(url),
  post: (url, data) => api.post(url, data),
  put: (url, data) => api.put(url, data),
  patch: (url, data) => api.patch(url, data),
  delete: (url) => api.delete(url),
};

// ✅ NEW: API Service object for cleaner usage
export const apiService = {
  // Authentication
  login: {
    customer: loginAsCustomer,
    technician: loginAsTechnician,
    coordinator: loginAsCoordinator,
  },
  
  register: signupUser,
  
  // Camp management
  camps: {
    getAll: (clientId) => apiHandlers.getCamps(clientId),
    getDetails: (campId) => apiHandlers.getCampDetails(campId),
    getProgress: (campId) => apiHandlers.getCampProgress(campId),
    getStatus: (campId) => apiHandlers.getCampStatus(campId),
    getStatusRealTime: (campId) => apiHandlers.getCampStatusRealTime(campId),
    create: (campData) => apiHandlers.createCamp(campData),
    update: (campId, campData) => apiHandlers.updateCamp(campId, campData),
    delete: (campId) => apiHandlers.deleteCamp(campId),
    markReady: (campId) => apiHandlers.markCampReady(campId),
  },
  
  // Patient management
  patients: {
    getAll: (campId) => apiHandlers.getPatients(campId),
    getByPackage: (campId, packageId) => apiHandlers.getPackagePatients(campId, packageId),
  },
  
  // Technician management
  technicians: {
    getAll: () => apiHandlers.getTechnicians(),
    getCamps: (technicianId) => apiHandlers.getTechnicianCamps(technicianId),
  },
  
  // Services
  services: {
    getAll: () => apiHandlers.getServices(),
    getCosts: () => apiHandlers.getServiceCosts(),
    create: creatservices,
  },
  
  // Reports and dashboard
  dashboard: {
    getClient: (clientId) => apiHandlers.getClientDashboard(clientId),
  },
  
  // Generic methods
  get: (url) => apiHandlers.get(url),
  post: (url, data) => apiHandlers.post(url, data),
  put: (url, data) => apiHandlers.put(url, data),
  patch: (url, data) => apiHandlers.patch(url, data),
  delete: (url) => apiHandlers.delete(url),
};

// Submit audiometry data
export const submitAudiometryData = async (data) => {
  const response = await fetch(`${BASE_URL}/api/technician/audiometry/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.patient_unique_id || errorData.message || 'Failed to save audiometry data');
  }

  return await response.json();
};

// Mark service as completed
export const markServiceCompleted = async (data) => {
  const response = await fetch(`${BASE_URL}/api/technician/submit/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.message || 'Failed to mark service as completed');
  }

  return await response.json();
};

// Export other API functions as needed
export const fetchPatientData = async (patientId) => {
  const response = await fetch(`${BASE_URL}/api/patient/${patientId}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.message || 'Failed to fetch patient data');
  }

  return await response.json();
};


export default api;
