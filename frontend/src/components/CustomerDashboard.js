// import React, { useState, useEffect, useContext } from 'react';
// import axios from 'axios';
// import { Link } from 'react-router-dom';
// import { Bar } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';
// import { AppContext } from '../App';

// ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// const CustomerDashboard = () => {
//   const [companyDetails, setCompanyDetails] = useState([]);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [expandedCompanyIndex, setExpandedCompanyIndex] = useState(null);

//   // ✅ Load from localStorage
//   const storedClientIdRaw = localStorage.getItem("clientId");
//   const storedClientId = storedClientIdRaw && storedClientIdRaw !== "NaN" && storedClientIdRaw !== "null"
//     ? parseInt(storedClientIdRaw)
//     : null;

//   const { companyId: contextCompanyId } = useContext(AppContext);
//   const clientId = storedClientId || contextCompanyId;

//   console.log("🧩 clientId from localStorage:", storedClientIdRaw);
//   console.log("🧩 clientId from context:", contextCompanyId);
//   console.log("✅ Final clientId used for fetch:", clientId);

//   useEffect(() => {
//     const fetchClientDashboard = async () => {
//       const token = localStorage.getItem('token');

//       if (!token) {
//         setError("Unauthorized: Token not found. Please login again.");
//         setLoading(false);
//         return;
//       }

//       if (!clientId) {
//         console.warn("⚠️ Client ID not found. Cannot fetch dashboard.");
//         setError("Client ID not found. Please login again.");
//         setLoading(false);
//         return;
//       }

//       try {
//         console.log("📤 Fetching client dashboard for clientId:", clientId);
//         const response = await axios.get(
//           `http://127.0.0.1:8000/api/client-dashboard/?client_id=${clientId}`,
//           {
//             headers: {
//               Authorization: `Token ${token}`,
//             },
//           }
//         );

//         const data = response.data.map((item) => ({
//           ...item,
//           datenow: new Date().toISOString().split('T')[0],
//         }));

//         setCompanyDetails(data);
//         console.log("✅ Dashboard data received:", data);
//       } catch (err) {
//         console.error("❌ Error fetching client dashboard:", err);
//         setError("Failed to fetch client data.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchClientDashboard();
//   }, [clientId]);

//   const toggleDetails = (index) => {
//     setExpandedCompanyIndex(expandedCompanyIndex === index ? null : index);
//   };

//   const chartData = {
//     labels: companyDetails.map((c) => c.name || 'N/A'),
//     datasets: [
//       {
//         label: 'Service Count (Dummy ₹)',
//         data: companyDetails.map((c) =>
//           c.services.reduce((sum, s) => sum + s.total_cases, 0)
//         ),
//         backgroundColor: 'rgba(75, 192, 192, 0.6)',
//         borderColor: 'rgba(75, 192, 192, 1)',
//         borderWidth: 1,
//       },
//     ],
//   };

//   const Loader = () => (
//     <div className="flex justify-center items-center h-screen">
//       <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
//     </div>
//   );

//   if (loading) return <Loader />;
//   if (error) return <div className="text-red-600 p-4">{error}</div>;

//   const displayedCompanyName =
//     localStorage.getItem('companyName') &&
//     localStorage.getItem('companyName') !== "undefined"
//       ? localStorage.getItem('companyName')
//       : companyDetails[0]?.name || "Welcome";

//   return (
//     <div className="flex flex-col min-h-screen">
//       <div className="flex flex-1">
//         <div className="w-64 bg-gray-800 text-white h-screen p-6">
//           <h2 className="text-2xl font-bold">{displayedCompanyName}</h2>
//           <nav className="mt-8">
//             <Link to="/camp-details" className="block py-2 px-4 hover:bg-gray-700 rounded">Add New Camp</Link>
//             <Link to="/login" className="block py-2 px-4 hover:bg-gray-700 rounded">LOGOUT</Link>
//           </nav>
//         </div>

//         <div className="flex-1 p-6 bg-gray-100">
//           <div className="flex justify-between p-4 bg-white rounded-lg shadow-md mb-4">
//             <h1 className="text-3xl font-bold text-blue-600">DASHBOARD</h1>
//           </div>

//           {companyDetails.length > 0 && (
//             <div className="mb-6">
//               <h2 className="text-2xl font-semibold mb-4">Service Summary</h2>
//               <Bar
//                 data={chartData}
//                 options={{
//                   responsive: true,
//                   plugins: {
//                     legend: { position: 'top' },
//                     title: { display: true, text: 'Service Totals by Client' },
//                   },
//                 }}
//               />
//             </div>
//           )}

//           {companyDetails.map((company, index) => (
//             <div key={index} className="mb-6 border bg-white p-4 rounded-lg shadow-md">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <h3 className="text-xl font-semibold">{company.name || "Unnamed Company"}</h3>
//                   <p>Date: {company.datenow}</p>
//                 </div>
//                 <button
//                   onClick={() => toggleDetails(index)}
//                   className="bg-blue-500 text-white px-4 py-2 rounded-lg"
//                 >
//                   {expandedCompanyIndex === index ? 'Hide Details' : 'Show Details'}
//                 </button>
//               </div>

//               {expandedCompanyIndex === index && (
//                 <div className="mt-4">
//                   <h4 className="text-lg font-semibold">Services:</h4>
//                   <ul className="list-disc pl-5">
//                     {company.services.map((s, i) => (
//                       <li key={i}>{s.service_name}: {s.total_cases} cases</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
//           ))}

//           {companyDetails.length === 0 && <p>No data available for this client.</p>}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CustomerDashboard;


import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
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

  // Load from localStorage
  const storedClientIdRaw = localStorage.getItem("clientId");
  const storedClientId = storedClientIdRaw && storedClientIdRaw !== "NaN" && storedClientIdRaw !== "null"
    ? parseInt(storedClientIdRaw)
    : null;

  const { companyId: contextCompanyId } = useContext(AppContext);
  const clientId = storedClientId || contextCompanyId;

  console.log("🧩 clientId from localStorage:", storedClientIdRaw);
  console.log("🧩 clientId from context:", contextCompanyId);
  console.log("✅ Final clientId used for fetch:", clientId);

  useEffect(() => {
    const fetchClientDashboard = async () => {
      const token = localStorage.getItem('token');

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
        const response = await axios.get(
          `http://127.0.0.1:8000/api/client-dashboard/?client_id=${clientId}`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        const data = response.data.map((item) => ({
          ...item,
          datenow: new Date().toISOString().split('T')[0],
        }));

        setCompanyDetails(data);
        console.log("✅ Dashboard data received:", data);
        
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
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/camps/?client_id=${clientId}`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      setCamps(response.data || []);
    } catch (err) {
      console.error("❌ Error fetching camps:", err);
      // Set dummy data for demonstration
      setCamps([
        { id: 1, name: 'Health Camp 2024', date: '2024-01-15', status: 'Completed', location: 'Mumbai' },
        { id: 2, name: 'Eye Check Camp', date: '2024-02-20', status: 'In Progress', location: 'Delhi' },
        { id: 3, name: 'Dental Camp', date: '2024-03-10', status: 'Generated', location: 'Bangalore' },
      ]);
    }
  };

  const fetchCampDetails = async (campId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/camp-details/${campId}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      setCampDetails(response.data);
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
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/invoice-history/${campId}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      setInvoiceHistory(response.data || []);
    } catch (err) {
      console.error("❌ Error fetching invoice history:", err);
      // Set dummy data for demonstration
      setInvoiceHistory([
        { id: 1, invoice_no: 'INV-001', date: '2024-01-20', amount: 25000, status: 'Paid' },
        { id: 2, invoice_no: 'INV-002', date: '2024-02-15', amount: 18000, status: 'Pending' },
        { id: 3, invoice_no: 'INV-003', date: '2024-03-10', amount: 32000, status: 'Generated' },
      ]);
    }
  };

  const fetchReports = async (campId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/reports/${campId}/`,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );
      setReports(response.data || []);
    } catch (err) {
      console.error("❌ Error fetching reports:", err);
      // Set dummy data for demonstration
      setReports([
        { id: 1, name: 'Participant Report', type: 'PDF', date: '2024-01-25', size: '2.5 MB' },
        { id: 2, name: 'Service Summary', type: 'Excel', date: '2024-02-01', size: '1.8 MB' },
        { id: 3, name: 'Financial Report', type: 'PDF', date: '2024-02-10', size: '3.2 MB' },
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
        label: 'Service Count (Dummy ₹)',
        data: companyDetails.map((c) =>
          c.services.reduce((sum, s) => sum + s.total_cases, 0)
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const Loader = () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid"></div>
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
              <h1 className="text-3xl font-bold text-blue-600">DASHBOARD</h1>
            </div>

            {companyDetails.length > 0 && (
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4">Service Summary</h2>
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
                    <h3 className="text-xl font-semibold">{company.name || "Unnamed Company"}</h3>
                    <p>Date: {company.datenow}</p>
                  </div>
                  <button
                    onClick={() => toggleDetails(index)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    {expandedCompanyIndex === index ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {expandedCompanyIndex === index && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold">Services:</h4>
                    <ul className="list-disc pl-5">
                      {company.services.map((s, i) => (
                        <li key={i}>{s.service_name}: {s.total_cases} cases</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {companyDetails.length === 0 && <p>No data available for this client.</p>}
          </div>
        );

      case 'campProgress':
        return (
          <div>
            <div className="flex justify-between p-4 bg-white rounded-lg shadow-md mb-4">
              <h1 className="text-3xl font-bold text-blue-600">CAMP PROGRESS</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Already Created Camps</h2>
                <div className="space-y-2">
                  {camps.map((camp) => (
                    <div
                      key={camp.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedCamp?.id === camp.id ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => handleCampSelect(camp)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{camp.name}</h3>
                          <p className="text-sm text-gray-600">Date: {camp.date}</p>
                          <p className="text-sm text-gray-600">Location: {camp.location}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          camp.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          camp.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {camp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Camp Details & QR Dashboard</h2>
                {selectedCamp && campDetails ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg">{campDetails.name}</h3>
                      <p className="text-gray-600">Status: {campDetails.status}</p>
                      <p className="text-gray-600">Participants: {campDetails.participants}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Services Offered:</h4>
                      <ul className="list-disc pl-5">
                        {campDetails.services.map((service, index) => (
                          <li key={index}>{service}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded">
                      <h4 className="font-medium mb-2">QR Code Dashboard</h4>
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gray-300 flex items-center justify-center rounded">
                          QR
                        </div>
                        <div>
                          <p className="text-sm">QR Code: {campDetails.qrCode}</p>
                          <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm mt-2">
                            View Full Dashboard
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Select a camp to view details</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'invoiceHistory':
        return (
          <div>
            <div className="flex justify-between p-4 bg-white rounded-lg shadow-md mb-4">
              <h1 className="text-3xl font-bold text-blue-600">INVOICE HISTORY</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Select Camp</h2>
                <div className="space-y-2">
                  {camps.map((camp) => (
                    <div
                      key={camp.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedCamp?.id === camp.id ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => handleCampSelect(camp)}
                    >
                      <h3 className="font-medium">{camp.name}</h3>
                      <p className="text-sm text-gray-600">Date: {camp.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Invoice History</h2>
                {selectedCamp ? (
                  <div className="space-y-3">
                    {invoiceHistory.map((invoice) => (
                      <div key={invoice.id} className="border p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{invoice.invoice_no}</h4>
                            <p className="text-sm text-gray-600">Date: {invoice.date}</p>
                            <p className="font-medium">₹{invoice.amount.toLocaleString()}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                        <div className="mt-2">
                          <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2">
                            View Invoice
                          </button>
                          <button className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Select a camp to view invoice history</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div>
            <div className="flex justify-between p-4 bg-white rounded-lg shadow-md mb-4">
              <h1 className="text-3xl font-bold text-blue-600">REPORTS</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Select Camp</h2>
                <div className="space-y-2">
                  {camps.map((camp) => (
                    <div
                      key={camp.id}
                      className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedCamp?.id === camp.id ? 'bg-blue-50 border-blue-300' : ''
                      }`}
                      onClick={() => handleCampSelect(camp)}
                    >
                      <h3 className="font-medium">{camp.name}</h3>
                      <p className="text-sm text-gray-600">Date: {camp.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Available Reports</h2>
                {selectedCamp ? (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="border p-3 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{report.name}</h4>
                            <p className="text-sm text-gray-600">Type: {report.type}</p>
                            <p className="text-sm text-gray-600">Generated: {report.date}</p>
                            <p className="text-sm text-gray-600">Size: {report.size}</p>
                          </div>
                          <div className="space-x-2">
                            <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                              View
                            </button>
                            <button className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Select a camp to view available reports</p>
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