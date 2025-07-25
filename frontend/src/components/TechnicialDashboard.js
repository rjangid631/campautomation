import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchTechnicianAssignments,
  fetchCampDetails,
  fetchPatientsForPackage,
} from "./api";

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

  useEffect(() => {
    const technicianId = localStorage.getItem("technicianId");
    const technicianName = localStorage.getItem("technicianName");
    const technicianEmail = localStorage.getItem("technicianEmail");
    if (technicianId) {
      setTechnicianInfo({
        id: technicianId,
        name: technicianName,
        email: technicianEmail,
      });
      loadTechnicianAssignments(technicianId);
    } else {
      setError("No technician information found. Please login again.");
      setLoading(false);
    }
  }, []);

  // Refactored: Use API from api.js
  const loadTechnicianAssignments = async (technicianId) => {
    try {
      setLoading(true);
      const processedCamps = await fetchTechnicianAssignments(technicianId);
      setAssignedCamps(processedCamps);
      if (processedCamps.length > 0) {
        setSelectedCamp(processedCamps[0]);
        loadCampDetails(processedCamps[0].camp.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("technicianId");
    localStorage.removeItem("technicianName");
    localStorage.removeItem("technicianEmail");
    navigate("/login");
  };

  // Refactored: Use API from api.js
  const loadCampDetails = async (campId) => {
    try {
      setCampDetailsLoading(true);
      const data = await fetchCampDetails(campId);
      setCampDetails(data);
      setSelectedCamp((prev) => ({
        ...prev,
        camp: {
          ...prev.camp,
          ...data.camp,
        },
      }));
    } catch (err) {
      // Don't set error here as basic camp info is still available
    } finally {
      setCampDetailsLoading(false);
    }
  };

  // Refactored: Use API from api.js
  const loadPatients = async (packageId) => {
    try {
      setPatientsLoading(true);
      setPatientsError(null);

      const technicianId = technicianInfo.id;
      const campId = selectedCamp?.camp?.id;

      if (!technicianId || !packageId || !campId) {
        throw new Error(
          "Missing required parameters (technicianId, packageId, or campId)"
        );
      }

      const patientsData = await fetchPatientsForPackage({
        technicianId,
        packageId,
        campId,
      });
      setPatients(patientsData);
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
    loadCampDetails(camp.camp.id);
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
    loadPatients(pkg.id);
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

  // Using new accent color for ready badge
  const getStatusBadge = (readyToGo) => {
    const baseClasses =
      "px-3 py-1 rounded-full text-sm font-medium";
    return readyToGo
      ? `${baseClasses} text-[#91d537] bg-[#eaf7d3]`
      : `${baseClasses} text-red-800 bg-red-100`;
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

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#11a8a4" }}
          ></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold mb-2">
            Error Loading Data
          </h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() =>
              technicianInfo && loadTechnicianAssignments(technicianInfo.id)
            }
            className="mt-4 px-4 py-2 text-white rounded transition-colors"
            style={{ background: "#11a8a4" }}
            onMouseOver={e =>
              (e.currentTarget.style.background = "#148e89")
            }
            onMouseOut={e =>
              (e.currentTarget.style.background = "#11a8a4")
            }
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
      <header className="bg-white shadow border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center py-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Technician Dashboard
            </h1>
            <div className="text-right">
              <p className="text-gray-600">
                Welcome, {technicianInfo?.name}!
              </p>
              <p className="text-sm text-gray-500">
                {technicianInfo?.email}
              </p>
              <button
                onClick={handleLogout}
                className="mt-2 block w-full md:w-auto text-left py-2 px-4 text-white rounded transition-colors"
                style={{ background: "#11a8a4" }}
                onMouseOver={e =>
                  (e.currentTarget.style.background = "#148e89")
                }
                onMouseOut={e =>
                  (e.currentTarget.style.background = "#11a8a4")
                }
              >
                LOGOUT
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Camp Assignments
          </h2>
          <p className="text-gray-600">
            Manage and monitor your assigned camps ({assignedCamps.length})
          </p>
        </div>

        {/* Camp Selection */}
        {assignedCamps.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Camp:
            </label>
            <select
              value={selectedCamp?.camp?.id || ""}
              onChange={(e) => {
                const campId = parseInt(e.target.value);
                const camp = assignedCamps.find(
                  (c) => c.camp && c.camp.id === campId
                );
                if (camp) handleCampSelect(camp);
              }}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2"
              style={{ focusRing: "#11a8a4" }}
            >
              {assignedCamps.map((assignment) => (
                <option key={assignment.camp.id} value={assignment.camp.id}>
                  {assignment.camp.location || "Unknown Location"} (#
                  {assignment.camp.id})
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
                  <div
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      background: "#11a8a4",
                      color: "#fff",
                    }}
                  >
                    #{selectedCamp.camp.id}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedCamp.camp.location || "Unknown Location"}
                  </h3>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={getStatusBadge(selectedCamp.camp.ready_to_go)}>
                    {getStatusText(selectedCamp.camp.ready_to_go)}
                  </span>
                  <button
                    onClick={handleViewPackagesClick}
                    className="text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                    style={{ background: "#11a8a4" }}
                    onMouseOver={e =>
                      (e.currentTarget.style.background = "#148e89")
                    }
                    onMouseOut={e =>
                      (e.currentTarget.style.background = "#11a8a4")
                    }
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
                    {selectedCamp.camp.location || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedCamp.camp.district || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    PIN: {selectedCamp.camp.pin_code || "N/A"}
                  </p>
                </div>

                {/* Duration */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Duration</h4>
                  <p className="text-gray-900 font-medium">
                    {formatDate(selectedCamp.camp.start_date)} -{" "}
                    {formatDate(selectedCamp.camp.end_date)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {calculateDuration(
                      selectedCamp.camp.start_date,
                      selectedCamp.camp.end_date
                    )}
                  </p>
                </div>

                {/* Assignment Details */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">
                    Assignment Details
                  </h4>
                  <p className="text-gray-900 font-medium">
                    #{selectedCamp.camp.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    Client: {selectedCamp.camp.client || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Packages: {campDetails?.packages?.length || 0}
                  </p>
                </div>
              </div>

              {/* Loading camp details */}
              {campDetailsLoading && (
                <div className="text-center py-4">
                  <div
                    className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-2"
                    style={{ borderColor: "#11a8a4" }}
                  ></div>
                  <p className="text-gray-600 text-sm">
                    Loading camp details...
                  </p>
                </div>
              )}

              {/* Packages Section */}
              {showPackages &&
                !selectedPackage &&
                campDetails?.packages &&
                campDetails.packages.length > 0 && (
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      Assigned Packages ({campDetails.packages.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {campDetails.packages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                          style={{
                            borderColor: "#11a8a4",
                            borderWidth: "1px",
                          }}
                          onClick={() => handlePackageClick(pkg)}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-medium text-gray-900">
                              {pkg.name || "Unnamed Package"}
                            </h5>
                            <span
                              className="px-2 py-1 rounded text-xs font-medium"
                              style={{
                                background: "#11a8a4",
                                color: "#fff",
                              }}
                            >
                              #{pkg.id}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="text-gray-900">
                                {formatDate(pkg.start_date)} -{" "}
                                {formatDate(pkg.end_date)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Services:</span>
                              <span className="text-gray-900">
                                {pkg.service_ids?.length || 0} service
                                {pkg.service_ids?.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Technicians:
                              </span>
                              <span className="text-gray-900">
                                {pkg.technicians?.length || 0} assigned
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                              className="w-full text-white py-2 px-4 rounded-md transition-colors text-sm"
                              style={{ background: "#11a8a4" }}
                              onMouseOver={e =>
                                (e.currentTarget.style.background = "#148e89")
                              }
                              onMouseOut={e =>
                                (e.currentTarget.style.background = "#11a8a4")
                              }
                              onClick={e => {
                                e.stopPropagation(); // Prevent parent click
                                navigate("/patient-dashboard", {
                                  state: {
                                    packageId: pkg.id,
                                    technicianId: technicianInfo.id,
                                    campId: selectedCamp.camp.id,
                                  },
                                });
                              }}
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
              {showPackages &&
                campDetails?.packages &&
                campDetails.packages.length === 0 && (
                  <div className="border-t pt-6">
                    <div className="text-center py-8">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <p className="text-gray-500">
                          No packages assigned for this camp
                        </p>
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
                      className="text-white px-4 py-2 rounded-md transition-colors text-sm"
                      style={{ background: "#11a8a4" }}
                      onMouseOver={e =>
                        (e.currentTarget.style.background = "#148e89")
                      }
                      onMouseOut={e =>
                        (e.currentTarget.style.background = "#11a8a4")
                      }
                    >
                      Back to Packages
                    </button>
                  </div>

                  {patientsLoading && (
                    <div className="text-center py-8">
                      <div
                        className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
                        style={{ borderColor: "#11a8a4" }}
                      ></div>
                      <p className="text-gray-600">Loading patients...</p>
                    </div>
                  )}

                  {patientsError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-800 font-medium">
                        Error loading patients
                      </p>
                      <p className="text-red-600 text-sm">{patientsError}</p>
                      <button
                        onClick={() => loadPatients(selectedPackage.id)}
                        className="mt-2 px-3 py-1 text-white rounded text-sm transition-colors"
                        style={{ background: "#11a8a4" }}
                        onMouseOver={e =>
                          (e.currentTarget.style.background = "#148e89")
                        }
                        onMouseOut={e =>
                          (e.currentTarget.style.background = "#11a8a4")
                        }
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {patients && patients.length > 0 && (
                    <div className="space-y-4">
                      <div className="rounded-lg p-3 mb-4" style={{ background: "#e3f6f5" }}>
                        <p className="font-medium" style={{ color: "#11a8a4" }}>
                          Total Patients: {patients.length}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {patients.map((patient) => (
                          <div
                            key={patient.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                              {/* Patient Name Column */}
                              <div className="space-y-2">
                                <h6 className="font-medium text-gray-700 text-sm">
                                  Patient Name
                                </h6>
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <h5 className="font-medium text-gray-900 text-lg">
                                    {patient.name}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    ID:{" "}
                                    <span className="font-mono">
                                      {patient.unique_patient_id}
                                    </span>
                                  </p>
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Services:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {patient.services
                                        .split(", ")
                                        .map((service, index) => (
                                          <span
                                            key={index}
                                            className="px-2 py-1 rounded text-xs"
                                            style={{
                                              background: "#11a8a4",
                                              color: "#fff",
                                            }}
                                          >
                                            {service}
                                          </span>
                                        ))}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* QR Code Column */}
                              <div className="space-y-2">
                                <h6 className="font-medium text-gray-700 text-sm">
                                  QR Code
                                </h6>
                                <div className="bg-gray-50 rounded-lg p-3 text-center">
                                  <img
                                    src={generateQRCode(
                                      patient.unique_patient_id
                                    )}
                                    alt={`QR Code for ${patient.name}`}
                                    className="mx-auto mb-2 border border-gray-200 rounded"
                                  />
                                  <p className="text-xs text-gray-600">
                                    Scan for details
                                  </p>
                                </div>
                              </div>

                              {/* Report Column */}
                              <div className="space-y-2">
                                <h6 className="font-medium text-gray-700 text-sm">
                                  Report
                                </h6>
                                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                  <button
                                    className="w-full text-white py-2 px-4 rounded-md transition-colors text-sm"
                                    style={{ background: "#91d537" }}
                                    onMouseOver={e =>
                                      (e.currentTarget.style.background =
                                        "#7BB021")
                                    }
                                    onMouseOut={e =>
                                      (e.currentTarget.style.background =
                                        "#91d537")
                                    }
                                  >
                                    Generate Report
                                  </button>
                                  <button
                                    className="w-full text-white py-2 px-4 rounded-md transition-colors text-sm"
                                    style={{ background: "#11a8a4" }}
                                    onMouseOver={e =>
                                      (e.currentTarget.style.background =
                                        "#148e89")
                                    }
                                    onMouseOut={e =>
                                      (e.currentTarget.style.background =
                                        "#11a8a4")
                                    }
                                  >
                                    View Report
                                  </button>
                                  <button
                                    className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors text-sm"
                                  >
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
                        <p className="text-gray-500">
                          No patients found for this package
                        </p>
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
              <p className="text-gray-400 mt-2">
                Check back later for assigned camps
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TechnicalDashboard;
