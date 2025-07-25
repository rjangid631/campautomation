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
  const [filteredClients, setFilteredClients] = useState([]); // STEP 3: Added filtered clients state
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

  // STEP 1: Debug localStorage contents
  console.log('🔍 STEP 1: Complete localStorage contents:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`${key}: ${value ? value.substring(0, 50) + '...' : 'null'}`);
  }

  // Fetch all clients - ONLY for Coordinator login type
  useEffect(() => {
    console.log('🔍 CLIENT FETCH EFFECT TRIGGERED');
    console.log('Current loginType:', loginType);
    console.log('Current loginType type:', typeof loginType);
    
    if (loginType !== 'Coordinator') {
      console.log('❌ Not coordinator, skipping client fetch. LoginType:', loginType);
      return;
    }

    // STEP 2: Better token retrieval
    const possibleTokenKeys = ['token', 'authToken', 'access_token', 'accessToken', 'auth_token', 'Token', 'AUTH_TOKEN'];
    let token = null;

    // Check localStorage first
    for (const key of possibleTokenKeys) {
      const storedToken = localStorage.getItem(key);
      if (storedToken && storedToken !== 'null' && storedToken !== 'undefined' && storedToken.trim() !== '') {
        token = storedToken;
        console.log(`✅ Found token with key: ${key}`);
        break;
      }
    }

    // Check sessionStorage as fallback
    if (!token) {
      for (const key of possibleTokenKeys) {
        const storedToken = sessionStorage.getItem(key);
        if (storedToken && storedToken !== 'null' && storedToken !== 'undefined' && storedToken.trim() !== '') {
          token = storedToken;
          console.log(`✅ Found token in sessionStorage with key: ${key}`);
          break;
        }
      }
    }

    console.log('📋 Final token found:', !!token);
    
    if (!token) {
      console.log('❌ No token found in any common storage key');
      setError('Authentication token not found. Please log in again to continue.');
      setClients([]);
      return;
    }

    setIsLoadingClients(true);
    console.log('🚀 Starting client fetch for coordinator...');
    console.log('🌐 API URL:', 'http://127.0.0.1:8000/api/clients/');

    // STEP 6: Better error handling in axios call
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
              email: client.email,
              login_type: client.login_type,
              user_type: client.user_type
            });
          });
          setClients(res.data);
          setError(''); // Clear any previous errors
        } else {
          console.log('❌ Data is not an array:', res.data);
          setClients([]);
          setError('Invalid data format received from server');
        }
      })
      .catch(err => {
        console.log('❌ CLIENT FETCH ERROR');
        console.error('Full error:', err);
        
        if (err.response?.status === 401) {
          setError('Session expired. Please log in again.');
        } else if (err.response?.status === 403) {
          setError('Access denied. You do not have permission to view clients.');
        } else {
          setError(`Error fetching clients: ${err.response?.data?.message || err.message || 'Unknown error'}`);
        }
        setClients([]);
      })
      .finally(() => {
        console.log('🏁 Client fetch completed, setting loading to false');
        setIsLoadingClients(false);
      });
  }, [loginType]); // Only depend on loginType

  // STEP 4: Filter clients when clients array changes
  useEffect(() => {
    if (!Array.isArray(clients)) {
      setFilteredClients([]);
      return;
    }
    
    console.log('🔍 Filtering clients. Total clients:', clients.length);
    
    const filtered = clients.filter(client => 
      client.login_type === 'Client' || 
      (client.login_type === undefined && client.user_type === 'Client')
    );
    
    console.log('🎯 Filtered clients count:', filtered.length);
    setFilteredClients(filtered);
  }, [clients]);

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
              className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#11a8a4] focus:border-[#11a8a4]"
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
            >
              <option value="">-- Select Client --</option>
              {filteredClients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.email})
                </option>
              ))}
            </select>
          )}
          
          {clients.length === 0 && !isLoadingClients && (
            <p className="text-gray-500 mt-2">No clients available - Check your authentication</p>
          )}
          
          {filteredClients.length === 0 && clients.length > 0 && !isLoadingClients && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
              <p className="text-orange-700">
                No clients found. Total users available: {clients.length}
              </p>
              <p className="text-sm text-orange-600 mt-1">
                Only users with login_type "Client" are shown in this dropdown.
              </p>
            </div>
          )}
          
          {clientDetails && (
            <div className="mt-4 bg-gray-50 p-3 rounded border border-[#11a8a4]">
              <h4 className="font-bold mb-2 text-[#11a8a4]">Selected Client Details</h4>
              <p><b>Name:</b> {clientDetails.name}</p>
              <p><b>Email:</b> {clientDetails.email}</p>
              <p><b>Contact:</b> {clientDetails.contact_number}</p>
              <p><b>Client ID:</b> {clientDetails.client_id}</p>
              <p><b>Login Type:</b> {clientDetails.login_type || clientDetails.user_type || 'Unknown'}</p>
            </div>
          )}
        </div>
      )}

      {/* Show current client details for non-coordinator */}
      {loginType !== 'Coordinator' && clientDetails && (
        <div className="mb-6 p-4 bg-white rounded shadow border border-[#11a8a4]">
          <h4 className="font-bold mb-2 text-[#11a8a4]">Client Details</h4>
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
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#11a8a4] focus:border-[#11a8a4]"
          value={campLocation}
          onChange={(e) => setCampLocation(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp District"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#11a8a4] focus:border-[#11a8a4]"
          value={campDistrict}
          onChange={(e) => setCampDistrict(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp State"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#11a8a4] focus:border-[#11a8a4]"
          value={campState}
          onChange={(e) => setCampState(e.target.value)}
        />
        <input
          type="text"
          placeholder="Camp Pin Code"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#11a8a4] focus:border-[#11a8a4]"
          value={campPinCode}
          maxLength={6}
          onChange={(e) => {
            const value = e.target.value;
            // Only allow numeric characters and limit to 6 characters
            if (/^\d*$/.test(value) && value.length <= 6) {
              setCampPinCode(value);
            }
          }}
        />
        {/* Optional: Add validation message */}
        {campPinCode.length > 0 && campPinCode.length < 6 && (
          <p className="text-red-500 text-sm mb-2">Pin code must be exactly 6 digits</p>
        )}
        <input
          type="text"
          placeholder="Camp Landmark"
          className="border rounded-lg p-3 mb-4 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#11a8a4] focus:border-[#11a8a4]"
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
              className="border rounded-lg p-3 mb-2 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#11a8a4] focus:border-[#11a8a4]"
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
              className="border rounded-lg p-3 mb-2 w-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#11a8a4] focus:border-[#11a8a4]"
              minDate={startDate || new Date()}
            />
            <FaCalendarAlt className="absolute top-1/2 transform -translate-y-1/2 right-3 text-gray-500" />
          </div>
        </div>

        <button
          className="bg-[#11a8a4] text-white px-4 py-2 rounded-lg shadow-md hover:bg-[#0e8e8a] transition duration-200"
          onClick={handleAddCamp}
        >
          Add Camp
        </button>
      </div>

      <h4 className="text-xl font-semibold mt-6 mb-4">Camps Added ({camps.length})</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {camps.map((camp, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-[#11a8a4]">
            <h5 className="text-lg font-semibold text-[#11a8a4]">{camp.campLocation}</h5>
            <p>{camp.campDistrict}, {camp.campState}</p>
            <p>Pin Code: {camp.campPinCode}</p>
            <p>Landmark: {camp.campLandmark}</p>
            <p>Start Date: {camp.startDate.toISOString().split('T')[0]}</p>
            <p>End Date: {camp.endDate.toISOString().split('T')[0]}</p>
          </div>
        ))}
      </div>
      
      <button
        className={`bg-[#11a8a4] text-white px-4 py-2 mt-6 rounded-lg shadow-md hover:bg-[#0e8e8a] transition duration-200 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
      </button>
    </div>
  );
};

export default CampDetails;