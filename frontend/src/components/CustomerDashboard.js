

import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { AppContext } from '../App';
import { apiHandlers } from './api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CustomerDashboard = () => {
  const [companyDetails, setCompanyDetails] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedCompanyIndex, setExpandedCompanyIndex] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [camps, setCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [campDetails, setCampDetails] = useState(null);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [reports, setReports] = useState([]);

  // Color scheme constants
  const colors = {
    aquaBlue: '#00c0df',
    grassGreen: '#7ed957',
    darkGrey: '#3c3b3f',
    vividPurple: '#9440dd'
  };

  // Load from localStorage
const rawClientId = localStorage.getItem("clientId");
console.log("🗃 Raw clientId from localStorage:", rawClientId);
const finalClientId = rawClientId && !rawClientId.startsWith("CL-") ? `CL-${rawClientId}` : rawClientId;
console.log("✅ Final clientId used for fetch:", finalClientId);

const clientId = localStorage.getItem('clientId') || '';
console.log("✅ Final clientId used for fetch:", clientId);

const clientIdString = clientId;           // for Camps API
console.log("🔤 Client ID String:", clientIdString);

console.log("✅ Final clientId used for fetch:", clientId);



  useEffect(() => {
    const fetchClientDashboard = async () => {
      const token = localStorage.getItem('access_token');


      if (!token) {
        setError("Unauthorized: Token not found. Please login again.");
        setLoading(false);
        return;
      }

      if (!clientId) {
        console.warn("⚠️ Client ID not found. Cannot fetch dashboard.");
        setError("Client ID not found. Please login again.");
        setLoading(false);
        return;
      }

      try {
        console.log("📤 Fetching client dashboard for clientId:", clientId);
        const data = await apiHandlers.getClientDashboard(clientId);

        const processedData = data.map((item) => ({
          ...item,
          datenow: new Date().toISOString().split('T')[0],
        }));

        setCompanyDetails(processedData);
        console.log("✅ Dashboard data received:", processedData);
        
        // Fetch camps data
        await fetchCamps();
      } catch (err) {
        console.error("❌ Error fetching client dashboard:", err);
        setError("Failed to fetch client data.");
      } finally {
        setLoading(false);
      }
    };

    fetchClientDashboard();
  }, [clientId]);

  const fetchCamps = async () => {
    try {
      console.log("📤 Fetching camps for client:", clientIdString);
      const campsData = await apiHandlers.getCamps(clientIdString);
      console.log("✅ Camps data received:", campsData);
      
      // Transform the data to match the expected format
      const transformedCamps = campsData.map(camp => ({
        id: camp.id,
        name: `${camp.location} Camp`,
        date: camp.start_date,
        endDate: camp.end_date,
        status: camp.ready_to_go ? 'Ready to Go' : 'In Progress',
        location: camp.location,
        district: camp.district,
        state: camp.state,
        pin_code: camp.pin_code,
        ready_to_go: camp.ready_to_go,
        client: camp.client
      }));

      setCamps(transformedCamps);
    } catch (err) {
      console.error("❌ Error fetching camps:", err);
      // Set fallback data for demonstration
      setCamps([

      ]);
    }
  };

  const fetchCampDetails = async (campId) => {
    try {
      const details = await apiHandlers.getCampDetails(campId);
      setCampDetails(details);
    } catch (err) {
      console.error("❌ Error fetching camp details:", err);
      // Set dummy data for demonstration
      setCampDetails({
        id: campId,
        name: camps.find(c => c.id === campId)?.name || 'Camp',
        participants: 150,
        services: ['Blood Test', 'BP Check', 'Sugar Test'],
        qrCode: 'QR123456',
        status: 'Active'
      });
    }
  };

  const fetchInvoiceHistory = async (campId) => {
    try {
      const invoices = await apiHandlers.getInvoiceHistory(campId);
      setInvoiceHistory(invoices);
    } catch (err) {
      console.error("❌ Error fetching invoice history:", err);
      // Set dummy data for demonstration
      setInvoiceHistory([
        { id: 1, invoice_no: 'INV-001', date: '2024-01-20', amount: 25000, status: 'Paid' },
        { id: 2, invoice_no: 'INV-002', date: '2024-02-15', amount: 18000, status: 'Pending' },
      ]);
    }
  };

  const fetchReports = async (campId) => {
    try {
      const reportsData = await apiHandlers.getReports(campId);
      setReports(reportsData);
    } catch (err) {
      console.error("❌ Error fetching reports:", err);
      // Set dummy data for demonstration
      setReports([
        { id: 1, name: 'Participant Report', type: 'PDF', date: '2024-01-25', size: '2.5 MB' },
        { id: 2, name: 'Service Summary', type: 'Excel', date: '2024-02-01', size: '1.8 MB' },
      ]);
    }
  };

  const handleCampSelect = (camp) => {
    setSelectedCamp(camp);
    if (activeSection === 'campProgress') {
      fetchCampDetails(camp.id);
    } else if (activeSection === 'invoiceHistory') {
      fetchInvoiceHistory(camp.id);
    } else if (activeSection === 'reports') {
      fetchReports(camp.id);
    }
  };

  const toggleDetails = (index) => {
    setExpandedCompanyIndex(expandedCompanyIndex === index ? null : index);
  };

  const chartData = {
    labels: companyDetails.map((c) => c.name || 'N/A'),
    datasets: [
      {
        label: 'Service Count',
        data: companyDetails.map((c) =>
          c.services.reduce((sum, s) => sum + s.total_cases, 0)
        ),
        backgroundColor: colors.aquaBlue,
        borderColor: colors.aquaBlue,
        borderWidth: 1,
      },
    ],
  };

  const Loader = () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-solid" style={{ borderColor: colors.aquaBlue }}></div>
    </div>
  );

  if (loading) return <Loader />;
  if (error) return <div className="text-red-600 p-4">{error}</div>;

  const displayedCompanyName =
    localStorage.getItem('companyName') &&
    localStorage.getItem('companyName') !== "undefined"
      ? localStorage.getItem('companyName')
      : companyDetails[0]?.name || "Welcome";

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <div className="flex justify-between p-4 bg-white rounded-lg shadow-md mb-4">
              <h1 className="text-3xl font-bold" style={{ color: colors.aquaBlue }}>DASHBOARD</h1>
            </div>

            {companyDetails.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4" style={{ color: colors.darkGrey }}>Service Summary</h2>
                <Bar
                  data={chartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Service Totals by Client' },
                    },
                  }}
                />
              </div>
            )}

            {companyDetails.map((company, index) => (
              <div key={index} className="mb-6 border bg-white p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: colors.darkGrey }}>
                      {company.name || "Unnamed Company"}
                    </h3>
                    <p style={{ color: colors.darkGrey }}>Date: {company.datenow}</p>
                  </div>
                  <button
                    onClick={() => toggleDetails(index)}
                    className="text-white px-4 py-2 rounded-lg"
                    style={{ backgroundColor: colors.aquaBlue }}
                  >
                    {expandedCompanyIndex === index ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {expandedCompanyIndex === index && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold" style={{ color: colors.darkGrey }}>Services:</h4>
                    <ul className="list-disc pl-5">
                      {company.services.map((s, i) => (
                        <li key={i} style={{ color: colors.darkGrey }}>
                          {s.service_name}: {s.total_cases} cases
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {companyDetails.length === 0 && (
              <p style={{ color: colors.darkGrey }}>No data available for this client.</p>
            )}
          </div>
        );

      case 'campProgress':
        return (
          <div>
            <div className="flex justify-between p-4 bg-white rounded-lg shadow-md mb-4">
              <h1 className="text-3xl font-bold" style={{ color: colors.aquaBlue }}>CAMP PROGRESS</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4" style={{ color: colors.darkGrey }}>
                  Ready to Go Camps
                </h2>
                <div className="space-y-2">
                  {camps.filter(camp => camp.ready_to_go).map((camp) => (
                    <div
                      key={camp.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedCamp?.id === camp.id ? 'border-blue-300' : ''
                      }`}
                      style={{
                        backgroundColor: selectedCamp?.id === camp.id ? colors.aquaBlue + '20' : 'white'
                      }}
                      onClick={() => handleCampSelect(camp)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium" style={{ color: colors.darkGrey }}>
                            {camp.name}
                          </h3>
                          <p className="text-sm" style={{ color: colors.darkGrey }}>
                            Start: {camp.date}
                          </p>
                          {camp.endDate && (
                            <p className="text-sm" style={{ color: colors.darkGrey }}>
                              End: {camp.endDate}
                            </p>
                          )}
                          <p className="text-sm" style={{ color: colors.darkGrey }}>
                            Location: {camp.location}, {camp.district}, {camp.state}
                          </p>
                          <p className="text-sm" style={{ color: colors.darkGrey }}>
                            Pin Code: {camp.pin_code}
                          </p>
                        </div>
                        <span 
                          className="px-2 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: colors.grassGreen }}
                        >
                          {camp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {camps.filter(camp => camp.ready_to_go).length === 0 && (
                    <p style={{ color: colors.darkGrey }}>No ready-to-go camps available.</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4" style={{ color: colors.darkGrey }}>
                  Camp Details & QR Dashboard
                </h2>
                {selectedCamp && campDetails ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg" style={{ color: colors.darkGrey }}>
                        {campDetails.name}
                      </h3>
                      <p style={{ color: colors.darkGrey }}>Status: {campDetails.status}</p>
                      <p style={{ color: colors.darkGrey }}>Participants: {campDetails.participants}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2" style={{ color: colors.darkGrey }}>
                        Services Offered:
                      </h4>
                      <ul className="list-disc pl-5">
                        {campDetails.services.map((service, index) => (
                          <li key={index} style={{ color: colors.darkGrey }}>{service}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded" style={{ backgroundColor: colors.aquaBlue + '10' }}>
                      <h4 className="font-medium mb-2" style={{ color: colors.darkGrey }}>
                        QR Code Dashboard
                      </h4>
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-20 h-20 flex items-center justify-center rounded"
                          style={{ backgroundColor: colors.darkGrey, color: 'white' }}
                        >
                          QR
                        </div>
                        <div>
                          <p className="text-sm" style={{ color: colors.darkGrey }}>
                            QR Code: {campDetails.qrCode}
                          </p>
                          <button 
                            className="text-white px-3 py-1 rounded text-sm mt-2"
                            style={{ backgroundColor: colors.vividPurple }}
                          >
                            View Full Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: colors.darkGrey }}>Select a camp to view details</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'invoiceHistory':
        return (
          <div>
            <div className="flex justify-between p-4 bg-white rounded-lg shadow-md mb-4">
              <h1 className="text-3xl font-bold" style={{ color: colors.aquaBlue }}>INVOICE HISTORY</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4" style={{ color: colors.darkGrey }}>
                  Select Camp
                </h2>
                <div className="space-y-2">
                  {camps.filter(camp => camp.ready_to_go).map((camp) => (
                    <div
                      key={camp.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedCamp?.id === camp.id ? 'border-blue-300' : ''
                      }`}
                      style={{
                        backgroundColor: selectedCamp?.id === camp.id ? colors.aquaBlue + '20' : 'white'
                      }}
                      onClick={() => handleCampSelect(camp)}
                    >
                      <h3 className="font-medium" style={{ color: colors.darkGrey }}>
                        {camp.name}
                      </h3>
                      <p className="text-sm" style={{ color: colors.darkGrey }}>
                        Date: {camp.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4" style={{ color: colors.darkGrey }}>
                  Invoice History
                </h2>
                {selectedCamp ? (
                  <div className="space-y-3">
                    {invoiceHistory.map((invoice) => (
                      <div key={invoice.id} className="border p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium" style={{ color: colors.darkGrey }}>
                              {invoice.invoice_no}
                            </h4>
                            <p className="text-sm" style={{ color: colors.darkGrey }}>
                              Date: {invoice.date}
                            </p>
                            <p className="font-medium" style={{ color: colors.darkGrey }}>
                              ₹{invoice.amount.toLocaleString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs text-white ${
                            invoice.status === 'Paid' ? '' : 
                            invoice.status === 'Pending' ? '' : ''
                          }`}
                          style={{
                            backgroundColor: invoice.status === 'Paid' ? colors.grassGreen :
                                           invoice.status === 'Pending' ? colors.vividPurple :
                                           colors.aquaBlue
                          }}>
                            {invoice.status}
                          </span>
                        </div>
                        <div className="mt-2">
                          <button 
                            className="text-white px-3 py-1 rounded text-sm mr-2"
                            style={{ backgroundColor: colors.aquaBlue }}
                          >
                            View Invoice
                          </button>
                          <button 
                            className="text-white px-3 py-1 rounded text-sm"
                            style={{ backgroundColor: colors.grassGreen }}
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: colors.darkGrey }}>Select a camp to view invoice history</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div>
            <div className="flex justify-between p-4 bg-white rounded-lg shadow-md mb-4">
              <h1 className="text-3xl font-bold" style={{ color: colors.aquaBlue }}>REPORTS</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4" style={{ color: colors.darkGrey }}>
                  Select Camp
                </h2>
                <div className="space-y-2">
                  {camps.filter(camp => camp.ready_to_go).map((camp) => (
                    <div
                      key={camp.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedCamp?.id === camp.id ? 'border-blue-300' : ''
                      }`}
                      style={{
                        backgroundColor: selectedCamp?.id === camp.id ? colors.aquaBlue + '20' : 'white'
                      }}
                      onClick={() => handleCampSelect(camp)}
                    >
                      <h3 className="font-medium" style={{ color: colors.darkGrey }}>
                        {camp.name}
                      </h3>
                      <p className="text-sm" style={{ color: colors.darkGrey }}>
                        Date: {camp.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4" style={{ color: colors.darkGrey }}>
                  Available Reports
                </h2>
                {selectedCamp ? (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="border p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium" style={{ color: colors.darkGrey }}>
                              {report.name}
                            </h4>
                            <p className="text-sm" style={{ color: colors.darkGrey }}>
                              Type: {report.type}
                            </p>
                            <p className="text-sm" style={{ color: colors.darkGrey }}>
                              Generated: {report.date}
                            </p>
                            <p className="text-sm" style={{ color: colors.darkGrey }}>
                              Size: {report.size}
                            </p>
                          </div>
                          <div className="space-x-2">
                            <button 
                              className="text-white px-3 py-1 rounded text-sm"
                              style={{ backgroundColor: colors.aquaBlue }}
                            >
                              View
                            </button>
                            <button 
                              className="text-white px-3 py-1 rounded text-sm"
                              style={{ backgroundColor: colors.grassGreen }}
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: colors.darkGrey }}>Select a camp to view available reports</p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <div className="w-64 bg-gray-800 text-white h-screen p-6">
          <h2 className="text-2xl font-bold mb-6">{displayedCompanyName}</h2>
          <nav className="space-y-2">
            <button
              onClick={() => setActiveSection('dashboard')}
              className={`block w-full text-left py-2 px-4 rounded ${
                activeSection === 'dashboard' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <Link to="/camp-details" className="block py-2 px-4 hover:bg-gray-700 rounded">
              Add New Camp
            </Link>
            <button
              onClick={() => setActiveSection('campProgress')}
              className={`block w-full text-left py-2 px-4 rounded ${
                activeSection === 'campProgress' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Camp Progress
            </button>
            <button
              onClick={() => setActiveSection('invoiceHistory')}
              className={`block w-full text-left py-2 px-4 rounded ${
                activeSection === 'invoiceHistory' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Invoice History
            </button>
            <button
              onClick={() => setActiveSection('reports')}
              className={`block w-full text-left py-2 px-4 rounded ${
                activeSection === 'reports' ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
            >
              Reports
            </button>
            <Link to="/login" className="block py-2 px-4 hover:bg-gray-700 rounded">
              LOGOUT
            </Link>
          </nav>
        </div>

        <div className="flex-1 p-6 bg-gray-100">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;