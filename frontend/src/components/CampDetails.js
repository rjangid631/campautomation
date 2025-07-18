import React, { useState, useContext, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createCamp } from './api';
import { FaCalendarAlt } from 'react-icons/fa';
import { AppContext } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Code written by Shyam on 2025-07-01
const CampDetails = ({ onNext }) => {
  const { companyId, loginType } = useContext(AppContext) || {};
  const clientIdFromContext = companyId || localStorage.getItem('clientId');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clients, setClients] = useState([]);
  const [clientDetails, setClientDetails] = useState(null);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const [camps, setCamps] = useState([]);
  const [campLocation, setCampLocation] = useState('');
  const [campDistrict, setCampDistrict] = useState('');
  const [campState, setCampState] = useState('');
  const [campPinCode, setCampPinCode] = useState('');
  const [campLandmark, setCampLandmark] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Fetch all clients - ONLY for Coordinator login type
  useEffect(() => {
    console.log('🔍 CLIENT FETCH EFFECT TRIGGERED');
    console.log('Current loginType:', loginType);
    console.log('Current loginType type:', typeof loginType);
    
    if (loginType !== 'Coordinator') {
      console.log('❌ Not coordinator, skipping client fetch. LoginType:', loginType);
      return;
    }

    const token = localStorage.getItem('token');
    console.log('📋 Token exists:', !!token);
    console.log('📋 Token value:', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      console.log('❌ No token found');
      setError('You are not logged in. Please log in to continue.');
      setClients([]);
      return;
    }

    setIsLoadingClients(true);
    console.log('🚀 Starting client fetch for coordinator...');
    console.log('🌐 API URL:', 'http://127.0.0.1:8000/api/clients/');

    axios.get('http://127.0.0.1:8000/api/clients/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then(res => {
        console.log('✅ CLIENT FETCH SUCCESS');
        console.log('📊 Response status:', res.status);
        console.log('📊 Response data:', res.data);
        console.log('📊 Response data type:', typeof res.data);
        console.log('📊 Response data length:', res.data ? res.data.length : 'No length');
        
        if (Array.isArray(res.data)) {
          console.log('✅ Data is array with', res.data.length, 'items');
          res.data.forEach((client, index) => {
            console.log(`👤 Client ${index + 1}:`, {
              id: client.id,
              client_id: client.client_id,
              name: client.name,
              email: client.email
            });
          });
        } else {
          console.log('❌ Data is not an array:', res.data);
        }
        
        setClients(res.data);
        setError(''); // Clear any previous errors
      })
      .catch(err => {
        console.log('❌ CLIENT FETCH ERROR');
        console.error('Full error object:', err);
        console.error('Error response:', err.response);
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
        
        if (err.response && err.response.status === 401) {
          setError('Session expired or unauthorized. Please log in again.');
          console.log('❌ 401 Unauthorized error');
        } else {
          setError('Error fetching clients: ' + (err.message || 'Unknown error'));
          console.log('❌ Other error:', err.message);
        }
        setClients([]);
      })
      .finally(() => {
        console.log('🏁 Client fetch completed, setting loading to false');
        setIsLoadingClients(false);
      });
  }, [loginType]); // Only depend on loginType

  // Fetch selected client details when a client is selected
  useEffect(() => {
    if (selectedClientId && loginType === 'Coordinator') {
      console.log('Fetching details for selected client:', selectedClientId);
      
      const token = localStorage.getItem('token');
      axios.get(`http://127.0.0.1:8000/api/clients/${selectedClientId}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
        .then(res => {
          console.log('Client details fetched:', res.data);
          setClientDetails(res.data);
        })
        .catch(err => {
          console.error('Error fetching client details:', err);
          setClientDetails(null);
        });
    } else {
      setClientDetails(null);
    }
  }, [selectedClientId, loginType]);

  // Use selected client id if coordinator, otherwise use context/localStorage
  const clientId = loginType === 'Coordinator'
    ? selectedClientId
    : clientIdFromContext;

  // Fetch client details for logged-in client (not Coordinator)
  useEffect(() => {
    if (loginType !== 'Coordinator' && clientIdFromContext) {
      console.log('Fetching client details for non-coordinator login:', clientIdFromContext);
      
      const token = localStorage.getItem('token');
      // Try to find the client by client_id first
      axios.get(`http://127.0.0.1:8000/api/clients/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
        .then(res => {
          const clientObj = res.data.find(c => c.client_id === clientIdFromContext);
          if (clientObj) {
            setClientDetails(clientObj);
            console.log('Found client details:', clientObj);
          } else {
            setError('Client not found.');
          }
        })
        .catch(err => {
          console.error('Error fetching client details for client login:', err);
          setClientDetails(null);
          setError('Failed to fetch client details.');
        });
    }
  }, [loginType, clientIdFromContext]);

  const handleAddCamp = () => {
    if (
      campLocation &&
      campDistrict &&
      campState &&
      campPinCode &&
      campLandmark &&
      startDate &&
      endDate &&
      endDate >= startDate
    ) {
      const newCamp = {
        campLocation,
        campDistrict,
        campState,
        campPinCode,
        campLandmark,
        startDate,
        endDate,
      };
      setCamps([...camps, newCamp]);

      // Clear form fields
      setCampLocation('');
      setCampDistrict('');
      setCampState('');
      setCampPinCode('');
      setCampLandmark('');
      setStartDate(null);
      setEndDate(null);
      setError('');
    } else {
      setError('Please fill out all fields before adding a camp.');
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called');
    console.log('loginType:', loginType);
    console.log('clientId:', clientId);
    console.log('camps:', camps);
    console.log('clientDetails:', clientDetails);

    // Validation
    if (loginType === 'Coordinator' && !selectedClientId) {
      setError('Please select a client before submitting.');
      return;
    }

    if (!clientId || camps.length === 0) {
      setError('Missing client selection or no camps added.');
      return;
    }

    if (!clientDetails) {
      setError('Client details are still loading. Please wait a moment and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const createdCampIds = [];
      const clientCode = clientDetails.client_id;

      console.log('Using client code:', clientCode);

      for (const camp of camps) {
        const campData = {
          client: clientCode,
          location: camp.campLocation,
          district: camp.campDistrict,
          state: camp.campState,
          pin_code: camp.campPinCode,
          landmark: camp.campLandmark,
          start_date: camp.startDate.toISOString().split('T')[0],
          end_date: camp.endDate.toISOString().split('T')[0],
        };
        console.log('Submitting campData:', campData);

        const response = await createCamp(campData);
        console.log('createCamp response:', response);
        if (response?.id) {
          createdCampIds.push(response.id);
        }
      }

      if (createdCampIds.length) {
        localStorage.setItem('createdCampIds', JSON.stringify(createdCampIds));
        localStorage.setItem('campId', createdCampIds[0]);
        console.log('✅ Stored campId:', createdCampIds[0]);
      }

      onNext({ camps, clientId: clientCode });
      navigate('/service-selection');
    } catch (err) {
      console.error('Error submitting camp data:', err);
      setError('Failed to submit camp data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h2 className="text-3xl font-semibold mb-6">Camp Details</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Only show client selection for Coordinator */}
      {loginType === 'Coordinator' && (
        <div className="mb-6 p-4 bg-white rounded shadow">
          <label className="block mb-2 font-semibold">Select Client:</label>
          
          {isLoadingClients ? (
            <p className="text-gray-500">Loading clients...</p>
          ) : (
            <select
              className="border p-2 rounded w-full"
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
            >
              <option value="">-- Select Client --</option>
              {clients
              .filter(client => client.login_type === 'Client') 
              .map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email}) - {client.login_type}
                </option>
              ))}
            </select>
          )}
          
          {clients.length === 0 && !isLoadingClients && (
            <p className="text-gray-500 mt-2">No clients available</p>
          )}
          
          {clientDetails && (
            <div className="mt-4 bg-gray-50 p-3 rounded">
              <h4 className="font-bold mb-2">Selected Client Details</h4>
              <p><b>Name:</b> {clientDetails.name}</p>
              <p><b>Email:</b> {clientDetails.email}</p>
              <p><b>Contact:</b> {clientDetails.contact_number}</p>
              <p><b>Client ID:</b> {clientDetails.client_id}</p>
            </div>
          )}
        </div>
      )}

      {/* Show current client details for non-coordinator */}
      {loginType !== 'Coordinator' && clientDetails && (
        <div className="mb-6 p-4 bg-white rounded shadow">
          <h4 className="font-bold mb-2">Client Details</h4>
          <p><b>Name:</b> {clientDetails.name}</p>
          <p><b>Email:</b> {clientDetails.email}</p>
          <p><b>Contact:</b> {clientDetails.contact_number}</p>
        </div>
      )}

      <h3 className="text-2xl font-semibold mt-6 mb-4">Add Camp</h3>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Camp Location"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campLocation}
          onChange={(e) => setCampLocation(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp District"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campDistrict}
          onChange={(e) => setCampDistrict(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp State"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campState}
          onChange={(e) => setCampState(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp Pin Code"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campPinCode}
          onChange={(e) => setCampPinCode(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp Landmark"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={campLandmark}
          onChange={(e) => setCampLandmark(e.target.value)}
        />

        <div className="mb-4 flex space-x-2">
          <div className="flex-1 relative">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="yyyy-MM-dd"
              placeholderText="Start Date"
              className="border rounded-lg p-3 mb-2 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              minDate={new Date()}
            />
            <FaCalendarAlt className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-500" />
          </div>
          <div className="flex-1 relative">
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="yyyy-MM-dd"
              placeholderText="End Date"
              className="border rounded-lg p-3 mb-2 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
              minDate={startDate || new Date()}
            />
            <FaCalendarAlt className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-500" />
          </div>
        </div>

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-200"
          onClick={handleAddCamp}
        >
          Add Camp
        </button>
      </div>

      <h4 className="text-xl font-semibold mt-6 mb-4">Camps Added ({camps.length})</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {camps.map((camp, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md">
            <h5 className="text-lg font-semibold">{camp.campLocation}</h5>
            <p>{camp.campDistrict}, {camp.campState}</p>
            <p>Pin Code: {camp.campPinCode}</p>
            <p>Landmark: {camp.campLandmark}</p>
            <p>Start Date: {camp.startDate.toISOString().split('T')[0]}</p>
            <p>End Date: {camp.endDate.toISOString().split('T')[0]}</p>
          </div>
        ))}
      </div>
      
      <button
        className={`bg-green-600 text-white px-4 py-2 mt-6 rounded-lg shadow-md hover:bg-green-700 transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
      </button>
    </div>
  );
};

export default CampDetails;