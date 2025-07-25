import React, { useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import {
  loginAsCoordinator,
  loginAsCustomer,
  signupUser,
  loginAsTechnician,
} from "./api";

function CoordinatorLogin({ onLogin }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    contact_number: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginMode, setLoginMode] = useState("default");
  
  // Add validation errors state
  const [validationErrors, setValidationErrors] = useState({});

  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateContactNumber = (number) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(number);
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
  };

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage("");
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Add validation on blur
  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';

    switch (name) {
      case 'email':
        if (value && !validateEmail(value)) {
          error = 'Please enter a valid email address with @';
        }
        break;
      case 'contact_number':
        if (value && !validateContactNumber(value)) {
          error = 'Contact number must be exactly 10 digits';
        }
        break;
      case 'password':
        if (value && !validatePassword(value)) {
          error = 'Password must contain at least one letter, one number, and one special character';
        }
        break;
      default:
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleCoordinatorLogin = async (e) => {
    e.preventDefault();
    const { username, password } = formData;

    try {
      const response = await loginAsCoordinator(username, password);
      
      console.log('🔐 Coordinator login response:', response);
      
      localStorage.setItem("role", response.role);
      localStorage.setItem("username", response.username);
      localStorage.setItem("loginType", "Coordinator");
      
      if (response.token) {
        localStorage.setItem("token", response.token);
        console.log('✅ Coordinator token stored');
      } else if (response.access_token) {
        localStorage.setItem("token", response.access_token);
        console.log('✅ Coordinator access_token stored as token');
      } else {
        console.error('❌ No token found in coordinator login response');
        console.log('Available keys:', Object.keys(response));
      }
      
      onLogin(response.role);
      
      if (response.role === "OnsiteCoordinator") {
        navigate("/onsite-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleCustomerLogin = async (e) => {
    e.preventDefault();
    const { username, password } = formData;

    try {
      const response = await loginAsCustomer(username, password);
      
      console.log("Login success:", response);
      
      localStorage.setItem("access_token", response.token);
      localStorage.setItem("refresh_token", response.refreshToken);
      localStorage.setItem("role", response.role);
      localStorage.setItem("username", response.username);
      localStorage.setItem("clientId", response.clientId);
      localStorage.setItem("userId", response.userId);
      
      onLogin(response.role, response.clientId);
      navigate("/customer-dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      setErrorMessage(error.message || "Login failed. Please try again.");
    }
  };

  const handleTechnicianLogin = async (e) => {
    e.preventDefault();
    try {
      const { role, technicianId, name, email } = await loginAsTechnician(
        formData.username,
        formData.password
      );

      localStorage.setItem("role", role);
      localStorage.setItem("technicianId", technicianId);
      localStorage.setItem("technicianName", name);
      localStorage.setItem("technicianEmail", email);

      onLogin(role, technicianId);
      navigate("/technical-dashboard");
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const errors = {};
    
    if (!validateEmail(signupData.email)) {
      errors.email = 'Please enter a valid email address with @';
    }
    
    if (!validateContactNumber(signupData.contact_number)) {
      errors.contact_number = 'Contact number must be exactly 10 digits';
    }
    
    if (!validatePassword(signupData.password)) {
      errors.password = 'Password must contain at least one letter, one number, and one special character';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      const successMessage = await signupUser(signupData);
      alert(successMessage);
      setShowSignup(false);
      // Clear form data
      setSignupData({
        name: "",
        email: "",
        password: "",
        contact_number: "",
      });
      setValidationErrors({});
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const getFormTitle = () => {
    if (showSignup) return "Sign Up";
    switch (loginMode) {
      case "coordinator":
        return "Coordinator Login";
      case "customer":
        return "Customer Login";
      case "technician":
        return "Technician Login";
      default:
        return "Login";
    }
  };

  const getUsernameLabel = () => {
    switch (loginMode) {
      case "coordinator":
        return "Coordinator Username";
      case "customer":
        return "Customer Email";
      case "technician":
        return "Technician Email";
      default:
        return "Username/Email";
    }
  };

  const getUsernamePlaceholder = () => {
    switch (loginMode) {
      case "coordinator":
        return "Enter coordinator username";
      case "customer":
        return "Enter customer email";
      case "technician":
        return "Enter technician email";
      default:
        return "Enter username or email";
    }
  };

  const getSubmitHandler = () => {
    if (showSignup) return handleSignupSubmit;
    switch (loginMode) {
      case "coordinator":
        return handleCoordinatorLogin;
      case "customer":
        return handleCustomerLogin;
      case "technician":
        return handleTechnicianLogin;
      default:
        return handleCoordinatorLogin;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden" 
         style={{ backgroundColor: '#11a8a4' }}>
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-20 animate-pulse"
           style={{ backgroundColor: '#7ed957' }}></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full opacity-30 animate-pulse delay-1000"
           style={{ backgroundColor: '#0cc0df' }}></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 rounded-full opacity-25 animate-bounce delay-500"
           style={{ backgroundColor: '#944d0d' }}></div>
      
      {/* QR CAMP Brand Logo Section - Top Left */}
      <div className="absolute top-8 left-8 flex items-center">
        <img
          src="/campanylogo.jpeg"
          alt="Logo"
          className="w-200 h-14 mr-3 rounded-full shadow-lg object-cover"
        />
        <h1 className="text-white text-xl font-bold tracking-wide"></h1>
      </div>

      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
        <h2 className="text-3xl font-bold text-center mb-6"
            style={{ color: '#3c3b3f' }}>
          {getFormTitle()}
        </h2>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Login Mode Selection Buttons */}
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          <button
            type="button"
            className={`px-3 py-1 rounded-xl font-medium transition-all duration-200 text-xs ${
              loginMode === "coordinator" 
                ? "text-white shadow-lg" 
                : "text-gray-600 hover:bg-gray-300"
            }`}
            style={{ 
              backgroundColor: loginMode === "coordinator" ? '#0cc0df' : '#e5e7eb'
            }}
            onClick={() => setLoginMode("coordinator")}
            disabled={showSignup}
          >
            Coordinator
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-xl font-medium transition-all duration-200 text-xs ${
              loginMode === "customer" 
                ? "text-white shadow-lg" 
                : "text-gray-600 hover:bg-gray-300"
            }`}
            style={{ 
              backgroundColor: loginMode === "customer" ? '#0cc0df' : '#e5e7eb'
            }}
            onClick={() => setLoginMode("customer")}
            disabled={showSignup}
          >
            Customer
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded-xl font-medium transition-all duration-200 text-xs ${
              loginMode === "technician" 
                ? "text-white shadow-lg" 
                : "text-gray-600 hover:bg-gray-300"
            }`}
            style={{ 
              backgroundColor: loginMode === "technician" ? '#0cc0df' : '#e5e7eb'
            }}
            onClick={() => setLoginMode("technician")}
            disabled={showSignup}
          >
            Technician
          </button>
        </div>

        <form
          className="flex flex-col gap-y-5"
          onSubmit={getSubmitHandler()}
        >
          {showSignup ? (
            <>
              {/* Sign Up Fields with Validation */}
              <label className="w-full">
                <p className="mb-2 text-sm font-semibold" style={{ color: '#3c3b3f' }}>
                  Name <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type="text"
                  name="name"
                  value={signupData.name}
                  onChange={handleSignupChange}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80"
                  style={{ 
                    '--tw-ring-color': '#0cc0df',
                    borderColor: '#0cc0df'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0cc0df'}
                />
              </label>

              {/* Email with validation */}
              <label className="w-full">
                <p className="mb-2 text-sm font-semibold" style={{ color: '#3c3b3f' }}>
                  Email <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type="email"
                  name="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  onBlur={handleBlur}
                  placeholder="Enter your email"
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 ${
                    validationErrors.email ? 'border-red-500' : 'border-gray-200'
                  }`}
                  style={{ 
                    '--tw-ring-color': validationErrors.email ? '#ef4444' : '#0cc0df',
                    borderColor: validationErrors.email ? '#ef4444' : '#0cc0df'
                  }}
                  onFocus={(e) => e.target.style.borderColor = validationErrors.email ? '#ef4444' : '#0cc0df'}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                )}
              </label>

              {/* Contact Number with validation */}
              <label className="w-full">
                <p className="mb-2 text-sm font-semibold" style={{ color: '#3c3b3f' }}>
                  Contact Number <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type="text"
                  name="contact_number"
                  value={signupData.contact_number}
                  onChange={handleSignupChange}
                  onBlur={handleBlur}
                  placeholder="Enter your 10-digit contact number"
                  maxLength={10}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 ${
                    validationErrors.contact_number ? 'border-red-500' : 'border-gray-200'
                  }`}
                  style={{ 
                    '--tw-ring-color': validationErrors.contact_number ? '#ef4444' : '#0cc0df',
                    borderColor: validationErrors.contact_number ? '#ef4444' : '#0cc0df'
                  }}
                  onFocus={(e) => e.target.style.borderColor = validationErrors.contact_number ? '#ef4444' : '#0cc0df'}
                  onKeyPress={(e) => {
                    // Only allow numbers
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
                {validationErrors.contact_number && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.contact_number}</p>
                )}
              </label>

              {/* Password with validation */}
              <label className="relative">
                <p className="mb-2 text-sm font-semibold" style={{ color: '#3c3b3f' }}>
                  Password <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  onBlur={handleBlur}
                  placeholder="Enter Password"
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80 ${
                    validationErrors.password ? 'border-red-500' : 'border-gray-200'
                  }`}
                  style={{ 
                    '--tw-ring-color': validationErrors.password ? '#ef4444' : '#0cc0df',
                    borderColor: validationErrors.password ? '#ef4444' : '#0cc0df'
                  }}
                  onFocus={(e) => e.target.style.borderColor = validationErrors.password ? '#ef4444' : '#0cc0df'}
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-11 cursor-pointer text-gray-400 transition-colors"
                  onMouseEnter={(e) => e.target.style.color = '#0cc0df'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF" />
                  ) : (
                    <AiOutlineEye fontSize={24} fill="#AFB2BF" />
                  )}
                </span>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
                )}
                
                {/* Password strength indicator */}
                {signupData.password && (
                  <div className="mt-2 text-xs">
                    <p className="font-medium text-gray-600 mb-1">Password must contain:</p>
                    <ul className="space-y-1">
                      <li className={`flex items-center ${/[a-zA-Z]/.test(signupData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="mr-2">{/[a-zA-Z]/.test(signupData.password) ? '✓' : '○'}</span>
                        At least one letter
                      </li>
                      <li className={`flex items-center ${/\d/.test(signupData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="mr-2">{/\d/.test(signupData.password) ? '✓' : '○'}</span>
                        At least one number
                      </li>
                      <li className={`flex items-center ${/[@$!%*?&]/.test(signupData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="mr-2">{/[@$!%*?&]/.test(signupData.password) ? '✓' : '○'}</span>
                        At least one special character (@$!%*?&)
                      </li>
                      <li className={`flex items-center ${signupData.password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                        <span className="mr-2">{signupData.password.length >= 6 ? '✓' : '○'}</span>
                        Minimum 6 characters
                      </li>
                    </ul>
                  </div>
                )}
              </label>
            </>
          ) : (
            <>
              {/* Login Fields */}
              <label className="w-full">
                <p className="mb-2 text-sm font-semibold" style={{ color: '#3c3b3f' }}>
                  {getUsernameLabel()}{" "}
                  <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleOnChange}
                  placeholder={getUsernamePlaceholder()}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80"
                  style={{ 
                    '--tw-ring-color': '#0cc0df',
                    borderColor: '#0cc0df'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0cc0df'}
                />
              </label>

              <label className="relative">
                <p className="mb-2 text-sm font-semibold" style={{ color: '#3c3b3f' }}>
                  Password <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleOnChange}
                  placeholder="Enter Password"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 bg-white/80"
                  style={{ 
                    '--tw-ring-color': '#0cc0df',
                    borderColor: '#0cc0df'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0cc0df'}
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-11 cursor-pointer text-gray-400 transition-colors"
                  onMouseEnter={(e) => e.target.style.color = '#0cc0df'}
                  onMouseLeave={(e) => e.target.style.color = '#9ca3af'}
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF" />
                  ) : (
                    <AiOutlineEye fontSize={24} fill="#AFB2BF" />
                  )}
                </span>
              </label>
            </>
          )}

          <div className="flex flex-col gap-y-4">
            <button
              type="submit"
              className="mt-6 rounded-xl py-3 text-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
              style={{ 
                background: 'linear-gradient(135deg, #0cc0df 0%, #7ed957 100%)',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #0aa8c4 0%, #6bc749 100%)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #0cc0df 0%, #7ed957 100%)';
              }}
            >
              {showSignup ? "Sign Up" : "Login"}
            </button>

            <div className="text-center mt-4">
              {showSignup ? (
                <p className="text-sm" style={{ color: '#3c3b3f' }}>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="font-medium hover:underline transition-colors"
                    style={{ color: '#0cc0df' }}
                    onMouseEnter={(e) => e.target.style.color = '#0aa8c4'}
                    onMouseLeave={(e) => e.target.style.color = '#0cc0df'}
                    onClick={() => {
                      setShowSignup(false);
                      setValidationErrors({});
                    }}
                  >
                    Login here
                  </button>
                </p>
              ) : (
                <p className="text-sm" style={{ color: '#3c3b3f' }}>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="font-medium hover:underline transition-colors"
                    style={{ color: '#0cc0df' }}
                    onMouseEnter={(e) => e.target.style.color = '#0aa8c4'}
                    onMouseLeave={(e) => e.target.style.color = '#0cc0df'}
                    onClick={() => setShowSignup(true)}
                  >
                    Sign up
                  </button>
                </p>
              )}
            </div>
          </div>
        </form>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-white text-opacity-90 text-sm">
        <p>© 2024 QR CAMP. All rights reserved.</p>
      </div>
      {/* About Us Button - Top Right */}
      <div className="absolute top-8 right-8">
        <button
          className="text-white underline text-sm hover:text-gray-200 transition"
          onClick={() => window.open("https://www.xraidigital.com/About/", "_blank")}
        >
          About Us
        </button>
      </div>
    </div>
  );
}

export default CoordinatorLogin;
