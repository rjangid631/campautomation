import axios from 'axios';



// ✅ ADD this utility function after imports
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      console.warn(`Request failed, retrying... (${i + 1}/${maxRetries})`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
};



const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000, // Increased timeout for camp status requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach token for authenticated requests
// ✅ Enhanced request interceptor with dual token support
api.interceptors.request.use(
  (config) => {
    // Check for both token types
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('access_token');
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// ✅ Response interceptor for better error handling
// ✅ Enhanced response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear all authentication tokens
      localStorage.removeItem('token');
      localStorage.removeItem('access_token'); 
      localStorage.removeItem('clientId');
      localStorage.removeItem('companyName');
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

    if (!data.access || !data.client_id) {
      console.error("Login response:", data);
      throw new Error("Authentication data incomplete");
    }

    // ✅ ADD THESE LINES - Store tokens and user info for CustomerDashboard
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('clientId', data.client_id);
    localStorage.setItem('companyName', data.name || 'Company');

    return {
      token: data.access,  
      refreshToken: data.refresh,
      role: data.login_type,  
      username: data.name,    
      clientId: data.client_id,  
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
    return { role: "Coordinator", username , token: "hardcoded-coordinator-token-123456" };
  } 
  else if (username === onsiteCoordinatorCredentials.username && 
           password === onsiteCoordinatorCredentials.password) {
    return { role: "OnsiteCoordinator", username , token: "hardcoded-onsite-coordinator-token-789012"};
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
export const submitCostDetails = async (companyId, payload) => {
  try {
    console.log('🔧 API: Sending payload to backend:', payload);
    console.log('🔧 API: CostDetails type:', typeof payload.costDetails);
    
    const response = await fetch(`${BASE_URL}/api/cost_details/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error Response:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✅ API Success Response:', result);
    return result;
    
  } catch (error) {
    console.error('❌ API Error in submitCostDetails:', error);
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

// ✅ Enhanced authentication headers helper
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const accessToken = localStorage.getItem('access_token');
  
  if (accessToken) {
    return {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  } else if (token) {
    return {
      headers: {
        Authorization: `Token ${token}`,
      },
    };
  }
  return { headers: {} };
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
  uploadReport: `${BASE_URL}/api/campmanager/upload/`,
  downloadReports: (campId) => `${BASE_URL}/api/technician/report-links/${campId}`,
  onsiteCamps: `${BASE_URL}/api/campmanager/camps/`,
  onsitePackagePatients: (campId, packageId) => `${BASE_URL}/api/campmanager/patients/filter/?camp_id=${campId}&package_id=${packageId}`,
  addPatient: `${BASE_URL}/api/campmanager/patients/`,
  printThermalSlips: `${BASE_URL}/api/campmanager/print-thermal-slips/`,
  // ADD this line in apiEndpoints
 campReportsDetail: (campId) => `${BASE_URL}/api/campmanager/detail/${campId}/`,

  statusCamps: `${BASE_URL}/api/campmanager/camps/`,
  statusAllCamps: `${BASE_URL}/api/camps/`,
  statusCampDetails: (campId) => `${BASE_URL}/api/technician/camp/${campId}/progress/`,
  audiometristSignature: (technicianId) => `${BASE_URL}/api/technician/audiometrist-signature/?technician_id=${technicianId}`,

  // Add dental endpoints
  dental: {
    patientDetails: '/campmanager/patient/',
    consultation: '/technician/dental-consultation/',
    finalSubmit: '/technician/submit/'
  }
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
      },
      timeout: 15000 // Add timeout
    });
    
    if (!response.data) {
      throw new Error("No data received from server");
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching client dashboard:', error);
    
    // Enhanced error messaging
    if (error.response?.status === 404) {
      throw new Error("Client data not found. Please verify your account.");
    } else if (error.response?.status === 403) {
      throw new Error("Access denied. Please contact administrator.");
    } else if (error.code === 'ECONNABORTED') {
      throw new Error("Request timeout. Please try again.");
    }
    
    throw error;
  }
},

   

  checkConnection: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/health/`, {
        timeout: 5000,
        headers: getAuthHeaders().headers
      });
      return response.status === 200;
    } catch (error) {
      console.error('Connection check failed:', error);
      return false;
    }
  },
  // Camp Manager API - Get all camps
   getCamps: async (clientId) => {
    return retryRequest(async () => {
      const response = await axios.get(
        `${BASE_URL}/api/camps/?client_id=${clientId}`,
        getAuthHeaders()
      );
  
      if (!Array.isArray(response.data)) {
        console.warn('Unexpected response format:', response.data);
        return [];
      }
  
      const filteredCamps = response.data.filter(camp => camp.ready_to_go === true);
      return filteredCamps;
    });
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
  // ADD this method in apiHandlers object
  getCampReports: async (campId) => {
    try {
      console.log(`📤 Fetching camp reports for camp ID: ${campId}`);
      const response = await fetch(`${BASE_URL}/api/campmanager/detail/${campId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("✅ Camp reports data received:", data);
      
      // Clean up Google Drive link format
      if (data.google_drive_link) {
        data.google_drive_link = data.google_drive_link.replace(/^\[|\]$/g, '');
        const linkMatch = data.google_drive_link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (linkMatch) {
          data.google_drive_link = linkMatch[2];
        }
      }
      
      return data;
    } catch (error) {
      console.error("❌ Error fetching camp reports:", error);
      return null;
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
    getSignature: (technicianId) => fetchAudiometristSignature(technicianId),
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

  
  // ADD these new sections after dashboard:
  invoices: {
    getHistory: (campId) => apiHandlers.getInvoiceHistory(campId),
  },
  
  reports: {
    getAll: (campId) => apiHandlers.getReports(campId),
    getCampReports: (campId) => apiHandlers.getCampReports(campId),
  },

  status: {
    getActiveCamps: () => campService.getActiveCamps(),
    getAllCamps: () => campService.getAllCamps(),
    getCampDetails: (campId) => campService.getCampDetails(campId),
    getMultipleCampDetails: (campIds) => campService.getMultipleCampDetails(campIds),
    processServiceStats: (campDetailsMap) => dataProcessors.processServiceStats(campDetailsMap),
    calculateUniqueTechnicians: (campDetailsMap) => dataProcessors.calculateUniqueTechnicians(campDetailsMap),
    groupCampsByLocation: (camps) => dataProcessors.groupCampsByLocation(camps),
    calculateMetrics: (campDetailsMap) => dataProcessors.calculateMetrics(campDetailsMap),
  },
  
  // Dental services
  dental: {
    getPatientDetails: async (patientId) => {
      try {
        const response = await api.get(`/campmanager/patient/${patientId}/`);
        console.log("✅ Patient Data Fetched:", response.data);
        return response.data;
      } catch (error) {
        console.error("❌ Error fetching patient details:", error);
        throw error;
      }
    },
    submitConsultation: async (submissionData) => {
      try {
        const response = await api.post('/technician/dental-consultation/', submissionData);
        console.log('✅ Consultation submission success:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error submitting consultation:', error);
        throw error;
      }
    },
    submitFinal: async (finalPayload) => {
      try {
        const response = await api.post('/technician/submit/', finalPayload);
        console.log('✅ Final submit success:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error in final submission:', error);
        throw error;
      }
    }
  },
  
  // Generic methods
  get: (url) => apiHandlers.get(url),
  post: (url, data) => apiHandlers.post(url, data),
  put: (url, data) => apiHandlers.put(url, data),
  patch: (url, data) => apiHandlers.patch(url, data),
  delete: (url) => apiHandlers.delete(url),
};

// Submit audiometry data
export const submitAudiometryData = async (formData, pdfBlob = null, technicianId = null) => {
  const form = new FormData();

  form.append('patient_unique_id', formData.PatientId);
  if (formData.rightEarLevel) form.append('right_ear_finding', formData.rightEarLevel);
  if (formData.leftEarLevel) form.append('left_ear_finding', formData.leftEarLevel);

  const freq = ['250', '500', '1000', '2000', '4000', '8000'];
  const rightAir = (formData.rightEarDB || '').split(',').map(v => v.trim());
  const leftAir = (formData.leftEarDB || '').split(',').map(v => v.trim());
  const rightBone = (formData.rightEarBoneDB || '').split(',').map(v => v.trim());
  const leftBone = (formData.leftEarBoneDB || '').split(',').map(v => v.trim());

  freq.forEach((hz, idx) => {
    if (leftAir[idx]) form.append(`left_air_${hz}`, leftAir[idx]);
    if (rightAir[idx]) form.append(`right_air_${hz}`, rightAir[idx]);
    if (leftBone[idx]) form.append(`left_bone_${hz}`, leftBone[idx]);
    if (rightBone[idx]) form.append(`right_bone_${hz}`, rightBone[idx]);
  });

  if (technicianId) {
    form.append('technician_id', technicianId);   // ✅ correct key
  }

  if (pdfBlob) {
    form.append('pdf_report', pdfBlob, `${formData.PatientId}_audiometry.pdf`);
  }

  const response = await fetch(`${BASE_URL}/api/technician/audiometry/`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData?.detail || errorData?.patient_unique_id || errorData.message || 'Failed to save audiometry data'
    );
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
  const response = await fetch(`${BASE_URL}/api/campmanager/patient/${patientId}/`, {
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



export const fetchAudiometristSignature = async (technicianId) => {
  try {
    const response = await api.get(apiEndpoints.audiometristSignature(technicianId));
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch signature:', error);
    throw new Error(error.response?.data?.message || "Signature not found");
  }
};



export const fetchPackagesByCamp = async (campId) => {
  try {
    const response = await api.get(`serviceselection/?camp=${campId}`);
    if (response.data && response.data.length > 0) {
      // The API returns an array, get the first item
      const serviceSelection = response.data[0];
      
      return serviceSelection.packages.map((pkg, index) => ({
        id: `${serviceSelection.id}-${index}`, // Generate a unique ID
        packageId: `${serviceSelection.id}-${index}`, 
        package_name: pkg.package_name,
        services: Object.keys(pkg.services || {}), // Extract service names
        start_date: pkg.start_date,
        end_date: pkg.end_date,
        camp: serviceSelection.camp,
        client: serviceSelection.client
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching packages by camp:', error);
    throw error;
  }
};

// ✅ NEW: Dashboard specific API functions for shared code reuse
export const dashboardAPI = {
  // Get all camps for dashboard
  getAllCamps: async () => {
    try {
      const response = await api.get('campmanager/camps/');
      return response.data;
    } catch (error) {
      console.error('Error fetching camps:', error);
      throw error;
    }
  },

  // Get camp details with packages
  getCampDetails: async (campId) => {
    try {
      const response = await api.get(`campmanager/camps/${campId}/details/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching camp details:', error);
      throw error;
    }
  },

  // Delete a camp
  deleteCamp: async (campId) => {
    try {
      await api.delete(`campmanager/camps/${campId}/`);
      return true;
    } catch (error) {
      console.error('Error deleting camp:', error);
      throw error;
    }
  },

  // Get patients for a specific package
  getPackagePatients: async (campId, packageId) => {
    try {
      const response = await api.get(`campmanager/patients/filter/?camp_id=${campId}&package_id=${packageId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching package patients:', error);
      throw error;
    }
  },

  // Upload report
  uploadReport: async (campId, driveLink) => {
    try {
      const response = await api.post('campmanager/upload/', {
        camp: campId,
        google_drive_link: driveLink
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading report:', error);
      throw error;
    }
  },

  // Get download reports
  getDownloadReports: async (campId) => {
    try {
      const response = await api.get(`technician/report-links/${campId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching download reports:', error);
      throw error;
    }
  },

  // Optionally, add a method to fetch camp info if needed
  getCampInfo: async (campId) => {
    try {
      const response = await api.get(`campmanager/detail/${campId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching camp info:', error);
      throw error;
    }
  },
};



// ✅ NEW: OnSite Dashboard specific API functions
export const onsiteAPI = {
  // Get all camps for onsite dashboard
  getAllCamps: async () => {
    try {
      const response = await api.get('campmanager/camps/');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch camps: ${error.message}`);
    }
  },

  // Get camp details with packages
  getCampDetails: async (campId) => {
    try {
      const response = await api.get(`campmanager/camps/${campId}/details/`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch camp details: ${error.message}`);
    }
  },

  // Get camps ready to go
  getReadyCamps: async () => {
    try {
      const response = await api.get('campmanager/camps/');
      return response.data.filter(camp => camp.ready_to_go === true);
    } catch (error) {
      throw new Error(`Failed to fetch ready camps: ${error.message}`);
    }
  },

  // Get patients for a specific package
  getPackagePatients: async (campId, packageId) => {
    try {
      const response = await api.get(`campmanager/patients/filter/?camp_id=${campId}&package_id=${packageId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch package patients: ${error.message}`);
    }
  },

  // Add new patient
  addPatient: async (patientData) => {
    try {
      const response = await api.post('campmanager/patients/', patientData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to add patient';
      throw new Error(errorMessage);
    }
  },

  // Validate patient data before submission
  validatePatientData: (patientData) => {
    const errors = [];
    const requiredFields = ['patient_id', 'name', 'age', 'gender', 'phone', 'services'];
    
    requiredFields.forEach(field => {
      if (!patientData[field] || (typeof patientData[field] === 'string' && !patientData[field].trim())) {
        errors.push(field.replace('_', ' ').toUpperCase());
      }
    });

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  },

  // Format patient data for API submission
  formatPatientData: (formData, selectedCamp, selectedPackage) => {
    return {
      patient_id: formData.patient_id.trim(),
      name: formData.name.trim(),
      age: parseInt(formData.age),
      gender: formData.gender,
      phone: formData.phone.trim(),
      services: formData.services.split(',').map(s => s.trim()).filter(s => s),
      load_number: formData.load_number || null,
      package_id: selectedPackage.id,
      camp_id: selectedCamp.id
    };
  },

  // Print thermal slips for patients
  printThermalSlips: async (patientIds) => {
    try {
      const response = await api.post('campmanager/print-thermal-slips/', {
        patient_ids: patientIds
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to print thermal slips: ${error.message}`);
    }
  },

  // Generate print window content
  generatePrintContent: (patient) => {
    return `
      <html>
        <head>
          <title>Patient Details - ${patient.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .patient-card { border: 1px solid #ddd; padding: 20px; margin: 10px 0; border-radius: 8px; }
            .qr-code { max-width: 200px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="patient-card">
            <h2>Patient Details</h2>
            <p><strong>Name:</strong> ${patient.name}</p>
            <p><strong>Patient ID:</strong> ${patient.unique_patient_id}</p>
            <p><strong>Age:</strong> ${patient.age}</p>
            <p><strong>Gender:</strong> ${patient.gender}</p>
            <p><strong>Phone:</strong> ${patient.phone}</p>
            <p><strong>Services:</strong> ${patient.services.join(', ')}</p>
            <div>
              <strong>QR Code:</strong><br>
              <img src="${patient.qr_code_url}" alt="QR Code" class="qr-code">
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;
  },

  // Upload patient details (photo and identity)
  uploadPatientDetails: async (formData) => {
    try {
      const response = await fetch(`${BASE_URL}/api/campmanager/upload-photo-identity/`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload patient details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in uploadPatientDetails:', error);
      throw error;
    }
  },
};



// ✅ NEW: Utility functions for OnSite Dashboard
export const onsiteUtils = {
  // Format date for display
  formatDate: (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  },

  // Get camp status based on dates
  getCampStatus: (startDate, endDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (today < start) {
      return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (today >= start && today <= end) {
      return { status: 'Active', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'Completed', color: 'bg-gray-100 text-gray-800' };
    }
  },

  // Filter patients based on search term
  filterPatients: (patients, searchTerm) => {
    if (!searchTerm) return patients;
    
    const term = searchTerm.toLowerCase();
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(term) ||
      patient.unique_patient_id.toLowerCase().includes(term) ||
      patient.phone.includes(term) ||
      patient.services.some(service => service.toLowerCase().includes(term))
    );
  },

  // Group camps by client
  groupCampsByClient: (camps) => {
    return camps.reduce((acc, camp) => {
      if (!acc[camp.client]) acc[camp.client] = [];
      acc[camp.client].unshift(camp);
      return acc;
    }, {});
  }
};



// ✅ NEW: Camp Service Functions for StatusTracking Dashboard
export const campService = {
  // Get active camps (ready to go)
  getActiveCamps: async () => {
    try {
      const response = await api.get('campmanager/camps/');
      return response.data.filter(camp => camp.ready_to_go === true);
    } catch (error) {
      console.error('Error fetching active camps:', error);
      throw error;
    }
  },

  // Get all camps
  getAllCamps: async () => {
    try {
      const response = await api.get('camps/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all camps:', error);
      throw error;
    }
  },

  // Get camp details by ID
  getCampDetails: async (campId) => {
    try {
      const response = await api.get(`technician/camp/${campId}/progress/`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch camp details for ${campId}:`, error);
      throw error;
    }
  },

  // Get details for multiple camps
  getMultipleCampDetails: async (campIds) => {
    try {
      const promises = campIds.map(id => campService.getCampDetails(id));
      const results = await Promise.allSettled(promises);
      
      const campDetailsMap = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          campDetailsMap[campIds[index]] = result.value;
        } else {
          console.error(`Failed to fetch details for camp ${campIds[index]}:`, result.reason);
        }
      });
      
      return campDetailsMap;
    } catch (error) {
      console.error('Error fetching multiple camp details:', error);
      throw error;
    }
  }
};


// ✅ NEW: Data Processing Utilities for StatusTracking
export const dataProcessors = {
  // Calculate unique technicians from camp details
  calculateUniqueTechnicians: (campDetailsMap) => {
    const technicianSet = new Set();
    Object.values(campDetailsMap).forEach(camp => {
      camp.technician_summary?.forEach(tech => {
        if (tech.technician__id !== null) {
          technicianSet.add(tech.technician__id);
        }
      });
    });
    return technicianSet.size;
  },

  // Process service statistics for charts
  processServiceStats: (campDetailsMap) => {
    const serviceCountMap = {};
    
    Object.values(campDetailsMap).forEach(camp => {
      camp.service_summary?.forEach(service => {
        const name = service.service__name;
        serviceCountMap[name] = (serviceCountMap[name] || 0) + service.completed;
      });
    });

    const total = Object.values(serviceCountMap).reduce((sum, count) => sum + count, 0);
    const serviceStatsArray = Object.entries(serviceCountMap).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));

    return { serviceCountMap, serviceStatsArray };
  },

  // Group camps by location
  groupCampsByLocation: (camps) => {
    const grouped = {};
    camps.forEach(camp => {
      if (!grouped[camp.location]) grouped[camp.location] = [];
      grouped[camp.location].push(camp);
    });
    return grouped;
  },

  // Calculate aggregate metrics
  calculateMetrics: (campDetailsMap) => {
    const values = Object.values(campDetailsMap);
    
    return {
      totalPatients: values.reduce((sum, camp) => sum + (camp.completed_patients || 0), 0),
      totalPatientsTotal: values.reduce((sum, camp) => sum + (camp.total_patients || 0), 0),
      totalCompletedServices: values.reduce((sum, camp) => sum + (camp.completed_services || 0), 0),
      totalServices: values.reduce((sum, camp) => sum + (camp.total_services || 0), 0),
      completedCamps: values.filter(camp => camp.is_completed).length
    };
  }
};



// Fetch patients for technician dashboard
export const fetchTechnicianPatients = async ({ technicianId, packageId, campId }) => {
  const response = await fetch(
    `${BASE_URL}/api/technician/patients/?technician_id=${technicianId}&package_id=${packageId}&camp_id=${campId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch patients.");
  }
  const data = await response.json();
  return data.patients || [];
};

// Fetch service ID by name
export const fetchServiceIdByName = async (serviceName) => {
  const response = await fetch(`${BASE_URL}/api/service-id/?name=${encodeURIComponent(serviceName)}`);
  if (!response.ok) {
    throw new Error("Failed to fetch service ID for: " + serviceName);
  }
  const data = await response.json();
  return data.id;
};

// Mark service as done (for ECG/X-ray)
export const submitTechnicianServiceDone = async ({ patientId, technicianId, serviceId }) => {
  const response = await fetch(`${BASE_URL}/api/technician/submit/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patient_id: patientId,
      technician_id: technicianId,
      service_id: serviceId
    })
  });
  if (!response.ok) {
    throw new Error("Failed to submit service completion.");
  }
  return await response.json();
};




// Camp Management APIs (for ViewServiceSelection component)
export const campApi = {
  // Get camp details with packages
  getCampDetails: async (campId) => {
    try {
      const response = await api.get(`campmanager/camps/${campId}/details/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching camp details:', error);
      throw error;
    }
  },

  // Update camp (e.g., ready_to_go status)
  updateCamp: async (campId, data) => {
    try {
      const response = await api.patch(`camps/${campId}/`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating camp:', error);
      throw error;
    }
  },

  // Upload Excel file for patient data
  uploadExcel: async (file, packageId, campId) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('package_id', packageId);
      formData.append('camp_id', campId);

      const response = await api.post('campmanager/upload-excel/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading Excel file:', error);
      throw error;
    }
  },
};

// Technician Management APIs (for ViewServiceSelection component)
export const technicianApi = {
  // Get all technicians
  getAllTechnicians: async () => {
    try {
      const response = await api.get('technician/technicians/');
      return response.data;
    } catch (error) {
      console.error('Error fetching technicians:', error);
      throw error;
    }
  },

  // Assign technicians to package with services
  assignPackage: async (campId, packageId, assignments) => {
    try {
      const payload = {
        camp_id: parseInt(campId),
        package_id: packageId,
        assignments: assignments
      };
      
      const response = await api.post('technician/assign-package/', payload);
      return response.data;
    } catch (error) {
      console.error('Error assigning technicians to package:', error);
      throw error;
    }
  },
};

// Service Management APIs (for ViewServiceSelection component)
export const serviceApi = {
  // Service mapping (can be fetched from API if needed)
  getServiceMap: () => {
    return {
      1: "ECG",
      2: "X-ray",
      3: "PFT",
      4: "Audiometry",
      5: "Optometry",
      6: "Doctor Consultation",
      7: "Pathology",
      8: "Dental Consultation",
      9: "Vitals",
      10: "Form 7",
      11: "BMD",
      12: "Tetanus Vaccine",
      13: "Typhoid Vaccine",
      14: "Coordinator",
      15: "CBC",
      16: "Complete Hemogram",
      17: "Hemoglobin",
      18: "Urine Routine",
      19: "Stool Examination",
      20: "Lipid Profile",
      21: "Kidney Profile",
      22: "LFT",
      23: "KFT",
      24: "Random Blood Glucose",
      25: "Blood Grouping"
    };
  },

  // Get service name by ID
  getServiceName: (serviceId) => {
    const serviceMap = serviceApi.getServiceMap();
    return serviceMap[serviceId] || `Service ${serviceId}`;
  },
};

// Utility functions (for ViewServiceSelection component)
export const utils = {
  // Format date for display
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  // Handle API errors
  handleApiError: (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error Response:', error.response.data);
      return error.response.data.message || 'Server error occurred';
    } else if (error.request) {
      // Request was made but no response received
      console.error('API Error Request:', error.request);
      return 'Network error - please check your connection';
    } else {
      // Something else happened
      console.error('API Error:', error.message);
      return error.message || 'An unexpected error occurred';
    }
  },
};

// Combined API object for easy import (for ViewServiceSelection component)
const API = {
  camp: campApi,
  technician: technicianApi,
  service: serviceApi,
  utils: utils,
};

// Individual exports for convenience
export default api;

// Fetch technician assignments
export const fetchTechnicianAssignments = async (technicianId) => {
  const response = await fetch(
   `${BASE_URL}/api/technician/assignments/?technician_id=${technicianId}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch technician assignments");
  }
  const data = await response.json();

  // Process assignments into camps and services
  const assignments = data.assignments || [];
  const campsMap = new Map();
  assignments.forEach((assignment) => {
    const campId = assignment.camp_id;
    if (!campsMap.has(campId)) {
      campsMap.set(campId, {
        camp: {
          id: campId,
          location: assignment.camp_location || "Unknown Location",
          district: "N/A",
          state: "N/A",
          pin_code: "N/A",
          start_date: null,
          end_date: null,
          ready_to_go: false,
          client: "N/A",
        },
        services: [],
      });
    }
    const camp = campsMap.get(campId);
    camp.services.push({
      id: assignment.service_id,
      name: assignment.service_name,
    });
  });

  return Array.from(campsMap.values());
};

// Fetch camp details
export const fetchCampDetails = async (campId) => {
  const response = await fetch(
    `${BASE_URL}/api/campmanager/camps/${campId}/details/`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch camp details for ID: ${campId}`);
  }
  return await response.json();
};

// Fetch patients for a package
export const fetchPatientsForPackage = async ({ technicianId, packageId, campId }) => {
  const response = await fetch(
    `${BASE_URL}/api/technician/patients/?technician_id=${technicianId}&package_id=${packageId}&camp_id=${campId}`
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error || "Failed to fetch patients data");
  }
  const data = await response.json();
  return data.patients || [];
};
