import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function TechnicalDashboard() {
  const [assignedCamps, setAssignedCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [campDetails, setCampDetails] = useState(null);
  const [patients, setPatients] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [campDetailsLoading, setCampDetailsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientsError, setPatientsError] = useState(null);
  const [showPackages, setShowPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPatients, setShowPatients] = useState(false);
  const [technicianInfo, setTechnicianInfo] = useState(null);
  const navigate = useNavigate();
  

  // Get technician info from localStorage
  useEffect(() => {
    const technicianId = localStorage.getItem("technicianId");
    const technicianName = localStorage.getItem("technicianName");
    const technicianEmail = localStorage.getItem("technicianEmail");
    
    if (technicianId) {
      setTechnicianInfo({
        id: technicianId,
        name: technicianName,
        email: technicianEmail
      });
      fetchTechnicianAssignments(technicianId);
    } else {
      setError("No technician information found. Please login again.");
      setLoading(false);
    }
  }, []);

  // Fetch technician assignments
  const fetchTechnicianAssignments = async (technicianId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/api/technician/assignments/?technician_id=${technicianId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch technician assignments");
      }
      
      const data = await response.json();
      console.log("API Response:", data);
      
      // Process the flat assignment structure
      const assignments = data.assignments || [];
      
      // Group assignments by camp_id to create camp objects
      const campsMap = new Map();
      
      assignments.forEach(assignment => {
        const campId = assignment.camp_id;
        
        if (!campsMap.has(campId)) {
          // Create a new camp object
          campsMap.set(campId, {
            camp: {
              id: campId,
              location: assignment.camp_location || 'Unknown Location',
              district: 'N/A',
              state: 'N/A',
              pin_code: 'N/A',
              start_date: null,
              end_date: null,
              ready_to_go: false,
              client: 'N/A'
            },
            services: []
          });
        }
        
        // Add service to the camp
        const camp = campsMap.get(campId);
        camp.services.push({
          id: assignment.service_id,
          name: assignment.service_name
        });
      });
      
      // Convert map to array
      const processedCamps = Array.from(campsMap.values());
      
      setAssignedCamps(processedCamps);
      
      // If there are assignments, select the first one by default
      if (processedCamps.length > 0) {
        setSelectedCamp(processedCamps[0]);
        fetchCampDetails(processedCamps[0].camp.id);
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch detailed camp information including packages
  const fetchCampDetails = async (campId) => {
    try {
      setCampDetailsLoading(true);
      const response = await fetch(`http://127.0.0.1:8000/api/campmanager/camps/${campId}/details/`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch camp details for ID: ${campId}`);
      }
      
      const data = await response.json();
      setCampDetails(data);
      
      // Update selected camp with detailed information
      setSelectedCamp(prev => ({
        ...prev,
        camp: {
          ...prev.camp,
          ...data.camp
        }
      }));
      
    } catch (err) {
      console.error("Error fetching camp details:", err);
      // Don't set error here as basic camp info is still available
    } finally {
      setCampDetailsLoading(false);
    }
  };

  // Fetch patients for a specific package
  const fetchPatients = async (packageId) => {
    try {
      setPatientsLoading(true);
      setPatientsError(null);
      
      const technicianId = technicianInfo.id;
      
      const response = await fetch(
        `http://127.0.0.1:8000/api/technician/patients/?technician_id=${technicianId}&package_id=${packageId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch patients data");
      }

      const data = await response.json();
      setPatients(data.patients || []);
      setShowPatients(true);
    } catch (err) {
      setPatientsError(err.message);
    } finally {
      setPatientsLoading(false);
    }
  };

  const handleCampSelect = (camp) => {
    setSelectedCamp(camp);
    setShowPackages(false);
    setSelectedPackage(null);
    setShowPatients(false);
    setCampDetails(null);
    fetchCampDetails(camp.camp.id);
  };

  const handleViewPackagesClick = () => {
    if (showPackages) {
      setShowPackages(false);
      setSelectedPackage(null);
      setShowPatients(false);
    } else {
      setShowPackages(true);
    }
  };

  const handlePackageClick = (pkg) => {
    setSelectedPackage(pkg);
    fetchPatients(pkg.id);
  };

  const handleBackToPackages = () => {
    setSelectedPackage(null);
    setShowPatients(false);
    setPatients(null);
    setPatientsError(null);
  };

  const generateQRCode = (patientId) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=PATIENT_${patientId}`;
  };

  const getStatusBadge = (readyToGo) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm font-medium";
    return readyToGo ? `${baseClasses} bg-green-100 text-green-800` : `${baseClasses} bg-red-100 text-red-800`;
  };

  const getStatusText = (readyToGo) => {
    return readyToGo ? "Ready to Go: Yes" : "Ready to Go: No";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => technicianInfo && fetchTechnicianAssignments(technicianInfo.id)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Technican Dashboard</h1>
            <div className="text-right">
              <p className="text-gray-600">Welcome, {technicianInfo?.name || 'Technician'}!</p>
              <p className="text-sm text-gray-500">{technicianInfo?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Camp Assignments</h2>
          <p className="text-gray-600">Manage and monitor your assigned camps ({assignedCamps.length})</p>
        </div>

        {/* Camp Selection */}
        {assignedCamps.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Camp:
            </label>
            <select
              value={selectedCamp?.camp?.id || ''}
              onChange={(e) => {
                const campId = parseInt(e.target.value);
                const camp = assignedCamps.find(c => c.camp && c.camp.id === campId);
                if (camp) handleCampSelect(camp);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {assignedCamps.map((assignment) => (
                <option key={assignment.camp.id} value={assignment.camp.id}>
                  {assignment.camp.location || 'Unknown Location'} (#{assignment.camp.id})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Camp Details */}
        <div className="space-y-6">
          {selectedCamp && selectedCamp.camp && (
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    #{selectedCamp.camp.id}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedCamp.camp.location || 'Unknown Location'}</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={getStatusBadge(selectedCamp.camp.ready_to_go)}>
                    {getStatusText(selectedCamp.camp.ready_to_go)}
                  </span>
                  <button
                    onClick={handleViewPackagesClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <span>{showPackages ? "Hide Packages" : "View Packages"}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Location Details */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Location Details</h4>
                  <p className="text-gray-900 font-medium">
                    {selectedCamp.camp.location || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">{selectedCamp.camp.district || 'N/A'}</p>
                  <p className="text-sm text-gray-600">PIN: {selectedCamp.camp.pin_code || 'N/A'}</p>
                </div>

                {/* Duration */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Duration</h4>
                  <p className="text-gray-900 font-medium">
                    {formatDate(selectedCamp.camp.start_date)} - {formatDate(selectedCamp.camp.end_date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {calculateDuration(selectedCamp.camp.start_date, selectedCamp.camp.end_date)}
                  </p>
                </div>

                {/* Assignment Details */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Assignment Details</h4>
                  <p className="text-gray-900 font-medium">#{selectedCamp.camp.id}</p>
                  <p className="text-sm text-gray-600">Client: {selectedCamp.camp.client || 'N/A'}</p>
                  <p className="text-sm text-gray-600">
                    Packages: {campDetails?.packages?.length || 0}
                  </p>
                </div>
              </div>

              {/* Loading camp details */}
              {campDetailsLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading camp details...</p>
                </div>
              )}

              {/* Packages Section */}
              {showPackages && !selectedPackage && campDetails?.packages && campDetails.packages.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Assigned Packages ({campDetails.packages.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {campDetails.packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => handlePackageClick(pkg)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-gray-900">{pkg.name || 'Unnamed Package'}</h5>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            #{pkg.id}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="text-gray-900">
                              {formatDate(pkg.start_date)} - {formatDate(pkg.end_date)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Services:</span>
                            <span className="text-gray-900">
                              {pkg.service_ids?.length || 0} service{pkg.service_ids?.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Technicians:</span>
                            <span className="text-gray-900">{pkg.technicians?.length || 0} assigned</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
                            onClick={() =>
                              navigate("/patient-dashboard", {
                                state: {
                                  packageId: pkg.id,
                                  technicianId: technicianInfo.id,
                                  campId: selectedCamp.camp.id,
                                },
                              })
                            }
                          >
                            View Package Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No packages available */}
              {showPackages && campDetails?.packages && campDetails.packages.length === 0 && (
                <div className="border-t pt-6">
                  <div className="text-center py-8">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <p className="text-gray-500">No packages assigned for this camp</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patients Section for Selected Package */}
              {selectedPackage && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">
                      Patients for Package: {selectedPackage.name}
                    </h4>
                    <button
                      onClick={handleBackToPackages}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
                    >
                      Back to Packages
                    </button>
                  </div>

                  {patientsLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading patients...</p>
                    </div>
                  )}

                  {patientsError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 font-medium">Error loading patients</p>
                      <p className="text-red-600 text-sm">{patientsError}</p>
                      <button
                        onClick={() => fetchPatients(selectedPackage.id)}
                        className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {patients && patients.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-blue-800 font-medium">Total Patients: {patients.length}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {patients.map((patient) => (
                          <div key={patient.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                              {/* Patient Name Column */}
                              <div className="space-y-2">
                                <h6 className="font-medium text-gray-700 text-sm">Patient Name</h6>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h5 className="font-medium text-gray-900 text-lg">{patient.name}</h5>
                                  <p className="text-sm text-gray-600">
                                    ID: <span className="font-mono">{patient.unique_patient_id}</span>
                                  </p>
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Services:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {patient.services.split(", ").map((service, index) => (
                                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                          {service}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* QR Code Column */}
                              <div className="space-y-2">
                                <h6 className="font-medium text-gray-700 text-sm">QR Code</h6>
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                  <img
                                    src={generateQRCode(patient.unique_patient_id)}
                                    alt={`QR Code for ${patient.name}`}
                                    className="mx-auto mb-2 border border-gray-200 rounded"
                                  />
                                  <p className="text-xs text-gray-600">Scan for details</p>
                                </div>
                              </div>

                              {/* Report Column */}
                              <div className="space-y-2">
                                <h6 className="font-medium text-gray-700 text-sm">Report</h6>
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                  <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-sm">
                                    Generate Report
                                  </button>
                                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm">
                                    View Report
                                  </button>
                                  <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-sm">
                                    Download PDF
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {patients && patients.length === 0 && (
                    <div className="text-center py-8">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-500">No patients found for this package</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Note */}
              {!selectedCamp.camp.ready_to_go && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Upload Excel and mark Ready to Go from View Camp only
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {assignedCamps.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-md p-8">
              <p className="text-gray-500 text-lg">No camp assignments found</p>
              <p className="text-gray-400 mt-2">Check back later for assigned camps</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TechnicalDashboard;