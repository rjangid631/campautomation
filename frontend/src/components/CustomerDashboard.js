import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { AppContext } from '../App';
import { apiService, apiHandlers } from './api';


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CustomerDashboard = () => {
  const [companyDetails, setCompanyDetails] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCompanyIndex, setExpandedCompanyIndex] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [camps, setCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [campDetails, setCampDetails] = useState(null);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [campReports, setCampReports] = useState(null);
  const [loadingCamps, setLoadingCamps] = useState(false);
  const [loadingCampDetails, setLoadingCampDetails] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  // Enhanced color scheme with the primary color
  const colors = {
    primary: '#11a8a4',
    primaryLight: '#11a8a4',
    primaryDark: '#0e8a87',
    accent: '#7ed957',
    warning: '#f59e0b',
    danger: '#ef4444',
    dark: '#1f2937',
    light: '#f8fafc',
    success: '#10b981',
    purple: '#8b5cf6'
  };

  // Load from localStorage
  const getClientId = () => {
    const rawClientId = localStorage.getItem("clientId");
    console.log("🗃 Raw clientId from localStorage:", rawClientId);
    
    if (!rawClientId || rawClientId === "undefined") {
      console.error("⚠️ Client ID not found in localStorage");
      window.location.href = "/login";
      return null;
    }

    return rawClientId.startsWith('CL-') ? rawClientId : `CL-${rawClientId}`;
  };

  const clientId = getClientId();

  console.log("✅ Final clientId used for fetch:", clientId);


  useEffect(() => {
    const hasSeenPopup = localStorage.getItem('hasSeenPopup');
    if (!hasSeenPopup && companyDetails.length > 0) {
      setShowWelcomePopup(true);
    }
  }, [companyDetails]);

  useEffect(() => {
    const fetchClientDashboard = async () => {
      if (!clientId) return;
      
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError("Unauthorized: Token not found. Please login again.");
        setLoading(false);
        window.location.href = "/login";
        return;
      }
    
      try {
        console.log("📤 Fetching client dashboard for clientId:", clientId);
        
        // Use the enhanced API service
        const data = await apiService.dashboard.getClient(clientId);
        
        const processedData = data.map((item) => ({
          ...item,
          datenow: new Date().toISOString().split('T')[0],
        }));
    
        setCompanyDetails(processedData);
        console.log("✅ Dashboard data received:", processedData);
        
        await fetchCamps();
      } catch (err) {
        console.error("❌ Error fetching client dashboard:", err);
        
        // Enhanced error handling
        if (err.response?.status === 401) {
          localStorage.clear(); // Clear all auth data
          window.location.href = "/login";
        } else if (err.response?.status === 403) {
          setError("Access denied. Please contact administrator.");
        } else {
          setError(`Failed to fetch client data: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
  };
    fetchClientDashboard();
  }, [clientId]);

  const fetchCamps = async () => {
    try {
      console.log("📤 Fetching camps for client:", clientId); 
      
      // Use enhanced API service
      const campsData = await apiService.camps.getAll(clientId);
      console.log("✅ Camps data received:", campsData);
      
      const transformedCamps = campsData.map(camp => ({
        id: camp.id,
        name: `${camp.location} Camp`,
        date: camp.start_date,
        endDate: camp.end_date,
        status: camp.ready_to_go
          ? (camp.is_completed ? 'Completed' : 'Ready to Go')
          : 'In Progress',
        location: camp.location,
        district: camp.district,
        state: camp.state,
        pin_code: camp.pin_code,
        ready_to_go: camp.ready_to_go,
        completed: camp.is_completed || false,
        client: camp.client
      }));
  
      setCamps(transformedCamps);
    } catch (err) {
      console.error("❌ Error fetching camps:", err);
      // Set empty array but don't throw error to prevent dashboard crash
      setCamps([]);
    }
  };

  const fetchCampDetails = async (campId) => {
    try {
      // Use enhanced API service
      const details = await apiService.camps.getDetails(campId);
      setCampDetails(details);
    } catch (err) {
      console.error("❌ Error fetching camp details:", err);
      
      // Better fallback data structure
      setCampDetails({
        id: campId,
        name: camps.find(c => c.id === campId)?.name || 'Camp Details',
        participants: 0,
        services: ['Loading...'],
        qrCode: `QR-${campId}`,
        status: 'Loading...'
      });
    }
  };

  const fetchInvoiceHistory = async (campId) => {
    try {
      // Use enhanced API service
      const invoices = await apiService.invoices.getHistory(campId);
      setInvoiceHistory(Array.isArray(invoices) ? invoices : []);
    } catch (err) {
      console.error("❌ Error fetching invoice history:", err);
      
      // Provide meaningful fallback data
      setInvoiceHistory([
        { 
          id: 1, 
          invoice_no: 'Loading...', 
          date: new Date().toISOString().split('T')[0], 
          amount: 0, 
          status: 'Loading' 
        }
      ]);
    }
  };

  const fetchReports = async (campId) => {
    try {
      const reportsData = await apiHandlers.getReports(campId);
      setReports(reportsData);
    } catch (err) {
      console.error("❌ Error fetching reports:", err);
      setReports([
        { id: 1, name: 'Participant Report', type: 'PDF', date: '2024-01-25', size: '2.5 MB' },
        { id: 2, name: 'Service Summary', type: 'Excel', date: '2024-02-01', size: '1.8 MB' },
      ]);
    }
  };

  const fetchCampReports = async (campId) => {
    try {
      console.log(`📤 Fetching camp reports for camp ID: ${campId}`);
      
      // Use the enhanced API service method
      const data = await apiService.reports.getCampReports(campId);
      
      if (data) {
        console.log("✅ Camp reports data received:", data);
        setCampReports(data);
      } else {
        setCampReports(null);
      }
    } catch (err) {
      console.error("❌ Error fetching camp reports:", err);
      setCampReports(null);
    }
  };

  const handleCampSelect = async (camp) => {
    setSelectedCamp(camp);
    
    try {
      if (activeSection === 'campProgress') {
        setLoadingCampDetails(true);
        await fetchCampDetails(camp.id);
      } else if (activeSection === 'invoiceHistory') {
        await fetchInvoiceHistory(camp.id);
      } else if (activeSection === 'reports') {
        setLoadingReports(true);
        await fetchCampReports(camp.id);
      }
    } catch (error) {
      console.error('Error handling camp selection:', error);
    } finally {
      setLoadingCampDetails(false);
      setLoadingReports(false);
    }
  };

  const toggleDetails = (index) => {
    setExpandedCompanyIndex(expandedCompanyIndex === index ? null : index);
  };

  const chartData = {
    labels: companyDetails.map((c) => c.name || 'N/A'),
    datasets: [
      {
        label: 'Service Count',
        data: companyDetails.map((c) =>
          c.services.reduce((sum, s) => sum + s.total_cases, 0)
        ),
        backgroundColor: colors.primary,
        borderColor: colors.primaryDark,
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'top',
        labels: {
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      title: { 
        display: true, 
        text: 'Service Totals by Client',
        font: {
          size: 18,
          weight: 'bold'
        },
        color: colors.dark
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb'
        }
      },
      x: {
        grid: {
          color: '#e5e7eb'
        }
      }
    }
  };

  const Loader = () => (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div 
          className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent"
          style={{ borderColor: `${colors.primary} transparent ${colors.primary} ${colors.primary}` }}
        ></div>
        <p className="text-lg font-medium" style={{ color: colors.primary }}>Loading...</p>
      </div>
    </div>
  );

  if (loading) return <Loader />;
  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    </div>
  );
  
const WelcomePopup = () => {
  if (!showWelcomePopup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end pr-6 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full transform transition-all duration-300 animate-bounce">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <button 
            onClick={handleClosePopup}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Welcome to Your Dashboard!</h3>
          <p className="text-gray-600 text-sm mb-4">
            Ready to organize a health camp? Start by creating a 
            <span className="font-semibold text-gray-800"> "Corporate X-Rai Test At Office"</span> camp.
          </p>
        </div>
        
        <div className="space-y-3">
          <Link 
            to="/camp-details"
            onClick={handleClosePopup}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 hover:opacity-90 hover:shadow-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add New Camp</span>
          </Link>
          
          <button 
            onClick={handleClosePopup}
            className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};


const handleClosePopup = () => {
  localStorage.setItem('hasSeenPopup', 'true');
  setShowWelcomePopup(false);
};

  const displayedCompanyName =
    localStorage.getItem('companyName') &&
    localStorage.getItem('companyName') !== "undefined"
      ? localStorage.getItem('companyName')
      : companyDetails[0]?.name || "Welcome";

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600 mt-1">Welcome back to your health camp management system</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Companies</p>
                    <p className="text-2xl font-bold text-gray-900">{companyDetails.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary + '20' }}>
                    <svg className="w-5 h-5" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Camps</p>
                    <p className="text-2xl font-bold text-gray-900">{camps.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.accent + '20' }}>
                    <svg className="w-5 h-5" style={{ color: colors.accent }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Camps</p>
                    <p className="text-2xl font-bold text-gray-900">{camps.filter(c => c.ready_to_go && !c.completed).length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.success + '20' }}>
                    <svg className="w-5 h-5" style={{ color: colors.success }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            {companyDetails.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Service Summary</h2>
                <div className="h-80">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            )}

            {/* Company Details */}
            {companyDetails.map((company, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {company.name || "Unnamed Company"}
                      </h3>
                      <p className="text-gray-600 mt-1">Date: {company.datenow}</p>
                    </div>
                    <button
                      onClick={() => toggleDetails(index)}
                      className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 hover:opacity-90"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {expandedCompanyIndex === index ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>

                  {expandedCompanyIndex === index && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Services:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {company.services.map((s, i) => (
                          <div key={i} className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{s.service_name}</span>
                              <span className="text-lg font-bold" style={{ color: colors.primary }}>
                                {s.total_cases}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">cases completed</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {companyDetails.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-600">No data available for this client at the moment.</p>
              </div>
            )}
          </div>
        );

      case 'campProgress':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Camp Progress</h1>
                  <p className="text-gray-600 mt-1">Monitor your active health camps</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Camps List */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Ready to Go Camps (Not Completed)
                  </h2>
                  <p className="text-gray-600 mt-1">Select a camp to view details</p>
                </div>
                <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                  {camps.filter(camp => camp.ready_to_go && !camp.completed).map((camp) => (
                    <div
                      key={camp.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedCamp?.id === camp.id 
                          ? 'border-2 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: selectedCamp?.id === camp.id ? colors.primary : undefined,
                        backgroundColor: selectedCamp?.id === camp.id ? colors.primary + '05' : 'white'
                      }}
                      onClick={() => handleCampSelect(camp)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">{camp.name}</h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p><span className="font-medium">Start:</span> {camp.date}</p>
                            {camp.endDate && <p><span className="font-medium">End:</span> {camp.endDate}</p>}
                            <p><span className="font-medium">Location:</span> {camp.location}, {camp.district}, {camp.state}</p>
                            <p><span className="font-medium">Pin Code:</span> {camp.pin_code}</p>
                          </div>
                        </div>
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-medium text-white ml-3"
                          style={{ backgroundColor: colors.success }}
                        >
                          {camp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {camps.filter(camp => camp.ready_to_go && !camp.completed).length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14" />
                        </svg>
                      </div>
                      <p className="text-gray-600">No ready-to-go camps available that are not completed.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Camp Details */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Camp Details </h2>
                  <p className="text-gray-600 mt-1">View detailed information about selected camp</p>
                </div>
                <div className="p-6">
                  {selectedCamp && campDetails ? (
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-3">{campDetails.name}</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Status:</span>
                            <p className="text-gray-900">{campDetails.status}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Participants:</span>
                            <p className="text-gray-900">{campDetails.participants}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Services Offered:</h4>
                        <div className="grid grid-cols-1 gap-2">
                          {campDetails.services.map((service, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary }}></div>
                              <span className="text-gray-700">{service}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-6">
                        <h4 className="font-semibold text-gray-900 mb-4">QR Code Dashboard</h4>
                        <div className="flex items-center space-x-6">
                          <div 
                            className="w-20 h-20 flex items-center justify-center rounded-lg text-white font-bold text-xl"
                            style={{ backgroundColor: colors.primary }}
                          >
                            QR
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600 mb-2">QR Code: <span className="font-medium">{campDetails.qrCode}</span></p>
                            <button 
                              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 hover:opacity-90"
                              style={{ backgroundColor: colors.purple }}
                            >
                              View Full Dashboard
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                      </div>
                      <p className="text-gray-600">Select a camp to view details</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      // case 'invoiceHistory':
      //   return (
      //     <div className="space-y-6">
      //       {/* Header */}
      //       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      //         <div className="flex items-center justify-between">
      //           <div>
      //             <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
      //             <p className="text-gray-600 mt-1">Track all your camp invoices and payments</p>
      //           </div>
      //           <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
      //             <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      //               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      //             </svg>
      //           </div>
      //         </div>
      //       </div>

      //       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      //         {/* Camps List */}
      //         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      //           <div className="p-6 border-b border-gray-200">
      //             <h2 className="text-xl font-semibold text-gray-900">Select Camp</h2>
      //             <p className="text-gray-600 mt-1">Choose a camp to view invoice history</p>
      //           </div>
      //           <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
      //             {camps.filter(camp => camp.ready_to_go).map((camp) => (
      //               <div
      //                 key={camp.id}
      //                 className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
      //                   selectedCamp?.id === camp.id 
      //                     ? 'border-2 shadow-md' 
      //                     : 'border-gray-200 hover:border-gray-300'
      //                 }`}
      //                 style={{
      //                   borderColor: selectedCamp?.id === camp.id ? colors.primary : undefined,
      //                   backgroundColor: selectedCamp?.id === camp.id ? colors.primary + '05' : 'white'
      //                 }}
      //                 onClick={() => handleCampSelect(camp)}
      //               >
      //                 <h3 className="font-semibold text-gray-900">{camp.name}</h3>
      //                 <p className="text-sm text-gray-600 mt-1">Date: {camp.date}</p>
      //               </div>
      //             ))}
      //           </div>
      //         </div>

      //         {/* Invoice History */}
      //         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      //           <div className="p-6 border-b border-gray-200">
      //             <h2 className="text-xl font-semibold text-gray-900">Invoice History</h2>
      //             <p className="text-gray-600 mt-1">View and download invoices</p>
      //           </div>
      //           <div className="p-6">
      //             {selectedCamp ? (
      //               <div className="space-y-4">
      //                 {invoiceHistory.map((invoice) => (
      //                   <div key={invoice.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      //                     <div className="flex justify-between items-start mb-3">
      //                       <div className="flex-1">
      //                         <h4 className="font-semibold text-gray-900">{invoice.invoice_no}</h4>
      //                         <p className="text-sm text-gray-600 mt-1">Date: {invoice.date}</p>
      //                         <p className="text-lg font-bold mt-2" style={{ color: colors.primary }}>
      //                           ₹{invoice.amount.toLocaleString()}
      //                         </p>
      //                       </div>
      //                       <span className={`px-3 py-1 rounded-full text-xs font-medium text-white`}
      //                       style={{
      //                         backgroundColor: invoice.status === 'Paid' ? colors.success :
      //                                        invoice.status === 'Pending' ? colors.warning :
      //                                        colors.primary
      //                       }}>
      //                         {invoice.status}
      //                       </span>
      //                     </div>
      //                     <div className="flex space-x-3">
      //                       <button 
      //                         className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors duration-200 hover:opacity-90"
      //                         style={{ backgroundColor: colors.primary }}
      //                       >
      //                         View Invoice
      //                       </button>
      //                       <button 
      //                         className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-colors duration-200 hover:opacity-90"
      //                         style={{ backgroundColor: colors.success }}
      //                       >
      //                         Download
      //                       </button>
      //                     </div>
      //                   </div>
      //                 ))}
      //               </div>
      //             ) : (
      //               <div className="text-center py-12">
      //                 <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
      //                   <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      //                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      //                   </svg>
      //                 </div>
      //                 <p className="text-gray-600">Select a camp to view invoice history</p>
      //               </div>
      //             )}
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   );

      case 'reports':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                  <p className="text-gray-600 mt-1">Access Google Drive reports for completed camps</p>
                </div>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Completed Camps */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Completed Camps</h2>
                  <p className="text-gray-600 mt-1">Select a completed camp to view reports</p>
                </div>
                <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                  {camps.filter(camp => camp.ready_to_go && camp.completed).map((camp) => (
                    <div
                      key={camp.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedCamp?.id === camp.id 
                          ? 'border-2 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{
                        borderColor: selectedCamp?.id === camp.id ? colors.primary : undefined,
                        backgroundColor: selectedCamp?.id === camp.id ? colors.primary + '05' : 'white'
                      }}
                      onClick={() => handleCampSelect(camp)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{camp.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Date: {camp.date}</p>
                          <p className="text-sm text-gray-600">Location: {camp.location}</p>
                        </div>
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: colors.purple }}
                        >
                          {camp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {camps.filter(camp => camp.ready_to_go && camp.completed).length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600">No completed camps available for reports.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Google Drive Reports */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Google Drive Reports</h2>
                  <p className="text-gray-600 mt-1">Access and download camp reports</p>
                </div>
                <div className="p-6">
                  {selectedCamp ? (
                    <div className="space-y-4">
                      {campReports ? (
                        <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-gray-900 mb-2">
                                Camp Reports - {selectedCamp.name}
                              </h4>
                              <div className="space-y-2 text-sm text-gray-600">
                                <p><span className="font-medium">Camp ID:</span> {campReports.camp}</p>
                                <p><span className="font-medium">Uploaded:</span> {new Date(campReports.uploaded_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm8-2a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">Google Drive Folder</span>
                              <p className="text-xs text-gray-600">All camp reports and documents</p>
                            </div>
                          </div>
                          
                          <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
                            <p className="text-xs text-gray-600 break-all font-mono">
                              {campReports.google_drive_link}
                            </p>
                          </div>
                          
                          <div className="flex space-x-3">
                            <button 
                              className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 hover:opacity-90"
                              style={{ backgroundColor: colors.primary }}
                              onClick={() => window.open(campReports.google_drive_link, '_blank')}
                            >
                              Open Google Drive
                            </button>
                            <button 
                              className="px-4 py-2 rounded-lg text-white font-medium transition-colors duration-200 hover:opacity-90"
                              style={{ backgroundColor: colors.success }}
                              onClick={() => {
                                navigator.clipboard.writeText(campReports.google_drive_link);
                                alert('Drive link copied to clipboard!');
                              }}
                            >
                              Copy Link
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-gray-200 rounded-lg p-8 bg-gray-50 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="font-medium text-gray-900 mb-2">No Reports Found</h3>
                          <p className="text-gray-600">No Google Drive reports found for this camp.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600">Select a completed camp to view Google Drive reports</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <WelcomePopup />
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 text-white min-h-screen shadow-xl" style={{ backgroundColor: colors.primary }}>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" style={{ color: colors.primary }} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold truncate">{displayedCompanyName}</h2>
                <p className="text-xs opacity-80">Health Camp Portal</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {[
                { key: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
                { key: 'campProgress', icon: 'progress', label: 'Camp Progress' },
                // { key: 'invoiceHistory', icon: 'invoice', label: 'Invoice History' },
                { key: 'reports', icon: 'reports', label: 'Reports' }
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveSection(item.key)}
                  className={`w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-left transition-all duration-200 ${
                    activeSection === item.key 
                      ? 'bg-white text-gray-900 shadow-md' 
                      : 'hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {item.key === 'dashboard' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                    {item.key === 'campProgress' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />}
                    {/* {item.key === 'invoiceHistory' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />} */}
                    {item.key === 'reports' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                  </svg>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              
              <div className="pt-4 mt-4 border-t border-white border-opacity-20">
                <Link 
                  to="/camp-details" 
                  className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-left transition-all duration-200 hover:bg-white hover:bg-opacity-10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Add New Camp</span>
                </Link>
                
                <Link 
                  to="/login" 
                  className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-left transition-all duration-200 hover:bg-red-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Logout</span>
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
