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
  const clientIdFromContext = companyId || parseInt(localStorage.getItem('clientId'));
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clients, setClients] = useState([]);
  const [clientDetails, setClientDetails] = useState(null);

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
  const navigate = useNavigate(); // <-- ADD THIS LINE
// Code written by Shyam on 2025-07-01
  // Fetch all clients if Camp Manager is logged in
  useEffect(() => {
    if (loginType === 'Coordinator') {
      axios.get('http://127.0.0.1:8000/api/clients/')
        .then(res => setClients(res.data))
        .catch(err => console.error('Error fetching clients:', err));
    }
  }, [loginType]);
// Code written by Shyam on 2025-07-01
  // Fetch selected client details
  useEffect(() => {
    if (selectedClientId) {
      axios.get(`http://127.0.0.1:8000/api/clients/${selectedClientId}/`)
        .then(res => setClientDetails(res.data))
        .catch(err => console.error('Error fetching client details:', err));
    } else {
      setClientDetails(null);
    }
  }, [selectedClientId]);

  // Use selected client id if manager, otherwise use context/localStorage
  const clientId = loginType === 'Coordinator'
    ? (selectedClientId ? parseInt(selectedClientId) : null)
    : clientIdFromContext;
// Code written by Shyam on 2025-07-01
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
// Code written by Shyam on 2025-07-01
  const handleSubmit = async () => {
    if (!clientId || camps.length === 0) {
      setError('Missing client ID or no camp added.');
      return;
    }

    setIsSubmitting(true);

    try {
      const createdCampIds = [];

      for (const camp of camps) {
        const campData = {
          client: clientId,
          location: camp.campLocation,
          district: camp.campDistrict,
          state: camp.campState,
          pin_code: camp.campPinCode,
          landmark: camp.campLandmark,
          start_date: camp.startDate.toISOString().split('T')[0],
          end_date: camp.endDate.toISOString().split('T')[0],
        };

        const response = await createCamp(campData);
        if (response?.id) {
          createdCampIds.push(response.id);
        }
      }

      if (createdCampIds.length) {
        localStorage.setItem('createdCampIds', JSON.stringify(createdCampIds));

        // ✅ Store the first created camp ID for use in ServiceSelection
        localStorage.setItem('campId', createdCampIds[0]);
        console.log('✅ Stored campId:', createdCampIds[0]);
      }

      onNext({ camps, clientId });
      navigate('/service-selection'); // ✅ fixed route from '/services'
    } catch (err) {
      console.error('Error submitting camp data:', err);
      setError('Failed to submit camp data.');
    } finally {
      setIsSubmitting(false);
    }
  };
// Code written by Shyam on 2025-07-01
  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h2 className="text-3xl font-semibold mb-6">Camp Details</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Only show for Camp Manager */}
      {loginType === 'Coordinator' && (
        <div className="mb-6 p-4 bg-white rounded shadow">
          <label className="block mb-2 font-semibold">Select Client:</label>
          <select
            className="border p-2 rounded w-full"
            value={selectedClientId}
            onChange={e => setSelectedClientId(e.target.value)}
          >
            <option value="">-- Select Client --</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name} ({client.email})
              </option>
            ))}
          </select>
          {clientDetails && (
            <div className="mt-4">
              <h4 className="font-bold mb-2">Client Details</h4>
              <p><b>Name:</b> {clientDetails.name}</p>
              <p><b>Email:</b> {clientDetails.email}</p>
              <p><b>Contact:</b> {clientDetails.contact_number}</p>
            </div>
          )}
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

      <h4 className="text-xl font-semibold mt-6 mb-4">Camps Added</h4>
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
