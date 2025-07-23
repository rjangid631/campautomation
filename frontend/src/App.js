import React, { useState, createContext, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Outlet } from 'react-router-dom';
import './index.css';

import CoordinatorLogin from './components/CoordinatorLogin';
import CampDetails from './components/CampDetails';
import ServiceSelection from './components/ServiceSelection';
import TestCaseInput from './components/TestCaseInput';
import CostCalculation from './components/CostCalculation';
import CostSummaryScreen from './components/CostSummaryScreen';
import SimpleCostCalculation from './components/SimpleCostCalculation';
import CustomerDashboard from './components/CustomerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import NewDashboard from './components/NewDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './components/Dashboard';
import ViewServiceSelection from './components/ViewServiceSelection';
import TechnicalDashboard from './components/TechnicialDashboard.js'; // ✅ Explicit .js
import PatientTechnicianDashboard from './components/PatientTechnicianDashboard';

// Service Form Components
import AudiometryForm from './components/AudiometryForm'; // ✅ Explicit .js
import ECGForm from './components/ECGForm';
import XrayForm from './components/XrayForm';
import PFTForm from './components/PFTForm';
import OptometryForm from './components/OptometryForm';
import DoctorConsultationForm from './components/DoctorConsultationForm';
import PathologyForm from './components/PathologyForm';
import DentalConsultationForm from './components/DentalConsultationForm';
import VitalsForm from './components/VitalsForm';
import Form7 from './components/Form7';
import BMDForm from './components/BMDForm';
import TetanusVaccineForm from './components/TetanusVaccineForm';
import TyphoidVaccineForm from './components/TyphoidVaccineForm';
import CoordinatorForm from './components/CoordinatorForm';
import CBCForm from './components/CBCForm';
import CompleteHemogramForm from './components/CompleteHemogramForm';
import HemoglobinForm from './components/HemoglobinForm';
import UrineRoutineForm from './components/UrineRoutineForm';
import StoolExaminationForm from './components/StoolExaminationForm';
import LipidProfileForm from './components/LipidProfileForm';
import KidneyProfileForm from './components/KidneyProfileForm';
import LFTForm from './components/LFTForm';
import KFTForm from './components/KFTForm';
import RandomBloodGlucoseForm from './components/RandomBloodGlucoseForm';
import BloodGroupingForm from './components/BloodGroupingForm';
import OnsiteDashboard from './components/OnsiteDashboard';
import StatusTracking from './components/StatusTracking';
import CampStatusPage from './components/CampStatusPage';
export const AppContext = createContext();
function App() {
  const [loginType, setLoginType] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [campDetails, setCampDetails] = useState({});
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [caseData, setCaseData] = useState({});
  const [costDetails, setCostDetails] = useState({});

  const navigate = useNavigate();
  const isAuthenticated = !!loginType;

  useEffect(() => {
    const storedId = localStorage.getItem("clientId");
    const storedType = localStorage.getItem("loginType");

    if (storedId) setCompanyId(parseInt(storedId));
    if (storedType) setLoginType(storedType);
  }, []);

const handleLogin = (type, id) => {
  setLoginType(type);
  setCompanyId(id);

  localStorage.setItem("loginType", type);
  localStorage.setItem("clientId", id);

  if (type === 'Coordinator') {
    navigate('/dashboard');
  } else if (type === 'OnsiteCoordinator') {
    navigate('/onsite-dashboard');
  } else if (type === 'Customer') {
    navigate('/customer-dashboard');
  } else if (type === 'Technician') {
    navigate('/technical-dashboard');
  }
};

  const handleCampDetailsNext = (details) => {
    setCampDetails(details);
    if (details.clientId) {
      setCompanyId(details.clientId);
      localStorage.setItem("clientId", details.clientId);
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
    localStorage.removeItem('loginType');
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
            {/* Authentication Routes */}
            <Route path="/login" element={<CoordinatorLogin onLogin={handleLogin} />} />
            
            {/* Main Application Routes */}
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
                  companyId={companyId}
                  selectedPackages={selectedPackages}
                  caseData={caseData}
                  onNext={handleCostCalculationNext}
                  onBack={handleBackFromCostCalculation}
                  onSubmit={handleCostCalculationNext}
                />
              } 
            />
            <Route 
              path="/onsite-dashboard" 
              element={<ProtectedRoute element={<OnsiteDashboard />} isAuthenticated={isAuthenticated} />} 
            />
            <Route 
              path="/cost-summary" 
              element={
                <CostSummaryScreen 
                  clientId={companyId} // 👈 pass the prop correctly
                  caseData={caseData}
                  costDetails={costDetails}
                  campDetails={campDetails}
                />
              } 
            />
            <Route path="/simple-cost-calculation" element={<SimpleCostCalculation username={username} />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} isAuthenticated={isAuthenticated} />} />
            
            <Route path="/customer-dashboard" element={<ProtectedRoute element={<CustomerDashboard />} isAuthenticated={isAuthenticated} />} />
            <Route path="/newdashboard" element={<NewDashboard />} />
            <Route path="/view-serviceselection/:campId" element={<ViewServiceSelection />} />
            <Route path="/technical-dashboard" element={<TechnicalDashboard />} />
            <Route path="/patient-dashboard" element={<PatientTechnicianDashboard />} />
            
            {/* Service Form Routes */}
            <Route path="/audiometry" element={<AudiometryForm />} />
            <Route path="/ecg" element={<ECGForm />} />
            <Route path="/xray" element={<XrayForm />} />
            <Route path="/pft" element={<PFTForm />} />
            <Route path="/optometry" element={<OptometryForm />} />
            <Route path="/doctor-consultation" element={<DoctorConsultationForm />} />
            <Route path="/pathology" element={<PathologyForm />} />
            <Route path="/dental-consultation" element={<DentalConsultationForm />} />
            <Route path="/vitals" element={<VitalsForm />} />
            <Route path="/form7" element={<Form7 />} />
            <Route path="/bmd" element={<BMDForm />} />
            <Route path="/tetanus-vaccine" element={<TetanusVaccineForm />} />
            <Route path="/typhoid-vaccine" element={<TyphoidVaccineForm />} />
            <Route path="/coordinator" element={<CoordinatorForm />} />
            <Route path="/cbc" element={<CBCForm />} />
            <Route path="/complete-hemogram" element={<CompleteHemogramForm />} />
            <Route path="/hemoglobin" element={<HemoglobinForm />} />
            <Route path="/urine-routine" element={<UrineRoutineForm />} />
            <Route path="/stool-examination" element={<StoolExaminationForm />} />
            <Route path="/lipid-profile" element={<LipidProfileForm />} />
            <Route path="/kidney-profile" element={<KidneyProfileForm />} />
            <Route path="/lft" element={<LFTForm />} />
            <Route path="/kft" element={<KFTForm />} />
            <Route path="/random-blood-glucose" element={<RandomBloodGlucoseForm />} />
            <Route path="/blood-grouping" element={<BloodGroupingForm />} />
            <Route path="/status-tracking" element={<StatusTracking />} />
            {/* Default Route */}
            <Route path="*" element={<Navigate to="/login" />} />
            <Route path="/campStatus/:campId" element={<CampStatusPage/>} />
          </Routes>

          <Outlet />
        </div>
      </AppContext.Provider>
    </ErrorBoundary>
  );
}

export default App;