import React, { useState, useEffect, useCallback } from 'react';
import { onsiteAPI, onsiteUtils } from './api';
import { useNavigate } from 'react-router-dom';


const OnsiteDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [patients, setPatients] = useState([]);
  const [originalPatients, setOriginalPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');



  // Add these new state variables after line 17
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [patientForm, setPatientForm] = useState({
    patient_id: '',
    name: '',
    age: '',
    gender: '',
    phone: '',
    services: ''
  });
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);



  // Color constants
  const COLORS = {
    white: '#ffffff',
    success: '#16a34a',
    danger: '#dc2626',
    lightGrey: '#f8f9fa',
    mediumGrey: '#e1e5e9',
    darkGrey: '#6c757d',
    lightText: '#8e9aaf',
    mediumText: '#6b7280',
    darkText: '#1f2937',
    aquaBlue: '#17a2b8'
  };





  // Add these new functions
  const handleAddPatientClick = (e, packageItem) => {
    e.stopPropagation(); // Prevent package selection
    setShowAddPatientModal(true);
  };
  
  const handlePatientFormChange = (field, value) => {
    setPatientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
const handleSubmitPatient = async (e) => {
  e.preventDefault();
  
  // Validate form fields
  const validation = onsiteAPI.validatePatientData(patientForm);
  if (!validation.isValid) {
    alert(`Please fill in: ${validation.errors.join(', ')}`);
    return;
  }
  

  // Validate selections
  if (!selectedCamp) {
    alert('Please select a camp first');
    return;
  }

  if (!selectedPackage) {
    alert('Please select a package first - try clicking the package again');
    return;
  }

  setIsSubmittingPatient(true);
  
  try {
    const patientData = onsiteAPI.formatPatientData(patientForm, selectedCamp, selectedPackage);
    await onsiteAPI.addPatient(patientData);
    // Reset form
    setPatientForm({ patient_id: '', name: '', age: '', gender: '', phone: '', services: '' });
    setShowAddPatientModal(false);
    
    // Refresh patient list
    fetchPackagePatients(selectedCamp.id, selectedPackage.id);
    
    alert('Patient added successfully!');
  } catch (error) {
    console.error(patientForm);
    console.error('Error adding patient:', error);
    alert(`Error: ${error.response?.data?.message || 'Failed to add patient'}`);
  } finally {
    setIsSubmittingPatient(false);
  }
};
  const handleCloseModal = () => {
    setShowAddPatientModal(false);
    setPatientForm({ name: '', age: '', gender: '', phone: '', services: '' });
  };

  // ADD PATIENT MODAL FUNCTION - ADDED HERE
  const renderAddPatientModal = () => {
    if (!showAddPatientModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '12px',
          padding: '32px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          {/* Modal Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: `1px solid ${COLORS.mediumGrey}`,
            paddingBottom: '16px'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: '600',
              color: COLORS.darkText 
            }}>
              Add New Patient
            </h2>
            <button
              onClick={handleCloseModal}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: COLORS.mediumText,
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
            >
              ×
            </button>
          </div>

          {/* Selected Package Info */}
          {selectedPackage && (
            <div style={{
              backgroundColor: COLORS.lightGrey,
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: `1px solid ${COLORS.mediumGrey}`
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: COLORS.mediumText }}>
                <strong>Adding patient to:</strong> {selectedPackage.name}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: COLORS.lightText }}>
                Camp: {selectedCamp?.location}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitPatient}>
            <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: COLORS.darkText,
              marginBottom: '8px'
            }}>
              Patient ID *
            </label>
            <input
              type="text"
              value={patientForm.patient_id}
              onChange={(e) => handlePatientFormChange('patient_id', e.target.value)}
              placeholder="Enter patient ID"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${COLORS.mediumGrey}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
            />
          </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: COLORS.darkText,
                marginBottom: '8px'
              }}>
                Patient Name *
              </label>
              <input
                type="text"
                value={patientForm.name}
                onChange={(e) => handlePatientFormChange('name', e.target.value)}
                placeholder="Enter patient's full name"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: COLORS.darkText,
                  marginBottom: '8px'
                }}>
                  Age *
                </label>
                <input
                  type="number"
                  value={patientForm.age}
                  onChange={(e) => handlePatientFormChange('age', e.target.value)}
                  placeholder="Enter age"
                  required
                  min="1"
                  max="120"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${COLORS.mediumGrey}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: COLORS.darkText,
                  marginBottom: '8px'
                }}>
                  Gender *
                </label>
                <select
                  value={patientForm.gender}
                  onChange={(e) => handlePatientFormChange('gender', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${COLORS.mediumGrey}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    backgroundColor: COLORS.white,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: COLORS.darkText,
                marginBottom: '8px'
              }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={patientForm.phone}
                onChange={(e) => handlePatientFormChange('phone', e.target.value)}
                placeholder="Enter phone number (e.g., +91 9876543210)"
                required
                pattern="[+]?[0-9\s\-]{10,15}"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{
                fontSize: '12px',
                color: COLORS.lightText,
                marginTop: '4px',
                margin: '4px 0 0 0'
              }}>
                Include country code if applicable
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: COLORS.darkText,
                marginBottom: '8px'
              }}>
                Services *
              </label>
              <textarea
                value={patientForm.services}
                onChange={(e) => handlePatientFormChange('services', e.target.value)}
                placeholder="Enter services (comma-separated, e.g., Consultation, Blood Test, X-Ray)"
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <p style={{
                fontSize: '12px',
                color: COLORS.lightText,
                marginTop: '4px',
                margin: '4px 0 0 0'
              }}>
                Separate multiple services with commas
              </p>
            </div>

            {/* Form Actions */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end',
              borderTop: `1px solid ${COLORS.mediumGrey}`,
              paddingTop: '20px'
            }}>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmittingPatient}
                style={{
                  padding: '10px 20px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '8px',
                  backgroundColor: COLORS.white,
                  color: COLORS.mediumText,
                  cursor: isSubmittingPatient ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPatient}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: isSubmittingPatient ? COLORS.mediumGrey : COLORS.success,
                  color: COLORS.white,
                  cursor: isSubmittingPatient ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isSubmittingPatient ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Adding...
                  </>
                ) : (
                  'Add Patient'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  


 const fetchData = useCallback(async () => {
    try {
      const camps = await onsiteAPI.getAllCamps();
      setData(camps);
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
      const campDetails = await onsiteAPI.getCampDetails(campId);
      setPackages(campDetails.packages || []);
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
      const patients = await onsiteAPI.getPackagePatients(campId, packageId);
      setPatients(patients);
      setOriginalPatients(patients);
    } catch (error) {
      console.error('Error fetching package patients:', error);
      setPatients([]);
      setOriginalPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };



  const handleCampClick = (camp) => {
    setSelectedCamp(camp);
    setSelectedPackage(null);
    setPatients([]);
    setOriginalPatients([]);
    setSearchTerm('');
    fetchPackages(camp.id);
  };


  const handlePackageClick = (packageItem) => {
    setSelectedPackage(packageItem);
    setSearchTerm('');
    fetchPackagePatients(selectedCamp.id, packageItem.id);
  };


  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    const filtered = onsiteUtils.filterPatients(originalPatients, term);
    setPatients(filtered);
  };


const handlePrintQR = async (patient) => {
  try {
    // Make API call to mark patient as checked-in & trigger thermal print
    const result = await onsiteAPI.printThermalSlips([patient.id]);
    
    // Open print window with patient QR
    const printWindow = window.open('', '_blank');
    const printContent = onsiteAPI.generatePrintContent(patient);
    printWindow.document.write(printContent);

  } catch (error) {
    console.error('Failed to print QR:', error);
    alert('Error printing QR. Check console.');
  }
};



  const handleCampStatus = (patientId) => {
    // Add camp status logic here
    console.log('Camp status for patient:', patientId);
  };


  const formatDate = onsiteUtils.formatDate;
  const getCampStatus = onsiteUtils.getCampStatus;


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
                    {/* ADD PATIENT Button */}
                   <button
  onClick={(e) => handleAddPatientClick(e, packageItem)}
  style={{
    backgroundColor: COLORS.success,
    color: COLORS.white,
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  ADD PATIENT
</button>
                    </div>


                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Enhanced Patients section with search functionality */}
        {selectedPackage && (
          <div style={{ marginTop: '32px', borderTop: `1px solid ${COLORS.mediumGrey}`, paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: COLORS.darkText }}>
                Patients for Package: {selectedPackage.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '8px', width: '300px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      border: `1px solid ${COLORS.mediumGrey}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: COLORS.lightText
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPatients(originalPatients);
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: COLORS.lightGrey,
                      color: COLORS.mediumText,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>


            {loadingPatients ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={spinnerStyle}></div>
                <p style={{ marginTop: '12px', color: COLORS.mediumText }}>Loading patients...</p>
              </div>
            ) : patients.length === 0 ? (
              <div style={{ 
                backgroundColor: COLORS.lightGrey, 
                padding: '24px', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: `1px dashed ${COLORS.mediumGrey}`
              }}>
                <p style={{ color: COLORS.mediumText, marginBottom: '8px' }}>
                  {searchTerm ? 'No matching patients found' : 'No patients found for this package'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPatients(originalPatients);
                    }}
                    style={{
                      backgroundColor: COLORS.lightGrey,
                      color: COLORS.darkText,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {patients.map(patient => (
                  <div key={patient.id} style={{
                    border: `1px solid ${COLORS.mediumGrey}`,
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: COLORS.white,
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '16px', color: COLORS.darkText }}>
                          {patient.name}
                        </p>
                        <span style={{
                          backgroundColor: COLORS.mediumGrey,
                          color: COLORS.darkGrey,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          ID: {patient.unique_patient_id}
                        </span>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', color: COLORS.mediumText }}>
                          Age: {patient.age}
                        </span>
                        <span style={{ fontSize: '14px', color: COLORS.mediumText }}>
                          Gender: {patient.gender}
                        </span>
                        <span style={{ fontSize: '14px', color: COLORS.mediumText }}>
                          Phone: {patient.phone}
                        </span>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '14px', color: COLORS.mediumText }}>
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
                          backgroundColor: COLORS.aquaBlue,
                          color: COLORS.white,
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                      >
                        Print QR
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
      setSearchTerm('');
    }
  };


  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* ADD PATIENT Modal - MOVED TO CORRECT POSITION */}
      {renderAddPatientModal()}
      
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
