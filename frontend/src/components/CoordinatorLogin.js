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

  const navigate = useNavigate();

  const handleOnChange = (e) => {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
    setErrorMessage("");
  };

  const handleSignupChange = (e) => {
    setSignupData((prevData) => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = formData;

    try {
      const { role, username: user } = await loginAsCoordinator(username, password);
      localStorage.setItem("role", role);
      localStorage.setItem("username", user);
      onLogin(role);
      navigate("/dashboard");
    } catch (error) {
      await handleCustomerLogin(username, password);
    }
  };

  const handleCustomerLogin = async (username, password) => {
    try {
      const { role, username: user, clientId, token } = await loginAsCustomer(username, password);
      localStorage.setItem("role", role);
      localStorage.setItem("username", user);
      localStorage.setItem("clientId", clientId);
      localStorage.setItem("token", token);
      onLogin(role, clientId);
      navigate("/customer-dashboard");
    } catch (error) {
      setErrorMessage(error.message);
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
    navigate("/technical-dashboard");  // ✅ Fixed: "technical" instead of "technicial"
  } catch (error) {
    setErrorMessage(error.message);
  }
};


  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    try {
      const successMessage = await signupUser(signupData);
      alert(successMessage);
      setShowSignup(false);
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-500">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {showSignup
            ? "Sign Up"
            : loginMode === "technician"
            ? "Technician Login"
            : "Login"}
        </h2>

        {errorMessage && (
          <div className="mb-4 text-red-500 text-sm">{errorMessage}</div>
        )}

        <div className="flex justify-center gap-4 mb-4">
          <button
            type="button"
            className={`px-3 py-1 rounded ${
              loginMode === "default" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setLoginMode("default")}
            disabled={showSignup}
          >
            Coordinator/Customer
          </button>
          <button
            type="button"
            className={`px-3 py-1 rounded ${
              loginMode === "technician" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setLoginMode("technician")}
            disabled={showSignup}
          >
            Technician
          </button>
        </div>

        <form
          className="flex flex-col gap-y-5"
          onSubmit={
            showSignup
              ? handleSignupSubmit
              : loginMode === "technician"
              ? handleTechnicianLogin
              : handleOnSubmit
          }
        >
          {showSignup ? (
            <>
              {/* Sign Up Fields */}
              <label className="w-full">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Name <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type="text"
                  name="name"
                  value={signupData.name}
                  onChange={handleSignupChange}
                  placeholder="Enter your name"
                  className="input-style"
                />
              </label>

              <label className="w-full">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Email <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type="email"
                  name="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  placeholder="Enter your email"
                  className="input-style"
                />
              </label>

              <label className="w-full">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Contact Number <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type="text"
                  name="contact_number"
                  value={signupData.contact_number}
                  onChange={handleSignupChange}
                  placeholder="Enter your contact number"
                  className="input-style"
                />
              </label>

              <label className="relative">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Password <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  placeholder="Enter Password"
                  className="input-style"
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="eye-icon"
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible fontSize={24} fill="#AFB2BF" />
                  ) : (
                    <AiOutlineEye fontSize={24} fill="#AFB2BF" />
                  )}
                </span>
              </label>
            </>
          ) : (
            <>
              {/* Login Fields */}
              <label className="w-full">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  {loginMode === "technician"
                    ? "Technician Email"
                    : "Username/Email"}{" "}
                  <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleOnChange}
                  placeholder={
                    loginMode === "technician"
                      ? "Enter Technician Email"
                      : "Enter username or email"
                  }
                  className="input-style"
                />
              </label>

              <label className="relative">
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Password <sup className="text-red-500">*</sup>
                </p>
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleOnChange}
                  placeholder="Enter Password"
                  className="input-style"
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="eye-icon"
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
              className="mt-6 rounded-md bg-blue-600 py-3 text-lg font-semibold text-white hover:bg-blue-700 transition duration-200"
            >
              {showSignup
                ? "Sign Up"
                : loginMode === "technician"
                ? "Technician Login"
                : "Login"}
            </button>

            <div className="text-center mt-4">
              {showSignup ? (
                <p className="text-sm">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => setShowSignup(false)}
                  >
                    Login here
                  </button>
                </p>
              ) : (
                <p className="text-sm">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
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
    </div>
  );
}

export default CoordinatorLogin;
