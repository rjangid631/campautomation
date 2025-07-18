import React, { useState, useEffect, useCallback } from 'react';
import { getServiceCosts, submitCostDetails } from './api';
import { useLocation } from 'react-router-dom';

const defaultCostValues = {
  travel: 0,
  stay: 0,
  food: 0,
};

const serviceCalculationRules = {
  'X-ray':          { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'Coordinator':    { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'ECG':            { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'Form 7':         { getSalary: (s,t)=>s*t, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'PFT':            { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'Audiometry':     { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'Optometry':      { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'Doctor Consultation': { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'Dental Consultation': { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'Vitals':         { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'BMD':            { getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'Tetanus Vaccine':{ getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
  'Typhoid Vaccine':{ getSalary: (s,d)=>s*d, getConsumables:(c,t)=>c*t, getReporting:(r,t)=>r*t, getIncentive:(i,d)=>i*d },
};

const defaultPrices = {
  'CBC': 20, 'Complete Hemogram': 40, 'Hemoglobin': 60, 'Urine Routine': 90,
  'Stool Examination': 100, 'Lipid Profile': 30, 'Kidney Profile': 50,
  'LFT': 70, 'KFT': 80, 'Random Blood Glucose': 45, 'Blood Grouping': 65,
};

function CostCalculation({ onSubmit }) {
  const { state } = useLocation();
  const { caseData = {}, companyId = '' } = state || {};

  const [costDetails, setCostDetails]   = useState({});
  const [initialized, setInitialized]   = useState(false);
  const [detailsInit, setDetailsInit]   = useState(false);

  // 1️⃣ Fetch master cost list once
  useEffect(() => {
    (async () => {
      try {
        const list = await getServiceCosts();
        const map = list.reduce((acc, c) => {
          acc[c.test_type_name] = {
            salary:     +c.salary,
            incentive:  +c.incentive,
            misc:       +c.misc,
            equipment:  +c.equipment,
            consumables:+c.consumables,
            reporting:  +c.reporting,
          };
          return acc;
        }, {});
        setCostDetails(map);
        setInitialized(true);
      } catch (e) { console.error(e); }
    })();
  }, []);

  // 2️⃣ Merge with caseData only once
  useEffect(() => {
    if (!initialized || detailsInit || !caseData) return;

    const merged = {};
    Object.entries(caseData).forEach(([key, data]) => {
      const { packageId, totalCase = 0, numberOfDays = 0, reportTypeCost = 0 } = data;
      const service = key.split('__')[1];        // key = "58__X-ray__0"
      merged[key] = {
        ...defaultCostValues,
        ...costDetails[service],
        reportTypeCost,
        totalCase,
        numberOfDays,
        tPrice: defaultPrices[service]
          ? (costDetails[service]?.reporting || 0) + reportTypeCost
          : undefined,
      };
    });
    setCostDetails(merged);
    setDetailsInit(true);
  }, [caseData, costDetails, initialized, detailsInit]);

  const handleChange = (serviceKey, field, value) =>
    setCostDetails(prev => ({ ...prev, [serviceKey]: { ...prev[serviceKey], [field]: +value } }));

  // 3️⃣ Calculate grouped by real packageId
  const calculateAllDetails = useCallback(() => {
    if (!detailsInit || !caseData) return {};

    const grouped = {};
    Object.entries(caseData).forEach(([serviceKey, data]) => {
      const { packageId, totalCase, numberOfDays, reportTypeCost } = data;
      const service = serviceKey.split('__')[1];
      const rules = serviceCalculationRules[service];

      if (!grouped[packageId]) grouped[packageId] = {};

      if (defaultPrices[service]) {
        const tPrice = costDetails[serviceKey]?.tPrice || defaultPrices[service];
        grouped[packageId][service] = {
          salary:0, incentive:0, consumables:0, reporting:tPrice, misc:0, equipment:0,
          travel:0, stay:0, food:0, reportTypeCost, overhead:0,
          tPrice, unitPrice: tPrice / (totalCase || 1)
        };
      } else if (costDetails[serviceKey] && rules) {
        const { salary, incentive, misc, equipment, consumables, reporting, travel, stay, food } = costDetails[serviceKey];
        const s = rules.getSalary(salary || 0, service === 'Form 7' ? totalCase : numberOfDays);
        const c = rules.getConsumables(consumables || 0, totalCase);
        const r = rules.getReporting(reporting || 0, totalCase);
        const i = rules.getIncentive(incentive || 0, numberOfDays);
        const overhead = (s + i + misc + equipment + reportTypeCost + c + r + travel + stay + food) * 1.5;
        const tPrice = overhead * 1.3;

        grouped[packageId][service] = {
          salary:s, incentive:i, consumables:c, reporting:r, misc, equipment,
          travel, stay, food, reportTypeCost, overhead, tPrice,
          unitPrice: ['vitals','optometry','audiometry'].includes(service.toLowerCase())
            ? (totalCase < 100 ? tPrice / totalCase : tPrice / 100)
            : totalCase ? tPrice / totalCase : 0
        };
      }
    });
    return grouped;
  }, [caseData, costDetails, detailsInit]);

  const allDetails = calculateAllDetails();

  // 4️⃣ Submit grouped by packageId
  const handleSubmit = async () => {
    try {
      for (const [packageId, services] of Object.entries(allDetails)) {
        const payload = {};
        Object.entries(services).forEach(([service, v]) => {
          payload[service] = {
            travel: v.travel, stay: v.stay, food: v.food,
            salary: v.salary, misc: v.misc, equipment: v.equipment,
            consumables: v.consumables, reporting: v.reporting,
          };
        });
        await submitCostDetails(companyId, payload, packageId);
      }
      onSubmit(allDetails);
    } catch (e) { console.error('Submit error:', e); }
  };

  if (!detailsInit) return <p className="text-center text-blue-600">Loading…</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Cost Calculation</h2>
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
          {Object.entries(allDetails).map(([packageId, services]) => (
            <React.Fragment key={packageId}>
              <tr>
                <td colSpan="5" className="font-bold bg-gray-100 px-6 py-3">
                  Package ID: {packageId}
                </td>
              </tr>
              {Object.entries(services).map(([service, d]) => (
                <tr key={service}>
                  <td className="px-6 py-4">{service}</td>
                  <td className="px-6 py-4">
                    <input type="number" className="p-2 border w-20"
                      value={costDetails[`${packageId}__${service}__0`]?.travel ?? 0}
                      onChange={e=>handleChange(`${packageId}__${service}__0`,'travel',e.target.value)} />
                  </td>
                  <td className="px-6 py-4">
                    <input type="number" className="p-2 border w-20"
                      value={costDetails[`${packageId}__${service}__0`]?.stay ?? 0}
                      onChange={e=>handleChange(`${packageId}__${service}__0`,'stay',e.target.value)} />
                  </td>
                  <td className="px-6 py-4">
                    <input type="number" className="p-2 border w-20"
                      value={costDetails[`${packageId}__${service}__0`]?.food ?? 0}
                      onChange={e=>handleChange(`${packageId}__${service}__0`,'food',e.target.value)} />
                  </td>
                  <td className="px-6 py-4">
                    {defaultPrices[service] ? (
                      <input type="number" className="p-2 border w-20"
                        value={costDetails[`${packageId}__${service}__0`]?.tPrice ?? defaultPrices[service]}
                        onChange={e=>handleChange(`${packageId}__${service}__0`,'tPrice',e.target.value)} />
                    ) : d.tPrice.toFixed(2)
                    }
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between mt-4">
        <button onClick={handleSubmit}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Submit
        </button>
      </div>
    </div>
  );
}

export default CostCalculation;