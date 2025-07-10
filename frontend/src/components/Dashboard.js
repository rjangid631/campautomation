// imports
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// API endpoints
const apiEndpoints = {
  camps: "http://127.0.0.1:8000/api/campmanager/camps/",
  allCamps: "http://127.0.0.1:8000/api/camps/",
  patients: (campId) => `http://127.0.0.1:8000/api/camps/${campId}/upload-excel/` // updated endpoint
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [firstLogin, setFirstLogin] = useState(true);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(apiEndpoints.camps);
      const camps = response.data;
      setData(camps);
      if (firstLogin) {
        setTimeout(() => setLoading(false), 2000);
        setFirstLogin(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching camps data:', error);
      setLoading(false);
    }
  }, [firstLogin]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!firstLogin) {
        fetchData();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchData, firstLogin]);
  
  const apiEndpoints = {
    camps: "http://127.0.0.1:8000/api/campmanager/camps/",
    allCamps: "http://127.0.0.1:8000/api/camps/",
    patients: (campId) => `http://127.0.0.1:8000/api/camps/${campId}/upload-excel/`,
    campDetails: (campId) => `http://127.0.0.1:8000/api/campmanager/camps/${campId}/details/`,
    packagePatients: (campId, packageId) => `http://127.0.0.1:8000/api/campmanager/patients/?camp_id=${campId}&package_id=${packageId}`
  };

  const handleDetailsToggle = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleDeleteCamp = async (campId) => {
    if (window.confirm('Are you sure you want to delete this camp?')) {
      try {
        await axios.delete(`${apiEndpoints.camps}${campId}/`);
        setData(data.filter(camp => camp.id !== campId));
      } catch (error) {
        console.error('Error deleting camp:', error);
        alert('Failed to delete camp. Please try again.');
      }
    }
  };

  const handleViewServiceSelection = (campId) => {
    navigate(`/view-serviceselection/${campId}`);
  };


// Fetch packages for a camp
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
   
   // Fetch patients for a specific package
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

  // Handle camp click in Camp Progress menu
  // Handle camp click in Camp Progress menu
  const handleCampClick = (camp) => {
    setSelectedCamp(camp);
    setSelectedPackage(null); // Reset selected package
    setPatients([]); // Clear patients
    fetchPackages(camp.id);
  };

  // Button handlers for patients
  const handlePrintQR = (patient) => {
    // Open new window/tab with patient details
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
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
    `);
  };

  // Handle package click
  const handlePackageClick = (packageItem) => {
    setSelectedPackage(packageItem);
    fetchPackagePatients(selectedCamp.id, packageItem.id);
  };

  const handleCampStatus = (patientId) => {
    alert(`Show status for patient ${patientId}`);
    // Implement actual status logic here
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', color: 'text-blue-600' },
    { id: 'add-camp', label: 'Add New Camp', color: 'text-green-600' },
    { id: 'view-camp', label: 'View Camp', color: 'text-purple-600' },
    { id: 'upload-report', label: 'Upload Report', color: 'text-orange-600' },
    { id: 'camp-progress', label: 'Camp Progress', color: 'text-indigo-600' },
    { id: 'logout', label: 'Log Out', color: 'text-red-600' }
  ];

  const handleMenuClick = (menuId) => {
    setActiveMenuItem(menuId);
    setSelectedCamp(null);
    setSelectedPackage(null); // Add this line
    setPatients([]);
    setPackages([]); // Add this line
    if (menuId === 'add-camp') navigate('/camp-details');
    else if (menuId === 'logout') navigate('/login');
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

  const calculateDuration = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } catch (error) {
      return 'N/A';
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

  // Filter camps based on activeMenuItem
  const filteredData = Array.isArray(data)
    ? data.filter(camp =>
        (activeMenuItem === 'dashboard' && camp.ready_to_go === true) ||
        (activeMenuItem === 'view-camp' && camp.ready_to_go === false)
      )
    : [];

  const groupedCamps = filteredData.reduce((acc, camp) => {
    if (!acc[camp.client]) acc[camp.client] = [];
    acc[camp.client].unshift(camp);
    return acc;
  }, {});

  // Render Camp Progress content
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
            <p style={{ margin: '4px 0 0 0', color: '#9ca3af', fontSize: '12px' }}>
              Client: {camp.client}
            </p>
          </div>
        ))}
      </div>

      {/* Show packages if a camp is selected */}
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePackageClick(packageItem);
                        }}
                        style={{
                          backgroundColor: selectedPackage?.id === packageItem.id ? '#1d4ed8' : '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        View Patients
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show patients if a package is selected */}
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
                    <div style={{ marginTop: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        Age: {patient.age}
                      </span>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        Gender: {patient.gender}
                      </span>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        Phone: {patient.phone}
                      </span>
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        Services: {patient.services.join(', ')}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrintQR(patient);
                      }}
                      style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      Print QR
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCampStatus(patient.unique_patient_id);
                      }}
                      style={{
                        backgroundColor: '#4b5563',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '14px'
                      }}
                    >
                      Camp Status
                    </button>
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
  const renderDashboardContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary cards */}
      {activeMenuItem === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Total Camps */}
          <div style={summaryCardStyle}>
            <h3 style={summaryCardTitle}>Total Camps</h3>
            <p style={summaryCardValueBlue}>{filteredData.length}</p>
          </div>
          {/* Active Clients */}
          <div style={summaryCardStyle}>
            <h3 style={summaryCardTitle}>Active Clients</h3>
            <p style={summaryCardValueGreen}>{Object.keys(groupedCamps).length}</p>
          </div>
          {/* Upcoming Camps */}
          <div style={summaryCardStyle}>
            <h3 style={summaryCardTitle}>Upcoming Camps</h3>
            <p style={summaryCardValueOrange}>
              {filteredData.filter(camp => new Date(camp.start_date) > new Date()).length}
            </p>
          </div>
          {/* Active Camps */}
          <div style={summaryCardStyle}>
            <h3 style={summaryCardTitle}>Active Camps</h3>
            <p style={summaryCardValuePurple}>
              {Array.isArray(data) ? data.filter(camp => {
                const today = new Date();
                const start = new Date(camp.start_date);
                const end = new Date(camp.end_date);
                return camp.ready_to_go === true && today >= start && today <= end;
              }).length : 0}
            </p>
          </div>
        </div>
      )}

      {/* Camp List */}
      {Object.entries(groupedCamps).map(([clientId, camps], clientIndex) => (
        <div key={clientId} style={clientCardStyle}>
          <div style={clientHeaderStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={clientTitleStyle}>Client: {clientId}</h2>
                <p style={clientSubTextStyle}>{camps.length} camp{camps.length > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => handleDetailsToggle(clientIndex)}
                style={toggleButtonStyle}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#eff6ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                {expandedIndex === clientIndex ? 'Hide Camps' : 'Show Camps'}
              </button>
            </div>
          </div>

          {expandedIndex === clientIndex && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {camps.map((camp) => {
                  const status = getCampStatus(camp.start_date, camp.end_date);
                  return (
                    <div key={camp.id} style={campCardStyle}
                      onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                      onMouseLeave={(e) => e.target.style.boxShadow = 'none'}>
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
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: camp.ready_to_go ? '#bbf7d0' : '#fee2e2',
                                color: camp.ready_to_go ? '#166534' : '#b91c1c',
                                cursor: 'not-allowed'
                              }}
                              title="Ready to Go status and Excel upload are only available in View Camp"
                            >
                              Ready to Go: {camp.ready_to_go ? 'Yes' : 'No'}
                            </span>
                            {!camp.ready_to_go && (
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                Upload Excel and mark Ready to Go from View Camp only
                              </div>
                            )}
                          </div>

                          <div style={campGridStyle}>
                            <div>
                              <p style={campSubText}>Location Details</p>
                              <p style={campInfo}>{camp.district}, {camp.state}</p>
                              <p style={campSubText}>PIN: {camp.pin_code}</p>
                            </div>
                            <div>
                              <p style={campSubText}>Duration</p>
                              <p style={campInfo}>{formatDate(camp.start_date)} - {formatDate(camp.end_date)}</p>
                              <p style={campSubText}>{calculateDuration(camp.start_date, camp.end_date)}</p>
                            </div>
                            <div>
                              <p style={campSubText}>Camp ID</p>
                              <p style={campInfo}>#{camp.id}</p>
                            </div>
                          </div>
                        </div>

                        {/* Show View button only if NOT on dashboard */}
                        {activeMenuItem !== 'dashboard' && (
                          <div style={{ marginLeft: '16px' }}>
                            <button onClick={() => handleViewServiceSelection(camp.id)} style={viewButtonStyle}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}>
                              View
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const getHeaderTitle = () => {
    if (activeMenuItem === 'view-camp') return 'View All Camps';
    if (activeMenuItem === 'camp-progress') return 'Camp Progress';
    return 'Dashboard of All Camps';
  };

  const getHeaderDescription = () => {
    if (activeMenuItem === 'view-camp') return 'View and manage all camps from all clients. You can delete camps that are not going to happen.';
    if (activeMenuItem === 'camp-progress') return 'View all camps marked ready to go and their patient details.';
    return 'Manage and monitor all camp activities. You can delete camps that are not going to happen.';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <div style={{ width: '256px', backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderRight: '1px solid #e5e7eb' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Camp Manager</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>Admin Dashboard</p>
        </div>
        <nav style={{ marginTop: '24px' }}>
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => handleMenuClick(item.id)} style={{
              width: '100%', textAlign: 'left', padding: '12px 24px',
              fontSize: '18px', fontWeight: '500', transition: 'all 0.2s',
              border: 'none', cursor: 'pointer',
              backgroundColor: activeMenuItem === item.id ? '#eff6ff' : 'transparent',
              borderRight: activeMenuItem === item.id ? '4px solid #3b82f6' : 'none',
              color: {
                'text-blue-600': '#2563eb', 'text-green-600': '#16a34a', 'text-purple-600': '#9333ea',
                'text-orange-600': '#ea580c', 'text-indigo-600': '#4f46e5', 'text-red-600': '#dc2626'
              }[item.color]
            }}>{item.label}</button>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ backgroundColor: 'white', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{getHeaderTitle()}</h1>
          <p style={{ color: '#6b7280', marginTop: '4px', margin: '4px 0 0 0' }}>{getHeaderDescription()}</p>
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
          ) : (activeMenuItem === 'dashboard' || activeMenuItem === 'view-camp') ? (
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
                  <p style={{ fontSize: '14px', color: '#9ca3af' }}>Start by adding a new camp</p>
                </div>
              </div>
            )
          ) : (
            <div style={loaderContainerStyle}>
              <div style={{ textAlign: 'center' }}>
                <div style={emptyStateIcon}></div>
                <p style={loadingTextStyle}>Feature Coming Soon</p>
                <p style={{ fontSize: '14px', color: '#9ca3af' }}>This feature is under development</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS animation */}
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// 🧩 Styles (to keep render code cleaner)
const summaryCardStyle = {
  backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};
const summaryCardTitle = { fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 };
const summaryCardValueBlue = { fontSize: '24px', fontWeight: 'bold', color: '#2563eb', marginTop: '8px' };
const summaryCardValueGreen = { ...summaryCardValueBlue, color: '#16a34a' };
const summaryCardValueOrange = { ...summaryCardValueBlue, color: '#ea580c' };
const summaryCardValuePurple = { ...summaryCardValueBlue, color: '#9333ea' };

const clientCardStyle = { backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' };
const clientHeaderStyle = { background: 'linear-gradient(to right, #3b82f6, #2563eb)', padding: '16px 24px' };
const clientTitleStyle = { fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 };
const clientSubTextStyle = { color: '#bfdbfe', marginTop: '4px', margin: '4px 0 0 0' };

const toggleButtonStyle = {
  backgroundColor: 'white', color: '#2563eb', padding: '8px 16px', borderRadius: '6px', fontWeight: '500', border: 'none', cursor: 'pointer'
};

const campCardStyle = {
  border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', transition: 'box-shadow 0.2s'
};

const campLocationStyle = { fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 };
const statusBadgeStyle = { padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
const campGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' };
const campSubText = { fontSize: '14px', color: '#6b7280', marginBottom: '4px' };
const campInfo = { fontWeight: '500', marginBottom: '4px' };

const viewButtonStyle = {
  backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: '500', cursor: 'pointer'
};

const loaderContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' };
const spinnerStyle = { border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: 'auto' };
const loadingTextStyle = { fontSize: '16px', color: '#6b7280', marginTop: '12px' };
const emptyStateIcon = { width: '40px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '50%', margin: 'auto' };

export default Dashboard;