import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

function TechnicalDashboard() {
  const navigate = useNavigate();
  const [assignedCamps, setAssignedCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [patients, setPatients] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientsError, setPatientsError] = useState(null);
  const [showPackages, setShowPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showPatients, setShowPatients] = useState(false);
  const [technicianInfo, setTechnicianInfo] = useState(null);

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
      console.log("API Response:", data); // Debug log
      
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
              district: 'N/A', // Not provided in your API
              state: 'N/A', // Not provided in your API
              pin_code: 'N/A', // Not provided in your API
              start_date: null, // Not provided in your API
              end_date: null, // Not provided in your API
              ready_to_go: false, // Not provided in your API
              client: 'N/A' // Not provided in your API
            },
            services: [], // Store services for this camp
            packages: [] // This would need to be fetched separately if needed
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
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
      setError(err.message);
    } finally {
      setLoading(false);
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
  };

  // Navigate to patient dashboard with package info
  const handleViewPatientsForPackage = (packageId) => {
    const technicianId = technicianInfo.id;
    navigate(`/patient-dashboard?technician_id=${technicianId}&package_id=${packageId}`);
  };

  // Navigate to individual patient report
  const handleViewReport = (patientId) => {
    navigate(`/patient-dashboard?patientId=${patientId}`);
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
            <h1 className="text-3xl font-bold text-gray-900">Technical Dashboard</h1>
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
                    <span>{showPackages ? "Hide Services" : "View Services"}</span>
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
                  <p className="text-sm text-gray-600">Services: {selectedCamp.services ? selectedCamp.services.length : 0}</p>
                </div>
              </div>

              {/* Services Section */}
              {showPackages && selectedCamp.services && selectedCamp.services.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">
                    Assigned Services ({selectedCamp.services.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedCamp.services.map((service) => (
                      <div
                        key={service.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-gray-900">{service.name || 'Unnamed Service'}</h5>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            #{service.id}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service ID:</span>
                            <span className="text-gray-900">{service.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service Name:</span>
                            <span className="text-gray-900">{service.name}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm">
                            View Service Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Note */}
              {!selectedCamp.camp.ready_to_go && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    
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