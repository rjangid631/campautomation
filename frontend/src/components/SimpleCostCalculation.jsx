import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { jsPDF } from "jspdf";
import { AppContext } from '../App';

function SimpleCostCalculation() {
  const {
    caseData,
    campDetails: clientDetails,
    handleFinalSubmit,
  } = useContext(AppContext);
  const username = localStorage.getItem('companyName');

  const [priceRanges, setPriceRanges] = useState({});
  const [subserviceCosts, setSubserviceCosts] = useState({});
  const [initialized, setInitialized] = useState(false);
  const [partnerMargin, setPartnerMargin] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('caseData:', caseData);
  }, [caseData]);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const [priceResponse, subserviceResponse] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/prices/'),
          axios.get('http://127.0.0.1:8000/api/service_costs/'),
        ]);

        const priceData = priceResponse.data.reduce((acc, service) => {
          acc[service.name] = service.price_ranges.map(range => ({
            maxCases: range.max_cases,
            pricePerCase: parseFloat(range.price),
          }));
          return acc;
        }, {});

        const subserviceData = subserviceResponse.data.reduce((acc, service) => {
          const includedTests = [
            'CBC', 'Complete Hemogram', 'Hemoglobin', 'Urine Routine', 'Stool Examination',
            'Lipid Profile', 'Kidney Profile', 'LFT', 'KFT', 'Random Blood Glucose', 'Blood Grouping'
          ];
          if (includedTests.includes(service.test_type_name)) {
            acc[service.test_type_name] = {
              salary: parseFloat(service.salary),
              incentive: parseFloat(service.incentive),
              misc: parseFloat(service.misc),
              equipment: parseFloat(service.equipment),
              reporting: parseFloat(service.reporting),
            };
          }
          return acc;
        }, {});

        setPriceRanges(priceData);
        setSubserviceCosts(subserviceData);
        setInitialized(true);
      } catch (error) {
        console.error('Error fetching service prices or costs:', error);
      }
    };

    if (!initialized) fetchServiceData();
  }, [initialized]);

  const calculateTotalPrice = (key, totalCase) => {
    if (!key || !totalCase) return 0;
    const [, service] = key.split('__');

    if (subserviceCosts.hasOwnProperty(service)) {
      const { salary = 0, incentive = 0, misc = 0, equipment = 0, reporting = 0 } = subserviceCosts[service] || {};
      return (salary + incentive + misc + equipment + reporting) * totalCase;
    } else {
      const ranges = priceRanges[service] || [];
      let pricePerCase = 0;

      for (let i = 0; i < ranges.length; i++) {
        if (totalCase <= ranges[i].maxCases) {
          pricePerCase = ranges[i].pricePerCase;
          break;
        }
      }

      const reportTypeCost = caseData?.[key]?.reportTypeCost || 0;
      return (totalCase * pricePerCase) + reportTypeCost;
    }
  };

  const calculateGrandTotal = () => {
    if (!caseData || typeof caseData !== 'object') return 0;

    const total = Object.keys(caseData).reduce((sum, key) => {
      const totalCase = caseData?.[key]?.totalCase || 0;
      return sum + calculateTotalPrice(key, totalCase);
    }, 0);

    return total * ((100 + partnerMargin) / 100) * ((100 - discount) / 100);
  };

  const calculateTotalCases = () => {
    if (!caseData || typeof caseData !== 'object') return 0;

    return Object.keys(caseData).reduce((maxCases, key) => {
      const totalCase = caseData?.[key]?.totalCase || 0;
      return Math.max(maxCases, totalCase);
    }, 0);
  };

  const handleCouponSubmit = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/validate-coupon/${couponCode}/`);
      setDiscount(response.data.discount_percentage);
      setError('');
    } catch (error) {
      setDiscount(0);
      setError('Invalid coupon code');
    }
  };

  const handleSubmit = async () => {
    if (!caseData || !clientDetails || !username) return;

    const costData = Object.keys(caseData).map(key => {
      const [, service] = key.split('__');
      return {
        service_name: service,
        total_cases: caseData?.[key]?.totalCase || 0,
      };
    });

    const postData = {
      client: clientDetails.client_id,
      grand_total: calculateGrandTotal().toFixed(2),
      super_company: username,
      services: costData,
    };

    try {
      await axios.post('http://127.0.0.1:8000/api/cost_details/', postData);
      handleFinalSubmit();
    } catch (error) {
      console.error('Error posting data:', error);
    }
  };

  const grandTotal = calculateGrandTotal();
  const totalCases = calculateTotalCases();
  const perCasePrice = totalCases > 0 ? grandTotal / totalCases : 0;

  const generatePDF = () => {
    if (!caseData || !clientDetails) return;

    const doc = new jsPDF('l', 'mm', 'a3');
    const margin = 15;
    const rowHeight = 12;
    const sectionSpacing = 14;
    let currentY = margin + 25;

    doc.setFontSize(30).setTextColor(0, 102, 204).text("Xrai", margin, margin);
    doc.setFontSize(22).setTextColor(0, 0, 0).text("Client Details", margin, currentY);

    doc.setFontSize(18);
    const clientInfo = [
      { label: "Client Name", value: clientDetails.name },
      { label: "Address", value: `${clientDetails.landmark}, ${clientDetails.district}, ${clientDetails.state} - ${clientDetails.pin_code}` },
    ];
    currentY += 12;

    clientInfo.forEach(detail => {
      doc.text(`${detail.label}: ${detail.value}`, margin, currentY);
      currentY += rowHeight;
    });

    doc.setFontSize(22);
    currentY += sectionSpacing;
    doc.text("Service Costs", margin, currentY);

    const serviceHeaderY = currentY + 17;
    doc.setFillColor(0, 153, 255);
    doc.rect(margin, serviceHeaderY - 10, 180, 10, 'F');
    doc.setFont("Helvetica", "bold").setTextColor(255, 255, 255);
    doc.text("Service", margin + 2, serviceHeaderY);
    doc.text("Total Cases", margin + 100, serviceHeaderY);

    let serviceStartY = serviceHeaderY + 8;
    Object.keys(caseData || {}).forEach((key, index) => {
      const [, service] = key.split('__');
      const totalCase = caseData?.[key]?.totalCase || 0;

      if (serviceStartY + rowHeight > doc.internal.pageSize.height - margin) {
        doc.addPage();
        serviceStartY = margin;
      }

      doc.setFillColor(index % 2 === 0 ? 240 : 255);
      doc.rect(margin, serviceStartY, 180, rowHeight, 'F');
      doc.setFont("Helvetica", "normal").setTextColor(0, 0, 0);
      doc.text(service, margin + 2, serviceStartY + 8);
      doc.text(totalCase.toString(), margin + 100, serviceStartY + 8);
      serviceStartY += rowHeight;
    });

    currentY = serviceStartY + sectionSpacing;
    doc.setFontSize(22).setTextColor(0, 102, 204);
    doc.text(`Grand Total: ₹${grandTotal.toFixed(0)}`, margin, currentY);
    doc.text(`Per-Case Price: ₹${perCasePrice.toFixed(0)}`, margin, currentY + 10);
    doc.save("xraidigitalcampcalculator.pdf");
  };

  if (!caseData) return <div className="text-red-500 p-4">No case data available.</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-4xl font-extrabold mb-6 text-blue-600 text-center">XRAI</h2>

      <table className="min-w-full divide-y divide-gray-200 mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Test Type</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Total Cases</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(caseData || {}).map(key => {
            const [, service] = key.split('__');
            return (
              <tr key={key} className="hover:bg-gray-50">
                <td className="px-4 py-3">{service}</td>
                <td className="px-4 py-3">{caseData?.[key]?.totalCase || 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4">
        <label htmlFor="coupon" className="block text-sm font-medium text-gray-700">Discount Coupon</label>
        <div className="flex items-center mt-1">
          <input
            type="text"
            id="coupon"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="p-2 border border-gray-300 rounded-md w-full"
          />
          <button
            onClick={handleCouponSubmit}
            className="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Apply
          </button>
        </div>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>

      <div className="mt-4">
        <label htmlFor="partnerMargin" className="block text-gray-700">Partner Margin (%)</label>
        <input
          type="number"
          id="partnerMargin"
          value={partnerMargin}
          onChange={(e) => setPartnerMargin(parseFloat(e.target.value) || 0)}
          className="border border-gray-300 rounded-md p-2"
        />
      </div>

      <div className="mt-4 flex justify-between items-center border-t pt-4">
        <div className="text-lg font-bold text-gray-800">Grand Total: ₹{grandTotal.toFixed(0)}</div>
        <div className="text-lg font-bold text-gray-800">Per-Case Price: ₹{perCasePrice.toFixed(0)}</div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
          onClick={generatePDF}
        >
          Generate PDF
        </button>
        <Link to="/login">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </Link>
      </div>
    </div>
  );
}

export default SimpleCostCalculation;
