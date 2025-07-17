// src/components/StatusTracking.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const apiEndpoints = {
  camps: "http://127.0.0.1:8000/api/campmanager/camps/",
  allCamps: "http://127.0.0.1:8000/api/camps/",
  campDetails: (campId) => `http://127.0.0.1:8000/api/campmanager/camps/${campId}/details/`,
};

function StatusTracking() {
  const [activeCamps, setActiveCamps] = useState([]);
  const [allCamps, setAllCamps] = useState([]);
  const [campDetailsMap, setCampDetailsMap] = useState({});

  useEffect(() => {
    axios.get(apiEndpoints.camps)
      .then(res => setActiveCamps(res.data))
      .catch(err => console.error('Error fetching active camps:', err));

    axios.get(apiEndpoints.allCamps)
      .then(res => setAllCamps(res.data))
      .catch(err => console.error('Error fetching all camps:', err));
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      const map = {};
      for (let camp of activeCamps) {
        try {
          const res = await axios.get(apiEndpoints.campDetails(camp.id));
          map[camp.id] = res.data;
        } catch (err) {
          console.error(`Failed to fetch camp details for ${camp.id}`);
        }
      }
      setCampDetailsMap(map);
    };

    if (activeCamps.length) fetchDetails();
  }, [activeCamps]);

  const getGroupedCampsByLocation = () => {
    const grouped = {};
    activeCamps.forEach(camp => {
      if (!grouped[camp.location]) grouped[camp.location] = [];
      grouped[camp.location].push(camp);
    });
    return grouped;
  };

  const getClientName = () => (allCamps.length ? allCamps[0].client : '');
  const groupedCamps = getGroupedCampsByLocation();

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-wrap gap-4 justify-around mb-6">
        <div className="bg-red-600 text-white px-6 py-3 rounded shadow-md text-center">
          <h3 className="font-bold">Total Camps YTD</h3>
          <p>{allCamps.length}</p>
        </div>
        <div className="bg-red-600 text-white px-6 py-3 rounded shadow-md text-center">
          <h3 className="font-bold">Total Camps Active Today</h3>
          <p>{activeCamps.length}</p>
        </div>
        <div className="bg-red-600 text-white px-6 py-3 rounded shadow-md text-center">
          <h3 className="font-bold">Total Technicians Active Today</h3>
          <p>TBD</p>
        </div>
        <div className="bg-red-600 text-white px-6 py-3 rounded shadow-md text-center w-60">
          <h3 className="font-bold">Service Execution Chart</h3>
          <p>Chart Placeholder</p>
        </div>
      </div>

      <div className="bg-green-200 p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Organisation Name - {getClientName()}</h2>
        {Object.entries(groupedCamps).map(([location, camps]) => (
          <div key={location} className="bg-yellow-100 p-3 my-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Location: {location}</h3>
            {camps.map(camp => (
              <div key={camp.id} className="bg-blue-600 text-white p-3 mb-3 rounded">
                <h4 className="text-md font-semibold mb-2">Camp #{camp.id}</h4>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {(campDetailsMap[camp.id]?.packages || []).flatMap(pkg =>
                      (pkg.services || []).map((service, i) => (
                        <div key={`${pkg.id}-${service.id}-${i}`} className="bg-blue-800 text-center p-2 rounded shadow">
                          <div>{service.name}</div>
                          <div>X / Y</div>
                        </div>
                      ))
                    )}
                                    </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatusTracking;
