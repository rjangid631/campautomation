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
    const response = await fetch('http://127.0.0.1:8000/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: email, password }),  // ✅ key fix here
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
      clientId: data.clientId,      // ✅ double-check backend uses `clientId`
      name: data.username || data.name,
      token: data.token,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Login failed');
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

    // Log the full response to debug structure
    console.log("🧾 Backend response:", response);

    if (response.status === 201 || response.status === 200) {
      return response;  // ✅ Return full Axios response
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
    const response = await api.post('test-case-data/', payload); // ✅ USE CUSTOM `api`
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

// ✅ HARD-CODED COORDINATOR LOGIN
export const loginAsCoordinator = async (username, password) => {
  const coordinatorCredentials = {
    username: "campcalculator@123",
    password: "camp15042002",
  };

  if (username === coordinatorCredentials.username && password === coordinatorCredentials.password) {
    return { role: "Coordinator", username };
  } else {
    throw new Error("Invalid coordinator credentials.");
  }
};
