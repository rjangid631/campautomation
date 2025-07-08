import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewServiceSelection = () => {
  const { campId } = useParams();
  const navigate = useNavigate();

  const [campData, setCampData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedTechsPerPkg, setSelectedTechsPerPkg] = useState({});
  const [selectedServicesPerPkg, setSelectedServicesPerPkg] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [uploadMsg, setUploadMsg] = useState({});
  const [excelUploaded, setExcelUploaded] = useState({});
  const [readyLoading, setReadyLoading] = useState(false);
  const [readySuccess, setReadySuccess] = useState(false);
  const [readyError, setReadyError] = useState(null);

  const SERVICE_MAP = {
    1: "ECG", 2: "X-ray", 3: "PFT", 4: "Audiometry", 5: "Optometry",
    6: "Doctor Consultation", 7: "Pathology", 8: "Dental Consultation", 9: "Vitals",
    10: "Form 7", 11: "BMD", 12: "Tetanus Vaccine", 13: "Typhoid Vaccine", 14: "Coordinator",
    15: "CBC", 16: "Complete Hemogram", 17: "Hemoglobin", 18: "Urine Routine",
    19: "Stool Examination", 20: "Lipid Profile", 21: "Kidney Profile", 22: "LFT",
    23: "KFT", 24: "Random Blood Glucose", 25: "Blood Grouping"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campRes = await axios.get(`http://127.0.0.1:8000/api/campmanager/camps/${campId}/details/`);
        setCampData(campRes.data.camp);
        setPackages(campRes.data.packages);

        const techRes = await axios.get(`http://127.0.0.1:8000/api/technician/technicians/`);
        setTechnicians(techRes.data);
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setLoading(false);
      }
    };

    if (campId) fetchData();
  }, [campId]);

  const handleTechChange = (pkgId, techId) => {
    setSelectedTechsPerPkg(prev => {
      const current = prev[pkgId] || [];
      return {
        ...prev,
        [pkgId]: current.includes(techId)
          ? current.filter(id => id !== techId)
          : [...current, techId]
      };
    });
    setSelectedServicesPerPkg(prev => ({ ...prev, [pkgId]: [] }));
  };

  const handleServiceToggle = (pkgId, serviceId) => {
    setSelectedServicesPerPkg(prev => {
      const current = prev[pkgId] || [];
      return {
        ...prev,
        [pkgId]: current.includes(serviceId)
          ? current.filter(id => id !== serviceId)
          : [...current, serviceId]
      };
    });
  };

  const handleAssign = async (pkgId) => {
    const serviceIds = selectedServicesPerPkg[pkgId] || [];
    const technicianIds = selectedTechsPerPkg[pkgId] || [];

    if (serviceIds.length === 0 || technicianIds.length === 0) {
      alert("Please select at least one technician and one service.");
      return;
    }

    const assignments = technicianIds.map(techId => ({
      technician_id: techId,
      service_ids: serviceIds
    }));

    try {
      const response = await axios.post(`http://127.0.0.1:8000/api/technician/assign-package/`, {
        camp_id: parseInt(campId),
        package_id: pkgId,
        assignments: assignments
      });

      alert("Technicians assigned to selected services successfully!");
    } catch (err) {
      console.error("Assignment error:", err);
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
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setReadyError('Failed to update.');
    }
    setReadyLoading(false);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  const isAnyExcelUploaded = Object.values(excelUploaded).some(Boolean);

  if (loading) return <p className="text-center mt-8">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Camp #{campId}</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <p><strong>Location:</strong> {campData.location}</p>
        <p><strong>District:</strong> {campData.district}</p>
        <p><strong>Dates:</strong> {formatDate(campData.start_date)} to {formatDate(campData.end_date)}</p>
      </div>

      {packages.map((pkg) => (
        <div key={pkg.id} className="bg-white p-4 rounded shadow mb-6">
          <h3 className="text-lg font-semibold mb-3">{pkg.name}</h3>

          <div className="mb-4">
            <p className="font-medium mb-1">Select Technician(s):</p>
            <div className="grid grid-cols-2 gap-2">
              {technicians.map(tech => (
                <label key={tech.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTechsPerPkg[pkg.id]?.includes(tech.id) || false}
                    onChange={() => handleTechChange(pkg.id, tech.id)}
                  />
                  {tech.name}
                </label>
              ))}
            </div>
          </div>

          {(selectedTechsPerPkg[pkg.id]?.length > 0) && (
            <div className="mb-4">
              <p className="font-medium mb-1">Select Services to Assign:</p>
              <div className="grid grid-cols-2 gap-2">
                {pkg.service_ids.map(sid => (
                  <label key={sid} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedServicesPerPkg[pkg.id]?.includes(sid) || false}
                      onChange={() => handleServiceToggle(pkg.id, sid)}
                    />
                    {SERVICE_MAP[sid] || `Service ${sid}`}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => handleAssign(pkg.id)}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Assignment
          </button>

          <div className="mt-4">
            <label className="block text-sm font-medium">Upload Patient Excel:</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => handleExcelUpload(pkg.id, e.target.files[0])}
              disabled={uploading[pkg.id]}
            />
            {uploading[pkg.id] && <span className="text-blue-600 ml-2">Uploading...</span>}
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
          {campData.ready_to_go ? 'Ready to Go!' : readyLoading ? 'Updating...' : 'Ready to Go'}
        </button>
        {readyError && <p className="text-red-600 mt-2">{readyError}</p>}
        {readySuccess && !campData.ready_to_go && <p className="text-green-600 mt-2">Marked as Ready!</p>}
      </div>
    </div>
  );
};

export default ViewServiceSelection;