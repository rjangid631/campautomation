import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, Package, Users } from 'lucide-react';

const ViewServiceSelection = () => {
  const { campId } = useParams();
  const [campData, setCampData] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTech, setShowTech] = useState({});
  const [selectedTechs, setSelectedTechs] = useState({});
  const [uploading, setUploading] = useState({});
  const [uploadMsg, setUploadMsg] = useState({});

  useEffect(() => {
    const fetchCampDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://127.0.0.1:8000/api/campmanager/camps/${campId}/details/`);
        setCampData(response.data.camp);
        setPackages(response.data.packages);
        setError(null);
      } catch (error) {
        console.error('Error fetching camp details:', error);
        setError('Failed to load camp details. Please try again.');
        setCampData(null);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    if (campId) {
      fetchCampDetails();
    }
  }, [campId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle technician checkbox change
  const handleTechChange = (pkgId, techId) => {
    setSelectedTechs(prev => ({
      ...prev,
      [pkgId]: prev[pkgId]
        ? prev[pkgId].includes(techId)
          ? prev[pkgId].filter(id => id !== techId)
          : [...prev[pkgId], techId]
        : [techId]
    }));
  };

  // Handle Excel upload
  const handleExcelUpload = async (pkgId, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [pkgId]: true }));
    setUploadMsg(prev => ({ ...prev, [pkgId]: '' }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('package_id', pkgId);
    formData.append('camp_id', campId); // Add camp_id to the form data
    try {
      await axios.post('http://127.0.0.1:8000/api/campmanager/upload-excel/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMsg(prev => ({ ...prev, [pkgId]: 'Upload successful!' }));
    } catch (err) {
      setUploadMsg(prev => ({ ...prev, [pkgId]: 'Upload failed.' }));
    }
    setUploading(prev => ({ ...prev, [pkgId]: false }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading camp details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Service Selection Details
          </h1>
          <p className="text-gray-600">
            Camp #{campId} - Overview of services and packages
          </p>
        </div>

        {/* Camp Information Card */}
        {campData && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center mb-4">
              <MapPin className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Camp Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 block mb-1">Location</label>
                <p className="text-gray-900 font-medium">{campData.location}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 block mb-1">District</label>
                <p className="text-gray-900 font-medium">{campData.district}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 block mb-1">State</label>
                <p className="text-gray-900 font-medium">{campData.state}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-medium text-gray-500 block mb-1">PIN Code</label>
                <p className="text-gray-900 font-medium">{campData.pin_code}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                <label className="text-sm font-medium text-gray-500 block mb-1">Duration</label>
                <div className="flex items-center text-gray-900">
                  <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="font-medium">
                    {formatDate(campData.start_date)} - {formatDate(campData.end_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Packages Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <Package className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">
              Service Packages ({packages.length})
            </h2>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No packages found for this camp.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 via-white to-blue-50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {pkg.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          {formatDate(pkg.start_date)} - {formatDate(pkg.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-purple-700 block mb-1">Services</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {pkg.service_ids.map((serviceId, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200"
                        >
                          Service {serviceId}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Technician Section */}
                  <div className="mb-4">
                    <button
                      className="text-blue-600 underline font-medium"
                      onClick={() =>
                        setShowTech(prev => ({ ...prev, [pkg.id]: !prev[pkg.id] }))
                      }
                    >
                      {showTech[pkg.id] ? 'Hide Technicians' : 'Choose Technicians'}
                    </button>
                    {showTech[pkg.id] && (
                      <div className="mt-3 border rounded-lg p-3 bg-blue-50">
                        {pkg.technician_ids && pkg.technician_ids.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {pkg.technician_ids.map(techId => (
                              <label key={techId} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedTechs[pkg.id]?.includes(techId) || false}
                                  onChange={() => handleTechChange(pkg.id, techId)}
                                  className="accent-blue-600"
                                />
                                <span className="text-gray-800">Technician {techId}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">No technicians assigned.</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Excel Upload Section */}
                  <div>
                    <label className="block font-medium mb-1 text-green-700">Upload Patient Excel:</label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={e => handleExcelUpload(pkg.id, e.target.files[0])}
                      className="block border border-gray-300 rounded px-2 py-1"
                      disabled={uploading[pkg.id]}
                    />
                    {uploading[pkg.id] && (
                      <span className="text-blue-600 ml-2">Uploading...</span>
                    )}
                    {uploadMsg[pkg.id] && (
                      <span className="ml-2">{uploadMsg[pkg.id]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Card */}
        {packages.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 mt-6">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{packages.length}</p>
                <p className="text-sm text-gray-600">Total Packages</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {packages.reduce((total, pkg) => total + pkg.service_ids.length, 0)}
                </p>
                <p className="text-sm text-gray-600">Total Services</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {[...new Set(packages.flatMap(pkg => pkg.service_ids))].length}
                </p>
                <p className="text-sm text-gray-600">Unique Services</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewServiceSelection;