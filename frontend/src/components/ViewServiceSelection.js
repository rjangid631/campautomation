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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#11a8a4' }}>
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#11a8a4' }}>
      {/* Background decorative elements */}
      <div className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-20 animate-pulse"
           style={{ backgroundColor: '#7ed957' }}></div>
      <div className="absolute bottom-20 right-20 w-24 h-24 rounded-full opacity-30 animate-pulse"
           style={{ animationDelay: '1000ms', backgroundColor: '#0cc0df' }}></div>
      <div className="absolute top-1/2 left-10 w-16 h-16 rounded-full opacity-25 animate-bounce"
           style={{ animationDelay: '500ms', backgroundColor: '#944d0d' }}></div>

      <div className="max-w-7xl mx-auto p-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Camp #{campId}</h2>
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-white/20 max-w-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm font-medium" style={{ color: '#3c3b3f' }}>Location</p>
                <p className="text-lg font-semibold" style={{ color: '#0cc0df' }}>{campData.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#3c3b3f' }}>District</p>
                <p className="text-lg font-semibold" style={{ color: '#0cc0df' }}>{campData.district}</p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#3c3b3f' }}>Duration</p>
                <p className="text-lg font-semibold" style={{ color: '#0cc0df' }}>
                  {formatDate(campData.start_date)} to {formatDate(campData.end_date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="space-y-8">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-6">
                <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: '#3c3b3f' }}>
                  {pkg.name}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Side - Technicians */}
                  <div>
                    <p className="text-lg font-semibold mb-4" style={{ color: '#0cc0df' }}>
                      Select Technician(s):
                    </p>
                    <div className="space-y-3">
                      {technicians.map(tech => (
                        <label key={tech.id} className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg"
                               style={{ 
                                 borderColor: selectedTechsPerPkg[pkg.id]?.includes(tech.id) ? '#0cc0df' : '#e5e7eb',
                                 backgroundColor: selectedTechsPerPkg[pkg.id]?.includes(tech.id) ? '#0cc0df15' : 'transparent'
                               }}>
                          <input
                            type="checkbox"
                            checked={selectedTechsPerPkg[pkg.id]?.includes(tech.id) || false}
                            onChange={() => handleTechChange(pkg.id, tech.id)}
                            className="w-5 h-5 rounded border-2 focus:ring-2"
                            style={{ 
                              accentColor: '#0cc0df',
                              '--tw-ring-color': '#0cc0df'
                            }}
                          />
                          <span className="text-lg font-medium" style={{ color: '#3c3b3f' }}>
                            {tech.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Right Side - Services */}
                  <div>
                    {(selectedTechsPerPkg[pkg.id]?.length > 0) && (
                      <div>
                        <p className="text-lg font-semibold mb-4" style={{ color: '#7ed957' }}>
                          Select Services to Assign:
                        </p>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                          {pkg.service_ids.map(sid => (
                            <label key={sid} className="flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg"
                                   style={{ 
                                     borderColor: selectedServicesPerPkg[pkg.id]?.includes(sid) ? '#7ed957' : '#e5e7eb',
                                     backgroundColor: selectedServicesPerPkg[pkg.id]?.includes(sid) ? '#7ed95715' : 'transparent'
                                   }}>
                              <input
                                type="checkbox"
                                checked={selectedServicesPerPkg[pkg.id]?.includes(sid) || false}
                                onChange={() => handleServiceToggle(pkg.id, sid)}
                                className="w-5 h-5 rounded border-2 focus:ring-2"
                                style={{ 
                                  accentColor: '#7ed957',
                                  '--tw-ring-color': '#7ed957'
                                }}
                              />
                              <span className="text-lg font-medium" style={{ color: '#3c3b3f' }}>
                                {SERVICE_MAP[sid] || `Service ${sid}`}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center">
                  <button
                    onClick={() => handleAssign(pkg.id)}
                    className="px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                    style={{ 
                      background: 'linear-gradient(135deg, #0cc0df 0%, #7ed957 100%)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #0aa8c4 0%, #6bc749 100%)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #0cc0df 0%, #7ed957 100%)';
                    }}
                  >
                    Save Assignment
                  </button>

                  <div className="flex-1">
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#3c3b3f' }}>
                      Upload Patient Excel:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => handleExcelUpload(pkg.id, e.target.files[0])}
                        disabled={uploading[pkg.id]}
                        className="block w-full text-sm border-2 rounded-xl p-3 focus:outline-none focus:ring-2 transition-all duration-200"
                        style={{ 
                          borderColor: '#0cc0df',
                          '--tw-ring-color': '#0cc0df'
                        }}
                      />
                      {uploading[pkg.id] && (
                        <span className="text-sm font-medium" style={{ color: '#0cc0df' }}>
                          Uploading...
                        </span>
                      )}
                      {uploadMsg[pkg.id] && (
                        <span className={`text-sm font-medium ${
                          uploadMsg[pkg.id].includes('successful') ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {uploadMsg[pkg.id]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ready to Go Button */}
        <div className="text-center mt-12">
          <button
            className={`px-12 py-4 rounded-xl font-bold text-white text-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${
              campData.ready_to_go
                ? 'bg-green-500 cursor-not-allowed'
                : isAnyExcelUploaded
                ? ''
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            style={!campData.ready_to_go && isAnyExcelUploaded ? {
              background: 'linear-gradient(135deg, #0cc0df 0%, #7ed957 100%)'
            } : {}}
            onClick={handleReadyToGo}
            disabled={campData.ready_to_go || readyLoading || !isAnyExcelUploaded}
            onMouseEnter={(e) => {
              if (!campData.ready_to_go && isAnyExcelUploaded) {
                e.target.style.background = 'linear-gradient(135deg, #0aa8c4 0%, #6bc749 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!campData.ready_to_go && isAnyExcelUploaded) {
                e.target.style.background = 'linear-gradient(135deg, #0cc0df 0%, #7ed957 100%)';
              }
            }}
          >
            {campData.ready_to_go ? 'Ready to Go!' : readyLoading ? 'Updating...' : 'Ready to Go'}
          </button>
          {readyError && (
            <p className="text-red-600 mt-4 text-lg font-semibold">{readyError}</p>
          )}
          {readySuccess && !campData.ready_to_go && (
            <p className="text-green-600 mt-4 text-lg font-semibold">Marked as Ready!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewServiceSelection;