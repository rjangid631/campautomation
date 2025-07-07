import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Package, Users } from 'lucide-react';

const ViewServiceSelection = () => {
  const { campId } = useParams();
  const navigate = useNavigate();

  const [campData, setCampData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTech, setShowTech] = useState({});
  const [selectedTechs, setSelectedTechs] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadMsg, setUploadMsg] = useState({});
  const [readyLoading, setReadyLoading] = useState(false);
  const [readySuccess, setReadySuccess] = useState(false);
  const [readyError, setReadyError] = useState(null);
  const [excelUploaded, setExcelUploaded] = useState({});

  // Fetch camp details
  useEffect(() => {
    const fetchCampDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://127.0.0.1:8000/api/campmanager/camps/${campId}/details/`);
        setCampData(response.data.camp);
        setPackages(response.data.packages);
        setError(null);
      } catch (error) {
        setError('Failed to load camp details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (campId) fetchCampDetails();
  }, [campId]);

  // Fetch technicians
  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/technician/technicians/');
        setTechnicians(response.data);
      } catch (err) {
        console.error("Failed to fetch technicians", err);
      }
    };
    fetchTechnicians();
  }, []);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const handleAssignTechnicians = async (pkgId) => {
    if (!selectedTechs[pkgId] || selectedTechs[pkgId].length === 0) {
      alert("Please select at least one technician.");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/technician/assign-package/", {
        camp_id: campId,
        package_id: pkgId,
        technician_ids: selectedTechs[pkgId],
      });
      alert("Technicians assigned successfully!");
    } catch (err) {
      alert("Failed to assign technicians.");
    }
  };

  const handleExcelUpload = async (pkgId, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [pkgId]: true }));
    setUploadMsg(prev => ({ ...prev, [pkgId]: '' }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('package_id', pkgId);
    formData.append('camp_id', campId);

    try {
      await axios.post('http://127.0.0.1:8000/api/campmanager/upload-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMsg(prev => ({ ...prev, [pkgId]: 'Upload successful!' }));
      setExcelUploaded(prev => ({ ...prev, [pkgId]: true }));
    } catch (err) {
      setUploadMsg(prev => ({ ...prev, [pkgId]: 'Upload failed.' }));
      setExcelUploaded(prev => ({ ...prev, [pkgId]: false }));
    }
    setUploading(prev => ({ ...prev, [pkgId]: false }));
  };

  const handleReadyToGo = async () => {
    setReadyLoading(true);
    setReadyError(null);
    try {
      await axios.patch(`http://127.0.0.1:8000/api/camps/${campId}/`, {
        ready_to_go: true,
      });
      setReadySuccess(true);
      setCampData(prev => ({ ...prev, ready_to_go: true }));
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setReadyError('Failed to update. Please try again.');
    }
    setReadyLoading(false);
  };

  const SERVICE_MAP = {
    1: "ECG", 2: "X-ray", 3: "PFT", 4: "Audiometry", 5: "Optometry",
    6: "Doctor Consultation", 7: "Pathology", 8: "Dental Consultation", 9: "Vitals",
    10: "Form 7", 11: "BMD", 12: "Tetanus Vaccine", 13: "Typhoid Vaccine", 14: "Coordinator",
    15: "CBC", 16: "Complete Hemogram", 17: "Hemoglobin", 18: "Urine Routine",
    19: "Stool Examination", 20: "Lipid Profile", 21: "Kidney Profile", 22: "LFT",
    23: "KFT", 24: "Random Blood Glucose", 25: "Blood Grouping"
  };

  const isAnyExcelUploaded = Object.values(excelUploaded).some(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading camp details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Service Selection Details - Camp #{campId}
        </h1>

        {campData && (
          <div className="bg-white shadow rounded p-6 mb-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div><strong>Location:</strong> {campData.location}</div>
              <div><strong>District:</strong> {campData.district}</div>
              <div><strong>State:</strong> {campData.state}</div>
              <div><strong>PIN Code:</strong> {campData.pin_code}</div>
              <div className="md:col-span-2"><strong>Dates:</strong> {formatDate(campData.start_date)} - {formatDate(campData.end_date)}</div>
            </div>
          </div>
        )}

        {packages.map(pkg => (
          <div key={pkg.id} className="bg-white shadow p-6 rounded-lg mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{pkg.name}</h3>

            <div className="mb-3">
              <label className="font-medium text-gray-700">Services:</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {pkg.service_ids.map((sid, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-100 border border-purple-200 rounded-full text-sm text-purple-800">
                    {SERVICE_MAP[sid] || `Service ${sid}`}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowTech(prev => ({ ...prev, [pkg.id]: !prev[pkg.id] }))}
              className="text-blue-600 underline text-sm mb-2"
            >
              {showTech[pkg.id] ? 'Hide Technicians' : 'Choose Technicians'}
            </button>

            {showTech[pkg.id] && (
              <div className="border p-3 bg-blue-50 rounded">
                {technicians.length > 0 ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-2 mb-3">
                      {technicians.map(tech => (
                        <label key={tech.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedTechs[pkg.id]?.includes(tech.id) || false}
                            onChange={() =>
                              setSelectedTechs(prev => ({
                                ...prev,
                                [pkg.id]: prev[pkg.id]
                                  ? prev[pkg.id].includes(tech.id)
                                    ? prev[pkg.id].filter(id => id !== tech.id)
                                    : [...prev[pkg.id], tech.id]
                                  : [tech.id]
                              }))
                            }
                            className="accent-blue-600"
                          />
                          {tech.name}
                        </label>
                      ))}
                    </div>
                    <button
                      onClick={() => handleAssignTechnicians(pkg.id)}
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                    >
                      Save Assignment
                    </button>
                  </>
                ) : (
                  <p className="text-gray-500">No technicians available.</p>
                )}
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-green-700 mb-1">Upload Patient Excel:</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleExcelUpload(pkg.id, e.target.files[0])}
                className="block border border-gray-300 rounded px-2 py-1"
                disabled={uploading[pkg.id]}
              />
              {uploading[pkg.id] && <span className="ml-2 text-blue-600">Uploading...</span>}
              {uploadMsg[pkg.id] && <span className="ml-2">{uploadMsg[pkg.id]}</span>}
            </div>
          </div>
        ))}

        <div className="text-center mt-8">
          <button
            className={`px-6 py-2 rounded font-semibold text-white transition ${
              campData.ready_to_go
                ? 'bg-green-500 cursor-not-allowed'
                : isAnyExcelUploaded
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={handleReadyToGo}
            disabled={campData.ready_to_go || readyLoading || !isAnyExcelUploaded}
          >
            {campData.ready_to_go
              ? 'Ready to Go!'
              : readyLoading
              ? 'Updating...'
              : 'Ready to go'}
          </button>
          {!isAnyExcelUploaded && !campData.ready_to_go && (
            <p className="text-gray-500 mt-2">Upload at least one Excel to enable Ready to Go</p>
          )}
          {readyError && <p className="text-red-600 mt-2">{readyError}</p>}
          {readySuccess && !campData.ready_to_go && (
            <p className="text-green-600 mt-2">Marked as Ready!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewServiceSelection;
