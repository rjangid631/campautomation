import React, { useState, useEffect, useCallback } from 'react';
import { getServiceCosts, submitCostDetails } from './api';
import { useNavigate } from 'react-router-dom';

const defaultCostValues = {
  travel: 0,
  stay: 0,
  food: 0,
};

// Define standard calculation rules for services in packages
const serviceCalculationRules = {
  'X-ray': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'Coordinator': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'ECG': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'Form 7': {
    getSalary: (salary, totalCase) => salary * totalCase,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'PFT': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'Audiometry': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'Optometry': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'Doctor Consultation': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'Dental Consultation': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'Vitals': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'BMD': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'Tetanus Vaccine': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
  'Typhoid Vaccine': {
    getSalary: (salary, days) => salary * days,
    getConsumables: (consumables, totalCase) => consumables * totalCase,
    getReporting: (reporting, totalCase) => reporting * totalCase,
    getIncentive: (incentive, days) => incentive * days,
  },
};

const defaultPrices = {
  'CBC': 20,
  'Complete Hemogram': 40,
  'Hemoglobin': 60,
  'Urine Routine': 90,
  'Stool Examination': 100,
  'Lipid Profile': 30,
  'Kidney Profile': 50,
  'LFT': 70,
  'KFT': 80,
  'Random Blood Glucose': 45,
  'Blood Grouping': 65
};

function CostCalculation({ 
  companyId, 
  selectedPackages = [], 
  caseData = {}, 
  onSubmit, 
  onNext, 
  onBack 
}) {
  const [costDetails, setCostDetails] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [packages, setPackages] = useState([]);
  const [servicePackages, setServicePackages] = useState({});
  const [serviceCosts, setServiceCosts] = useState({});
  const navigate = useNavigate();

  // Fetch service costs and initialize costDetails
  useEffect(() => {
    const fetchServiceCosts = async () => {
      try {
        const costData = await getServiceCosts();
        const formattedCostData = costData.reduce((acc, cost) => {
          acc[cost.test_type_name] = {
            salary: parseFloat(cost.salary),
            incentive: parseFloat(cost.incentive),
            misc: parseFloat(cost.misc),
            equipment: parseFloat(cost.equipment),
            consumables: parseFloat(cost.consumables),
            reporting: parseFloat(cost.reporting),
          };
          return acc;
        }, {});
        setServiceCosts(formattedCostData);
      } catch (error) {
        console.error('Error fetching service costs:', error);
      }
    };

    fetchServiceCosts();
  }, []);

  // Initialize with props data or API data
  useEffect(() => {
    const initializeWithPropsData = () => {
      try {
        console.log('🔥 Initializing CostCalculation with props:', {
          companyId,
          selectedPackagesCount: selectedPackages.length,
          caseDataKeys: Object.keys(caseData).length
        });

        if (!companyId) {
          console.error('Company ID is missing from props');
          return;
        }

        // If we have selectedPackages from props, use them
        if (selectedPackages && selectedPackages.length > 0) {
          const packageMap = {};
          const initialCostDetails = {};

          selectedPackages.forEach(pkg => {
            const packageName = pkg.package_name || pkg.name;
            const packageId = pkg.id || pkg.packageId;
            
            // Get services list
            const serviceList = Array.isArray(pkg.services) 
              ? pkg.services 
              : Object.keys(pkg.services || {});

            packageMap[packageName] = serviceList;

            // Initialize cost details for each service in the package
            serviceList.forEach(serviceName => {
              const serviceKey = Object.keys(caseData).find(key => 
                key.includes(serviceName) && key.includes(packageId)
              );
              const serviceCase = caseData[serviceKey] || {};
              
              initialCostDetails[serviceName] = {
                ...defaultCostValues,
                ...serviceCosts[serviceName],
                reportTypeCost: serviceCase.reportTypeCost || 0,
                totalCase: serviceCase.totalCase || 0,
                numberOfDays: serviceCase.numberOfDays || 0,
                packageName: packageName,
                packageId: packageId,
                tPrice: defaultPrices[serviceName] || undefined,
              };
            });
          });

          setServicePackages(packageMap);
          setPackages(selectedPackages);
          setCostDetails(initialCostDetails);
          setInitialized(true);

          console.log('✅ Successfully initialized with props data');
          return;
        }

        // Fallback to API fetch if no props data
        fetchDataFromAPI();

      } catch (error) {
        console.error('❌ Error initializing with props:', error);
        fetchDataFromAPI();
      }
    };

    const fetchDataFromAPI = async () => {
      try {
        console.log('📡 Falling back to API fetch...');
        
        if (!companyId) {
          console.error('Company ID is missing');
          return;
        }

        const response = await fetch(`http://localhost:8000/api/serviceselection/?client=${companyId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const packagesData = await response.json();
        
        if (Array.isArray(packagesData) && packagesData.length > 0) {
          const companyData = packagesData.find(item => 
            item.client === companyId || item.company_id === companyId.toString()
          );
        
          if (companyData && Array.isArray(companyData.packages)) {
            const packageMap = {};
            const initialCostDetails = {};
            
            companyData.packages.forEach(pkg => {
              const serviceList = Object.keys(pkg.services || {});
              packageMap[pkg.package_name] = serviceList;
              
              // Initialize cost details for each service
              serviceList.forEach(serviceName => {
                initialCostDetails[serviceName] = {
                  ...defaultCostValues,
                  ...serviceCosts[serviceName],
                  reportTypeCost: 0,
                  totalCase: 0,
                  numberOfDays: 0,
                  packageName: pkg.package_name,
                  packageId: pkg.id,
                  tPrice: defaultPrices[serviceName] || undefined,
                };
              });
            });
            
            setServicePackages(packageMap);
            setPackages(companyData.packages);
            setCostDetails(initialCostDetails);
            setInitialized(true);
          }
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };

    if (!initialized && companyId && Object.keys(serviceCosts).length > 0) {
      initializeWithPropsData();
    }
  }, [initialized, companyId, selectedPackages, caseData, serviceCosts]);

  const handleChange = (service, field, value) => {
    setCostDetails(prev => ({
      ...prev,
      [service]: {
        ...prev[service],
        [field]: value,
      },
    }));
  };

  const calculateAllDetails = useCallback(() => {
    const details = {};
 
    Object.keys(costDetails).forEach(serviceName => {
      const serviceData = costDetails[serviceName];
      const { totalCase = 0, numberOfDays = 0, reportTypeCost = 0 } = serviceData;
      const rules = serviceCalculationRules[serviceName] || serviceCalculationRules['X-ray'];

      if (Object.keys(defaultPrices).includes(serviceName)) {
        const defaultPrice = defaultPrices[serviceName];
        const tPrice = serviceData?.tPrice || defaultPrice;
        details[serviceName] = {
          salary: 0,
          incentive: 0,
          consumables: 0,
          reporting: tPrice,
          misc: 0,
          equipment: 0,
          travel: serviceData?.travel || 0,
          stay: serviceData?.stay || 0,
          food: serviceData?.food || 0,
          reportTypeCost,
          overhead: 0,
          tPrice,
          unitPrice: tPrice,
          packageName: serviceData?.packageName || ''
        };
      } else {
        const salary = rules.getSalary(serviceData?.salary || 0, serviceName === 'Form 7' ? totalCase : numberOfDays);
        const consumables = rules.getConsumables(serviceData?.consumables || 0, totalCase);
        const reporting = rules.getReporting(serviceData?.reporting || 0, totalCase);
        const incentive = rules.getIncentive(serviceData?.incentive || 0, numberOfDays);
        const misc = serviceData?.misc || 0;
        const equipment = serviceData?.equipment || 0;
        const travel = serviceData?.travel || 0;
        const stay = serviceData?.stay || 0;
        const food = serviceData?.food || 0;

        const overhead = (salary + incentive + misc + equipment + reportTypeCost + consumables + reporting + travel + stay + food) * 1.5;
        const tPrice = overhead * 1.3;

        details[serviceName] = {
          salary,
          incentive,
          consumables,
          reporting,
          misc,
          equipment,
          travel,
          stay,
          food,
          reportTypeCost,
          overhead,
          tPrice,
          unitPrice:
            serviceName === "vitals" || serviceName === "optometry" || serviceName === "audiometry"
              ? totalCase < 100
                ? tPrice / totalCase
                : tPrice / 100
              : totalCase
              ? tPrice / totalCase
              : 0,
          packageName: serviceData?.packageName || ''
        };
      }
    });
    return details;
  }, [costDetails]);

  const allDetails = calculateAllDetails();

  // Group services by package for display
  const groupedByPackage = Object.keys(allDetails).reduce((acc, serviceName) => {
    const packageName = allDetails[serviceName].packageName || 'Ungrouped Services';
    if (!acc[packageName]) {
      acc[packageName] = [];
    }
    acc[packageName].push({ serviceName, details: allDetails[serviceName] });
    return acc;
  }, {});

  const handleSubmit = async () => {
    try {
      const finalDetails = calculateAllDetails();
      
      // Format cost details for submission (same structure as before)
      const costDetailsFormatted = Object.keys(finalDetails).reduce((acc, service) => {
        const { travel, stay, food, salary, misc, equipment, consumables, reporting } = finalDetails[service];
        acc[service] = { travel, stay, food, salary, misc, equipment, consumables, reporting };
        return acc;
      }, {});

      const submissionPayload = {
        clientId: companyId,
        costDetails: costDetailsFormatted
      };
      
      console.log('📤 Final payload:', JSON.stringify(submissionPayload, null, 2));
      
      await submitCostDetails(companyId, submissionPayload);
      
      alert('Package costs submitted successfully!');

      if (onNext) onNext(submissionPayload);
      if (onSubmit) onSubmit(submissionPayload);

    } catch (error) {
      console.error('❌ Error submitting package costs:', error);
      alert('Failed to submit package costs. Please try again.');
    }
  };
  
  if (!initialized || Object.keys(costDetails).length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-2xl mb-4">Package Cost Calculation</h2>
        
        <div className="bg-blue-100 p-4 rounded mb-4 text-sm">
          <p><strong>Company ID:</strong> {companyId || 'Not provided'}</p>
          <p><strong>Selected Packages Count:</strong> {selectedPackages.length}</p>
          <p><strong>Case Data Keys:</strong> {Object.keys(caseData).length}</p>
          <p><strong>Initialized:</strong> {initialized ? 'Yes' : 'No'}</p>
          <p><strong>Service Costs Loaded:</strong> {Object.keys(serviceCosts).length}</p>
        </div>
        
        <div className="text-gray-500">Loading package data...</div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Package Cost Calculation</h2>
      
      <div className="bg-gray-100 p-4 rounded mb-4 text-sm">
        <p><strong>Company ID:</strong> {companyId}</p>
        <p><strong>Total Services:</strong> {Object.keys(costDetails).length}</p>
        <p><strong>Data Source:</strong> {selectedPackages.length > 0 ? 'Props' : 'API'}</p>
      </div>
      
      <div className="space-y-6">
        {Object.keys(groupedByPackage).map(packageName => (
          <div key={packageName} className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-xl font-semibold mb-4 text-blue-600">{packageName}</h3>
            
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left">Service Name</th>
                  <th className="px-6 py-3 text-left">Travel</th>
                  <th className="px-6 py-3 text-left">Stay</th>
                  <th className="px-6 py-3 text-left">Food</th>
                  <th className="px-6 py-3 text-left">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {groupedByPackage[packageName].map(({ serviceName, details }) => (
                  <tr key={serviceName} className="border-t">
                    <td className="px-6 py-4 font-medium">{serviceName}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={costDetails[serviceName]?.travel || 0}
                        onChange={e => handleChange(serviceName, 'travel', +e.target.value)}
                        className="p-2 border rounded w-24"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={costDetails[serviceName]?.stay || 0}
                        onChange={e => handleChange(serviceName, 'stay', +e.target.value)}
                        className="p-2 border rounded w-24"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={costDetails[serviceName]?.food || 0}
                        onChange={e => handleChange(serviceName, 'food', +e.target.value)}
                        className="p-2 border rounded w-24"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {Object.keys(defaultPrices).includes(serviceName) ? (
                        <input
                          type="number"
                          value={costDetails[serviceName]?.tPrice || defaultPrices[serviceName]}
                          onChange={e => handleChange(serviceName, 'tPrice', +e.target.value)}
                          className="p-2 border rounded w-24"
                        />
                      ) : (
                        <span className="font-semibold">
                          {details?.tPrice?.toFixed(2) || '0.00'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        
        <div className="flex justify-between mt-6">
          {onBack && (
            <button
              onClick={onBack}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Back
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default CostCalculation;
