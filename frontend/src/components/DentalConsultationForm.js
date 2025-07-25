import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";

function DentalConsultationForm() {
  // State for form sections
  const [showPainDetails, setShowPainDetails] = useState(false);
  const [showSensitivityDetails, setShowSensitivityDetails] = useState(false);
  const [showDentalCaries, setShowDentalCaries] = useState(false);
  const [showGingiva, setShowGingiva] = useState(false);
  const [showMissingTeeth, setShowMissingTeeth] = useState(false);
  const [showOcclusion, setShowOcclusion] = useState(false);
  const [showMalocclusion, setShowMalocclusion] = useState(false);
  const [showRestoration, setShowRestoration] = useState(false);
  const [showRct, setShowRct] = useState(false);
  const [showIopa, setShowIopa] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const patientId = location?.state?.patientId || '';
  const technicianIdFromLocation = location?.state?.technicianId;
  const technicianId = technicianIdFromLocation || localStorage.getItem('technician_id');
  console.log("🔍 location.state =", location?.state);
  console.log("🆔 Extracted patientId =", patientId);
  // State for selected teeth
  const [selectedTeeth, setSelectedTeeth] = useState({
    pain: new Set(),
    restoration: new Set(),
    rct: new Set(),
    iopa: new Set(),
    caries: new Set(),
    fissure: new Set(),
    missing: new Set()
  });

  // State for form data
  const [formData, setFormData] = useState({
  patient_id: '',
  patient_name: '',
  age: '',
  gender: '',
  contact_number: '',
  screening_date: '',
  family_diabetes: 'no',
  family_diabetes_years: '',
  family_diabetes_relation: '',
  family_hypertension: 'no',
  family_hypertension_years: '',
  family_hypertension_relation: '',
  family_other: '',
  medical_diabetes: 'no',
  medical_diabetes_years: '',
  medical_hypertension: 'no',
  medical_hypertension_years: '',
  current_medications: 'no',
  medications_list: '',
  past_surgeries: '',
    complaints: [],
  pain_regions: [],
  pain_days: '',
    sensitivity_type: [],
  cold_regions: [],
  hot_regions: [],
  sweet_regions: [],
  sour_regions: [],
  other_complaints: '',
    examination: [],
  gingiva_condition: '',
  occlusion_type: '',
  malocclusion_type: '',
  crowding_location: [],
  spacing_location: [],
  protrusion_type: [],
  other_findings: '',
    advice: [],
  medications: '',
    other_advice: ''
});
  useEffect(() => {
    if (!patientId) {
      console.warn("⛔ No patientId found. Skipping API call.");
      return;
    }

    console.log(`🌐 Fetching patient details for ID: ${patientId}`);

    fetch(`http://127.0.0.1:8000/api/campmanager/patient/${patientId}/`)
      .then(res => {
        console.log("🌐 API response status:", res.status);
        if (!res.ok) throw new Error("Failed to fetch patient details");
        return res.json();
      })
      .then(data => {
        console.log("✅ Patient Data Fetched:", data);

        setFormData(prev => ({
          ...prev,
          patient_id: data.unique_patient_id,
          patient_name: data.patient_name,
          age: data.age,
          gender: data.gender,
          contact_number: data.contact_number,
          screening_date: data.test_date || '',
        }));
      })
      .catch(err => {
        console.error("❌ Error fetching patient details:", err);
      });
  }, [patientId]);
  const handleBack = () => {
    navigate(-1);
  };
  
  const serviceId = location?.state?.serviceId || '';
  // Toggle functions
  const toggleSection = (section, setter) => {
    setter(!section);
    if (!section) {
      // Clear selection when hiding
      const newSelectedTeeth = {...selectedTeeth};
      const sectionKey = section.replace('show', '').toLowerCase();
      newSelectedTeeth[sectionKey] = new Set();
      setSelectedTeeth(newSelectedTeeth);
    }
  };

  const toggleToothSelection = (toothNumber, type) => {
    const newSelectedTeeth = {...selectedTeeth};
    if (newSelectedTeeth[type].has(toothNumber)) {
      newSelectedTeeth[type].delete(toothNumber);
    } else {
      newSelectedTeeth[type].add(toothNumber);
    }
    setSelectedTeeth(newSelectedTeeth);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (checked) {
        setFormData(prev => ({
            ...prev,
          [name]: [...prev[name], value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: prev[name].filter(item => item !== value)
        }));
      }
    } else if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const mapBooleanFromArray = (key, arr) => arr.includes(key);

  const submissionData = {
    ...formData,
    technician_id: parseInt(technicianId),
    patient_unique_id: formData.patient_id,

    // Booleans from checkbox sections
    pain_teeth: mapBooleanFromArray('pain_teeth', formData.complaints),
    sensitivity: mapBooleanFromArray('sensitivity', formData.complaints),
    bleeding_gums: mapBooleanFromArray('bleeding_gums', formData.complaints),

    dental_caries: mapBooleanFromArray('dental_caries', formData.examination),
    gingiva: mapBooleanFromArray('gingiva', formData.examination),
    missing_teeth: mapBooleanFromArray('missing_teeth', formData.examination),
    occlusion: mapBooleanFromArray('occlusion', formData.examination),

    restoration_required: mapBooleanFromArray('restoration', formData.advice),
    rct_required: mapBooleanFromArray('rct', formData.advice),
    iopa_required: mapBooleanFromArray('iopa', formData.advice),
    oral_prophylaxis_required: mapBooleanFromArray('oral_prophylaxis', formData.advice),
    replacement_required: mapBooleanFromArray('replacement', formData.advice),

    // Process teeth selections
    pain_teeth_numbers: Array.from(selectedTeeth.pain).join(','),
    missing_teeth_numbers: Array.from(selectedTeeth.missing).join(','),
    restoration_teeth: Array.from(selectedTeeth.restoration).join(','),
    rct_teeth: Array.from(selectedTeeth.rct).join(','),
    iopa_teeth: Array.from(selectedTeeth.iopa).join(','),

    // Sensitivity flags
    sensitivity_cold: formData.sensitivity_type.includes('cold'),
    sensitivity_hot: formData.sensitivity_type.includes('hot'),
    sensitivity_sweet: formData.sensitivity_type.includes('sweet'),
    sensitivity_sour: formData.sensitivity_type.includes('sour'),

    // Region details
    sensitivity_regions: {
      cold: formData.cold_regions,
      hot: formData.hot_regions,
      sweet: formData.sweet_regions,
      sour: formData.sour_regions
    },

    // Caries
    grossly_carious: Array.from(selectedTeeth.caries).join(','),
    pit_fissure_caries: Array.from(selectedTeeth.fissure).join(','),

    // Malocclusion
    malocclusion_details: {
      crowding: formData.crowding_location,
      spacing: formData.spacing_location,
      protrusion: formData.protrusion_type
    }
  };

  console.log('🚀 Submitting consultation form:', submissionData);

  try {
    // Step 1: Submit consultation data
    const consultationResponse = await fetch('http://127.0.0.1:8000/api/technician/dental-consultation/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    });

    if (!consultationResponse.ok) {
      throw new Error('❌ Failed to submit consultation form');
    }

    const consultationResult = await consultationResponse.json();
    console.log('✅ Consultation submission success:', consultationResult);

    // Step 2: Final confirmation
    const finalPayload = {
      technician_id: parseInt(technicianId),
      patient_id: formData.patient_id,  // 👈 match what your working code sends
      service_id: serviceId             // 👈 add if required
    };

    console.log("📤 Submitting final confirmation with:", finalPayload);

    const finalResponse = await fetch('http://127.0.0.1:8000/api/technician/submit/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalPayload),
    });

    const finalResult = await finalResponse.json();

    if (!finalResponse.ok) {
      throw new Error(finalResult.message || '❌ Final submission failed');
    }

    console.log('✅ Final submit success:', finalResult);
    alert("Consultation submitted and finalized successfully!");
    navigate(-1);

  } catch (error) {
    console.error('❌ Error during submission:', error);
    alert(`Submission failed: ${error.message}`);
  }
};



  // Render tooth selection grid
  const renderTeethGrid = (type) => {
  const upperRight = [1, 2, 3, 4, 5, 6, 7, 8];
  const upperLeft = [9, 10, 11, 12, 13, 14, 15, 16];
    const lowerRight = [32, 31, 30, 29, 28, 27, 26, 25];
    const lowerLeft = [24, 23, 22, 21, 20, 19, 18, 17];

    return (
      <div className="teeth-box">
        {/* Upper Teeth */}
        <div className="flex justify-between gap-2 mb-2">
          {/* Upper Right */}
          <div className="flex-1 max-w-[50%]">
            <small className="text-gray-500">Upper Right</small>
            <div className="grid grid-cols-4 gap-1">
              {upperRight.map(tooth => (
                <span 
                  key={`${type}-${tooth}`}
                  className={`flex items-center justify-center p-1 text-sm border border-gray-200 rounded cursor-pointer transition-all ${
                    selectedTeeth[type].has(tooth.toString()) ? 'bg-blue-500 text-white border-blue-700' : 'bg-white'
                  }`}
                  onClick={() => toggleToothSelection(tooth.toString(), type)}
                >
                  {tooth}
                </span>
              ))}
            </div>
          </div>
          {/* Upper Left */}
          <div className="flex-1 max-w-[50%]">
            <small className="text-gray-500">Upper Left</small>
            <div className="grid grid-cols-4 gap-1">
              {upperLeft.map(tooth => (
                <span 
                  key={`${type}-${tooth}`}
                  className={`flex items-center justify-center p-1 text-sm border border-gray-200 rounded cursor-pointer transition-all ${
                    selectedTeeth[type].has(tooth.toString()) ? 'bg-blue-500 text-white border-blue-700' : 'bg-white'
                  }`}
                  onClick={() => toggleToothSelection(tooth.toString(), type)}
                >
                  {tooth}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* Lower Teeth */}
        <div className="flex justify-between gap-2">
          {/* Lower Right */}
          <div className="flex-1 max-w-[50%]">
            <small className="text-gray-500">Lower Right</small>
            <div className="grid grid-cols-4 gap-1">
              {lowerRight.map(tooth => (
                <span 
                  key={`${type}-${tooth}`}
                  className={`flex items-center justify-center p-1 text-sm border border-gray-200 rounded cursor-pointer transition-all ${
                    selectedTeeth[type].has(tooth.toString()) ? 'bg-blue-500 text-white border-blue-700' : 'bg-white'
                  }`}
                  onClick={() => toggleToothSelection(tooth.toString(), type)}
                >
                  {tooth}
                </span>
              ))}
            </div>
          </div>
          {/* Lower Left */}
          <div className="flex-1 max-w-[50%]">
            <small className="text-gray-500">Lower Left</small>
            <div className="grid grid-cols-4 gap-1">
              {lowerLeft.map(tooth => (
                <span 
                  key={`${type}-${tooth}`}
                  className={`flex items-center justify-center p-1 text-sm border border-gray-200 rounded cursor-pointer transition-all ${
                    selectedTeeth[type].has(tooth.toString()) ? 'bg-blue-500 text-white border-blue-700' : 'bg-white'
                  }`}
                  onClick={() => toggleToothSelection(tooth.toString(), type)}
                >
                  {tooth}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto">
          <span className="text-xl">🦷 Dental Consultation Form </span>
          <button
            onClick={handleBack}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            ← Back
          </button>
        </div>
      </nav>

      <div className="container mx-auto p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 my-4">
          <h2 className="text-2xl font-bold text-center mb-6">Dental Consultation Form</h2>
          
          <form onSubmit={handleSubmit}>
            {/* Section 1: Basic Information */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-4">
              <h3 className="font-bold">🧍 1. Basic Information (Auto-filled)</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-4">
                    <label className="block mb-1">Patient ID:</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded" 
                      name="patient_id"
                      value={formData.patient_id}
                      onChange={handleInputChange}
                      readOnly
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1">Patient Name:</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded" 
                      name="patient_name"
                      value={formData.patient_name}
                      onChange={handleInputChange}
                      readOnly // ✅ Read-only is fine since data is prefilled
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1">Age:</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded" 
                      value={formData.age}
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block mb-1">Gender:</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-gray-300 rounded" 
                      value={formData.gender}
                      readOnly
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1">Contact Number:</label>
                    <input 
                      type="tel" 
                      className="w-full p-2 border border-gray-300 rounded" 
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      readOnly
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block mb-1">Date of Screening <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className="w-full p-2 border border-gray-300 rounded" 
                      name="screening_date"
                      value={formData.screening_date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Family History */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-4">
              <h3 className="font-bold">🩺 2. Family History</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block mb-2">Any History of Diabetes?</label>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="fam_diabetes_no" 
                      name="family_diabetes" 
                      value="no" 
                      checked={formData.family_diabetes === 'no'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label htmlFor="fam_diabetes_no" className="mr-4">No</label>
                    <input 
                      type="radio" 
                      id="fam_diabetes_yes" 
                      name="family_diabetes" 
                      value="yes" 
                      checked={formData.family_diabetes === 'yes'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label htmlFor="fam_diabetes_yes">Yes</label>
                  </div>
                  {formData.family_diabetes === 'yes' && (
                    <div className="mt-2">
                      <input 
                        type="number" 
                        name="family_diabetes_years" 
                        className="w-full p-2 border border-gray-300 rounded mb-2" 
                        placeholder="Since how many years?"
                        value={formData.family_diabetes_years}
                        onChange={handleInputChange}
                      />
                      <input 
                        type="text" 
                        name="family_diabetes_relation" 
                        className="w-full p-2 border border-gray-300 rounded" 
                        placeholder="Who has diabetes?"
                        value={formData.family_diabetes_relation}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Any History of Hypertension?</label>
                  <div className="flex items-center">
                    <input 
                      type="radio" 
                      id="fam_hypertension_no" 
                      name="family_hypertension" 
                      value="no" 
                      checked={formData.family_hypertension === 'no'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label htmlFor="fam_hypertension_no" className="mr-4">No</label>
                    <input 
                      type="radio" 
                      id="fam_hypertension_yes" 
                      name="family_hypertension" 
                      value="yes" 
                      checked={formData.family_hypertension === 'yes'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <label htmlFor="fam_hypertension_yes">Yes</label>
                  </div>
                  {formData.family_hypertension === 'yes' && (
                    <div className="mt-2">
                      <input 
                        type="number" 
                        name="family_hypertension_years" 
                        className="w-full p-2 border border-gray-300 rounded mb-2" 
                        placeholder="Since how many years?"
                        value={formData.family_hypertension_years}
                        onChange={handleInputChange}
                      />
                      <input 
                        type="text" 
                        name="family_hypertension_relation" 
                        className="w-full p-2 border border-gray-300 rounded" 
                        placeholder="Who has hypertension?"
                        value={formData.family_hypertension_relation}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block mb-1">Any Other Family History:</label>
                <textarea 
                  name="family_other" 
                  className="w-full p-2 border border-gray-300 rounded" 
                  rows="2"
                  value={formData.family_other}
                  onChange={handleInputChange}
                ></textarea>
              </div>
            </div>

            {/* Section 3: Medical History */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-4">
              <h3 className="font-bold">🦷 3. Medical History</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="mb-4">
                    <label className="block mb-2">History of Diabetes?</label>
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        id="med_diabetes_no" 
                        name="medical_diabetes" 
                        value="no" 
                        checked={formData.medical_diabetes === 'no'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="med_diabetes_no" className="mr-4">No</label>
                      <input 
                        type="radio" 
                        id="med_diabetes_yes" 
                        name="medical_diabetes" 
                        value="yes" 
                        checked={formData.medical_diabetes === 'yes'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="med_diabetes_yes">Yes</label>
                    </div>
                    {formData.medical_diabetes === 'yes' && (
                      <div className="mt-2">
                        <input 
                          type="number" 
                          name="medical_diabetes_years" 
                          className="w-full p-2 border border-gray-300 rounded" 
                          placeholder="Since how many years?"
                          value={formData.medical_diabetes_years}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-2">History of Hypertension?</label>
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        id="med_hypertension_no" 
                        name="medical_hypertension" 
                        value="no" 
                        checked={formData.medical_hypertension === 'no'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="med_hypertension_no" className="mr-4">No</label>
                      <input 
                        type="radio" 
                        id="med_hypertension_yes" 
                        name="medical_hypertension" 
                        value="yes" 
                        checked={formData.medical_hypertension === 'yes'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="med_hypertension_yes">Yes</label>
                    </div>
                    {formData.medical_hypertension === 'yes' && (
                      <div className="mt-2">
                        <input 
                          type="number" 
                          name="medical_hypertension_years" 
                          className="w-full p-2 border border-gray-300 rounded" 
                          placeholder="Since how many years?"
                          value={formData.medical_hypertension_years}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <label className="block mb-2">Currently taking any medications?</label>
                    <div className="flex items-center">
                      <input 
                        type="radio" 
                        id="medications_no" 
                        name="current_medications" 
                        value="no" 
                        checked={formData.current_medications === 'no'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="medications_no" className="mr-4">No</label>
                      <input 
                        type="radio" 
                        id="medications_yes" 
                        name="current_medications" 
                        value="yes" 
                        checked={formData.current_medications === 'yes'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <label htmlFor="medications_yes">Yes</label>
                    </div>
                    {formData.current_medications === 'yes' && (
                      <div className="mt-2">
                        <textarea 
                          name="medications_list" 
                          className="w-full p-2 border border-gray-300 rounded" 
                          rows="3" 
                          placeholder="List current medications"
                          value={formData.medications_list}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block mb-1">Have you undergone any surgeries in the past?</label>
                    <textarea 
                      name="past_surgeries" 
                      className="w-full p-2 border border-gray-300 rounded" 
                      rows="2"
                      value={formData.past_surgeries}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Chief Complaints */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-4">
              <h3 className="font-bold">🔎 4. Chief Complaints</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              
              {/* Pain Complaints */}
              <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
                <h5 className="font-bold mb-3">🦷 Pain Complaints</h5>
                <div className="mb-3">
                  <input 
                    type="checkbox" 
                    id="pain_teeth" 
                    name="complaints" 
                    value="pain_teeth" 
                    checked={formData.complaints.includes('pain_teeth')}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="pain_teeth">Pain in Teeth</label>
                </div>
                
                {formData.complaints.includes('pain_teeth') && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Left side - Teeth Diagram */}
                      <div>
                        <div className="border border-gray-200 rounded p-4 mb-4">
                          {/* Teeth diagram image would go here */}
                          <div className="bg-white border border-gray-300 rounded-lg p-4 flex justify-center items-center h-64">
                            <img
                              src="/dental.png"
                              alt="Dental Diagram"
                              className="object-contain h-full"
                            />
                          </div>
                          {/* <div className="text-center py-8 bg-gray-100 rounded">
                            
                          </div> */}
                        </div>
                        <div className="border border-gray-200 rounded p-4 bg-white">
                          <label className="block mb-2">Select Affected Teeth:</label>
                          {renderTeethGrid('pain')}
                        </div>
                      </div>

                      {/* Right side - Pain Details */}
                      <div>
                        {/* Region Selection */}
                        <div className="mb-4">
                          <label className="block mb-2">Select Region(s):</label>
                          <div className="space-y-2">
                            {['right_upper', 'right_lower', 'left_upper', 'left_lower', 'upper_front', 'lower_front'].map(region => (
                              <div key={region} className="flex items-center">
                                <input 
                                  type="checkbox" 
                                  id={`pain_${region}`}
                                  name="pain_regions" 
                                  value={region}
                                  checked={formData.pain_regions.includes(region)}
                                  onChange={handleInputChange}
                                  className="mr-2"
                                />
                                <label htmlFor={`pain_${region}`}>
                                  {region.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Region
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Number of Days */}
                        <div className="mb-4">
                          <label className="block mb-1">Number of Days <span className="text-red-500">*</span></label>
                          <input 
                            type="number" 
                            className="w-full p-2 border border-gray-300 rounded" 
                            name="pain_days" 
                            min="1" 
                            required 
                            placeholder="Enter number of days"
                            value={formData.pain_days}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sensitivity Complaints */}
              <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
                <h5 className="font-bold mb-3">🧊 Sensitivity</h5>
                <div className="mb-3">
                  <input 
                    type="checkbox" 
                    id="sensitivity" 
                    name="complaints" 
                    value="sensitivity" 
                    checked={formData.complaints.includes('sensitivity')}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="sensitivity">Sensitivity</label>
                </div>
                
                {formData.complaints.includes('sensitivity') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block mb-2">Type of Sensitivity:</label>
                      <div className="space-y-3">
                        {/* Cold */}
                        <div>
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id="sensitivity_cold" 
                              name="sensitivity_type" 
                              value="cold" 
                              checked={formData.sensitivity_type.includes('cold')}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <label htmlFor="sensitivity_cold">Sensitivity to Cold</label>
                          </div>
                          {formData.sensitivity_type.includes('cold') && (
                            <div className="ml-6 pl-4 border-l-2 border-gray-200 mt-2">
                              <label className="block mb-2">Select Regions:</label>
                              <div className="space-y-2">
                                {['right_upper', 'right_lower', 'left_upper', 'left_lower', 'upper_front', 'lower_front'].map(region => (
                                  <div key={`cold-${region}`} className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`cold_${region}`}
                                      name="cold_regions" 
                                      value={region}
                                      checked={formData.cold_regions.includes(region)}
                                      onChange={handleInputChange}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`cold_${region}`}>
                                      {region.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Region
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Hot */}
                        <div>
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id="sensitivity_hot" 
                              name="sensitivity_type" 
                              value="hot" 
                              checked={formData.sensitivity_type.includes('hot')}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <label htmlFor="sensitivity_hot">Sensitivity to Hot</label>
                          </div>
                          {formData.sensitivity_type.includes('hot') && (
                            <div className="ml-6 pl-4 border-l-2 border-gray-200 mt-2">
                              <label className="block mb-2">Select Regions:</label>
                              <div className="space-y-2">
                                {['right_upper', 'right_lower', 'left_upper', 'left_lower', 'upper_front', 'lower_front'].map(region => (
                                  <div key={`hot-${region}`} className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`hot_${region}`}
                                      name="hot_regions" 
                                      value={region}
                                      checked={formData.hot_regions.includes(region)}
                                      onChange={handleInputChange}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`hot_${region}`}>
                                      {region.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Region
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sweet */}
                        <div>
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id="sensitivity_sweet" 
                              name="sensitivity_type" 
                              value="sweet" 
                              checked={formData.sensitivity_type.includes('sweet')}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <label htmlFor="sensitivity_sweet">Sensitivity to Sweet</label>
                          </div>
                          {formData.sensitivity_type.includes('sweet') && (
                            <div className="ml-6 pl-4 border-l-2 border-gray-200 mt-2">
                              <label className="block mb-2">Select Regions:</label>
                              <div className="space-y-2">
                                {['right_upper', 'right_lower', 'left_upper', 'left_lower', 'upper_front', 'lower_front'].map(region => (
                                  <div key={`sweet-${region}`} className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`sweet_${region}`}
                                      name="sweet_regions" 
                                      value={region}
                                      checked={formData.sweet_regions.includes(region)}
                                      onChange={handleInputChange}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`sweet_${region}`}>
                                      {region.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Region
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sour */}
                        <div>
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              id="sensitivity_sour" 
                              name="sensitivity_type" 
                              value="sour" 
                              checked={formData.sensitivity_type.includes('sour')}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            <label htmlFor="sensitivity_sour">Sensitivity to Sour</label>
                          </div>
                          {formData.sensitivity_type.includes('sour') && (
                            <div className="ml-6 pl-4 border-l-2 border-gray-200 mt-2">
                              <label className="block mb-2">Select Regions:</label>
                              <div className="space-y-2">
                                {['right_upper', 'right_lower', 'left_upper', 'left_lower', 'upper_front', 'lower_front'].map(region => (
                                  <div key={`sour-${region}`} className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`sour_${region}`}
                                      name="sour_regions" 
                                      value={region}
                                      checked={formData.sour_regions.includes(region)}
                                      onChange={handleInputChange}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`sour_${region}`}>
                                      {region.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Region
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bleeding Gums */}
              <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
                <h5 className="font-bold mb-3">🩸 Bleeding in Gums</h5>
                <div className="mb-3">
                  <input 
                    type="checkbox" 
                    id="bleeding_gums" 
                    name="complaints" 
                    value="bleeding_gums" 
                    checked={formData.complaints.includes('bleeding_gums')}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="bleeding_gums">Bleeding while Brushing</label>
                </div>
              </div>

              {/* Other Complaints */}
              <div className="border border-gray-200 rounded p-4 bg-white">
                <h5 className="font-bold mb-3">📝 Other Complaints</h5>
                <div>
                  <textarea 
                    name="other_complaints" 
                    className="w-full p-2 border border-gray-300 rounded" 
                    rows="3" 
                    placeholder="Enter any other complaints here..."
                    value={formData.other_complaints}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Section 5: Oral Examination */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-4">
              <h3 className="font-bold">🩻 5. Oral Examination</h3>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              
              {/* Dental Caries */}
              <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
                <h5 className="font-bold mb-3">🦷 Dental Caries</h5>
                <div className="mb-3">
                  <input 
                    type="checkbox" 
                    id="dental_caries" 
                    name="examination" 
                    value="dental_caries" 
                    checked={formData.examination.includes('dental_caries')}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label htmlFor="dental_caries">Dental Caries Present</label>
                </div>
                
                {formData.examination.includes('dental_caries') && (
                  <div>
                    {/* Grossly Carious */}
                    <div className="mb-4">
                      <label className="block mb-2">Grossly Carious:</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded p-4">
                          {/* Teeth diagram image would go here */}
                          <div className="bg-white border border-gray-300 rounded-lg p-4 flex justify-center items-center h-64">
                            <img
                              src="/dental.png"
                              alt="Dental Diagram"
                              className="object-contain h-full"
                            />
                          </div>
                        </div>
                        <div className="border border-gray-200 rounded p-4 bg-white">
                          <label className="block mb-2">Select Grossly Carious Teeth:</label>
                          {renderTeethGrid('caries')}
                        </div>
                      </div>
                    </div>

                    {/* Pit & Fissure Caries */}
                    <div className="mb-4">
                      <label className="block mb-2">Pit & Fissure Caries:</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded p-4">
                          {/* Teeth diagram image would go here */}
                          <div className="bg-white border border-gray-300 rounded-lg p-4 flex justify-center items-center h-64">
                            <img
                              src="/dental.png"
                              alt="Dental Diagram"
                              className="object-contain h-full"
                            />
                          </div>
                        </div>
                        <div className="border border-gray-200 rounded p-4 bg-white">
                          <label className="block mb-2">Select Pit & Fissure Caries Teeth:</label>
                          {renderTeethGrid('fissure')}
                        </div>
                      </div>
                    </div>

                    {/* Other Caries */}
                    <div className="mb-4">
                      <label className="block mb-1">Any Other Caries:</label>
                      <textarea 
                        name="other_caries" 
                        className="w-full p-2 border border-gray-300 rounded" 
                        rows="2"
                        value={formData.other_caries}
                        onChange={handleInputChange}
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>

              {/* Gingiva */}
              <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
                <h5 className="font-bold mb-3">🦷 Gingiva</h5>
                <div className="mb-3">
                  <input 
                    type="checkbox" 
                    id="gingiva" 
                    name="examination" 
                    value="gingiva" 
                    checked={formData.examination.includes('gingiva')}
                                      onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="gingiva">Gingiva Issues Present</label>
              </div>
              
              {formData.examination.includes('gingiva') && (
                <div>
                  <div className="mb-4">
                    <label className="block mb-2">Select Condition:</label>
                    <div className="space-y-2">
                      {['normal', 'mild', 'moderate', 'severe'].map(condition => (
                        <div key={condition} className="flex items-center">
                          <input 
                            type="radio" 
                            id={`gingiva_${condition}`}
                            name="gingiva_condition" 
                            value={condition}
                            checked={formData.gingiva_condition === condition}
                            onChange={handleInputChange}
                            className="mr-2"
                          />
                          <label htmlFor={`gingiva_${condition}`}>
                            {condition.charAt(0).toUpperCase() + condition.slice(1)}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Missing Teeth */}
            <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
              <h5 className="font-bold mb-3">🦷 Missing Teeth</h5>
              <div className="mb-3">
                <input 
                  type="checkbox" 
                  id="missing_teeth" 
                  name="examination" 
                  value="missing_teeth" 
                  checked={formData.examination.includes('missing_teeth')}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="missing_teeth">Missing Teeth Present</label>
              </div>
              
              {formData.examination.includes('missing_teeth') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded p-4">
                    {/* Teeth diagram image would go here */}
                    <div className="bg-white border border-gray-300 rounded-lg p-4 flex justify-center items-center h-64">
                      <img
                        src="/dental.png"
                        alt="Dental Diagram"
                        className="object-contain h-full"
                      />
                    </div>
                    {/* <div className="text-center py-8 bg-gray-100 rounded bg-white">
                      
                    </div> */}
                  </div>
                  <div className="border border-gray-200 rounded p-4 bg-white">
                    <label className="block mb-2">Select Missing Teeth:</label>
                    {renderTeethGrid('missing')}
                  </div>
                </div>
              )}
            </div>

            {/* Occlusion */}
            <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
              <h5 className="font-bold mb-3">🦷 Occlusion</h5>
              <div className="mb-3">
                <input 
                  type="checkbox" 
                  id="occlusion" 
                  name="examination" 
                  value="occlusion" 
                  checked={formData.examination.includes('occlusion')}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="occlusion">Occlusion Issues Present</label>
              </div>
              
              {formData.examination.includes('occlusion') && (
                <div>
                  <div className="mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          id="occlusion_normal" 
                          name="occlusion_type" 
                          value="normal" 
                          checked={formData.occlusion_type === 'normal'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <label htmlFor="occlusion_normal">Normal</label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          id="occlusion_malocclusion" 
                          name="occlusion_type" 
                          value="malocclusion" 
                          checked={formData.occlusion_type === 'malocclusion'}
                          onChange={handleInputChange}
                          className="mr-2"
                        />
                        <label htmlFor="occlusion_malocclusion">Malocclusion</label>
                      </div>
                    </div>
                  </div>

                  {formData.occlusion_type === 'malocclusion' && (
                    <div className="ml-4 pl-4 border-l-2 border-gray-200">
                      <div className="mb-4">
                        <div className="space-y-3">
                          {/* Crowding */}
                          <div>
                            <div className="flex items-center">
                              <input 
                                type="radio" 
                                id="malocclusion_crowding" 
                                name="malocclusion_type" 
                                value="crowding" 
                                checked={formData.malocclusion_type === 'crowding'}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <label htmlFor="malocclusion_crowding">Crowding</label>
                            </div>
                            {formData.malocclusion_type === 'crowding' && (
                              <div className="ml-6 mt-2 space-y-2">
                                {['upper', 'lower', 'anterior'].map(location => (
                                  <div key={`crowding-${location}`} className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`crowding_${location}`}
                                      name="crowding_location" 
                                      value={location}
                                      checked={formData.crowding_location.includes(location)}
                                      onChange={handleInputChange}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`crowding_${location}`}>
                                      {location.charAt(0).toUpperCase() + location.slice(1)} teeth
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Spacing */}
                          <div>
                            <div className="flex items-center">
                              <input 
                                type="radio" 
                                id="malocclusion_spacing" 
                                name="malocclusion_type" 
                                value="spacing" 
                                checked={formData.malocclusion_type === 'spacing'}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <label htmlFor="malocclusion_spacing">Spacing</label>
                            </div>
                            {formData.malocclusion_type === 'spacing' && (
                              <div className="ml-6 mt-2 space-y-2">
                                {['upper', 'lower', 'anterior'].map(location => (
                                  <div key={`spacing-${location}`} className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`spacing_${location}`}
                                      name="spacing_location" 
                                      value={location}
                                      checked={formData.spacing_location.includes(location)}
                                      onChange={handleInputChange}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`spacing_${location}`}>
                                      {location.charAt(0).toUpperCase() + location.slice(1)} teeth
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Protrusion */}
                          <div>
                            <div className="flex items-center">
                              <input 
                                type="radio" 
                                id="malocclusion_protrusion" 
                                name="malocclusion_type" 
                                value="protrusion" 
                                checked={formData.malocclusion_type === 'protrusion'}
                                onChange={handleInputChange}
                                className="mr-2"
                              />
                              <label htmlFor="malocclusion_protrusion">Protrusion</label>
                            </div>
                            {formData.malocclusion_type === 'protrusion' && (
                              <div className="ml-6 mt-2 space-y-2">
                                {['maxillary', 'mandibular', 'bimaxillary'].map(protrusionType => (
                                  <div key={`protrusion-${protrusionType}`} className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`protrusion_${protrusionType}`}
                                      name="protrusion_type" 
                                      value={protrusionType}
                                      checked={formData.protrusion_type.includes(protrusionType)}
                                      onChange={handleInputChange}
                                      className="mr-2"
                                    />
                                    <label htmlFor={`protrusion_${protrusionType}`}>
                                      {protrusionType.charAt(0).toUpperCase() + protrusionType.slice(1)}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Other Findings */}
            <div className="border border-gray-200 rounded p-4 bg-white">
              <div>
                <label className="block mb-1">Any Other Finding:</label>
                <textarea 
                  name="other_findings" 
                  className="w-full p-2 border border-gray-300 rounded" 
                  rows="3"
                  value={formData.other_findings}
                  onChange={handleInputChange}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 6: Advice */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-4">
            <h3 className="font-bold">🧾 6. Advice</h3>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
            
            {/* Restoration */}
            <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
              <h5 className="font-bold mb-3">🦷 Restoration</h5>
              <div className="mb-3">
                <input 
                  type="checkbox" 
                  id="restoration" 
                  name="advice" 
                  value="restoration" 
                  checked={formData.advice.includes('restoration')}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="restoration">Restoration Required</label>
              </div>
              
              {formData.advice.includes('restoration') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded p-4">
                    {/* Teeth diagram image would go here */}
                    <div className="bg-white border border-gray-300 rounded-lg p-4 flex justify-center items-center h-64">
                            <img
                              src="/dental.png"
                              alt="Dental Diagram"
                              className="object-contain h-full"
                            />
                      </div>
                    {/* <div className="text-center py-8 bg-gray-100 rounded">
                      Teeth Diagram Placeholder
                    </div> */}
                  </div>
                  <div className="border border-gray-200 rounded p-4 bg-white">
                    <label className="block mb-2">Select Teeth for Restoration:</label>
                    {renderTeethGrid('restoration')}
                  </div>
                </div>
              )}
            </div>

            {/* RCT */}
            <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
              <h5 className="font-bold mb-3">🦷 RCT (Root Canal Treatment)</h5>
              <div className="mb-3">
                <input 
                  type="checkbox" 
                  id="rct" 
                  name="advice" 
                  value="rct" 
                  checked={formData.advice.includes('rct')}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="rct">RCT Required</label>
              </div>
              
              {formData.advice.includes('rct') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded p-4">
                    {/* Teeth diagram image would go here */}
                    <div className="bg-white border border-gray-300 rounded-lg p-4 flex justify-center items-center h-64">
                            <img
                              src="/dental.png"
                              alt="Dental Diagram"
                              className="object-contain h-full"
                            />
                          </div>
                    {/* <div className="text-center py-8 bg-gray-100 rounded">
                      Teeth Diagram Placeholder
                    </div> */}
                  </div>
                  <div className="border border-gray-200 rounded p-4 bg-white">
                    <label className="block mb-2">Select Teeth for RCT:</label>
                    {renderTeethGrid('rct')}
                  </div>
                </div>
              )}
            </div>

            {/* IOPA */}
            <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
              <h5 className="font-bold mb-3">🦷 IOPA (Intraoral Periapical Radiograph)</h5>
              <div className="mb-3">
                <input 
                  type="checkbox" 
                  id="iopa" 
                  name="advice" 
                  value="iopa" 
                  checked={formData.advice.includes('iopa')}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="iopa">IOPA Required</label>
              </div>
              
              {formData.advice.includes('iopa') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded p-4">
                    {/* Teeth diagram image would go here */}
                    <div className="bg-white border border-gray-300 rounded-lg p-4 flex justify-center items-center h-64">
                            <img
                              src="/dental.png"
                              alt="Dental Diagram"
                              className="object-contain h-full"
                            />
                     </div>
                    {/* <div className="text-center py-8 bg-gray-100 rounded">
                      Teeth Diagram Placeholder
                    </div> */}
                  </div>
                  <div className="border border-gray-200 rounded p-4 bg-white">
                    <label className="block mb-2">Select Teeth for IOPA:</label>
                    {renderTeethGrid('iopa')}
                  </div>
                </div>
              )}
            </div>

            {/* Oral Prophylaxis */}
            <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
              <h5 className="font-bold mb-3">🦷 Oral Prophylaxis</h5>
              <div className="mb-3">
                <input 
                  type="checkbox" 
                  id="oral_prophylaxis" 
                  name="advice" 
                  value="oral_prophylaxis" 
                  checked={formData.advice.includes('oral_prophylaxis')}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="oral_prophylaxis">Oral Prophylaxis </label>
              </div>
            </div>

            {/* Medications */}
            <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
              <h5 className="font-bold mb-3">💊 Medications</h5>
              <div>
                <textarea 
                  name="medications" 
                  className="w-full p-2 border border-gray-300 rounded" 
                  rows="3" 
                  placeholder="Enter prescribed medications..."
                  value={formData.medications}
                  onChange={handleInputChange}
                ></textarea>
              </div>
            </div>

            {/* Replacement of Missing Teeth */}
            <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
              <h5 className="font-bold mb-3">🦷 Replacement of Missing Teeth</h5>
              <div className="mb-3">
                <input 
                  type="checkbox" 
                  id="replacement" 
                  name="advice" 
                  value="replacement" 
                  checked={formData.advice.includes('replacement')}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="replacement">Replacement Required</label>
              </div>
            </div>

            {/* Other Advice */}
            <div className="border border-gray-200 rounded p-4 bg-white">
              <h5 className="font-bold mb-3">📝 Other Advice</h5>
              <div>
                <textarea 
                  name="other_advice" 
                  className="w-full p-2 border border-gray-300 rounded" 
                  rows="3" 
                  placeholder="Enter any other advice..."
                  value={formData.other_advice}
                  onChange={handleInputChange}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
            >
              Submit Consultation Form
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
);
}

export default DentalConsultationForm;