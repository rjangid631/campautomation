import React, { useState, useEffect, useCallback } from 'react';
import { getServiceCosts, submitCostDetails } from './api';

const defaultCostValues = {
  travel: 0,
  stay: 0,
  food: 0,
};

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

function CostCalculation({ caseData, onSubmit, companyId }) {
  const [costDetails, setCostDetails] = useState({});
  const [initialized, setInitialized] = useState(false);

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
        setCostDetails(formattedCostData);
        setInitialized(true);
      } catch (error) {
        console.error('Error fetching service costs:', error);
      }
    };
  
    if (!initialized) {
      fetchServiceCosts();
    }
  }, [initialized]);

  // Initialize the cost details with case data
  useEffect(() => {
    if (initialized && caseData) {
      const initialDetails = {};
      
      // Convert caseData array to object with service_name as key
      const caseDataObj = caseData.reduce((acc, item) => {
        acc[item.service_name] = {
          totalCase: item.total_case,
          reportTypeCost: item.report_type_cost,
          numberOfDays: item.number_of_days
        };
        return acc;
      }, {});
      
      Object.keys(caseDataObj).forEach(service => {
        const { totalCase = 0, reportTypeCost = 0, numberOfDays = 0 } = caseDataObj[service] || {};
        initialDetails[service] = {
          ...defaultCostValues,
          ...costDetails[service],
          reportTypeCost,
          totalCase,
          numberOfDays,
        };
      });
      setCostDetails(initialDetails);
    }
  }, [caseData, initialized]);

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
    
    if (!caseData) return details;

    caseData.forEach(item => {
      const testType = item.service_name;
      const { total_case: totalCase = 0, number_of_days: numberOfDays = 0, report_type_cost: reportTypeCost = 0 } = item;
      const rules = serviceCalculationRules[testType] || serviceCalculationRules['X-ray']; // Default to X-ray rules

      const salary = rules.getSalary(costDetails[testType]?.salary || 0, testType === 'Form 7' ? totalCase : numberOfDays);
      const consumables = rules.getConsumables(costDetails[testType]?.consumables || 0, totalCase);
      const reporting = rules.getReporting(costDetails[testType]?.reporting || 0, totalCase);
      const incentive = rules.getIncentive(costDetails[testType]?.incentive || 0, numberOfDays);
      const misc = costDetails[testType]?.misc || 0;
      const equipment = costDetails[testType]?.equipment || 0;
      const travel = costDetails[testType]?.travel || 0;
      const stay = costDetails[testType]?.stay || 0;
      const food = costDetails[testType]?.food || 0;

      const overhead = (salary + incentive + misc + equipment + reportTypeCost + consumables + reporting + travel + stay + food) * 1.5;
      const tPrice = overhead * 1.3;

      details[testType] = {
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
        unitPrice: totalCase ? tPrice / totalCase : 0,
      };
    });
    
    return details;
  }, [caseData, costDetails]);

  const allDetails = calculateAllDetails();

  const handleSubmit = async () => {
    try {
      const finalDetails = calculateAllDetails();
      await submitCostDetails(companyId, Object.keys(finalDetails).reduce((acc, service) => {
        const { travel, stay, food, salary, misc, equipment, consumables, reporting } = finalDetails[service];
        acc[service] = { travel, stay, food, salary, misc, equipment, consumables, reporting };
        return acc;
      }, {}));
      onSubmit(finalDetails);
    } catch (error) {
      console.error('Error submitting cost details:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Cost Calculation</h2>
      <div className="space-y-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3">Test Type</th>
              <th className="px-6 py-3">Travel</th>
              <th className="px-6 py-3">Stay</th>
              <th className="px-6 py-3">Food</th>
              <th className="px-6 py-3">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {caseData && caseData.map(item => {
              const service = item.service_name;
              const details = allDetails[service];
              return (
                <tr key={service}>
                  <td className="px-6 py-4">{service}</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={costDetails[service]?.travel || 0}
                      onChange={e => handleChange(service, 'travel', +e.target.value)}
                      className="p-2 border"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={costDetails[service]?.stay || 0}
                      onChange={e => handleChange(service, 'stay', +e.target.value)}
                      className="p-2 border"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={costDetails[service]?.food || 0}
                      onChange={e => handleChange(service, 'food', +e.target.value)}
                      className="p-2 border"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {details?.tPrice?.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex justify-between mt-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default CostCalculation; 