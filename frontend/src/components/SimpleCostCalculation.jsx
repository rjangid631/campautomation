import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { jsPDF } from "jspdf";
import { AppContext } from '../App';
import api from './api';
// write by shyam 
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
          api.get('/prices/'),
          api.get('/service_costs/'),
        ]);

        console.log("📦 priceResponse.data:", priceResponse.data);
        console.log("📦 subserviceResponse.data:", subserviceResponse.data);

        const priceData = priceResponse.data.reduce((acc, service) => {
          if (!Array.isArray(service.price_ranges)) {
            console.warn(`⚠️ price_ranges missing or invalid for service: ${service.name}`, service);
            acc[service.name] = [];
          } else {
            acc[service.name] = service.price_ranges.map(range => ({
              maxCases: range.max_cases,
              pricePerCase: parseFloat(range.price),
            }));
          }
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
        console.error('❌ Error fetching service prices or costs:', error);
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
      const response = await api.get(`/validate-coupon/${couponCode}/`);
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
      await api.post('/cost_details/', postData);
      handleFinalSubmit();
    } catch (error) {
      console.error('Error posting data:', error);
    }
  };

  const grandTotal = calculateGrandTotal();
  const totalCases = calculateTotalCases();
  const perCasePrice = totalCases > 0 ? grandTotal / totalCases : 0;

  console.log("🔍 Actual clientDetails object:", clientDetails);
  console.log("🔍 JSON version:", JSON.stringify(clientDetails, null, 2));

  // change by shyam on 27-06-2025
const generatePDF = () => {
  if (!caseData || !clientDetails) {
    alert('Missing required data for PDF generation');
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4'); // Changed to A4 portrait for smaller size
  const margin = 8;
  const rowHeight = 8;
  const sectionSpacing = 10;
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let currentY = margin + 20;

  // **COMPACT HEADER**
  doc.setFontSize(22).setTextColor(0, 102, 204);
  doc.text("XRAI DIGITAL", margin, margin + 8);
  
  doc.setFontSize(10).setTextColor(60, 60, 60);
  doc.text("Healthcare Service Invoice", margin, margin + 16);
  
  // Invoice details - compact
  const currentDate = new Date().toLocaleDateString('en-IN');
  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
  doc.setFontSize(9).setTextColor(80, 80, 80);
  doc.text(`Invoice: ${invoiceNumber}`, pageWidth - margin - 50, margin + 8);
  doc.text(`Date: ${currentDate}`, pageWidth - margin - 50, margin + 16);

  // **CLIENT INFORMATION - COMPACT**
  doc.setFontSize(14).setTextColor(0, 102, 204);
  doc.text("CLIENT INFORMATION", margin, currentY);
  
  const campInfo = clientDetails?.camps?.[0] || {};
  const clientData = [
    ["Client ID", clientDetails?.clientId || "N/A"],
    ["Name", clientDetails?.clientName || "N/A"],
    ["Location", campInfo?.campLocation || "N/A"],
    ["Address", `${campInfo?.campLandmark || "N/A"}, ${campInfo?.campDistrict || "N/A"}, ${campInfo?.campState || "N/A"} - ${campInfo?.campPinCode || "N/A"}`],
    ["Duration", campInfo?.startDate && campInfo?.endDate 
      ? `${new Date(campInfo.startDate).toLocaleDateString('en-IN')} to ${new Date(campInfo.endDate).toLocaleDateString('en-IN')}`
      : "N/A"],
    ["Contact", clientDetails?.contactNumber || "N/A"],
    ["Email", clientDetails?.email || "N/A"]
  ];
  
  currentY += 12;
  
  // Compact client table
  const tableWidth = pageWidth - (margin * 2);
  const labelWidth = 50;
  const valueWidth = tableWidth - labelWidth;
  
  // Table header
  doc.setFillColor(0, 102, 204);
  doc.rect(margin, currentY, tableWidth, 10, 'F');
  doc.setFont("Helvetica", "bold").setFontSize(10).setTextColor(255, 255, 255);
  doc.text("FIELD", margin + 3, currentY + 7);
  doc.text("INFORMATION", margin + labelWidth + 3, currentY + 7);
  
  currentY += 10;
  
  // Client data rows - compact
  clientData.forEach((row, index) => {
    const [label, value] = row;
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, tableWidth, rowHeight, 'F');
    }
    
    // Cell borders
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.rect(margin, currentY, labelWidth, rowHeight);
    doc.rect(margin + labelWidth, currentY, valueWidth, rowHeight);
    
    // Content
    doc.setFont("Helvetica", "bold").setFontSize(8).setTextColor(50, 50, 50);
    doc.text(label, margin + 3, currentY + 5.5);
    
    doc.setFont("Helvetica", "normal").setTextColor(0, 0, 0);
    
    // Handle long text
    const maxWidth = valueWidth - 6;
    const textLines = doc.splitTextToSize(value, maxWidth);
    
    if (textLines.length > 1) {
      textLines.forEach((line, lineIndex) => {
        doc.text(line, margin + labelWidth + 3, currentY + 5.5 + (lineIndex * 3));
      });
      currentY += rowHeight + ((textLines.length - 1) * 3);
    } else {
      doc.text(value, margin + labelWidth + 3, currentY + 5.5);
      currentY += rowHeight;
    }
  });
  
  // Table border
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.5);
  const clientTableStartY = currentY - clientData.reduce((acc) => acc + rowHeight, 0) - 10;
  const clientTableHeight = currentY - clientTableStartY;
  doc.rect(margin, clientTableStartY, tableWidth, clientTableHeight);

  // **SERVICE BREAKDOWN - COMPACT**
  currentY += sectionSpacing;
  doc.setFontSize(14).setTextColor(0, 102, 204);
  doc.text("SERVICE BREAKDOWN", margin, currentY);
  
  currentY += 12;
  
  // Service table with fixed column widths - only 2 columns
  const serviceColWidths = [130, 50]; // Service, Cases
  const serviceTableWidth = serviceColWidths.reduce((a, b) => a + b, 0);
  
  // Service table header
  doc.setFillColor(0, 102, 204);
  doc.rect(margin, currentY, serviceTableWidth, 10, 'F');
  doc.setFont("Helvetica", "bold").setFontSize(10).setTextColor(255, 255, 255);
  
  let xPos = margin + 3;
  doc.text("SERVICE", xPos, currentY + 7);
  xPos += serviceColWidths[0];
  doc.text("CASES", xPos, currentY + 7);
  
  currentY += 10;
  
  let totalCases = 0;
  
  // Service rows
  Object.entries(caseData || {}).forEach(([key, data], index) => {
    const [, service] = key.split('__');
    const cases = data?.totalCase || 0;
    
    totalCases += cases;
    
    // Row background
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, serviceTableWidth, rowHeight, 'F');
    }
    
    // Cell borders
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    let borderX = margin;
    serviceColWidths.forEach(width => {
      doc.rect(borderX, currentY, width, rowHeight);
      borderX += width;
    });
    
    // Content
    doc.setFont("Helvetica", "normal").setFontSize(9).setTextColor(40, 40, 40);
    
    xPos = margin + 3;
    const truncatedService = service.length > 20 ? service.substring(0, 17) + '...' : service;
    doc.text(truncatedService, xPos, currentY + 6);
    
    xPos += serviceColWidths[0];
    doc.setFont("Helvetica", "bold");
    doc.text(cases.toString(), xPos, currentY + 6);
    
    currentY += rowHeight;
  });
  
  // Service table border
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.5);
  const serviceTableStartY = currentY - (Object.keys(caseData).length * rowHeight) - 10;
  const serviceTableHeight = currentY - serviceTableStartY;
  doc.rect(margin, serviceTableStartY, serviceTableWidth, serviceTableHeight);

  // **SUMMARY - COMPACT**
  currentY += sectionSpacing;
  
  doc.setFillColor(0, 102, 204);
  doc.rect(margin, currentY, serviceTableWidth, 8, 'F');
  doc.setFont("Helvetica", "bold").setFontSize(10).setTextColor(255, 255, 255);
  doc.text("SUMMARY", margin + 3, currentY + 6);
  
  currentY += 8;
  
  const summaryItems = [
    { label: "Total Cases", value: totalCases.toString() },
    { label: "Rate/Case", value: `Rs.${perCasePrice.toLocaleString()}` },
    { label: "GRAND TOTAL", value: `Rs.${grandTotal.toLocaleString()}`, bold: true }
  ];
  
  summaryItems.forEach((item, index) => {
    const itemHeight = item.bold ? 10 : 8;
    
    if (item.bold) {
      doc.setFillColor(0, 102, 204);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
    } else {
      doc.setFillColor(index % 2 === 0 ? 248 : 255);
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);
    }
    
    doc.rect(margin, currentY, serviceTableWidth, itemHeight, 'F');
    
    // Borders
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.rect(margin, currentY, serviceTableWidth * 0.6, itemHeight);
    doc.rect(margin + (serviceTableWidth * 0.6), currentY, serviceTableWidth * 0.4, itemHeight);
    
    doc.setFont("Helvetica", item.bold ? "bold" : "normal");
    doc.text(item.label, margin + 3, currentY + (itemHeight/2) + 2);
    doc.text(item.value, margin + (serviceTableWidth * 0.6) + 3, currentY + (itemHeight/2) + 2);
    
    currentY += itemHeight;
  });
  
  // Summary border
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.5);
  const summaryStartY = currentY - summaryItems.reduce((acc, item) => acc + (item.bold ? 10 : 8), 0) - 8;
  const summaryHeight = currentY - summaryStartY;
  doc.rect(margin, summaryStartY, serviceTableWidth, summaryHeight);

  // **COMPACT FOOTER**
  const footerY = pageHeight - 15;
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
  
  doc.setFontSize(8).setTextColor(100, 100, 100);
  doc.text("Thank you for choosing Xrai Digital Healthcare Services", margin, footerY);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, margin, footerY + 8);

  // Save with proper filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const clientId = clientDetails?.clientId || 'CLIENT';
  doc.save(`XRAI-Invoice-${clientId}-${timestamp}.pdf`);
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
