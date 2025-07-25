import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchTechnicianPatients,
  fetchServiceIdByName,
  submitTechnicianServiceDone
} from "./api";

function PatientTechnicianDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const { packageId, technicianId, campId, packageName } = location.state || {};

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!packageId || !technicianId) {
      setError("Missing package or technician information.");
      setLoading(false);
      return;
    }
    fetchPatients();
  }, [packageId, technicianId]);

  const fetchPatients = async () => {
    try {
      const data = await fetchTechnicianPatients({ technicianId, packageId, campId });
      setPatients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.unique_patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getServiceRoute = (service) => {
    const normalized = service.trim().toLowerCase();

    const serviceRoutes = {
      'audiometry': '/audiometry',
      'ecg': '/ecg',
      'x-ray': '/xray',
      'pft': '/pft',
      'optometry': '/optometry',
      'doctor consultation': '/doctor-consultation',
      'pathology': '/pathology',
      'dental consultation': '/dental-consultation',
      'vitals': '/vitals',
      'form 7': '/form7',
      'bmd': '/bmd',
      'tetanus vaccine': '/tetanus-vaccine',
      'typhoid vaccine': '/typhoid-vaccine',
      'coordinator': '/coordinator',
      'cbc': '/cbc',
      'complete hemogram': '/complete-hemogram',
      'hemoglobin': '/hemoglobin',
      'urine routine': '/urine-routine',
      'stool examination': '/stool-examination',
      'lipid profile': '/lipid-profile',
      'kidney profile': '/kidney-profile',
      'lft': '/lft',
      'kft': '/kft',
      'random blood glucose': '/random-blood-glucose',
      'blood grouping': '/blood-grouping'
    };

    return serviceRoutes[normalized] || null;
  };

  const handleServiceClick = async (serviceName, patient) => {
    const trimmedService = serviceName.trim();
    const route = getServiceRoute(trimmedService);

    // Always fetch serviceId for all services
    let serviceId;
    try {
      serviceId = await fetchServiceIdByName(trimmedService);
    } catch (err) {
      alert(`Service ID not found for: "${trimmedService}"`);
      return;
    }

    // Special handling for ECG and X-ray
    if (["ecg", "x-ray"].includes(trimmedService.toLowerCase())) {
      if (window.confirm("You want to done")) {
        try {
          await submitTechnicianServiceDone({
            patientId: patient.unique_patient_id,
            technicianId,
            serviceId
          });
          alert("Service marked as done!");
        } catch (err) {
          alert("Error: " + err.message);
        }
      }
      return; // Do not navigate
    }

    if (!route) {
      alert(`No route defined for service: "${trimmedService}"`);
      return;
    }

    // Default navigation for other services
    navigate(route, {
      state: {
        patientId: patient.unique_patient_id,
        patientName: patient.name,
        technicianId: technicianId,
        serviceId: serviceId
      }
    });
  };

  const generateQRCode = (patientId) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=PATIENT_${patientId}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-600 text-lg">Loading patient data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="bg-white border border-red-300 p-6 rounded shadow">
          <p className="text-red-800 font-semibold mb-2">Error</p>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Patients - {packageName || "Package"} (Camp #{campId})
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            ← Back
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search patients by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredPatients.length === 0 ? (
          <div className="bg-white border border-gray-300 p-6 rounded text-center text-gray-600">
            {searchTerm ? "No patients found matching your search." : "No patients found for this package."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 shadow rounded-lg">
              <thead className="bg-blue-100">
                <tr>
                  <th className="text-left px-4 py-3 border-b">#</th>
                  <th className="text-left px-4 py-3 border-b">Patient Name</th>
                  <th className="text-left px-4 py-3 border-b">Patient ID</th>
                  <th className="text-left px-4 py-3 border-b">Services</th>
                  <th className="text-left px-4 py-3 border-b">QR Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient, index) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b">{index + 1}</td>
                    <td className="px-4 py-3 border-b font-medium text-gray-900">{patient.name}</td>
                    <td className="px-4 py-3 border-b font-mono text-sm">{patient.unique_patient_id}</td>
                    <td className="px-4 py-3 border-b">
                      <div className="flex flex-wrap gap-1">
                        {patient.services.split(",").map((service, i) => {
                          const trimmedService = service.trim();
                          const route = getServiceRoute(trimmedService);
                          return (
                            <span
                              key={i}
                              title={route ? "" : "Form not available"}
                              className={`text-xs px-2 py-1 rounded cursor-pointer ${
                                route
                                  ? 'bg-green-200 text-green-900 hover:bg-green-300'
                                  : 'bg-blue-200 text-blue-900'
                              }`}
                              onClick={() => handleServiceClick(trimmedService, patient)}
                            >
                              {trimmedService}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b">
                      <img
                        src={generateQRCode(patient.unique_patient_id)}
                        alt="QR"
                        className="h-16 w-16 border rounded"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientTechnicianDashboard;
