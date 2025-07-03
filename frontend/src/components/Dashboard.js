import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

  // Fetch dashboard camps data
  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get(apiEndpoints.camps);
      const camps = response.data;
      console.log('Camps data:', camps);
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

    // Set up polling every 10 seconds
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

  const handleDeleteCamp = async (campId, isFromAllCamps = false) => {
    if (window.confirm('Are you sure you want to delete this camp?')) {
      try {
        const endpoint = apiEndpoints.camps;
        await axios.delete(`${endpoint}${campId}/`);
        console.log(`Deleted camp with ID: ${campId}`);
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
    
    if (menuId === 'add-camp') {
      navigate('/camp-details');
    } else if (menuId === 'logout') {
      console.log('Logging out...');
      navigate('/login');
    }
    
    console.log(`Navigating to: ${menuId}`);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
    
    if (today < start) {
      return { status: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (today >= start && today <= end) {
      return { status: 'Active', color: 'bg-green-100 text-green-800' };
    } else {
      return { status: 'Completed', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const groupedCamps = Array.isArray(data) ? data.reduce((acc, camp) => {
  if (!acc[camp.client]) {
    acc[camp.client] = [];
  }
  // Insert each camp at the beginning to reverse the order (last becomes first)
  acc[camp.client].unshift(camp);
  return acc;
}, {}) : {};

  const renderDashboardContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Only show summary stats on dashboard, not on view-camp */}
      {activeMenuItem === 'dashboard' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '24px', 
          marginBottom: '24px' 
        }}>
          {/* Total Camps */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
            padding: '24px', 
            border: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 }}>Total Camps</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#2563eb', margin: '8px 0 0 0' }}>{data.length}</p>
          </div>
          {/* Active Clients */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
            padding: '24px', 
            border: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 }}>Active Clients</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a', margin: '8px 0 0 0' }}>{Object.keys(groupedCamps).length}</p>
          </div>
          {/* Upcoming Camps */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
            padding: '24px', 
            border: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 }}>Upcoming Camps</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c', margin: '8px 0 0 0' }}>
              {data.filter(camp => new Date(camp.start_date) > new Date()).length}
            </p>
          </div>
          {/* Active Camps */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
            padding: '24px', 
            border: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 }}>Active Camps</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#9333ea', margin: '8px 0 0 0' }}>
              {data.filter(camp => {
                const today = new Date();
                const start = new Date(camp.start_date);
                const end = new Date(camp.end_date);
                return today >= start && today <= end;
              }).length}
            </p>
          </div>
        </div>
      )}

      {/* Camps List */}
      {Object.entries(groupedCamps).map(([clientId, camps], clientIndex) => (
        <div key={clientId} style={{ 
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
          border: '1px solid #e5e7eb', 
          overflow: 'hidden' 
        }}>
          {/* Client Header */}
          <div style={{ 
            background: 'linear-gradient(to right, #3b82f6, #2563eb)', 
            padding: '16px 24px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>Client: {clientId}</h2>
                <p style={{ color: '#bfdbfe', marginTop: '4px', margin: '4px 0 0 0' }}>{camps.length} camp{camps.length > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => handleDetailsToggle(clientIndex)}
                style={{
                  backgroundColor: 'white',
                  color: '#2563eb',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#eff6ff'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                {expandedIndex === clientIndex ? 'Hide Camps' : 'Show Camps'}
              </button>
            </div>
          </div>

          {/* Expanded Camp Details */}
          {expandedIndex === clientIndex && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {camps.map((camp, campIndex) => {
                  const status = getCampStatus(camp.start_date, camp.end_date);
                  return (
                    <div key={camp.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '16px',
                      transition: 'box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                    onMouseLeave={(e) => e.target.style.boxShadow = 'none'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                              {camp.location}
                            </h3>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: status.status === 'Upcoming' ? '#dbeafe' :
                                status.status === 'Active' ? '#dcfce7' : '#f3f4f6',
                              color: status.status === 'Upcoming' ? '#1e40af' :
                                status.status === 'Active' ? '#166534' : '#374151'
                            }}>
                              {status.status}
                            </span>
                          </div>
                          
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px'
                          }}>
                            <div>
                              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Location Details</p>
                              <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{camp.district}, {camp.state}</p>
                              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>PIN: {camp.pin_code}</p>
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Duration</p>
                              <p style={{ fontWeight: '500', margin: '0 0 4px 0' }}>{formatDate(camp.start_date)} - {formatDate(camp.end_date)}</p>
                              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{calculateDuration(camp.start_date, camp.end_date)}</p>
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Camp ID</p>
                              <p style={{ fontWeight: '500', margin: 0 }}>#{camp.id}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ marginLeft: '16px' }}>
                          <button
                            onClick={() => handleViewServiceSelection(camp.id)}
                            style={{
                              backgroundColor: '#2563eb',
                              color: 'white',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              fontWeight: '500',
                              border: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                          >
                            View
                          </button>
                        </div>
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
    switch (activeMenuItem) {
      case 'view-camp':
        return 'View All Camps';
      case 'dashboard':
      default:
        return 'Dashboard of All Camps';
    }
  };

  const getHeaderDescription = () => {
    switch (activeMenuItem) {
      case 'view-camp':
        return 'View and manage all camps from all clients. You can delete camps that are not going to happen.';
      case 'dashboard':
      default:
        return 'Manage and monitor all camp activities. You can delete camps that are not going to happen.';
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Left Sidebar */}
      <div style={{ 
        width: '256px', 
        backgroundColor: 'white', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
        borderRight: '1px solid #e5e7eb' 
      }}>
        <div style={{ 
          padding: '24px', 
          borderBottom: '1px solid #e5e7eb' 
        }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: 0 
          }}>Camp Manager</h2>
          <p style={{ 
            fontSize: '14px', 
            color: '#6b7280', 
            marginTop: '4px',
            margin: '4px 0 0 0' 
          }}>Admin Dashboard</p>
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
                backgroundColor: activeMenuItem === item.id ? '#eff6ff' : 'transparent',
                borderRight: activeMenuItem === item.id ? '4px solid #3b82f6' : 'none',
                color: item.color === 'text-blue-600' ? '#2563eb' :
                       item.color === 'text-green-600' ? '#16a34a' :
                       item.color === 'text-purple-600' ? '#9333ea' :
                       item.color === 'text-orange-600' ? '#ea580c' :
                       item.color === 'text-indigo-600' ? '#4f46e5' :
                       item.color === 'text-red-600' ? '#dc2626' : '#374151',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (activeMenuItem !== item.id) {
                  e.target.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (activeMenuItem !== item.id) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: 'white', 
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 
          borderBottom: '1px solid #e5e7eb', 
          padding: '16px 24px' 
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#1f2937',
            margin: 0 
          }}>
            {getHeaderTitle()}
          </h1>
          <p style={{ 
            color: '#6b7280', 
            marginTop: '4px',
            margin: '4px 0 0 0' 
          }}>
            {getHeaderDescription()}
          </p>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {(activeMenuItem === 'dashboard' || activeMenuItem === 'view-camp') && (
            loading ? (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '16px'
                  }}></div>
                  <p style={{ fontSize: '18px', color: '#6b7280' }}>Loading camp data...</p>
                </div>
              </div>
            ) : Array.isArray(data) && data.length > 0 ? (
              renderDashboardContent()
            ) : (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 8px auto',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '50%'
                  }}></div>
                  <p style={{ fontSize: '18px', color: '#6b7280', margin: '8px 0 4px 0' }}>No camp data available</p>
                  <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>Start by adding a new camp</p>
                </div>
              </div>
            )
          )}

          {activeMenuItem !== 'dashboard' && activeMenuItem !== 'view-camp' && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  margin: '0 auto 8px auto',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '50%'
                }}></div>
                <p style={{ fontSize: '18px', color: '#6b7280', margin: '8px 0 4px 0' }}>Feature Coming Soon</p>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>This feature is under development</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Add CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;