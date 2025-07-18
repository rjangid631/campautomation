import React, { useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";

function DentalConsultationForm() {
  // State for form sections
  const navigate = useNavigate();
  
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
    other_advice: '',
    other_caries: ''  // Added missing field
  });

  const handleBack = () => navigate(-1);

  const toggleToothSelection = (toothNumber, type) => {
    setSelectedTeeth(prev => {
      const newSet = new Set(prev[type]);
      if (newSet.has(toothNumber)) {
        newSet.delete(toothNumber);
      } else {
        newSet.add(toothNumber);
      }
      return {...prev, [type]: newSet};
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked 
          ? [...prev[name], value] 
          : prev[name].filter(item => item !== value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Prepare data for submission
    const submissionData = {
      ...formData,
      selected_pain_teeth: Array.from(selectedTeeth.pain).join(','),
      selected_caries_teeth: Array.from(selectedTeeth.caries).join(','),
      selected_fissure_teeth: Array.from(selectedTeeth.fissure).join(','),
      selected_missing_teeth: Array.from(selectedTeeth.missing).join(','),
      selected_restoration_teeth: Array.from(selectedTeeth.restoration).join(','),
      selected_rct_teeth: Array.from(selectedTeeth.rct).join(','),
      selected_iopa_teeth: Array.from(selectedTeeth.iopa).join(','),
      sensitivity_type_input: formData.sensitivity_type.join(',')
    };
    console.log('Form submission data:', submissionData);
    // Send data to backend at 'dental-consultation' endpoint
  };

  // Render tooth selection grid
  const renderTeethGrid = (type) => {
    const teethMap = {
      upperRight: [1, 2, 3, 4, 5, 6, 7, 8],
      upperLeft: [9, 10, 11, 12, 13, 14, 15, 16],
      lowerRight: [32, 31, 30, 29, 28, 27, 26, 25],
      lowerLeft: [24, 23, 22, 21, 20, 19, 18, 17]
    };

    return (
      <div className="teeth-box">
        {/* Upper Teeth */}
        <div className="flex justify-between gap-2 mb-2">
          {['upperRight', 'upperLeft'].map(section => (
            <div key={section} className="flex-1 max-w-[50%]">
              <small className="text-gray-500">
                {section.split(/(?=[A-Z])/).join(' ')}
              </small>
              <div className="grid grid-cols-4 gap-1">
                {teethMap[section].map(tooth => (
                  <span 
                    key={`${type}-${tooth}`}
                    className={`flex items-center justify-center p-1 text-sm border rounded cursor-pointer transition-all ${
                      selectedTeeth[type].has(tooth.toString()) 
                        ? 'bg-blue-500 text-white border-blue-700' 
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => toggleToothSelection(tooth.toString(), type)}
                  >
                    {tooth}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Lower Teeth */}
        <div className="flex justify-between gap-2">
          {['lowerRight', 'lowerLeft'].map(section => (
            <div key={section} className="flex-1 max-w-[50%]">
              <small className="text-gray-500">
                {section.split(/(?=[A-Z])/).join(' ')}
              </small>
              <div className="grid grid-cols-4 gap-1">
                {teethMap[section].map(tooth => (
                  <span 
                    key={`${type}-${tooth}`}
                    className={`flex items-center justify-center p-1 text-sm border rounded cursor-pointer transition-all ${
                      selectedTeeth[type].has(tooth.toString()) 
                        ? 'bg-blue-500 text-white border-blue-700' 
                        : 'bg-white border-gray-200'
                    }`}
                    onClick={() => toggleToothSelection(tooth.toString(), type)}
                  >
                    {tooth}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Section rendering functions for cleaner code
  const renderSectionHeader = (title, icon) => (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg mb-4">
      <h3 className="font-bold">{icon} {title}</h3>
    </div>
  );

  const renderTeethSection = (title, type, formKey, sectionKey) => (
    <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
      <h5 className="font-bold mb-3">{title}</h5>
      <div className="mb-3">
        <input 
          type="checkbox" 
          id={type} 
          name={formKey} 
          value={type} 
          checked={formData[formKey].includes(type)}
          onChange={handleInputChange}
          className="mr-2"
        />
        <label htmlFor={type}>{title} Present</label>
      </div>
      
      {formData[formKey].includes(type) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded p-4">
            <div className="text-center py-8 bg-gray-100 rounded">
              Teeth Diagram Placeholder
            </div>
          </div>
          <div className="border border-gray-200 rounded p-4 bg-white">
            <label className="block mb-2">Select Teeth for {title}:</label>
            {renderTeethGrid(sectionKey)}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <div className="container mx-auto flex justify-between">
          <span className="text-xl">🦷 Dental Consultation Form</span>
          <button
            onClick={handleBack}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
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
            {renderSectionHeader("1. Basic Information (Auto-filled)", "🧍")}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              {/* ... existing basic info fields ... */}
            </div>

            {/* Section 2: Family History */}
            {renderSectionHeader("2. Family History", "🩺")}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              {/* ... existing family history fields ... */}
            </div>

            {/* Section 3: Medical History */}
            {renderSectionHeader("3. Medical History", "🦷")}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              {/* ... existing medical history fields ... */}
            </div>

            {/* Section 4: Chief Complaints */}
            {renderSectionHeader("4. Chief Complaints", "🔎")}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              {/* Pain Complaints */}
              <div className="border border-gray-200 rounded p-4 mb-4 bg-white">
                {/* ... pain complaints fields ... */}
                {formData.complaints.includes('pain_teeth') && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="border border-gray-200 rounded p-4 mb-4">
                          <div className="text-center py-8 bg-gray-100 rounded">
                            Teeth Diagram Placeholder
                          </div>
                        </div>
                        <div className="border border-gray-200 rounded p-4 bg-white">
                          <label className="block mb-2">Select Affected Teeth:</label>
                          {renderTeethGrid('pain')}
                        </div>
                      </div>
                      {/* ... pain details ... */}
                    </div>
                  </div>
                )}
              </div>
              
              {/* ... other complaint sections ... */}
            </div>

            {/* Section 5: Oral Examination */}
            {renderSectionHeader("5. Oral Examination", "🩻")}
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
                          <div className="text-center py-8 bg-gray-100 rounded">
                            Teeth Diagram Placeholder
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
                          <div className="text-center py-8 bg-gray-100 rounded">
                            Teeth Diagram Placeholder
                          </div>
                        </div>
                        <div className="border border-gray-200 rounded p-4 bg-white">
                          <label className="block mb-2">Select Pit & Fissure Caries Teeth:</label>
                          {renderTeethGrid('fissure')}
                        </div>
                      </div>
                    </div>

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
              {/* ... existing gingiva section ... */}

              {/* Missing Teeth */}
              {renderTeethSection("🦷 Missing Teeth", "missing_teeth", "examination", "missing")}

              {/* Occlusion */}
              {/* ... existing occlusion section ... */}

              {/* Other Findings */}
              {/* ... existing other findings ... */}
            </div>

            {/* Section 6: Advice */}
            {renderSectionHeader("6. Advice", "🧾")}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              {renderTeethSection("🦷 Restoration", "restoration", "advice", "restoration")}
              {renderTeethSection("🦷 RCT (Root Canal Treatment)", "rct", "advice", "rct")}
              {renderTeethSection("🦷 IOPA (Intraoral Periapical Radiograph)", "iopa", "advice", "iopa")}
              
              {/* ... other advice sections ... */}
            </div>

            <div className="mt-6 text-center">
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
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