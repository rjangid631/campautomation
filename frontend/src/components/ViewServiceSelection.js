import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campApi, technicianApi, serviceApi, utils } from './api';

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

  const SERVICE_MAP = serviceApi.getServiceMap();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campData = await campApi.getCampDetails(campId);
        setCampData(campData.camp);
        setPackages(campData.packages);

        const techniciansData = await technicianApi.getAllTechnicians();
        setTechnicians(techniciansData);
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
      await technicianApi.assignPackage(campId, pkgId, assignments);
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

    try {
      await campApi.uploadExcel(file, pkgId, campId);
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
      await campApi.updateCamp(campId, { ready_to_go: true });
      setReadySuccess(true);
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      setReadyError('Failed to update.');
    }
    setReadyLoading(false);
  };

  const formatDate = utils.formatDate;

  const isAnyExcelUploaded = Object.values(excelUploaded).some(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#11a8a4' }}>
        <div className="text-white text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8" style={{ backgroundColor: '#11a8a4' }}>
      {/* Background decorative elements */}
      <div className="absolute top-20 left-4 sm:left-20 w-16 h-16 sm:w-32 sm:h-32 rounded-full opacity-20 animate-pulse"
           style={{ backgroundColor: '#7ed957' }}></div>
      <div className="absolute bottom-20 right-4 sm:right-20 w-12 h-12 sm:w-24 sm:h-24 rounded-full opacity-30 animate-pulse"
           style={{ animationDelay: '1000ms', backgroundColor: '#0cc0df' }}></div>
      <div className="absolute top-1/2 left-2 sm:left-10 w-8 h-8 sm:w-16 sm:h-16 rounded-full opacity-25 animate-bounce"
           style={{ animationDelay: '500ms', backgroundColor: '#944d0d' }}></div>

      <div className="max-w-7xl mx-auto">
        {/* Camp Information Header */}
        <div className="text-center mb-8">
          <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-2xl border border-white/20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 text-center">
              <div className="px-2">
                <p className="text-xs sm:text-sm font-medium text-gray-700">Camp ID</p>
                <p className="text-lg sm:text-xl font-semibold text-cyan-500">#{campId}</p>
              </div>
              <div className="px-2">
                <p className="text-xs sm:text-sm font-medium text-gray-700">Location</p>
                <p className="text-lg sm:text-xl font-semibold text-cyan-500 break-words">{campData?.location}</p>
              </div>
              <div className="px-2">
                <p className="text-xs sm:text-sm font-medium text-gray-700">District</p>
                <p className="text-lg sm:text-xl font-semibold text-cyan-500 break-words">{campData?.district}</p>
              </div>
              <div className="px-2">
                <p className="text-xs sm:text-sm font-medium text-gray-700">Duration</p>
                <p className="text-sm sm:text-lg font-semibold text-cyan-500">
                  {formatDate(campData?.start_date)} to {formatDate(campData?.end_date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="space-y-6 sm:space-y-8">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-4 sm:p-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center break-words" style={{ color: '#3c3b3f' }}>
                  {pkg.name}
                </h3>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
                  {/* Left Side - Technicians */}
                  <div className="space-y-4">
                    <p className="text-lg sm:text-xl font-semibold" style={{ color: '#0cc0df' }}>
                      Select Technician(s):
                    </p>
                    <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto">
                      {technicians.map(tech => (
                        <label key={tech.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg"
                               style={{ 
                                 borderColor: selectedTechsPerPkg[pkg.id]?.includes(tech.id) ? '#0cc0df' : '#e5e7eb',
                                 backgroundColor: selectedTechsPerPkg[pkg.id]?.includes(tech.id) ? '#0cc0df15' : 'transparent'
                               }}>
                          <input
                            type="checkbox"
                            checked={selectedTechsPerPkg[pkg.id]?.includes(tech.id) || false}
                            onChange={() => handleTechChange(pkg.id, tech.id)}
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 focus:ring-2 flex-shrink-0"
                            style={{ 
                              accentColor: '#0cc0df',
                              '--tw-ring-color': '#0cc0df'
                            }}
                          />
                          <span className="text-sm sm:text-lg font-medium break-words" style={{ color: '#3c3b3f' }}>
                            {tech.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Right Side - Services */}
                  <div className="space-y-4">
                    {(selectedTechsPerPkg[pkg.id]?.length > 0) && (
                      <div>
                        <p className="text-lg sm:text-xl font-semibold" style={{ color: '#7ed957' }}>
                          Select Services to Assign:
                        </p>
                        <div className="space-y-2 sm:space-y-3 max-h-64 sm:max-h-80 overflow-y-auto pr-2">
                          {pkg.service_ids.map(sid => (
                            <label key={sid} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:shadow-lg"
                                   style={{ 
                                     borderColor: selectedServicesPerPkg[pkg.id]?.includes(sid) ? '#7ed957' : '#e5e7eb',
                                     backgroundColor: selectedServicesPerPkg[pkg.id]?.includes(sid) ? '#7ed95715' : 'transparent'
                                   }}>
                              <input
                                type="checkbox"
                                checked={selectedServicesPerPkg[pkg.id]?.includes(sid) || false}
                                onChange={() => handleServiceToggle(pkg.id, sid)}
                                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 focus:ring-2 flex-shrink-0"
                                style={{ 
                                  accentColor: '#7ed957',
                                  '--tw-ring-color': '#7ed957'
                                }}
                              />
                              <span className="text-sm sm:text-lg font-medium break-words" style={{ color: '#3c3b3f' }}>
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
                <div className="mt-6 sm:mt-8 flex flex-col lg:flex-row gap-4 sm:gap-6">
                  <button
                    onClick={() => handleAssign(pkg.id)}
                    className="w-full lg:w-auto px-6 sm:px-8 py-3 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
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

                  <div className="flex-1 space-y-2">
                    <label className="block text-sm font-semibold" style={{ color: '#3c3b3f' }}>
                      Upload Patient Excel:
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={(e) => handleExcelUpload(pkg.id, e.target.files[0])}
                        disabled={uploading[pkg.id]}
                        className="block w-full text-sm border-2 rounded-xl p-2 sm:p-3 focus:outline-none focus:ring-2 transition-all duration-200"
                        style={{ 
                          borderColor: '#0cc0df',
                          '--tw-ring-color': '#0cc0df'
                        }}
                      />
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        {uploading[pkg.id] && (
                          <span className="text-sm font-medium whitespace-nowrap" style={{ color: '#0cc0df' }}>
                            Uploading...
                          </span>
                        )}
                        {uploadMsg[pkg.id] && (
                          <span className={`text-sm font-medium whitespace-nowrap ${
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
            </div>
          ))}
        </div>

        {/* Ready to Go Button */}
        <div className="text-center mt-8 sm:mt-12">
          <button
            className={`w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-bold text-white text-lg sm:text-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${
              campData?.ready_to_go
                ? 'bg-green-500 cursor-not-allowed'
                : isAnyExcelUploaded
                ? ''
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            style={!campData?.ready_to_go && isAnyExcelUploaded ? {
              background: 'linear-gradient(135deg, #0cc0df 0%, #7ed957 100%)'
            } : {}}
            onClick={handleReadyToGo}
            disabled={campData?.ready_to_go || readyLoading || !isAnyExcelUploaded}
            onMouseEnter={(e) => {
              if (!campData?.ready_to_go && isAnyExcelUploaded) {
                e.target.style.background = 'linear-gradient(135deg, #0aa8c4 0%, #6bc749 100%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!campData?.ready_to_go && isAnyExcelUploaded) {
                e.target.style.background = 'linear-gradient(135deg, #0cc0df 0%, #7ed957 100%)';
              }
            }}
          >
            {campData?.ready_to_go ? 'Ready to Go!' : readyLoading ? 'Updating...' : 'Ready to Go'}
          </button>
          {readyError && (
            <p className="text-red-600 mt-4 text-base sm:text-lg font-semibold">{readyError}</p>
          )}
          {readySuccess && !campData?.ready_to_go && (
            <p className="text-green-600 mt-4 text-base sm:text-lg font-semibold">Marked as Ready!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewServiceSelection;
