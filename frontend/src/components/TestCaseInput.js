import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { fetchHardCopyPrices, saveTestCaseData, fetchPackagesByCamp } from './api';
import { AppContext } from '../App';

function TestCaseInput({ onNext, onBack }) {
  const appCtx = useContext(AppContext);
  const selectedPackages = appCtx.selectedPackages || [];

  const [caseData, setCaseData] = useState({});
  const [errors, setErrors] = useState({});
  const [hardCopyPrices, setHardCopyPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState(null);

  const thresholds = {
    'X-ray': 200, 'ECG': 100, 'PFT': 200, 'CBC': 120, 'pathology': 120,
    'Audiometry': 125, 'Optometry': 150, 'Doctor Consultation': 100,
    'Dental Consultation': 125, 'Vitals': 150, 'BMD': 150,
    'Tetanus Vaccine': 125, 'Typhoid Vaccine': 125
  };

  useEffect(() => {
    // Set companyId safely once
    const getCompanyId = () => {
      if (appCtx?.companyId && typeof appCtx.companyId === 'string') {
        return appCtx.companyId;
      }
      const storedId = localStorage.getItem("clientId") || localStorage.getItem("client_id");
      if (storedId && storedId.startsWith("CL-")) {
        return storedId;
      }
      return null;
    };
    setCompanyId(getCompanyId());
  }, [appCtx.companyId]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const prices = await fetchHardCopyPrices();
        setHardCopyPrices(prices);
      } catch (error) {
        console.error('❌ Error fetching hard copy prices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    const initial = {};
    selectedPackages.forEach(pkg => {
      const serviceList = Array.isArray(pkg.services)
        ? pkg.services
        : Object.keys(pkg.services || {});

      serviceList.forEach(service => {
        const key = `${pkg.id || pkg.packageId}__${service}`;
        initial[key] = {
          packageId: pkg.id || pkg.packageId,
          packageName: pkg.package_name,
          service,
          casePerDay: '',
          numberOfDays: '',
          totalCase: 0,
          reportType: 'digital',
          reportTypeCost: 0
        };
      });
    });
    setCaseData(initial);
  }, [selectedPackages]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const campId = localStorage.getItem('campId');
        if (campId) {
          const packages = await fetchPackagesByCamp(campId);
          appCtx.setSelectedPackages(packages);
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };
    fetchPackages();
  }, []);

  const handleChange = (key, field, value) => {
    setCaseData(prev => {
      const updated = { ...prev[key], [field]: value };
      const casePerDay = parseInt(updated.casePerDay);
      const numberOfDays = parseInt(updated.numberOfDays);

      if (!isNaN(casePerDay) && !isNaN(numberOfDays)) {
        updated.totalCase = casePerDay * numberOfDays;
        const threshold = thresholds[updated.service] * numberOfDays;
        if (casePerDay > threshold) {
          setErrors(prev => ({ ...prev, [key]: `${updated.service} exceeds max allowed: ${threshold}` }));
        } else {
          setErrors(prev => ({ ...prev, [key]: '' }));
        }
      } else {
        updated.totalCase = 0;
        setErrors(prev => ({ ...prev, [key]: '' }));
      }

      return { ...prev, [key]: updated };
    });
  };

  const handleReportTypeChange = (key, value) => {
    setCaseData(prev => {
      const updated = { ...prev[key], reportType: value };
      const unitPrice = updated.service === 'CBC' ? 25 : hardCopyPrices[updated.service] || 0;
      updated.reportTypeCost = value === 'hard copy' ? unitPrice * updated.totalCase : 0;
      return { ...prev, [key]: updated };
    });
  };

  const handleNext = async () => {
    if (!companyId) {
      alert("Company ID is missing. Please go back and complete the previous steps.");
      return;
    }

    const payload = Object.values(caseData).map(d => {
      if (!d.packageId) {
        const pkg = selectedPackages.find(p =>
          p.services.includes(d.service) || (p.services && p.services[d.service])
        );
        if (pkg) d.packageId = pkg.id;
      }

      return {
        client: companyId,
        package: d.packageId,
        service_name: d.service,
        case_per_day: parseInt(d.casePerDay),
        number_of_days: parseInt(d.numberOfDays),
        report_type: d.reportType,
        report_type_cost: d.reportTypeCost
      };
    });

    try {
      await saveTestCaseData(payload);
      if (typeof onNext === 'function') {
        onNext(caseData);
      }
    } catch (err) {
      console.error("❌ Error submitting data:", err);
      if (err.response) {
        alert(`Failed: ${JSON.stringify(err.response.data, null, 2)}`);
      } else {
        alert("Network error. Please try again.");
      }
    }
  };

  const isValid = Object.entries(caseData).every(([key, d]) =>
    d.casePerDay !== '' &&
    d.numberOfDays !== '' &&
    !errors[key] &&
    parseInt(d.casePerDay) > 0 &&
    parseInt(d.numberOfDays) > 0
  );

  if (!companyId) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> Company ID not found. Please go back and complete the previous steps.
        </div>
      </div>
    );
  }

  if (loading) return <p className="text-center text-blue-600">Loading...</p>;

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-center">Test Case Input</h2>

      <div className="bg-gray-100 p-2 rounded text-sm">
        <p><strong>Company ID:</strong> {companyId || 'Not set'}</p>
        <p><strong>Selected Packages:</strong> {selectedPackages.length}</p>
      </div>

      {selectedPackages.map((pkg, index) => {
        const serviceList = Array.isArray(pkg.services)
          ? pkg.services
          : Object.keys(pkg.services || {});
        return (
          <div key={pkg.packageId || pkg.package_name || `pkg-${index}`} className="mb-10 border-2 border-gray-200 p-4 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">
              {pkg.package_name || pkg.name || `Package ${index + 1}`}
            </h2>

            <div className="grid sm:grid-cols-2 gap-6">
              {serviceList.map(service => {
                const key = `${pkg.id || pkg.packageId}__${service}`;
                return (
                  <div key={key} className="border p-4 rounded shadow">
                    <h4 className="text-lg font-medium mb-2">{service}</h4>

                    <label className="block text-sm">Number of Days</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded mb-2"
                      value={caseData[key]?.numberOfDays ?? ''}
                      onChange={e => handleChange(key, 'numberOfDays', e.target.value)}
                    />

                    <label className="block text-sm">Cases Per Day</label>
                    <input
                      type="number"
                      className={`w-full p-2 border rounded mb-2 ${errors[key] ? 'border-red-500' : ''}`}
                      value={caseData[key]?.casePerDay ?? ''}
                      onChange={e => handleChange(key, 'casePerDay', e.target.value)}
                    />
                    {errors[key] && <p className="text-red-500 text-sm">{errors[key]}</p>}

                    <label className="block text-sm">Report Type</label>
                    <select
                      className="w-full p-2 border rounded mb-2"
                      value={caseData[key]?.reportType}
                      onChange={e => handleReportTypeChange(key, e.target.value)}
                    >
                      <option value="digital">Digital</option>
                      <option value="hard copy">Hard Copy</option>
                    </select>

                    <p><strong>Total Cases:</strong> {caseData[key]?.totalCase}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className={`px-4 py-2 rounded text-white ${isValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
          disabled={!isValid}
        >
          Next
        </button>
      </div>
    </div>
  );
}

TestCaseInput.propTypes = {
  onNext: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired
};

export default TestCaseInput;
