import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OnsiteDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // API endpoints
  const apiEndpoints = {
    camps: "http://127.0.0.1:8000/api/campmanager/camps/",
    campDetails: (campId) => `http://127.0.0.1:8000/api/campmanager/camps/${campId}/details/`,
    packagePatients: (campId, packageId) => `http://127.0.0.1:8000/api/campmanager/patients/?camp_id=${campId}&package_id=${packageId}`
  };

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(apiEndpoints.camps);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching camps data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchPackages = async (campId) => {
    setLoadingPackages(true);
    try {
      const response = await axios.get(apiEndpoints.campDetails(campId));
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const fetchPackagePatients = async (campId, packageId) => {
    setLoadingPatients(true);
    try {
      const response = await axios.get(apiEndpoints.packagePatients(campId, packageId));
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching package patients:', error);
      setPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleCampClick = (camp) => {
    setSelectedCamp(camp);
    setSelectedPackage(null);
    setPatients([]);
    fetchPackages(camp.id);
  };

  const handlePackageClick = (packageItem) => {
    setSelectedPackage(packageItem);
    fetchPackagePatients(selectedCamp.id, packageItem.id);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getCampStatus = (startDate, endDate) => {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (today < start) return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    else if (today >= start && today <= end) return { status: 'Active', color: 'bg-green-100 text-green-800' };
    else return { status: 'Completed', color: 'bg-gray-100 text-gray-800' };
  };

  // Add the missing render functions
  const renderCampProgressContent = () => {
    const readyCamps = data.filter(camp => camp.ready_to_go === true);

    return (
      <div>
        <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Camps Ready to Go</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {readyCamps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <p>No camps are marked ready to go.</p>
            </div>
          )}
          {readyCamps.map(camp => (
            <div
              key={camp.id}
              onClick={() => handleCampClick(camp)}
              style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedCamp?.id === camp.id ? '#eff6ff' : 'white',
                transition: 'all 0.2s',
                boxShadow: selectedCamp?.id === camp.id ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                {camp.location} (ID: {camp.id})
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                {camp.district}, {camp.state} | {formatDate(camp.start_date)} - {formatDate(camp.end_date)}
              </p>
            </div>
          ))}
        </div>

        {/* Packages section */}
        {selectedCamp && (
          <div style={{ marginTop: '32px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Packages for Camp: {selectedCamp.location} (ID: {selectedCamp.id})
            </h3>
            {loadingPackages ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={spinnerStyle}></div>
                <p style={{ marginTop: '12px', color: '#6b7280' }}>Loading packages...</p>
              </div>
            ) : packages.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No packages found for this camp.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {packages.map(packageItem => (
                  <div key={packageItem.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: selectedPackage?.id === packageItem.id ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handlePackageClick(packageItem)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                          {packageItem.name}
                        </h4>
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                          {formatDate(packageItem.start_date)} - {formatDate(packageItem.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Patients section */}
        {selectedPackage && (
          <div style={{ marginTop: '32px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Patients for Package: {selectedPackage.name}
            </h3>
            {loadingPatients ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={spinnerStyle}></div>
                <p style={{ marginTop: '12px', color: '#6b7280' }}>Loading patients...</p>
              </div>
            ) : patients.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No patients found for this package.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {patients.map(patient => (
                  <div key={patient.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'white'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '16px' }}>
                          {patient.name}
                        </p>
                        <span style={{
                          backgroundColor: '#e5e7eb',
                          color: '#374151',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          ID: {patient.unique_patient_id}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDashboardContent = () => {
    const filteredData = data.filter(camp => camp.ready_to_go === true);
    const groupedCamps = filteredData.reduce((acc, camp) => {
      if (!acc[camp.client]) acc[camp.client] = [];
      acc[camp.client].unshift(camp);
      return acc;
    }, {});

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div style={summaryCardStyle}>
            <h3 style={summaryCardTitle}>Total Camps</h3>
            <p style={summaryCardValueBlue}>{filteredData.length}</p>
          </div>
          <div style={summaryCardStyle}>
            <h3 style={summaryCardTitle}>Active Clients</h3>
            <p style={summaryCardValueGreen}>{Object.keys(groupedCamps).length}</p>
          </div>
        </div>

        {/* Camp List */}
        {Object.entries(groupedCamps).map(([clientId, camps]) => (
          <div key={clientId} style={clientCardStyle}>
            <div style={clientHeaderStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={clientTitleStyle}>Client: {clientId}</h2>
                  <p style={clientSubTextStyle}>{camps.length} camp{camps.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {camps.map((camp) => {
                  const status = getCampStatus(camp.start_date, camp.end_date);
                  return (
                    <div key={camp.id} style={campCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                            <h3 style={campLocationStyle}>{camp.location}</h3>
                            <span style={{
                              ...statusBadgeStyle,
                              backgroundColor: status.status === 'Upcoming' ? '#dbeafe' :
                                status.status === 'Active' ? '#dcfce7' : '#f3f4f6',
                              color: status.status === 'Upcoming' ? '#1e40af' :
                                status.status === 'Active' ? '#166534' : '#374151'
                            }}>{status.status}</span>
                          </div>

                          <div style={campGridStyle}>
                            <div>
                              <p style={campSubText}>Location Details</p>
                              <p style={campInfo}>{camp.district}, {camp.state}</p>
                            </div>
                            <div>
                              <p style={campSubText}>Duration</p>
                              <p style={campInfo}>{formatDate(camp.start_date)} - {formatDate(camp.end_date)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simplified menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', color: 'text-blue-600' },
    { id: 'camp-progress', label: 'Camp Progress', color: 'text-indigo-600' },
    { id: 'logout', label: 'Log Out', color: 'text-red-600' }
  ];

  const handleMenuClick = (menuId) => {
    if (menuId === 'logout') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login');
    } else {
      setActiveMenuItem(menuId);
      setSelectedCamp(null);
      setSelectedPackage(null);
      setPatients([]);
      setPackages([]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Simplified Sidebar */}
      <div style={{ width: '256px', backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderRight: '1px solid #e5e7eb' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Onsite Coordinator</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Limited Access Dashboard</p>
        </div>
        <nav style={{ marginTop: '24px' }}>
          {menuItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => handleMenuClick(item.id)}
              style={{
                width: '100%', 
                textAlign: 'left', 
                padding: '12px 24px',
                fontSize: '18px', 
                fontWeight: '500', 
                transition: 'all 0.2s',
                border: 'none', 
                cursor: 'pointer',
                backgroundColor: activeMenuItem === item.id ? '#eff6ff' : 'transparent',
                borderRight: activeMenuItem === item.id ? '4px solid #3b82f6' : 'none',
                color: {
                  'text-blue-600': '#2563eb', 
                  'text-indigo-600': '#4f46e5', 
                  'text-red-600': '#dc2626'
                }[item.color]
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ backgroundColor: 'white', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            {activeMenuItem === 'dashboard' ? 'Dashboard' : 'Camp Progress'}
          </h1>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {activeMenuItem === 'camp-progress' ? (
            loading ? (
              <div style={loaderContainerStyle}>
                <div style={{ textAlign: 'center' }}>
                  <div style={spinnerStyle}></div>
                  <p style={loadingTextStyle}>Loading camp data...</p>
                </div>
              </div>
            ) : (
              renderCampProgressContent()
            )
          ) : (
            loading ? (
              <div style={loaderContainerStyle}>
                <div style={{ textAlign: 'center' }}>
                  <div style={spinnerStyle}></div>
                  <p style={loadingTextStyle}>Loading camp data...</p>
                </div>
              </div>
            ) : Array.isArray(data) && data.length > 0 ? (
              renderDashboardContent()
            ) : (
              <div style={loaderContainerStyle}>
                <div style={{ textAlign: 'center' }}>
                  <div style={emptyStateIcon}></div>
                  <p style={loadingTextStyle}>No camp data available</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// Style constants
const loaderContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' };
const spinnerStyle = { border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: 'auto' };
const loadingTextStyle = { fontSize: '16px', color: '#6b7280', marginTop: '12px' };
const emptyStateIcon = { width: '40px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '50%', margin: 'auto' };
const summaryCardStyle = {
  backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};
const summaryCardTitle = { fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 };
const summaryCardValueBlue = { fontSize: '24px', fontWeight: 'bold', color: '#2563eb', marginTop: '8px' };
const summaryCardValueGreen = { ...summaryCardValueBlue, color: '#16a34a' };
const clientCardStyle = { backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' };
const clientHeaderStyle = { background: 'linear-gradient(to right, #3b82f6, #2563eb)', padding: '16px 24px' };
const clientTitleStyle = { fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 };
const clientSubTextStyle = { color: '#bfdbfe', marginTop: '4px', margin: '4px 0 0 0' };
const campCardStyle = {
  border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', transition: 'box-shadow 0.2s'
};
const campLocationStyle = { fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 };
const statusBadgeStyle = { padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
const campGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' };
const campSubText = { fontSize: '14px', color: '#6b7280', marginBottom: '4px' };
const campInfo = { fontWeight: '500', marginBottom: '4px' };

export default OnsiteDashboard;