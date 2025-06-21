import React, { useState, useEffect, useCallback } from 'react';
import { getServiceCosts,submitCostDetails } from './api';

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

function CostCalculation({ caseData, onSubmit,companyId }) {
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
    if (initialized) {
      const initialDetails = {};
      Object.keys(caseData).forEach(service => {
        const { totalCase = 0, reportTypeCost = 0, numberOfDays = 0 } = caseData[service] || {};
        initialDetails[service] = {
          ...defaultCostValues,
          ...costDetails[service],
          reportTypeCost,
          totalCase,
          numberOfDays,
          tPrice: ['CBC', 'Complete Hemogram','Hemoglobin','Urine Routine','Stool Examination','Lipid Profile','Kidney Profile','LFT','KFT','Random Blood Glucose','Blood Grouping'].includes(service) ? costDetails[service]?.reporting +reportTypeCost|| 0 : undefined,
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

  const calculateAllDetails = useCallback(() => {
    const details = {};
 
    Object.keys(caseData).forEach(testType => {
      const { totalCase = 0, numberOfDays = 0, reportTypeCost = 0 } = caseData[testType] || {};
      const rules = serviceCalculationRules[testType] || serviceCalculationRules['default'];
  
      if (Object.keys(defaultPrices).includes(testType)) {
        const defaultPrice = defaultPrices[testType];
        const tPrice = costDetails[testType]?.tPrice || defaultPrice; // Ensure tPrice is valid
        details[testType] = {
          salary: 0,
          incentive: 0,
          consumables: 0,
          reporting: tPrice, // Use reporting as the total price
          misc: 0,
          equipment: 0,
          travel: 0,
          stay: 0,
          food: 0,
          reportTypeCost,
          overhead: 0,
          tPrice,
          unitPrice: tPrice
        };
      } else {
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
          unitPrice:
            testType === "vitals" || testType === "optometry" || testType === "audiometry"
              ? totalCase < 100
                ? tPrice / totalCase // If totalCase < 100, use total cases
                : tPrice / 100       // If totalCase >= 100, divide by 100
              : totalCase
              ? tPrice / totalCase   // For other test types, calculate normally
              : 0,                   // If totalCase is 0, return 0
        };
        
      }
    });
    return details;
  }, [caseData, costDetails,serviceCalculationRules]);

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
            {Object.keys(allDetails).map(service => {
              const details = allDetails[service];
              return (
                <tr key={service}>
                  <td className="px-6 py-4">{service}</td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={costDetails[service]?.travel }
                      onChange={e => handleChange(service, 'travel', +e.target.value)}
                      className="p-2 border"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={costDetails[service]?.stay }
                      onChange={e => handleChange(service, 'stay', +e.target.value)}
                      className="p-2 border"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={costDetails[service]?.food }
                      onChange={e => handleChange(service, 'food', +e.target.value)}
                      className="p-2 border"
                    />
                  </td>
               <td className="px-6 py-4">
  {['CBC', 'Complete Hemogram', 'Hemoglobin', 'Urine Routine', 'Stool Examination', 'Lipid Profile', 'Kidney Profile', 'LFT', 'KFT', 'Random Blood Glucose', 'Blood Grouping'].includes(service) ? (
    <input
      type="number"
      value={costDetails[service]?.tPrice || defaultPrices[service]} // Use costDetails or fallback to defaultPrices
      onChange={e => handleChange(service, 'tPrice', +e.target.value)}
      className="p-2 border"
    />
  ) : (
    details?.tPrice?.toFixed(2) // Ensure details exist before accessing tPrice
  )}
</td>    </tr>
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



