import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function PatientTechnicianDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const { packageId, technicianId, campId, packageName } = location.state || {};

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const response = await fetch(
        `http://127.0.0.1:8000/api/technician/patients/?technician_id=${technicianId}&package_id=${packageId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch patients.");
      }
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

        {patients.length === 0 ? (
          <div className="bg-white border border-gray-300 p-6 rounded text-center text-gray-600">
            No patients found for this package.
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
                {patients.map((patient, index) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 border-b">{index + 1}</td>
                    <td className="px-4 py-3 border-b font-medium text-gray-900">{patient.name}</td>
                    <td className="px-4 py-3 border-b font-mono text-sm">{patient.unique_patient_id}</td>
                    <td className="px-4 py-3 border-b">
                      <div className="flex flex-wrap gap-1">
                        {patient.services.split(", ").map((service, i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded cursor-pointer ${
                              service === 'Audiometry' 
                                ? 'bg-green-200 text-green-900 hover:bg-green-300' 
                                : 'bg-blue-200 text-blue-900'
                            }`}
                            onClick={() => service === 'Audiometry' && navigate('/audiometry', {
                              state: {
                                patientId: patient.unique_patient_id,
                                patientName: patient.name,
                                technicianId: technicianId
                              }
                            })}
                          >
                            {service}
                          </span>
                        ))}
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
