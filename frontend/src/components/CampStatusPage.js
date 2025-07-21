import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from './api';

const COLORS = {
  primary: '#11a8a4',
  primaryLight: '#11a8a420',
  primaryDark: '#0f9590',
  aquaBlue: '#00CED1',
  darkAquaBlue: '#00B8CC',
  mediumGrey: '#6b7280',
  lightGrey: '#f8fafc',
  white: '#ffffff',
  green: '#10b981',
  greenLight: '#10b98120',
  orange: '#f59e0b',
  orangeLight: '#f59e0b20',
  red: '#ef4444',
  redLight: '#ef444420',
  blue: '#3b82f6',
  blueLight: '#3b82f620',
  darkText: '#1f2937',
  mediumText: '#6b7280',
  lightText: '#9ca3af',
  border: '#e5e7eb',
  shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  shadowLarge: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
};

const CampStatusPage = () => {
  const { campId } = useParams();
  const navigate = useNavigate();
  const [campData, setCampData] = useState({
    service_summary: [],
    technician_summary: [],
    packages: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const fetchCampData = async () => {
    try {
      setLoading(true);
      console.log('Fetching camp data for campId:', campId);
      const response = await apiService.camps.getProgress(campId);
      
      // Ensure all arrays exist with default empty arrays
      setCampData({
        ...response,
        service_summary: response.service_summary || [],
        technician_summary: response.technician_summary || [],
        packages: response.packages || []
      });
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch camp data');
      console.error('Error fetching camp data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampData();
    const interval = setInterval(fetchCampData, 30000);
    return () => clearInterval(interval);
  }, [campId]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: COLORS.lightGrey
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={spinnerStyle}></div>
          <p style={{ fontSize: '18px', color: COLORS.mediumText, marginTop: '16px' }}>
            Loading camp status...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: COLORS.lightGrey
      }}>
        <div style={{ 
          textAlign: 'center',
          backgroundColor: COLORS.white,
          padding: '40px',
          borderRadius: '12px',
          boxShadow: COLORS.shadow,
          maxWidth: '400px'
        }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            backgroundColor: COLORS.redLight,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.red}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 style={{ color: COLORS.red, fontSize: '20px', marginBottom: '12px' }}>Error Loading Data</h2>
          <p style={{ color: COLORS.mediumText, marginBottom: '24px' }}>{error}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                ...buttonStyle,
                backgroundColor: COLORS.mediumGrey,
                color: COLORS.white
              }}
            >
              Go Back
            </button>
            <button
              onClick={fetchCampData}
              style={{
                ...buttonStyle,
                backgroundColor: COLORS.primary,
                color: COLORS.white
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (isCompleted) => {
    return isCompleted ? COLORS.green : COLORS.orange;
  };

  const getStatusBgColor = (isCompleted) => {
    return isCompleted ? COLORS.greenLight : COLORS.orangeLight;
  };

  const ProgressBar = ({ value, total, color = COLORS.primary, height = '8px' }) => (
    <div style={{ 
      width: '100%', 
      height: height, 
      backgroundColor: COLORS.border, 
      borderRadius: '6px',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{
        width: `${total > 0 ? (value / total) * 100 : 0}%`,
        height: '100%',
        backgroundColor: color,
        borderRadius: '6px',
        transition: 'width 0.5s ease-in-out',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
          animation: 'shimmer 2s infinite'
        }} />
      </div>
    </div>
  );

  const StatCard = ({ title, value, subtitle, color, icon }) => (
    <div style={{ 
      backgroundColor: COLORS.white,
      padding: '24px',
      borderRadius: '12px',
      border: `1px solid ${COLORS.border}`,
      boxShadow: COLORS.shadow,
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '-10px',
        right: '-10px',
        width: '40px',
        height: '40px',
        backgroundColor: `${color}20`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div style={{ 
        fontSize: '36px', 
        fontWeight: 'bold', 
        color: color, 
        marginBottom: '8px',
        background: `linear-gradient(45deg, ${color}, ${color}80)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        {value}
      </div>
      <div style={{ color: COLORS.darkText, fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
        {title}
      </div>
      <div style={{ color: COLORS.mediumText, fontSize: '12px' }}>
        {subtitle}
      </div>
    </div>
  );

  return (
    <div style={{ 
      backgroundColor: COLORS.lightGrey,
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto'
      }}>
        {/* Header with Back Button */}
        <div style={{ 
          backgroundColor: COLORS.white, 
          padding: '24px', 
          borderRadius: '16px', 
          marginBottom: '24px',
          boxShadow: COLORS.shadowLarge,
          background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDark})`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: `${COLORS.white}20`,
                color: COLORS.white,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s',
                backdropFilter: 'blur(10px)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px',
              backgroundColor: getStatusBgColor(campData.is_completed),
              padding: '8px 16px',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: getStatusColor(campData.is_completed),
                animation: campData.is_completed ? 'none' : 'pulse 2s infinite'
              }} />
              <span style={{ 
                fontWeight: 'bold', 
                fontSize: '14px',
                color: getStatusColor(campData.is_completed)
              }}>
                {campData.is_completed ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            </div>
          </div>
          
          <div>
            <h1 style={{ 
              margin: 0, 
              color: COLORS.white, 
              fontSize: '32px', 
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {campData.camp_name}
            </h1>
            <p style={{ 
              margin: '12px 0 8px 0', 
              color: `${COLORS.white}90`, 
              fontSize: '18px',
              fontWeight: '500'
            }}>
              📍 {campData.location} • {campData.district}, {campData.state}
            </p>
            <p style={{ 
              margin: '4px 0', 
              color: `${COLORS.white}80`, 
              fontSize: '14px'
            }}>
              🗓️ {campData.start_date} - {campData.end_date}
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div style={{ 
          backgroundColor: COLORS.white, 
          padding: '32px', 
          borderRadius: '16px', 
          marginBottom: '24px',
          boxShadow: COLORS.shadowLarge
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: COLORS.primaryLight,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 style={{ margin: 0, color: COLORS.darkText, fontSize: '24px', fontWeight: '700' }}>
              Overall Progress
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '24px',
            marginBottom: '32px'
          }}>
            <StatCard
              title="Overall Progress"
              value={`${campData.progress_percent?.toFixed(1) || 0}%`}
              subtitle="Total completion"
              color={COLORS.primary}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
            />
            <StatCard
              title="Completed Services"
              value={campData.completed_services || 0}
              subtitle={`Out of ${campData.total_services || 0} services`}
              color={COLORS.green}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.green}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>}
            />
            <StatCard
              title="Pending Services"
              value={campData.pending_services || 0}
              subtitle="Services remaining"
              color={COLORS.orange}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.orange}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
            />
            <StatCard
              title="Total Patients"
              value={campData.total_patients || 0}
              subtitle={`${campData.completed_patients || 0} completed`}
              color={COLORS.blue}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.blue}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>}
            />
          </div>
          
          <div style={{ 
            padding: '24px',
            backgroundColor: COLORS.lightGrey,
            borderRadius: '12px',
            border: `2px solid ${COLORS.border}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px', fontWeight: '600', color: COLORS.darkText }}>
                Services Progress
              </span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: COLORS.mediumText }}>
                {campData.completed_services || 0}/{campData.total_services || 0} completed
              </span>
            </div>
            <ProgressBar 
              value={campData.completed_services || 0} 
              total={campData.total_services || 1} 
              color={COLORS.primary}
              height="12px"
            />
          </div>
        </div>

        {/* Service Summary */}
        <div style={{ 
          backgroundColor: COLORS.white, 
          padding: '32px', 
          borderRadius: '16px', 
          marginBottom: '24px',
          boxShadow: COLORS.shadowLarge
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: COLORS.blueLight,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.blue}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h6m-6 0V9a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2h-2m-6 0H7a2 2 0 01-2-2V9a2 2 0 012-2h2m0 0V5a2 2 0 012-2h4a2 2 0 012 2v2M9 5V3a2 2 0 012-2h2a2 2 0 012 2v2m-4 2h4" />
              </svg>
            </div>
            <h2 style={{ margin: 0, color: COLORS.darkText, fontSize: '24px', fontWeight: '700' }}>
              Service Summary
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '20px' 
          }}>
            {campData.service_summary?.length > 0 ? (
              campData.service_summary.map((service, index) => (
                <div key={service.service__id || index} style={{ 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: '12px', 
                  padding: '20px',
                  backgroundColor: COLORS.lightGrey,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${service.completed === service.total ? COLORS.green : COLORS.orange}, ${service.completed === service.total ? COLORS.green : COLORS.orange}80)`
                  }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: COLORS.darkText, fontWeight: '600' }}>
                      {service.service__name || 'Unnamed Service'}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      backgroundColor: service.completed === service.total ? COLORS.greenLight : COLORS.orangeLight,
                      color: service.completed === service.total ? COLORS.green : COLORS.orange,
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}>
                      <span>{service.completed || 0}/{service.total || 0}</span>
                    </div>
                  </div>
                  
                  <ProgressBar 
                    value={service.completed || 0} 
                    total={service.total || 1} 
                    color={service.completed === service.total ? COLORS.green : COLORS.orange}
                    height="10px"
                  />
                  
                  <div style={{ marginTop: '12px', fontSize: '14px', color: COLORS.mediumText, textAlign: 'center' }}>
                    {service.total > 0 ? `${((service.completed / service.total) * 100).toFixed(1)}% completed` : 'No services scheduled'}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '20px',
                color: COLORS.mediumText
              }}>
                No service data available
              </div>
            )}
          </div>
        </div>

        {/* Technician Summary */}
        <div style={{ 
          backgroundColor: COLORS.white, 
          padding: '32px', 
          borderRadius: '16px', 
          marginBottom: '24px',
          boxShadow: COLORS.shadowLarge
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: COLORS.orangeLight,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.orange}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h2 style={{ margin: 0, color: COLORS.darkText, fontSize: '24px', fontWeight: '700' }}>
              Technician Summary
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            {campData.technician_summary?.length > 0 ? (
              campData.technician_summary.map((tech, index) => (
                <div key={tech.technician__id || index} style={{ 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: '12px', 
                  padding: '20px',
                  backgroundColor: COLORS.lightGrey,
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: tech.technician__name ? COLORS.primary : COLORS.mediumGrey,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: COLORS.white,
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {tech.technician__name ? tech.technician__name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <h3 style={{ margin: 0, fontSize: '16px', color: COLORS.darkText, fontWeight: '600' }}>
                        {tech.technician__user__name || 'Unassigned'}
                      </h3>
                    </div>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      color: tech.completed === tech.total ? COLORS.green : COLORS.orange,
                      backgroundColor: tech.completed === tech.total ? COLORS.greenLight : COLORS.orangeLight,
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {tech.completed || 0}/{tech.total || 0}
                    </span>
                  </div>
                  
                  <ProgressBar 
                    value={tech.completed || 0} 
                    total={tech.total || 1} 
                    color={tech.completed === tech.total ? COLORS.green : COLORS.orange}
                    height="10px"
                  />
                  
                  <div style={{ marginTop: '12px', fontSize: '14px', color: COLORS.mediumText, textAlign: 'center' }}>
                    {tech.total > 0 ? `${((tech.completed / tech.total) * 100).toFixed(1)}% completed` : 'No tasks assigned'}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '20px',
                color: COLORS.mediumText
              }}>
                No technician data available
              </div>
            )}
          </div>
        </div>

        {/* Package Summary */}
        <div style={{ 
          backgroundColor: COLORS.white, 
          padding: '32px', 
          borderRadius: '16px', 
          marginBottom: '24px',
          boxShadow: COLORS.shadowLarge
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: COLORS.greenLight,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={COLORS.green}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 style={{ margin: 0, color: COLORS.darkText, fontSize: '24px', fontWeight: '700' }}>
              Package Summary
            </h2>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '20px' 
          }}>
            {campData.packages?.length > 0 ? (
              campData.packages.map((pkg, index) => (
                <div key={pkg.package_id || index} style={{ 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: '12px', 
                  padding: '20px',
                  backgroundColor: COLORS.lightGrey,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: COLORS.darkText, fontWeight: '600' }}>
                      {pkg.package_name || 'Unnamed Package'}
                    </h3>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold',
                      color: pkg.completed_patients === pkg.total_patients ? COLORS.green : COLORS.orange,
                      backgroundColor: pkg.completed_patients === pkg.total_patients ? COLORS.greenLight : COLORS.orangeLight,
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {pkg.completed_patients || 0}/{pkg.total_patients || 0}
                    </span>
                  </div>
                  
                  <ProgressBar 
                    value={pkg.completed_patients || 0} 
                    total={pkg.total_patients || 1} 
                    color={pkg.completed_patients === pkg.total_patients ? COLORS.green : COLORS.orange}
                    height="10px"
                  />
                  
                  <div style={{ marginTop: '12px', fontSize: '14px', color: COLORS.mediumText, textAlign: 'center' }}>
                    {pkg.total_patients > 0 ? `${((pkg.completed_patients / pkg.total_patients) * 100).toFixed(1)}% patients completed` : 'No patients enrolled'}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ 
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '20px',
                color: COLORS.mediumText
              }}>
                No package data available
              </div>
            )}
          </div>
        </div>

        {/* Footer with Last Updated */}
        <div style={{ 
          textAlign: 'center', 
          padding: '24px',
          backgroundColor: COLORS.white,
          borderRadius: '12px',
          boxShadow: COLORS.shadow
        }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '12px',
            padding: '12px 24px',
            backgroundColor: COLORS.lightGrey,
            borderRadius: '25px',
            border: `1px solid ${COLORS.border}`
          }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              backgroundColor: COLORS.green,
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ color: COLORS.mediumText, fontSize: '14px' }}>
              Auto-refreshing every 30 seconds
            </span>
            {lastUpdated && (
              <span style={{ color: COLORS.lightText, fontSize: '12px' }}>
                • Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Style constants
const spinnerStyle = {
  border: `3px solid ${COLORS.border}`,
  borderTop: `3px solid ${COLORS.primary}`,
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  animation: 'spin 1s linear infinite',
  margin: '0 auto'
};

const buttonStyle = {
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  fontWeight: '500',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

export default CampStatusPage;