import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { dashboardAPI } from './api'; // or import { apiHandlers } from './api';

const COLORS = {
  aquaBlue: '#11a8a4',
  grassGreen: '#7ed957',
  darkGrey: '#3c3b3f',
  vividPurple: '#9440dd',
  white: '#ffffff',
  lightGrey: '#f3f4f6',
  mediumGrey: '#e5e7eb',
  darkText: '#1f2937',
  mediumText: '#6b7280',
  lightText: '#9ca3af',
  orange: '#f97316'
};

const DownloadReports = () => {
  const { campId } = useParams();
  const navigate = useNavigate();
  const [groupedReports, setGroupedReports] = useState({});
  const [filteredReports, setFilteredReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [campInfo, setCampInfo] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [reportTypes, setReportTypes] = useState(['All']);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  useEffect(() => {
    fetchReports();
  }, [campId]);

  useEffect(() => {
    applyFilter(activeFilter);
  }, [groupedReports, activeFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Use the centralized API
      const reportsData = await dashboardAPI.getDownloadReports(campId);
      // Optionally fetch camp info if needed
      // const campInfoData = await dashboardAPI.getCampInfo(campId);

      // Group reports by patient name
      const reports = reportsData || [];
      const grouped = reports.reduce((acc, report) => {
        const patientName = report.patient_name;
        if (!acc[patientName]) {
          acc[patientName] = {
            patient_name: patientName,
            reports: []
          };
        }
        acc[patientName].reports.push({
          type: report.report_type,
          pdf_link: report.pdf_link
        });
        return acc;
      }, {});

      // Extract unique report types for filter buttons
      const uniqueTypes = [...new Set(reports.map(report => report.report_type))].sort();
      setReportTypes(['All', ...uniqueTypes]);

      setGroupedReports(grouped);
      // setCampInfo(campInfoData || null); // Uncomment if you fetch camp info
      setError('');
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Failed to fetch reports. Please try again.');
      setGroupedReports({});
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (filterType) => {
    if (filterType === 'All') {
      setFilteredReports(groupedReports);
    } else {
      const filtered = {};
      Object.keys(groupedReports).forEach(patientName => {
        const patient = groupedReports[patientName];
        const filteredPatientReports = patient.reports.filter(report => 
          report.type === filterType
        );
        
        if (filteredPatientReports.length > 0) {
          filtered[patientName] = {
            ...patient,
            reports: filteredPatientReports
          };
        }
      });
      setFilteredReports(filtered);
    }
  };

  const handleFilterChange = (filterType) => {
    setActiveFilter(filterType);
  };

  const handleDownload = (reportUrl, patientName, reportType) => {
    if (reportUrl) {
      const link = document.createElement('a');
      link.href = reportUrl;
      link.download = `${patientName}_${reportType}_report.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Report not available for download');
    }
  };

  const downloadFileAsBlob = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      return { blob, filename };
    } catch (error) {
      console.error(`Error downloading ${filename}:`, error);
      return null;
    }
  };

  const handleDownloadAll = async () => {
    const allReports = [];
    
    // Collect all reports from filtered data
    Object.values(filteredReports).forEach(patient => {
      patient.reports.forEach(report => {
        if (report.pdf_link) {
          allReports.push({
            url: report.pdf_link,
            filename: `${patient.patient_name}_${report.type}_report.pdf`,
            patientName: patient.patient_name,
            reportType: report.type
          });
        }
      });
    });

    if (allReports.length === 0) {
      alert('No reports available for download');
      return;
    }

    setDownloadingAll(true);
    setDownloadProgress({ current: 0, total: allReports.length });

    try {
      const zip = new JSZip();
      const failedDownloads = [];

      // Create folders for organization
      const folders = {};

      for (let i = 0; i < allReports.length; i++) {
        const report = allReports[i];
        setDownloadProgress({ current: i + 1, total: allReports.length });

        const fileData = await downloadFileAsBlob(report.url, report.filename);
        
        if (fileData) {
          // Organize by patient name
          const folderName = report.patientName.replace(/[^a-zA-Z0-9]/g, '_');
          if (!folders[folderName]) {
            folders[folderName] = zip.folder(folderName);
          }
          folders[folderName].file(report.filename, fileData.blob);
        } else {
          failedDownloads.push(report.filename);
        }
      }

      // Generate and download zip file
      const content = await zip.generateAsync({ type: 'blob' });
      const zipFilename = activeFilter === 'All' 
        ? `Camp_${campId}_All_Reports.zip`
        : `Camp_${campId}_${activeFilter}_Reports.zip`;
      
      saveAs(content, zipFilename);

      // Show summary
      if (failedDownloads.length > 0) {
        alert(`Download completed! ${allReports.length - failedDownloads.length} files downloaded successfully. ${failedDownloads.length} files failed to download.`);
      } else {
        alert(`All ${allReports.length} reports downloaded successfully!`);
      }

    } catch (error) {
      console.error('Error creating zip file:', error);
      alert('Error occurred while creating the zip file. Please try again.');
    } finally {
      setDownloadingAll(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getReportTypeColor = (reportType) => {
    switch (reportType.toLowerCase()) {
      case 'audiometry':
        return COLORS.aquaBlue;
      case 'optometry':
        return COLORS.grassGreen;
      case 'doctor':
        return COLORS.vividPurple;
      default:
        return COLORS.darkGrey;
    }
  };

  const getFilterButtonColor = (filterType) => {
    switch (filterType.toLowerCase()) {
      case 'all':
        return COLORS.darkGrey;
      case 'audiometry':
        return COLORS.aquaBlue;
      case 'optometry':
        return COLORS.grassGreen;
      case 'doctor':
        return COLORS.vividPurple;
      default:
        return COLORS.mediumGrey;
    }
  };

  const getTotalReportsCount = () => {
    return Object.values(groupedReports).reduce((total, patient) => total + patient.reports.length, 0);
  };

  const getFilteredReportsCount = () => {
    return Object.values(filteredReports).reduce((total, patient) => total + patient.reports.length, 0);
  };

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
          <div style={{
            width: '40px',
            height: '40px',
            border: `4px solid ${COLORS.mediumGrey}`,
            borderTop: `4px solid ${COLORS.aquaBlue}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: 'auto'
          }}></div>
          <p style={{ marginTop: '16px', color: COLORS.mediumText }}>Loading reports...</p>
        </div>
      </div>
    );
  }

  const patientsList = Object.values(filteredReports).filter((patient) =>
    patient.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: COLORS.lightGrey,
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          border: `1px solid ${COLORS.mediumGrey}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: COLORS.darkText, 
              margin: 0 
            }}>
              Download Patient Reports
            </h1>
            <p style={{ 
              color: COLORS.mediumText, 
              marginTop: '4px',
              margin: '4px 0 0 0'
            }}>
              Camp ID: {campId} {campInfo && `- ${campInfo.location}`}
            </p>
          </div>
          <button
            onClick={handleBack}
            style={{
              backgroundColor: COLORS.aquaBlue,
              color: COLORS.white,
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            color: '#b91c1c'
          }}>
            {error}
          </div>
        )}

        {/* NEW – search bar */}
        <div style={{ marginBottom: '16px', maxWidth: '280px' }}>
          <input
            type="text"
            placeholder="Search patient..."
            value={searchQuery}
            onChange={handleSearchChange}
            disabled={downloadingAll}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: `1px solid ${COLORS.mediumGrey}`,
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>
        

        {/* Filter Buttons */}
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '8px',
          border: `1px solid ${COLORS.mediumGrey}`,
          padding: '20px 24px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '16px'
          }}>
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: COLORS.darkText,
                margin: '0 0 8px 0'
              }}>
                Filter Reports by Type
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: COLORS.mediumText,
                margin: 0
              }}>
                Total: {getTotalReportsCount()} reports | Showing: {getFilteredReportsCount()} reports
              </p>
            </div>
            
            {/* Download All Button */}
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll || getFilteredReportsCount() === 0}
              style={{
                backgroundColor: downloadingAll ? COLORS.mediumGrey : COLORS.orange,
                color: COLORS.white,
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                cursor: downloadingAll || getFilteredReportsCount() === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                minWidth: '140px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!downloadingAll && getFilteredReportsCount() > 0) {
                  e.target.style.backgroundColor = COLORS.vividPurple;
                }
              }}
              onMouseLeave={(e) => {
                if (!downloadingAll && getFilteredReportsCount() > 0) {
                  e.target.style.backgroundColor = COLORS.orange;
                }
              }}
            >
              {downloadingAll ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: `2px solid ${COLORS.white}30`,
                    borderTop: `2px solid ${COLORS.white}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Downloading...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Download All ({getFilteredReportsCount()})
                </>
              )}
            </button>
          </div>

          {/* Download Progress */}
          {downloadingAll && (
            <div style={{
              backgroundColor: COLORS.lightGrey,
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '16px',
              border: `1px solid ${COLORS.mediumGrey}`
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', color: COLORS.darkText, fontWeight: '500' }}>
                  Downloading Reports...
                </span>
                <span style={{ fontSize: '14px', color: COLORS.mediumText }}>
                  {downloadProgress.current} / {downloadProgress.total}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: COLORS.mediumGrey,
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(downloadProgress.current / downloadProgress.total) * 100}%`,
                  height: '100%',
                  backgroundColor: COLORS.orange,
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }}></div>
              </div>
            </div>
          )}
          
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            {reportTypes.map((reportType) => (
              <button
                key={reportType}
                onClick={() => handleFilterChange(reportType)}
                disabled={downloadingAll}
                style={{
                  backgroundColor: activeFilter === reportType ? getFilterButtonColor(reportType) : COLORS.white,
                  color: activeFilter === reportType ? COLORS.white : getFilterButtonColor(reportType),
                  border: `2px solid ${getFilterButtonColor(reportType)}`,
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: downloadingAll ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: downloadingAll ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== reportType && !downloadingAll) {
                    e.target.style.backgroundColor = `${getFilterButtonColor(reportType)}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== reportType && !downloadingAll) {
                    e.target.style.backgroundColor = COLORS.white;
                  }
                }}
              >
                {reportType === 'All' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                )}
                {reportType === 'Audiometry' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
                {reportType === 'Optometry' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
                {reportType === 'Doctor' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                {reportType}
                {activeFilter === reportType && (
                  <span style={{
                    backgroundColor: `${COLORS.white}30`,
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}>
                    {getFilteredReportsCount()}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Reports List */}
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '8px',
          border: `1px solid ${COLORS.mediumGrey}`,
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '20px 24px',
            borderBottom: `1px solid ${COLORS.mediumGrey}`,
            backgroundColor: COLORS.lightGrey
          }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: COLORS.darkText,
              margin: 0
            }}>
              {activeFilter === 'All' ? 'All Patient Reports' : `${activeFilter} Reports`} ({patientsList.length} patients)
            </h2>
          </div>

          {patientsList.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: COLORS.mediumText 
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ margin: 'auto', marginBottom: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                {activeFilter === 'All' ? 'No reports available' : `No ${activeFilter} reports available`}
              </p>
              <p style={{ fontSize: '14px', color: COLORS.lightText }}>
                {activeFilter === 'All' 
                  ? 'Reports will appear here once they are generated for patients.'
                  : `Try selecting a different report type or check "All" to see available reports.`
                }
              </p>
            </div>
          ) : (
            <div style={{ padding: '0' }}>
              {patientsList.map((patient, index) => (
                <div
                  key={`${patient.patient_name}-${index}`}
                  style={{
                    padding: '20px 24px',
                    borderBottom: index < patientsList.length - 1 ? `1px solid ${COLORS.mediumGrey}` : 'none',
                    transition: 'background-color 0.2s',
                    opacity: downloadingAll ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => !downloadingAll && (e.currentTarget.style.backgroundColor = COLORS.lightGrey)}
                  onMouseLeave={(e) => !downloadingAll && (e.currentTarget.style.backgroundColor = COLORS.white)}
                >
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ 
                        margin: 0, 
                        fontSize: '16px', 
                        fontWeight: '600', 
                        color: COLORS.darkText,
                        marginBottom: '8px'
                      }}>
                        {patient.patient_name}
                      </h3>
                      <span style={{
                        backgroundColor: COLORS.mediumGrey,
                        color: COLORS.darkGrey,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {activeFilter === 'All' 
                          ? `${patient.reports.length} report${patient.reports.length !== 1 ? 's' : ''} available`
                          : `${patient.reports.length} ${activeFilter} report${patient.reports.length !== 1 ? 's' : ''}`
                        }
                      </span>
                    </div>
                    
                    {/* Reports for this patient */}
                    <div style={{ 
                      display: 'grid', 
                      gap: '12px',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
                    }}>
                      {patient.reports.map((report, reportIndex) => (
                        <div
                          key={`${patient.patient_name}-${report.type}-${reportIndex}`}
                          style={{
                            backgroundColor: COLORS.lightGrey,
                            border: `1px solid ${COLORS.mediumGrey}`,
                            borderRadius: '6px',
                            padding: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              backgroundColor: `${getReportTypeColor(report.type)}20`,
                              color: getReportTypeColor(report.type),
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              {report.type}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDownload(report.pdf_link, patient.patient_name, report.type)}
                            disabled={downloadingAll}
                            style={{
                              backgroundColor: downloadingAll ? COLORS.mediumGrey : COLORS.aquaBlue,
                              color: COLORS.white,
                              border: 'none',
                              borderRadius: '4px',
                              padding: '6px 12px',
                              cursor: downloadingAll ? 'not-allowed' : 'pointer',
                              fontWeight: '500',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (!downloadingAll) {
                                e.target.style.backgroundColor = COLORS.vividPurple;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!downloadingAll) {
                                e.target.style.backgroundColor = COLORS.aquaBlue;
                              }
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DownloadReports;
