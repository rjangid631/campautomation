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

  // ✅ Load from localStorage
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
      } catch (err) {
        console.error("❌ Error fetching client dashboard:", err);
        setError("Failed to fetch client data.");
      } finally {
        setLoading(false);
      }
    };

    fetchClientDashboard();
  }, [clientId]);

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

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-1">
        <div className="w-64 bg-gray-800 text-white h-screen p-6">
          <h2 className="text-2xl font-bold">{displayedCompanyName}</h2>
          <nav className="mt-8">
            <Link to="/camp-details" className="block py-2 px-4 hover:bg-gray-700 rounded">Add New Camp</Link>
            <Link to="/login" className="block py-2 px-4 hover:bg-gray-700 rounded">LOGOUT</Link>
          </nav>
        </div>

        <div className="flex-1 p-6 bg-gray-100">
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
      </div>
    </div>
  );
};

export default CustomerDashboard;
