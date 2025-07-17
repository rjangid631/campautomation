import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach token for authenticated requests
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Token ${token}`;
    return config;
  },
  error => Promise.reject(error)
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

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();

    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    return {
      role: 'Customer',
      clientId: data.clientId,
      name: data.username || data.name,
      token: data.token,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
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


// ✅ LOGIN: Coordinator (hardcoded)
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

// API handlers object
export const apiHandlers = {
  // Client Dashboard API
  getClientDashboard: async (clientId) => {
    try {
      const response = await axios.get(
       `${BASE_URL}/api/client-dashboard/?client_id=${clientId}` ,
        getAuthHeaders()
      );
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
        `${BASE_URL}/camps/${clientId}/`,
        getAuthHeaders()
      );
      
      // Filter camps by client ID and ready_to_go status
      const filteredCamps = response.data.filter(camp => 
        camp.client === clientId && camp.ready_to_go === true
      );
      
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
  }
};




export default api;