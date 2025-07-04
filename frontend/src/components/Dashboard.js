// imports
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// API endpoints
const apiEndpoints = {
  camps: "http://127.0.0.1:8000/api/campmanager/camps/",
  allCamps: "http://127.0.0.1:8000/api/camps/"
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [firstLogin, setFirstLogin] = useState(true);

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

  const getHeaderTitle = () => activeMenuItem === 'view-camp' ? 'View All Camps' : 'Dashboard of All Camps';
  const getHeaderDescription = () =>
    activeMenuItem === 'view-camp'
      ? 'View and manage all camps from all clients. You can delete camps that are not going to happen.'
      : 'Manage and monitor all camp activities. You can delete camps that are not going to happen.';

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
          {(activeMenuItem === 'dashboard' || activeMenuItem === 'view-camp') ? (
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
