import React, { useState, useEffect, useRef } from 'react';
import { submitAudiometryData, fetchPatientData, markServiceCompleted } from './api';
import { useLocation } from 'react-router-dom';

const AudiometryApp = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [error, setError] = useState(null);
  const [fetchingPatient, setFetchingPatient] = useState(false);
  const location = useLocation();
  const { patientId, patientName, technicianId, serviceId } = location.state || {};


  // Form states
  const [formData, setFormData] = useState({
    PatientName: '',
    PatientId: '',
    age: '',
    gender: '',
    TestDate: '',
    ReportDate: '',
    rightEarDB: '',
    leftEarDB: '',
    rightEarBoneDB: '',
    leftEarBoneDB: '',
    rightEarLevel: '',
    leftEarLevel: '',
    xAxis: '250,500,1000,2000,4000,8000'
  });

  useEffect(() => {
  if (!patientId) return;

  fetch(`http://127.0.0.1:8000/api/campmanager/patient/${patientId}/`)
    .then((res) => res.json())
    .then((data) => {
      setFormData(prev => ({
        ...prev,
        PatientId: data.unique_patient_id || '',
        PatientName: data.patient_name || '',
        age: data.age || '',
        gender: data.gender || '',
        contact_number: data.contact_number || '',
        TestDate: data.test_date || '',
        ReportDate: data.report_date || ''
      }));
    })
    .catch((err) => console.error("❌ Fetch failed:", err));
}, [patientId]);


const audiogramStyle = {
  border: '2px solid #333',
  backgroundColor: 'white',
  fontFamily: 'Arial, sans-serif'
};

  // Refs for plots
  const leftEarPlotRef = useRef(null);
  const rightEarPlotRef = useRef(null);

  const handlePatientIdChange = async (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, PatientId: value }));
    
    // Auto-fetch patient data after user stops typing (debounce)
    if (value.trim().length >= 3) {
      try {
        setLoading(true);
        const patientData = await fetchPatientData(value);
        
        // Auto-fill form with fetched patient data
        setFormData(prev => ({
          ...prev,
          PatientName: patientData.name || patientData.PatientName || '',
          age: patientData.age || '',
          gender: patientData.gender || '',
          TestDate: patientData.TestDate || '',
          ReportDate: patientData.ReportDate || '',
          rightEarDB: patientData.rightEarDB || '',
          leftEarDB: patientData.leftEarDB || '',
          rightEarBoneDB: patientData.rightEarBoneDB || '',
          leftEarBoneDB: patientData.leftEarBoneDB || '',
          rightEarLevel: patientData.rightEarLevel || '',
          leftEarLevel: patientData.leftEarLevel || ''
        }));
        
        showNotification('Patient data loaded successfully!');
      } catch (error) {
        // Patient not found - that's okay for new patients
        console.log('Patient not found or new patient');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePatientIdBlur = async () => {
   const patientId = formData.PatientId.trim();
   if (!patientId || patientId.length < 2) return;
   
   try {
     const existingPatient = await fetchPatientData(patientId);
     
     if (existingPatient && !formData.PatientName) {
       // Only auto-fill if form is mostly empty
       setFormData(prev => ({
         ...prev,
         PatientName: existingPatient.name || existingPatient.PatientName || '',
         age: existingPatient.age || '',
         gender: existingPatient.gender || '',
       }));
     }
   } catch (error) {
     // Silently handle - new patients are expected
   }
};

  const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Use in component
const debouncedPatientId = useDebounce(formData.PatientId, 500);

useEffect(() => {
  if (debouncedPatientId && debouncedPatientId.length >= 3) {
    fetchPatientDataAuto(debouncedPatientId);
  }
}, [debouncedPatientId]);

const fetchPatientDataAuto = async (patientId) => {
  try {
    const patientData = await fetchPatientData(patientId);
    if (patientData && !formData.PatientName) {
      setFormData(prev => ({
        ...prev,
        PatientName: patientData.name || '',
        age: patientData.age || '',
        gender: patientData.gender || '',
      }));
    }
  } catch (error) {
    console.log('Patient not found');
  }
};




  useEffect(() => {
    initializePlots();
  }, []);

  const initializePlots = () => {
    // Create basic SVG audiogram grids
    createAudiogramGrid(leftEarPlotRef.current, 'Left Ear Graph');
    createAudiogramGrid(rightEarPlotRef.current, 'Right Ear Graph');
  };

const createAudiogramGrid = (container, title) => {
  if (!container) return;
  const topMargin = 35;
  const leftMargin = 40;
  const bottomMargin = 40;
  const rightMargin = 20;
  const plotHeight = 200;
  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '320');
  svg.setAttribute('height', '280');
  svg.setAttribute('viewBox', '0 0 320 280');
  svg.style.border = '2px solid #333';
  svg.style.backgroundColor = 'white';
  
  // Background
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('width', '400');
  rect.setAttribute('height', '350');
  rect.setAttribute('fill', 'white');
  svg.appendChild(rect);
  
  // Title
  const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  titleText.setAttribute('x', '200');
  titleText.setAttribute('y', '25');
  titleText.setAttribute('text-anchor', 'middle');
  titleText.setAttribute('font-size', '16');
  titleText.setAttribute('font-weight', 'bold');
  titleText.textContent = title;
  svg.appendChild(titleText);
  
  // Draw frequency grid lines (vertical)
  const frequencies = ['125', '250', '500', '1k', '2k', '4k', '8k', '12k'];
  for (let i = 0; i < frequencies.length; i++) {
    const x = getFrequencyPosition(i);
    
    // Grid line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x);
    line.setAttribute('y1', '45');
    line.setAttribute('x2', x);
    line.setAttribute('y2', '295');
    line.setAttribute('stroke', '#ccc');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
    
    // Frequency labels
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', '260'); 
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '12');
    label.setAttribute('font-weight', 'bold');
    label.textContent = frequencies[i];
    svg.appendChild(label);
  }
  
  // Draw dB grid lines (horizontal)
  const dbLevels = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
  for (let i = 0; i < dbLevels.length; i++) {
    const y = topMargin + (i * (plotHeight / (dbLevels.length - 1)));
    
    // Grid line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '50');
    line.setAttribute('y1', y);
    line.setAttribute('x2', '350');
    line.setAttribute('y2', y);
    line.setAttribute('stroke', i === 1 ? '#999' : '#ddd'); // Emphasize 0dB line
    line.setAttribute('stroke-width', i === 1 ? '2' : '1');
    svg.appendChild(line);
    
    // dB labels
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', '40');
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('font-size', '11');
    label.textContent = dbLevels[i];
    svg.appendChild(label);
  }
  
  // Y-axis label
  const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yLabel.setAttribute('x', '20');
  yLabel.setAttribute('y', '170');
  yLabel.setAttribute('text-anchor', 'middle');
  yLabel.setAttribute('font-size', '12');
  yLabel.setAttribute('font-weight', 'bold');
  yLabel.setAttribute('transform', 'rotate(-90, 20, 170)');
  yLabel.textContent = 'Decibel (dB)';
  svg.appendChild(yLabel);
  
  // X-axis label
  const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xLabel.setAttribute('x', '200');
  xLabel.setAttribute('y', '275');
  xLabel.setAttribute('text-anchor', 'middle');
  xLabel.setAttribute('font-size', '12');
  xLabel.setAttribute('font-weight', 'bold');
  xLabel.textContent = 'Frequency (Hz)';
  svg.appendChild(xLabel);
  
  container.appendChild(svg);
};


const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  // Validate dB values if it's an ear measurement field
  if (name.includes('Ear') && name.includes('DB')) {
    const values = value.split(',').map(v => v.trim());
    if (values.length > 8) {
      setError('Maximum 8 frequency values allowed');
      return;
    }
  }
  
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};


const handleSubmit = async (e) => {
  const validationErrors = validatePatientData(formData);
  if (validationErrors.length > 0) {
    setError(validationErrors.join(', '));
    return;
  }
  e.preventDefault();
  setLoading(true);
  
  try {
    // Use the actual API instead of simulation
    const response = await submitAudiometryData({
      ...formData,
      patient_unique_id: formData.PatientId
    });
    
    const newPatient = {
      ...formData,
      id: response.id || Date.now(),
      patient_unique_id: formData.PatientId
    };

    // Add to patients list
    setPatients(prev => [...prev, newPatient]);

    // Reset form
    setFormData({
      PatientName: '',
      PatientId: '',
      age: '',
      gender: '',
      TestDate: '',
      ReportDate: '',
      rightEarDB: '',
      leftEarDB: '',
      rightEarBoneDB: '',
      leftEarBoneDB: '',
      rightEarLevel: '',
      leftEarLevel: '',
      xAxis: '250,500,1000,2000,4000,8000'
    });

    showNotification('Patient data saved successfully!');
  } catch (error) {
    setError(error.message || 'Failed to save patient data');
  } finally {
    setLoading(false);
  }
};


const handlePatientSelect = (patient) => {
  setSelectedPatient(patient);
  
  // Auto-fill form with selected patient data
  setFormData({
    PatientName: patient.PatientName || '',
    PatientId: patient.PatientId || '',
    age: patient.age || '',
    gender: patient.gender || '',
    TestDate: patient.TestDate || '',
    ReportDate: patient.ReportDate || '',
    rightEarDB: patient.rightEarDB || '',
    leftEarDB: patient.leftEarDB || '',
    rightEarBoneDB: patient.rightEarBoneDB || '',
    leftEarBoneDB: patient.leftEarBoneDB || '',
    rightEarLevel: patient.rightEarLevel || '',
    leftEarLevel: patient.leftEarLevel || '',
    xAxis: patient.xAxis || '250,500,1000,2000,4000,8000'
  });
  
  updatePlots(patient);
};


  const updatePlots = (patient) => {
    // Update both plots with patient data
    updateAudiogramWithData(leftEarPlotRef.current, 'Left Ear Graph', patient, 'left');
    updateAudiogramWithData(rightEarPlotRef.current, 'Right Ear Graph', patient, 'right');
  };

  const updateAudiogramWithData = (container, title, patient, ear) => {
    if (!container || !patient) return;
    
    createAudiogramGrid(container, title);
    const svg = container.querySelector('svg');
    
    const airData = ear === 'left' ? patient.leftEarDB : patient.rightEarDB;
    const boneData = ear === 'left' ? patient.leftEarBoneDB : patient.rightEarBoneDB;
    
    if (airData) {
      const values = airData.split(',').map(Number);
      drawAudiogramLine(svg, values, ear === 'left' ? 'blue' : 'red', ear === 'left' ? 'x' : 'o');
    }
    
    if (boneData) {
      const values = boneData.split(',').map(Number);
      drawAudiogramLine(svg, values, ear === 'left' ? 'blue' : 'red', ear === 'left' ? '[' : ']');
    }
  };

const drawAudiogramLine = (svg, values, ear, testType) => {
  if (!values || values.length === 0) return;
  
  const frequencies = [125, 250, 500, 1000, 2000, 4000, 8000, 12000];
  const color = ear === 'left' ? '#0066CC' : '#CC0000'; // Blue for left, red for right
  
  // Define symbols based on standard audiometric conventions
  const getSymbol = (ear, testType) => {
    if (testType === 'air') {
      return ear === 'left' ? 'X' : 'O';
    } else if (testType === 'bone') {
      return ear === 'left' ? '>' : '<';
    }
  };
  
  const symbol = getSymbol(ear, testType);
  let pathData = '';
  
  // Plot points and create path
  for (let i = 0; i < Math.min(values.length, frequencies.length); i++) {
    if (values[i] !== null && values[i] !== undefined && values[i] !== '') {
      const x = getFrequencyPosition(i);
      const y = 45 + ((parseFloat(values[i]) + 10) * 17.86 / 10);
      
      // Add to path
      if (pathData === '') {
        pathData = `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
      
      // Draw symbol
      const symbolElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      symbolElement.setAttribute('x', x);
      symbolElement.setAttribute('y', y + 4);
      symbolElement.setAttribute('text-anchor', 'middle');
      symbolElement.setAttribute('font-size', '14');
      symbolElement.setAttribute('font-weight', 'bold');
      symbolElement.setAttribute('fill', color);
      symbolElement.textContent = symbol;
      svg.appendChild(symbolElement);
    }
  }
  
  // Draw connecting line
  if (pathData) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-dasharray', testType === 'bone' ? '5,5' : 'none');
    svg.appendChild(path);
  }
};

const getFrequencyPosition = (freqIndex, totalWidth = 260) => {
  const positions = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875];
  return 40 + (positions[freqIndex] * totalWidth);  // leftMargin + scaled position
};


  const calculateAverage = (values) => {
    const validValues = values.filter(val => typeof val === 'number' && !isNaN(val));
    if (validValues.length > 0) {
      return validValues.reduce((acc, val) => acc + val, 0) / validValues.length;
    }
    return null;
  };

const handleMarkCompleted = async () => {
  if (!selectedPatient) {
    setError('Please select a patient first');
    return;
  }

  setLoading(true);
  try {
    await markServiceCompleted({
      patient_unique_id: selectedPatient.PatientId,
      service_type: 'audiometry',
      completed_date: new Date().toISOString()
    });
    
    showNotification('Service marked as completed!');
  } catch (error) {
    setError(error.message || 'Failed to mark service as completed');
  } finally {
    setLoading(false);
  }
};

  const validatePatientData = (data) => {
  const errors = [];
  
  if (!data.PatientName?.trim()) errors.push('Patient name is required');
  if (!data.PatientId?.trim()) errors.push('Patient ID is required');
  if (!data.age || isNaN(data.age)) errors.push('Valid age is required');
  
  return errors;
};


  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all patients?')) {
      setPatients([]);
      setSelectedPatient(null);
      initializePlots();
      showNotification('All patients deleted!');
    }
  };

  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => {
      setNotification({ show: false, message: '' });
    }, 3000);
  };

  const dismissError = () => {
    setError(null);
  };

  const getHearingLossText = (level, ear) => {
    if (!level) return '';
    if (level === 'Normal') {
      return `${level} in ${ear} ear.`;
    }
    return `${level} hearing loss in the ${ear} ear.`;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Loading Spinner */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-lg z-40">
          {notification.message}
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="border-b pb-4 mb-4">
              <h5 className="text-lg font-medium text-center">Notification</h5>
            </div>
            <div className="mb-4">
              <p className="text-red-600">{error}</p>
            </div>
            <div className="text-center">
              <button onClick={dismissError} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-gray-800 font-bold">
          Total number of Patients: {patients.length}
        </div>
        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Form and Patient List */}
        <div className="space-y-6">
          {/* Patient Form */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input
                  className="border border-gray-300 rounded px-3 py-2"
                  type="text"
                  name="PatientName"
                  placeholder="Patient Name"
                  value={formData.PatientName}
                  onChange={handleInputChange}
                  readOnly
                />
                <input
                  className="border border-gray-300 rounded px-3 py-2"
                  type="text"
                  name="PatientId"
                  placeholder="Patient ID"
                  value={formData.PatientId}
                  onChange={handlePatientIdChange}  // Changed to new handler
                  onBlur={handlePatientIdBlur} 
                  readOnly
                />{fetchingPatient && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                  )}
                <input
                  className="border border-gray-300 rounded px-3 py-2"
                  type="number"
                  name="age"
                  placeholder="Age"
                  value={formData.age}
                  onChange={handleInputChange}
                  readOnly
                />
                <select
                  className="border border-gray-300 rounded px-3 py-2"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input
                  className="border border-gray-300 rounded px-3 py-2"
                  type="date"
                  name="TestDate"
                  placeholder="Test Date"
                  value={formData.TestDate}
                  onChange={handleInputChange}
                  readOnly
                />
                <input
                  className="border border-gray-300 rounded px-3 py-2"
                  type="date"
                  name="ReportDate"
                  placeholder="Report Date"
                  value={formData.ReportDate}
                  onChange={handleInputChange}
                  required
                />
                <input
                    className="border border-gray-300 rounded px-3 py-2"
                   type="text"
                   name="rightEarDB"
                   placeholder="Right Ear Air (125,250,500,1k,2k,4k,8k,12k)"
                   value={formData.rightEarDB}
                   onChange={handleInputChange}
                   required
                />
                <input
                  className="border border-gray-300 rounded px-3 py-2"
                  type="text"
                  name="leftEarDB"
                  placeholder="Left Ear Air (comma-separated)"
                  value={formData.leftEarDB}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <input
                  className="border border-gray-300 rounded px-3 py-2"
                  type="text"
                  name="rightEarBoneDB"
                  placeholder="Right Ear Bone"
                  value={formData.rightEarBoneDB}
                  onChange={handleInputChange}
                  required
                />
                <input
                  className="border border-gray-300 rounded px-3 py-2"
                  type="text"
                  name="leftEarBoneDB"
                  placeholder="Left Ear Bone"
                  value={formData.leftEarBoneDB}
                  onChange={handleInputChange}
                  required
                />
                <select
                  className="border border-gray-300 rounded px-3 py-2"
                  name="rightEarLevel"
                  value={formData.rightEarLevel}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Right Ear Level</option>
                  <option value="Normal">Normal</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Profound">Profound</option>
                </select>
                <select
                  className="border border-gray-300 rounded px-3 py-2"
                  name="leftEarLevel"
                  value={formData.leftEarLevel}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Left Ear Level</option>
                  <option value="Normal">Normal</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Profound">Profound</option>
                </select>
                <input
                  className="border border-gray-300 rounded px-3 py-2"
                  type="text"
                  name="xAxis"
                  value={formData.xAxis}
                  onChange={handleInputChange}
                />
              </div>

              <div
                onClick={handleSubmit}
                className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 cursor-pointer text-center"
              >
                Add Patient
              </div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleMarkCompleted}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              disabled={!selectedPatient || loading}
            >
              Mark Completed
            </button>
            <button
              onClick={handleDeleteAll}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Delete All
            </button>
          </div>

          {/* Patient List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h5 className="text-lg font-medium text-center mb-4">Audiometry Patient List</h5>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {patients.map((patient, index) => (
                <div key={patient.id || index} className="flex items-center space-x-2 p-2 hover:bg-gray-50 cursor-pointer rounded">
                  <input
                    type="radio"
                    name="selectedPatient"
                    onChange={() => handlePatientSelect(patient)}
                    className="mr-2"
                  />
                  <span className="font-medium w-48">{patient.PatientName}</span>
                  <span className="w-24">{patient.PatientId}</span>
                  <span className="w-16">{patient.age}</span>
                  <span className="w-20">{patient.gender}</span>
                </div>
              ))}
              {patients.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No patients added yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Report */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="space-y-6">
            {/* Patient Details Table */}
            <table className="w-full border-collapse border border-gray-300">
              <tbody>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100">Name</th>
                  <td className="border border-gray-300 px-4 py-2">{selectedPatient?.PatientName || ''}</td>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100">Patient ID</th>
                  <td className="border border-gray-300 px-4 py-2">{selectedPatient?.PatientId || ''}</td>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100">Age</th>
                  <td className="border border-gray-300 px-4 py-2">{selectedPatient?.age || ''}</td>
                </tr>
                <tr>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100">Gender</th>
                  <td className="border border-gray-300 px-4 py-2">{selectedPatient?.gender || ''}</td>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100">Test Date</th>
                  <td className="border border-gray-300 px-4 py-2">{selectedPatient?.TestDate || ''}</td>
                  <th className="border border-gray-300 px-4 py-2 bg-gray-100">Report Date</th>
                  <td className="border border-gray-300 px-4 py-2">{selectedPatient?.ReportDate || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* Plots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div ref={leftEarPlotRef} className="border border-gray-200"></div>
              <div ref={rightEarPlotRef} className="border border-gray-200"></div>
            </div>

            {/* Averages Table */}
            {selectedPatient && (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th colSpan={3} className="border border-gray-300 px-4 py-2 bg-gray-100">PURE TONE AVERAGE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">PTA</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {(() => {
                        const rightValues = selectedPatient.rightEarDB ? selectedPatient.rightEarDB.split(',').map(Number) : [];
                        const avg = calculateAverage([rightValues[1], rightValues[2], rightValues[3]]);
                        return avg !== null ? `Rt Ear: ${avg.toFixed(2)} dBHL` : '-';
                      })()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {(() => {
                        const leftValues = selectedPatient.leftEarDB ? selectedPatient.leftEarDB.split(',').map(Number) : [];
                        const avg = calculateAverage([leftValues[1], leftValues[2], leftValues[3]]);
                        return avg !== null ? `Lt Ear: ${avg.toFixed(2)} dBHL` : '-';
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Audiometry Table */}
            {selectedPatient && (
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 bg-gray-100">FREQ.</th>
                    <th className="border border-gray-300 px-4 py-2 bg-gray-100">250Hz</th>
                    <th className="border border-gray-300 px-4 py-2 bg-gray-100">500Hz</th>
                    <th className="border border-gray-300 px-4 py-2 bg-gray-100">1kHz</th>
                    <th className="border border-gray-300 px-4 py-2 bg-gray-100">2kHz</th>
                    <th className="border border-gray-300 px-4 py-2 bg-gray-100">4kHz</th>
                    <th className="border border-gray-300 px-4 py-2 bg-gray-100">8kHz</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">RT Ear</td>
                    {selectedPatient.rightEarDB ? selectedPatient.rightEarDB.split(',').map((value, index) => (
                      <td key={index} className="border border-gray-300 px-4 py-2">{value || '-'}</td>
                    )) : Array(6).fill(0).map((_, index) => (
                      <td key={index} className="border border-gray-300 px-4 py-2">-</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">LT Ear</td>
                    {selectedPatient.leftEarDB ? selectedPatient.leftEarDB.split(',').map((value, index) => (
                      <td key={index} className="border border-gray-300 px-4 py-2">{value || '-'}</td>
                    )) : Array(6).fill(0).map((_, index) => (
                      <td key={index} className="border border-gray-300 px-4 py-2">-</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}

            {/* Findings */}
            <div className="space-y-2">
              <p className="font-bold">Finding:</p>
              {selectedPatient && (
                <>
                  <p className="font-bold">{getHearingLossText(selectedPatient.leftEarLevel, 'left')}</p>
                  <p className="font-bold">{getHearingLossText(selectedPatient.rightEarLevel, 'right')}</p>
                </>
              )}
            </div>

            {/* Placeholder for audiometry image */}
            <div className="w-64 h-24 bg-gray-200 border border-gray-300 flex items-center justify-center">
              <span className="text-gray-500">Audiometry Image</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudiometryApp;