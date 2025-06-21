// App.js
import React, { useState, createContext, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import CoordinatorLogin from './components/CoordinatorLogin';
import CampDetails from './components/CampDetails';
import ServiceSelection from './components/ServiceSelection';
import TestCaseInput from './components/TestCaseInput';
import CostCalculation from './components/CostCalculation';
import CostSummaryScreen from './components/CostSummaryScreen';
import SimpleCostCalculation from './components/SimpleCostCalculation';
import Dashboard from './components/Dashboard';
import CustomerDashboard from './components/CustomerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NewDashboard from './components/NewDashboard';
import ErrorBoundary from './components/ErrorBoundary';

export const AppContext = createContext();

function App() {
  const [loginType, setLoginType] = useState(null);
  const [companyId, setCompanyId] = useState(null); // This will now hold the DB ID (integer)
  const [campDetails, setCampDetails] = useState({});
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [caseData, setCaseData] = useState({});
  const [costDetails, setCostDetails] = useState({});
  const [authError, setAuthError] = useState(null);

  const navigate = useNavigate();
  const isAuthenticated = !!loginType;

  // 🔁 Load companyId from localStorage (if any)
  useEffect(() => {
    const storedId = localStorage.getItem("clientId");
    if (storedId) setCompanyId(parseInt(storedId));
  }, []);

  const handleLogin = (type, clientId) => {
    setLoginType(type);
    setCompanyId(clientId); // ✅ This is now an integer from backend
    localStorage.setItem("clientId", clientId); // Save for refresh support

    if (type === 'Coordinator') navigate('/dashboard');
    else if (type === 'Customer') navigate('/customer-dashboard');
  };

  const handleCampDetailsNext = (details) => {
    setCampDetails(details);
    if (details.clientId) {
      setCompanyId(details.clientId);
      localStorage.setItem("clientId", details.clientId); // Also store
    }
    navigate('/service-selection');
  };

  const handleServiceSelectionNext = (packagesWithServices, flatServices = []) => {
    setSelectedPackages(packagesWithServices);
    setSelectedServices(flatServices);
    navigate('/test-case-input');
  };

  const handleTestCaseInputNext = (data) => {
    setCaseData(data);
    if (loginType === 'Coordinator') navigate('/cost-calculation');
    else navigate('/simple-cost-calculation');
  };

  const handleCostCalculationNext = (details) => {
    setCostDetails(details);
    navigate('/cost-summary');
  };

  const handleFinalSubmit = () => {
    setLoginType(null);
    setCompanyId(null);
    setCampDetails({});
    setSelectedServices([]);
    setSelectedPackages([]);
    setCaseData({});
    setCostDetails({});
    localStorage.removeItem('authToken');
    localStorage.removeItem('clientId');
    navigate('/login');
  };

  const handleLogout = () => handleFinalSubmit();
  const username = localStorage.getItem('companyName');

  const handleBackFromServiceSelection = () => navigate('/camp-details');
  const handleBackFromTestCaseInput = () => navigate('/service-selection');
  const handleBackFromCostCalculation = () => navigate('/test-case-input');

  const contextValue = {
    loginType,
    companyId,
    campDetails,
    selectedServices,
    selectedPackages,
    caseData,
    costDetails,
    handleLogin,
    handleCampDetailsNext,
    handleServiceSelectionNext,
    handleTestCaseInputNext,
    handleCostCalculationNext,
    handleFinalSubmit,
    handleLogout,
  };

  return (
    <ErrorBoundary>
      <AppContext.Provider value={contextValue}>
        <div className="container mx-auto p-4">
          {window.location.pathname === '/cost-summary' && (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-2 px-4 rounded shadow hover:bg-red-700"
            >
              Logout
            </button>
          )}

          <Routes>
            <Route path="/login" element={<CoordinatorLogin onLogin={handleLogin} />} />
            <Route path="/camp-details" element={<CampDetails onNext={handleCampDetailsNext} />} />
            <Route 
              path="/service-selection" 
              element={
                <ServiceSelection 
                  onNext={handleServiceSelectionNext}
                  onBack={handleBackFromServiceSelection}
                />
              } 
            />
            <Route 
              path="/test-case-input" 
              element={
                <TestCaseInput 
                  onNext={handleTestCaseInputNext}
                  onBack={handleBackFromTestCaseInput}
                />
              } 
            />
            <Route 
              path="/cost-calculation" 
              element={
                <CostCalculation 
                  onNext={handleCostCalculationNext}
                  onBack={handleBackFromCostCalculation}
                />
              } 
            />
            <Route path="/cost-summary" element={<CostSummaryScreen />} />
            <Route path="/simple-cost-calculation" element={<SimpleCostCalculation username={username} />} />
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} isAuthenticated={isAuthenticated} />} />
            <Route path="/customer-dashboard" element={<ProtectedRoute element={<CustomerDashboard />} isAuthenticated={isAuthenticated} />} />
            <Route path="/newdashboard" element={<NewDashboard />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>

          <Outlet />
        </div>
      </AppContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
