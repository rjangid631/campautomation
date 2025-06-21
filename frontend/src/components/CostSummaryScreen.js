import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { submitCostSummary } from './api';
function CostSummaryScreen({ caseData, costDetails, campDetails, companyId,onSubmit,}) {
    const [markup, setMarkup] = useState({});
    // Helper functions to handle billing counter
    const getBillingCounter = () => {
        let storedCounter = localStorage.getItem('billingCounter');
        if (!storedCounter) {
            storedCounter = '0'; // Set to zero if no value is stored
            localStorage.setItem('billingCounter', storedCounter);
        }
        return parseInt(storedCounter, 10);
    };
    console.log(campDetails)

    const setBillingCounter = (counter) => {
        localStorage.setItem('billingCounter', counter);
    };

    // Function to generate a unique billing number
    const generateBillingNumber = () => {
        const uniqueString = 'U4RAD'; // Fixed unique identifier
        const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // Date in YYYYMMDD format
        let billingCounter = getBillingCounter();
        const incrementingNumber = billingCounter.toString().padStart(3, '0'); // 3-digit formatted number
        setBillingCounter(billingCounter + 1); // Increment counter and store it
        return `${uniqueString}-${currentDate}-${incrementingNumber}`;
    };

    // Function to calculate revised unit price
    const calculateRevisedUnitPrice = (unitPrice, markupValue) => {
        return unitPrice * markupValue;
    };

    // Function to calculate total price
    const calculateTotalPrice = (revisedUnitPrice, totalCase) => {
        return revisedUnitPrice * totalCase;
    };

    // Service rows for the table
    const serviceRows = Object.keys(caseData).map((service) => {
        const { totalCase } = caseData[service];
        const { unitPrice } = costDetails[service] || { unitPrice: 0 }; // Default to 0 if undefined
        const serviceMarkup = markup[service] || 1; // Default markup value to 1 if undefined
        const revisedUnitPrice = calculateRevisedUnitPrice(unitPrice, serviceMarkup);
        const totalPrice = calculateTotalPrice(revisedUnitPrice, totalCase);

        return (
            <tr key={service} className="border-b border-gray-200">
                <td className="py-2 px-4">{service}</td>
                <td className="py-2 px-4 text-right">{totalCase || 0}</td>
                <td className="py-2 px-4 text-right">
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={serviceMarkup}
                        onChange={(e) => handleMarkupChange(service, parseFloat(e.target.value))}
                        className="w-20 p-1 border rounded text-right"
                    />
                </td>
                <td className="py-2 px-4 text-right">₹{isNaN(revisedUnitPrice) ? '0.00' : revisedUnitPrice.toFixed(2)}</td>
                <td className="py-2 px-4 text-right">₹{isNaN(totalPrice) ? '0.00' : totalPrice.toFixed(2)}</td>
            </tr>
        );
    });

    // Grand total calculation
    const grandTotal = Object.keys(caseData).reduce((total, service) => {
        const { totalCase } = caseData[service];
        const { unitPrice } = costDetails[service] || { unitPrice: 0 }; // Default to 0 if undefined
        const serviceMarkup = markup[service] || 1; // Default markup value to 1 if undefined
        const revisedUnitPrice = calculateRevisedUnitPrice(unitPrice, serviceMarkup);
        const totalPrice = calculateTotalPrice(revisedUnitPrice, totalCase);
        return total + totalPrice;
    }, 0);

    // Handle markup change
    const handleMarkupChange = (service, value) => {
        setMarkup((prev) => ({
            ...prev,
            [service]: value,
        }));
    };

    // Generate and download the PDF
    const handleDownloadComprehensivePDF = () => {
        const doc = new jsPDF();
        // Initialize doc and add title with underline
const billingNumber = generateBillingNumber();
doc.setFontSize(12);
doc.setTextColor(0, 0, 0);

// Title
doc.setFontSize(20);
doc.setTextColor(0, 51, 153); // Dark blue color for title
doc.text('U4RAD CAMP ESTIMATION', 105, 25, { align: 'center' });
doc.setLineWidth(1);
doc.line(50, 28, 160, 28); // Short underline below the title

// Billing Number
doc.setFontSize(12);
doc.setTextColor(50, 50, 50); // Gray text
doc.text(`Billing Number: ${billingNumber}`, 14, 35);

// Section: Company Details (Title with underline)
doc.setFontSize(16);
doc.setTextColor(0, 51, 153);
doc.text('Company Details', 14, 50);
doc.setLineWidth(0.5);
doc.line(14, 52, 200, 52); // Underline under section title

// Company details - grid layout
doc.setFontSize(11);
doc.setTextColor(0, 0, 0);
let positionY = 60; // Starting point for company details

const { companyName, companyState, companyDistrict, companyPinCode, companyLandmark, companyAddress } = campDetails;
// Assuming positionY is already defined and used for vertical spacing
if (companyName) {
    doc.setFont("helvetica", "bold");
    doc.text(companyName, 14, positionY); // Display the company name
    positionY += 7;
}

if (companyAddress || companyLandmark || companyDistrict || companyState || companyPinCode) {
    // Combine all address components into a single continuous line
    const addressParts = [
        companyAddress || '',
        companyLandmark || '',
        companyDistrict || '',
        companyState || '',
        companyPinCode || ''
    ];
    
    // Filter out empty strings and join them with a space
    const formattedAddressLine = addressParts.filter(part => part.trim() !== '').join(' ');

    // Print the combined address in a single line
    doc.setFont("helvetica", "normal");
    doc.text(formattedAddressLine, 14, positionY); // Display the complete address

    positionY += 7;
}

// Add line separator before the next section
doc.setLineWidth(0.5);
doc.line(14, positionY + 5, 200, positionY + 5);
positionY += 10; // Adjust position after the line

// Section: Camp Locations & Dates
doc.setFontSize(16);
doc.setTextColor(0, 51, 153);
doc.text('Camp Locations & Dates', 14, positionY);
doc.setLineWidth(0.5);
doc.line(14, positionY + 2, 200, positionY + 2); // Underline for section title

positionY += 10;
doc.setFontSize(11);
doc.setTextColor(0, 0, 0);

const locations = campDetails.camps || [];
if (locations.length > 0) {
    locations.forEach((camp, idx) => {
        const startDateStr = new Date(camp.startDate).toDateString();
        const endDateStr = new Date(camp.endDate).toDateString();
        const { campLocation, campState, campDistrict, campPinCode } = camp;

        // Add grid layout for camp details
        doc.setFont("helvetica", "bold");
        doc.text('Location:', 14, positionY);
        doc.setFont("helvetica", "normal");
        doc.text(`${campLocation}`, 50, positionY);

        doc.setFont("helvetica", "bold");
        doc.text('State:', 100, positionY);
        doc.setFont("helvetica", "normal");
        doc.text(`${campState}`, 130, positionY);

        positionY += 7;
        doc.setFont("helvetica", "bold");
        doc.text('District:', 14, positionY);
        doc.setFont("helvetica", "normal");
        doc.text(`${campDistrict}`, 50, positionY);

        doc.setFont("helvetica", "bold");
        doc.text('Pin Code:', 100, positionY);
        doc.setFont("helvetica", "normal");
        doc.text(`${campPinCode}`, 130, positionY);

        positionY += 7;
        doc.setFont("helvetica", "bold");
        doc.text('Camp Dates:', 14, positionY);
        doc.setFont("helvetica", "normal");
        doc.text(`${startDateStr} - ${endDateStr}`, 50, positionY);
        positionY += 10;

        if (positionY > doc.internal.pageSize.height - 40) {
            doc.addPage();
            positionY = 20;
        }
    });
} else {
    doc.text('No camp locations provided.', 20, positionY);
}
  
        // Table for Services
        const serviceRows = Object.keys(caseData).map((service) => {
            const { totalCase } = caseData[service];
            const { unitPrice } = costDetails[service] || { unitPrice: 0 }; // Default to 0 if undefined
            const serviceMarkup = markup[service] || 1; // Default markup value to 1 if undefined
            const revisedUnitPrice = calculateRevisedUnitPrice(unitPrice, serviceMarkup);
            const totalPrice = calculateTotalPrice(revisedUnitPrice, totalCase);

            return [
                service,
                totalCase || 0,
                `${revisedUnitPrice.toFixed(2)}`,
                `${totalPrice.toFixed(2)}`
            ];
        });

        doc.autoTable({
            startY: positionY + 10,
            head: [['Test Service', 'Total Case', 'Revised Unit Price', 'Total Price']],
            body: serviceRows,
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 5, fillColor: [245, 245, 245] },
            headStyles: { fillColor: [0, 51, 102], textColor: 255 },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
            },
            margin: { top: 10 },
            pageBreak: 'auto',
        });

        // Grand Total
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Grand Total: ${grandTotal.toLocaleString()}`, 14, doc.autoTable.previous.finalY + 10);

        // Save the PDF
        doc.save(`U4RAD CAMP Estimation_${billingNumber}.pdf`);
    };

    const handleSubmit = async () => {
        const billingNumber = generateBillingNumber();
        const data = {
            company_id: companyId,
            billing_number: billingNumber,
            company_name: campDetails.companyName || '',
            company_state: campDetails.companyState || '',
            company_district: campDetails.companyDistrict || '',
            company_pincode: campDetails.companyPinCode || '',
            company_landmark: campDetails.companyLandmark || '',
            company_address: campDetails.companyAddress || '',
            camp_details: campDetails.camps || [],
            service_details: Object.keys(caseData).map((service) => {
                const { totalCase } = caseData[service];
                const { unitPrice } = costDetails[service] || { unitPrice: 0 };
                const serviceMarkup = markup[service] || 1;
                const revisedUnitPrice = calculateRevisedUnitPrice(unitPrice, serviceMarkup);
                const totalPrice = calculateTotalPrice(revisedUnitPrice, totalCase);
                return {
                    service,
                    totalCase,
                    unitPrice,
                    revisedUnitPrice,
                    totalPrice,
                };
            }),
            grand_total: grandTotal,
        };
    
        try {
            await submitCostSummary(data); // Call the function to submit data
            alert('Data submitted successfully!');
        } catch (error) {
            alert('Failed to submit data.');
        }
    };
    
    return (
        <div className="p-4 bg-white rounded shadow-md">
            <h2 className="text-xl font-bold mb-4">Cost Summary</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="py-2 px-4 text-left">Test Service</th>
                            <th className="py-2 px-4 text-right">Total Case</th>
                            <th className="py-2 px-4 text-right">Markup</th>
                            <th className="py-2 px-4 text-right">Revised Unit Price</th>
                            <th className="py-2 px-4 text-right">Total Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {serviceRows}
                    </tbody>
                </table>
            </div>
            <div className="mt-4">
                <div className="text-right font-bold">Grand Total: ₹{grandTotal.toFixed(2)}</div>
            </div>
            <div className="mt-4 flex justify-end space-x-4">
                <button
                    onClick={handleDownloadComprehensivePDF}
                    className="bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-700"
                >
                    Download Estimation PDF
                </button>
                <button
                    onClick={handleSubmit}
                    className="bg-green-500 text-white py-2 px-4 rounded shadow hover:bg-green-700"
                >
                    Save in dashboard
                </button>
            </div>
        </div>
    );
}

export default CostSummaryScreen;




