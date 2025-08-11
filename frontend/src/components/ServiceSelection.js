import React, { useState, useContext, useEffect } from 'react';
import { creatservices } from './api';
import PropTypes from 'prop-types';
import { AppContext } from '../App';
import api, { retryRequest } from './api';

function ServiceSelection({ userType }) {
  const appContext = useContext(AppContext);
  const rawId = appContext.companyId || localStorage.getItem('clientId');
  const companyId = rawId ? rawId.toString() : null;
  const handleServiceSelectionNext = appContext.handleServiceSelectionNext;

  const [packages, setPackages] = useState([
    {
      id: 1,
      name: 'Package 1',
      services: [],
      pathologyOptions: [],
      start_date: '',
      end_date: ''
    }
  ]);

  // State for services fetched from API
  const [services, setServices] = useState([]);
  const [pathologySubServices, setPathologySubServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd

  // Fetch services from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);

        // ✅ No hardcoded IP, uses baseURL from api.js
        const { data } = await retryRequest(() => api.get('/services/'));

        // Extract service names
        const serviceNames = data.map(service => service.name);
        setServices(serviceNames);

        // Reset pathology sub-services
        setPathologySubServices([]);

        setError(null);
        console.log('✅ Services fetched successfully:', serviceNames);
      } catch (err) {
        console.error('❌ Error fetching services:', err);
        setError(err.message);
        setServices([]);
        setPathologySubServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const cid = localStorage.getItem('clientId');
    const campId = localStorage.getItem('campId');
    console.log('🔍 ServiceSelection - clientId:', cid);
    console.log('🔍 ServiceSelection - campId:', campId);
  }, []);

  const handleAddPackage = () => {
    setPackages([
      ...packages,
      {
        id: packages.length + 1,
        name: `Package ${packages.length + 1}`,
        services: [],
        pathologyOptions: [],
        start_date: '',
        end_date: ''
      }
    ]);
  };

  const handlePackageChange = (id, key, value) => {
    setPackages(prev =>
      prev.map(pkg =>
        pkg.id === id ? { ...pkg, [key]: value } : pkg
      )
    );
  };

  const handleServiceToggle = (pkgId, service) => {
    setPackages(prev =>
      prev.map(pkg => {
        if (pkg.id !== pkgId) return pkg;

        const already = pkg.services.includes(service);
        const updated = already
          ? pkg.services.filter(s => s !== service)
          : [...pkg.services, service];

        const resetPath = service === 'Pathology' && already
          ? []
          : pkg.pathologyOptions;

        return {
          ...pkg,
          services: updated,
          pathologyOptions: resetPath
        };
      })
    );
  };

  const handlePathologyToggle = (pkgId, test) => {
    setPackages(prev =>
      prev.map(pkg => {
        if (pkg.id !== pkgId) return pkg;
        const exists = pkg.pathologyOptions.includes(test);
        return {
          ...pkg,
          pathologyOptions: exists
            ? pkg.pathologyOptions.filter(t => t !== test)
            : [...pkg.pathologyOptions, test]
        };
      })
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}-${m}-${y}`;
  };

  const handleSave = async () => {
    try {
      if (!companyId) throw new Error('❌ Client ID missing.');

      const campId = localStorage.getItem('campId');
      if (!campId) throw new Error('❌ Camp ID missing from localStorage.');

      const invalid = packages.some(pkg =>
        !pkg.name || !pkg.start_date || !pkg.end_date || pkg.services.length === 0
      );
      if (invalid) throw new Error('❌ Fill all fields for every package.');

      const payload = {
        client: companyId,
        camp: campId,
        packages: packages.map(pkg => {
          const normalServices = pkg.services.filter(s => s !== 'Pathology');
          const pathology = pkg.services.includes('Pathology') ? pkg.pathologyOptions : [];

          const serviceObj = {};
          [...normalServices, ...pathology].forEach(service => {
            serviceObj[service] = { total_case: 0 };
          });

          return {
            package_name: pkg.name,
            start_date: formatDate(pkg.start_date),
            end_date: formatDate(pkg.end_date),
            services: serviceObj
          };
        })
      };

      console.log('📦 Sending payload:', JSON.stringify(payload, null, 2));
      const response = await creatservices(payload);

      const returnedData = response.data?.data?.packages;

      if (!response.data?.success || !Array.isArray(returnedData)) {
        console.warn("📭 Unexpected backend response:", response.data);
        throw new Error('Invalid backend response or packages missing');
      }

      if (returnedData.length !== packages.length) {
        throw new Error("Backend did not return expected number of packages");
      }

      const packagesWithIds = packages.map((pkg, index) => {
        const backendPkg = returnedData[index];
        if (!backendPkg?.id) {
          throw new Error(`Invalid backend response at index ${index}`);
        }

        return {
          id: backendPkg.id,
          name: pkg.name,
          start_date: pkg.start_date,
          end_date: pkg.end_date,
          services: pkg.services,
          pathologyOptions: pkg.pathologyOptions || []
        };
      });

      const flatServices = packagesWithIds.flatMap(pkg => {
        const normalServices = pkg.services.filter(s => s !== 'Pathology');
        const pathology = pkg.services.includes('Pathology') ? pkg.pathologyOptions : [];

        return [...normalServices, ...pathology].map(service => ({
          package: pkg.id,  // ⬅ add package ID here
          service_name: service
        }));
      });

      console.log("✅ Final package list with IDs:", packagesWithIds);
      handleServiceSelectionNext(packagesWithIds, flatServices);

    } catch (err) {
      console.error("❌ Save error:", err);
      alert(err.message || 'Error saving packages');
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-10 px-4 flex justify-center items-center">
        <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-10 px-4 flex justify-center items-center">
        <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-md text-center">
          <div className="text-red-500 mb-4 text-4xl">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load Services</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 py-10 px-4 flex justify-center">
      <div className="bg-white shadow-xl rounded-lg p-8 w-full max-w-5xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Create Service Packages
        </h2>

        {packages.map(pkg => (
          <div key={pkg.id} className="border p-6 mb-6 rounded-lg bg-gray-50 shadow-sm">
            <input
              type="text"
              placeholder="Package Name"
              value={pkg.name}
              onChange={e => handlePackageChange(pkg.id, 'name', e.target.value)}
              className="p-2 w-full border rounded mb-4"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm">Start Date</label>
                <input
                  type="date"
                  value={pkg.start_date}
                  min={today}
                  onChange={e => handlePackageChange(pkg.id, 'start_date', e.target.value)}
                  className="p-2 border rounded w-full"
                />
              </div>
              <div>
                <label className="text-sm">End Date</label>
                <input
                  type="date"
                  value={pkg.end_date}
                  min={pkg.start_date || today}
                  onChange={e => handlePackageChange(pkg.id, 'end_date', e.target.value)}
                  className="p-2 border rounded w-full"
                />
              </div>
            </div>

            <h4 className="font-semibold mb-2">Select Services</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {services.map(service => (
                <label
                  key={service}
                  className={`flex items-center p-2 rounded border cursor-pointer ${
                    pkg.services.includes(service)
                      ? 'bg-green-200 border-green-500 font-semibold'
                      : 'border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={pkg.services.includes(service)}
                    onChange={() => handleServiceToggle(pkg.id, service)}
                    className="mr-2"
                  />
                  {service}
                </label>
              ))}
            </div>

            {pkg.services.includes('Pathology') && (
              <>
                <h4 className="font-semibold mt-4 mb-2">Pathology Options</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {pathologySubServices.map(test => (
                    <label
                      key={test}
                      className={`flex items-center p-2 rounded border cursor-pointer ${
                        pkg.pathologyOptions.includes(test)
                          ? 'bg-green-100 border-green-400 font-semibold'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={pkg.pathologyOptions.includes(test)}
                        onChange={() => handlePathologyToggle(pkg.id, test)}
                        className="mr-2"
                      />
                      {test}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}

        <div className="flex justify-between mt-6">
          <button
            onClick={handleAddPackage}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            Add New Package
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Save and Next
          </button>
        </div>
      </div>
    </div>
  );
}

ServiceSelection.propTypes = {
  userType: PropTypes.string
};

export default ServiceSelection;