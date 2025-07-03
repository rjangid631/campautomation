import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { fetchHardCopyPrices, saveTestCaseData } from './api';
import { AppContext } from '../App';

function TestCaseInput({ onNext, onBack }) {
  const appCtx = useContext(AppContext);
  let companyId = null;

    if (appCtx?.companyId && typeof appCtx.companyId === 'string') {
      companyId = appCtx.companyId;
    } else {
      const storedId = localStorage.getItem("clientId");
      if (storedId && storedId.startsWith("CL-")) {
        companyId = storedId;
      } else {
        console.warn("⚠️ Company ID not found or invalid in context/localStorage");
      }
    }
  const selectedPackages = appCtx.selectedPackages || [];

  const [caseData, setCaseData] = useState({});
  const [errors, setErrors] = useState({});
  const [hardCopyPrices, setHardCopyPrices] = useState({});
  const [loading, setLoading] = useState(true);

  const thresholds = {
    'X-ray': 200, 'ECG': 100, 'PFT': 200, 'CBC': 120, 'pathology': 120,
    'Audiometry': 125, 'Optometry': 150, 'Doctor Consultation': 100,
    'Dental Consultation': 125, 'Vitals': 150, 'BMD': 150,
    'Tetanus Vaccine': 125, 'Typhoid Vaccine': 125
  };

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
        const key = `${pkg.packageId}__${service}`;
        initial[key] = {
          packageId: pkg.packageId,
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

  const handleChange = (key, field, value) => {
    setCaseData(prev => {
      const updated = { ...prev[key], [field]: value };

      const casePerDay = parseInt(updated.casePerDay);
      const numberOfDays = parseInt(updated.numberOfDays);

      if (!isNaN(casePerDay) && !isNaN(numberOfDays)) {
        updated.totalCase = casePerDay * numberOfDays;

        const threshold = thresholds[updated.service] * numberOfDays;
        if (casePerDay > threshold) {
          setErrors(prev => ({
            ...prev,
            [key]: `${updated.service} exceeds max allowed: ${threshold}`
          }));
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
      updated.reportTypeCost = value === 'hard copy'
        ? unitPrice * updated.totalCase
        : 0;
      return { ...prev, [key]: updated };
    });
  };

  const handleNext = async () => {
    if (!companyId) {
      alert("Company ID is missing. Please go back and complete the previous steps.");
      return;
    }

    const payload = Object.values(caseData).map(d => ({
      client: companyId,
      package: d.packageId,
      service_name: d.service,
      case_per_day: parseInt(d.casePerDay),
      number_of_days: parseInt(d.numberOfDays),
      report_type: d.reportType === 'digital' ? 1 : 2,
      report_type_cost: d.reportTypeCost
    }));

    console.log("📤 Submitting payload:", payload);

    try {
      await saveTestCaseData(payload);
      console.log("✅ Submitted test case data");

      if (typeof onNext === 'function') {
        onNext(caseData);
      }
    } catch (err) {
      console.error("❌ Error submitting data:", err);

      if (err.response) {
        console.error("❌ Response data:", err.response.data);
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
          <div key={pkg.packageId || pkg.package_name || `pkg-${index}`} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-800">{pkg.package_name}</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {serviceList.map(service => {
                const key = `${pkg.packageId}__${service}`;
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




// update code for problem  The issue was that when you have multiple packages with the same service (like ECG in both Package 1 and Package 2), the input values were being shared between them. 

/*

// OLD (problematic):
//const key = `${pkg.packageId}__${service}`;

// NEW (more unique):
//const key = `${pkg.packageId || pkgIndex}__${service}__${pkgIndex}__${serviceIndex}`;

import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { fetchHardCopyPrices, saveTestCaseData } from './api';
import { AppContext } from '../App';

function TestCaseInput({ onNext, onBack }) {
  const appCtx = useContext(AppContext);
  let companyId = null;

  if (appCtx?.companyId && typeof appCtx.companyId === 'string') {
    companyId = appCtx.companyId;
  } else {
    const storedId = localStorage.getItem("clientId");
    if (storedId && storedId.startsWith("CL-")) {
      companyId = storedId;
    } else {
      console.warn("⚠️ Company ID not found or invalid in context/localStorage");
    }
  }
  const selectedPackages = appCtx.selectedPackages || [];

  const [caseData, setCaseData] = useState({});
  const [errors, setErrors] = useState({});
  const [hardCopyPrices, setHardCopyPrices] = useState({});
  const [loading, setLoading] = useState(true);

  const thresholds = {
    'X-ray': 200, 'ECG': 100, 'PFT': 200, 'CBC': 120, 'pathology': 120,
    'Audiometry': 125, 'Optometry': 150, 'Doctor Consultation': 100,
    'Dental Consultation': 125, 'Vitals': 150, 'BMD': 150,
    'Tetanus Vaccine': 125, 'Typhoid Vaccine': 125
  };

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
    selectedPackages.forEach((pkg, pkgIndex) => {
      const serviceList = Array.isArray(pkg.services)
        ? pkg.services
        : Object.keys(pkg.services || {});

      serviceList.forEach((service, serviceIndex) => {
        // Create a more unique key that includes package index to avoid conflicts
        // Even if packageId is the same, this ensures uniqueness
        const key = `${pkg.packageId || pkgIndex}__${service}__${pkgIndex}__${serviceIndex}`;
        
        initial[key] = {
          packageId: pkg.packageId || `pkg-${pkgIndex}`,
          packageName: pkg.package_name,
          packageIndex: pkgIndex, // Add package index for reference
          service,
          casePerDay: '',
          numberOfDays: '',
          totalCase: 0,
          reportType: 'digital',
          reportTypeCost: 0
        };
      });
    });
    
    console.log("🔍 Initial case data keys:", Object.keys(initial));
    setCaseData(initial);
  }, [selectedPackages]);

  const handleChange = (key, field, value) => {
    setCaseData(prev => {
      // Create a new object to ensure React detects the change
      const newState = { ...prev };
      const updated = { ...newState[key], [field]: value };

      const casePerDay = parseInt(updated.casePerDay);
      const numberOfDays = parseInt(updated.numberOfDays);

      if (!isNaN(casePerDay) && !isNaN(numberOfDays)) {
        updated.totalCase = casePerDay * numberOfDays;

        const threshold = thresholds[updated.service] * numberOfDays;
        if (casePerDay > threshold) {
          setErrors(prev => ({
            ...prev,
            [key]: `${updated.service} exceeds max allowed: ${threshold}`
          }));
        } else {
          setErrors(prev => ({ ...prev, [key]: '' }));
        }
      } else {
        updated.totalCase = 0;
        setErrors(prev => ({ ...prev, [key]: '' }));
      }

      newState[key] = updated;
      console.log(`🔄 Updated ${key}:`, updated);
      return newState;
    });
  };

  const handleReportTypeChange = (key, value) => {
    setCaseData(prev => {
      const newState = { ...prev };
      const updated = { ...newState[key], reportType: value };
      
      const unitPrice = updated.service === 'CBC' ? 25 : hardCopyPrices[updated.service] || 0;
      updated.reportTypeCost = value === 'hard copy'
        ? unitPrice * updated.totalCase
        : 0;
      
      newState[key] = updated;
      console.log(`📋 Report type changed for ${key}:`, updated);
      return newState;
    });
  };

  const handleNext = async () => {
    if (!companyId) {
      alert("Company ID is missing. Please go back and complete the previous steps.");
      return;
    }

    const payload = Object.values(caseData).map(d => ({
      client: companyId,
      package: d.packageId,
      service_name: d.service,
      case_per_day: parseInt(d.casePerDay),
      number_of_days: parseInt(d.numberOfDays),
      report_type: d.reportType === 'digital' ? 1 : 2,
      report_type_cost: d.reportTypeCost
    }));

    console.log("📤 Submitting payload:", payload);

    try {
      await saveTestCaseData(payload);
      console.log("✅ Submitted test case data");

      if (typeof onNext === 'function') {
        onNext(caseData);
      }
    } catch (err) {
      console.error("❌ Error submitting data:", err);

      if (err.response) {
        console.error("❌ Response data:", err.response.data);
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

  if (loading) return <p className="text-center text-blue-600">Loading...</p>;

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-center">Test Case Input</h2>

      <div className="bg-gray-100 p-2 rounded text-sm">
        <p><strong>Company ID:</strong> {companyId || 'Not set'}</p>
        <p><strong>Selected Packages:</strong> {selectedPackages.length}</p>
      </div>

      {selectedPackages.map((pkg, pkgIndex) => {
        const serviceList = Array.isArray(pkg.services)
          ? pkg.services
          : Object.keys(pkg.services || {});

        return (
          <div key={`package-${pkg.packageId || pkgIndex}-${pkgIndex}`} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-blue-800">
              {pkg.package_name} {selectedPackages.filter(p => p.package_name === pkg.package_name).length > 1 ? `(Instance ${pkgIndex + 1})` : ''}
            </h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {serviceList.map((service, serviceIndex) => {
                // Use the same key generation logic as in useEffect
                const key = `${pkg.packageId || pkgIndex}__${service}__${pkgIndex}__${serviceIndex}`;
                const data = caseData[key];
                
                if (!data) {
                  console.warn(`⚠️ No data found for key: ${key}`);
                  return null;
                }

                return (
                  <div key={`service-${key}`} className="border p-4 rounded shadow">
                    <h4 className="text-lg font-medium mb-2">
                      {service}
                      <span className="text-sm text-gray-500 ml-2">
                        (Package {pkgIndex + 1})
                      </span>
                    </h4>

                    <label className="block text-sm">Number of Days</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded mb-2"
                      value={data.numberOfDays}
                      onChange={e => handleChange(key, 'numberOfDays', e.target.value)}
                      placeholder="Enter number of days"
                    />

                    <label className="block text-sm">Cases Per Day</label>
                    <input
                      type="number"
                      className={`w-full p-2 border rounded mb-2 ${errors[key] ? 'border-red-500' : ''}`}
                      value={data.casePerDay}
                      onChange={e => handleChange(key, 'casePerDay', e.target.value)}
                      placeholder="Enter cases per day"
                    />
                    {errors[key] && <p className="text-red-500 text-sm">{errors[key]}</p>}

                    <label className="block text-sm">Report Type</label>
                    <select
                      className="w-full p-2 border rounded mb-2"
                      value={data.reportType}
                      onChange={e => handleReportTypeChange(key, e.target.value)}
                    >
                      <option value="digital">Digital</option>
                      <option value="hard copy">Hard Copy</option>
                    </select>

                    <p><strong>Total Cases:</strong> {data.totalCase}</p>
                    <p className="text-xs text-gray-500">Key: {key}</p>
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


*/